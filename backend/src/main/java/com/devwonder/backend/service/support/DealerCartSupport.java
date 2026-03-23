package com.devwonder.backend.service.support;

import com.devwonder.backend.dto.dealer.DealerCartItemResponse;
import com.devwonder.backend.dto.dealer.UpsertDealerCartItemRequest;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.DealerCartItem;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.ProductOfCart;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.exception.ResourceNotFoundException;
import com.devwonder.backend.repository.DealerCartItemRepository;
import com.devwonder.backend.repository.ProductOfCartRepository;
import com.devwonder.backend.repository.ProductRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DealerCartSupport {

    private final DealerCartItemRepository dealerCartItemRepository;
    private final ProductOfCartRepository productOfCartRepository;
    private final ProductRepository productRepository;
    private final ProductStockSyncSupport productStockSyncSupport;

    public List<DealerCartItemResponse> getCart(Long dealerId) {
        return dealerCartItemRepository.findByDealerIdOrderByUpdatedAtDesc(dealerId).stream()
                .map(DealerPortalResponseMapper::toCartResponse)
                .toList();
    }

    public DealerCartItemResponse upsertCartItem(Dealer dealer, UpsertDealerCartItemRequest request) {
        if (request.quantity() <= 0) {
            throw new BadRequestException("quantity must be greater than zero; use DELETE endpoint to remove items");
        }

        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        int availableStock = productStockSyncSupport.countAvailableStock(product.getId());
        if (availableStock <= 0) {
            throw new BadRequestException("Product is out of stock");
        }
        if (request.quantity() > availableStock) {
            throw new BadRequestException("quantity must not exceed available stock");
        }
        DealerCartItem existing = dealerCartItemRepository.findByDealerIdAndProductOfCartProductId(dealer.getId(), product.getId())
                .orElse(null);

        ProductOfCart productOfCart;
        DealerCartItem cartItem;
        if (existing == null) {
            productOfCart = new ProductOfCart();
            productOfCart.setProduct(product);
            productOfCart.setPriceSnapshot(product.getRetailPrice());
            productOfCart.setNote(DealerRequestSupport.normalize(request.note()));
            productOfCart = productOfCartRepository.save(productOfCart);

            cartItem = new DealerCartItem();
            cartItem.getId().setIdDealer(dealer.getId());
            cartItem.getId().setIdProductOfCart(productOfCart.getId());
            cartItem.setDealer(dealer);
            cartItem.setProductOfCart(productOfCart);
        } else {
            cartItem = existing;
            productOfCart = existing.getProductOfCart();
            productOfCart.setNote(DealerRequestSupport.normalize(request.note()));
            if (productOfCart.getPriceSnapshot() == null) {
                productOfCart.setPriceSnapshot(product.getRetailPrice());
            }
            productOfCartRepository.save(productOfCart);
        }
        cartItem.setQuantity(request.quantity());
        return DealerPortalResponseMapper.toCartResponse(dealerCartItemRepository.save(cartItem));
    }

    public void removeCartItem(Long dealerId, Long productId) {
        DealerCartItem existing = dealerCartItemRepository.findByDealerIdAndProductOfCartProductId(dealerId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));
        dealerCartItemRepository.delete(existing);
        productOfCartRepository.delete(existing.getProductOfCart());
    }

    public void clearCart(Long dealerId) {
        List<DealerCartItem> items = dealerCartItemRepository.findByDealerIdOrderByUpdatedAtDesc(dealerId);
        dealerCartItemRepository.deleteAll(items);
        productOfCartRepository.deleteAll(items.stream().map(DealerCartItem::getProductOfCart).toList());
    }
}
