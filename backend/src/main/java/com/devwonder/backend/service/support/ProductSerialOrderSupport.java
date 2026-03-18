package com.devwonder.backend.service.support;

import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.ProductSerial;
import com.devwonder.backend.entity.enums.ProductSerialStatus;
import com.devwonder.backend.repository.ProductSerialRepository;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ProductSerialOrderSupport {

    private final ProductSerialRepository productSerialRepository;

    public void releaseNonWarrantySerials(Order order) {
        if (order == null || order.getId() == null) {
            return;
        }
        List<ProductSerial> linkedSerials = productSerialRepository.findByOrderId(order.getId());
        if (linkedSerials.isEmpty()) {
            return;
        }

        List<ProductSerial> serialsToUpdate = new ArrayList<>();
        for (ProductSerial serial : linkedSerials) {
            if (serial == null || serial.getWarranty() != null) {
                continue;
            }
            serial.setOrder(null);
            serial.setDealer(null);
            if (serial.getStatus() != ProductSerialStatus.DEFECTIVE) {
                serial.setStatus(ProductSerialStatus.AVAILABLE);
            }
            serialsToUpdate.add(serial);
        }
        if (!serialsToUpdate.isEmpty()) {
            productSerialRepository.saveAll(serialsToUpdate);
        }
    }
}
