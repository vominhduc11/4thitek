package com.devwonder.backend.service.support;

import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.exception.ResourceNotFoundException;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.OrderRepository;
import com.devwonder.backend.service.DealerAccountLifecycleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DealerPortalLookupSupport {

    private final DealerRepository dealerRepository;
    private final OrderRepository orderRepository;
    private final DealerAccountLifecycleService dealerAccountLifecycleService;

    public Dealer requireDealerByUsername(String username) {
        Dealer dealer = dealerRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Dealer not found"));
        dealerAccountLifecycleService.assertDealerPortalAccess(dealer);
        return dealer;
    }

    public Dealer requireDealerByUsernameForUpdate(String username) {
        Dealer dealer = dealerRepository.findByUsernameForUpdate(username)
                .orElseThrow(() -> new ResourceNotFoundException("Dealer not found"));
        dealerAccountLifecycleService.assertDealerPortalAccess(dealer);
        return dealer;
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

    public Order resolveDealerOrderForUpdate(Long dealerId, Long orderId) {
        if (orderId == null) {
            return null;
        }
        return requireDealerOrderForUpdate(dealerId, orderId);
    }

    public void validateDealerOwnership(Long dealerId, Long orderId) {
        if (orderId != null) {
            requireDealerOrder(dealerId, orderId);
        }
    }
}
