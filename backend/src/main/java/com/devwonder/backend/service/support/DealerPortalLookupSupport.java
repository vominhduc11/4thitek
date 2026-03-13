package com.devwonder.backend.service.support;

import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.exception.ResourceNotFoundException;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DealerPortalLookupSupport {

    private final DealerRepository dealerRepository;
    private final OrderRepository orderRepository;

    public Dealer requireDealerByUsername(String username) {
        return dealerRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Dealer not found"));
    }

    public Order requireDealerOrder(Long dealerId, Long orderId) {
        return orderRepository.findVisibleByIdAndDealerId(orderId, dealerId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
    }

    public Order requireDealerOrderForUpdate(Long dealerId, Long orderId) {
        return orderRepository.findVisibleByIdAndDealerIdForUpdate(orderId, dealerId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
    }

    public Order resolveDealerOrder(Long dealerId, Long orderId) {
        if (orderId == null) {
            return null;
        }
        return requireDealerOrder(dealerId, orderId);
    }

    public void validateDealerOwnership(Long dealerId, Long orderId) {
        if (orderId != null) {
            requireDealerOrder(dealerId, orderId);
        }
    }
}
