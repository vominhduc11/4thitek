package com.devwonder.backend.service.support;

import com.devwonder.backend.dto.dealer.DealerPaymentResponse;
import com.devwonder.backend.dto.dealer.RecordPaymentRequest;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.Payment;
import com.devwonder.backend.entity.enums.PaymentMethod;
import com.devwonder.backend.entity.enums.PaymentStatus;
import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.exception.ConflictException;
import com.devwonder.backend.repository.OrderRepository;
import com.devwonder.backend.repository.PaymentRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DealerPaymentSupport {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final DealerOrderNotificationSupport dealerOrderNotificationSupport;

    public List<DealerPaymentResponse> getPayments(Long orderId) {
        return paymentRepository.findByOrderIdOrderByPaidAtDescIdDesc(orderId).stream()
                .map(DealerPortalResponseMapper::toPaymentResponse)
                .toList();
    }

    public DealerPaymentResponse recordPayment(Dealer dealer, Order order, RecordPaymentRequest request) {
        if (order.getPaymentMethod() == PaymentMethod.BANK_TRANSFER) {
            throw new BadRequestException("Bank transfer payments are confirmed by SePay webhook");
        }
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("Cannot record payment for cancelled order");
        }

        BigDecimal amount = request.amount().setScale(0, RoundingMode.HALF_UP);
        Instant duplicateWindow = Instant.now().minusSeconds(5);
        if (paymentRepository.existsByOrderIdAndAmountAndCreatedAtAfter(order.getId(), amount, duplicateWindow)) {
            throw new ConflictException("Duplicate payment detected");
        }
        String transactionCode = DealerRequestSupport.normalize(request.transactionCode());
        if (transactionCode != null && paymentRepository.existsByTransactionCodeIgnoreCase(transactionCode)) {
            throw new ConflictException("Transaction code already exists");
        }

        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setAmount(amount);
        payment.setMethod(request.method() == null ? DealerOrderSupport.defaultPaymentMethod(order) : request.method());
        payment.setStatus(PaymentStatus.PAID);
        payment.setChannel(DealerRequestSupport.defaultIfBlank(request.channel(), payment.getMethod().name()));
        payment.setTransactionCode(transactionCode);
        payment.setNote(DealerRequestSupport.normalize(request.note()));
        payment.setProofFileName(DealerRequestSupport.normalize(request.proofFileName()));
        payment.setPaidAt(request.paidAt() == null ? Instant.now() : request.paidAt());

        Payment savedPayment = paymentRepository.save(payment);
        order.setPaidAmount(DealerOrderSupport.zeroIfNull(order.getPaidAmount()).add(amount));
        order.setPaymentStatus(OrderPricingSupport.resolvePaymentStatus(order));
        orderRepository.save(order);
        dealerOrderNotificationSupport.notifyPaymentRecorded(dealer, order, amount);
        return DealerPortalResponseMapper.toPaymentResponse(savedPayment);
    }
}
