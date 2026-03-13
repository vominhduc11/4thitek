package com.devwonder.backend.service.support;

import com.devwonder.backend.dto.dealer.DealerProductSerialResponse;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.ProductSerial;

public final class ProductSerialResponseMapper {

    private ProductSerialResponseMapper() {
    }

    public static DealerProductSerialResponse toDealerProductSerialResponse(ProductSerial serial) {
        Product product = serial.getProduct();
        return new DealerProductSerialResponse(
                serial.getId(),
                serial.getSerial(),
                serial.getStatus(),
                product == null ? null : product.getId(),
                product == null ? null : product.getName(),
                product == null ? null : product.getSku(),
                serial.getOrder() == null ? null : serial.getOrder().getId(),
                serial.getWarehouseId(),
                serial.getWarehouseName(),
                serial.getImportedAt()
        );
    }
}
