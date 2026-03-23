package com.devwonder.backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.ProductSerial;
import com.devwonder.backend.entity.enums.CustomerStatus;
import com.devwonder.backend.entity.enums.ProductSerialStatus;
import com.devwonder.backend.entity.enums.PublishStatus;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.OrderRepository;
import com.devwonder.backend.repository.ProductRepository;
import com.devwonder.backend.repository.ProductSerialRepository;
import com.devwonder.backend.repository.WarrantyRegistrationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:public_api_contract;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "app.mail.enabled=false",
        "app.bootstrap-super-admin.enabled=false"
})
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class PublicApiContractTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private WarrantyRegistrationRepository warrantyRegistrationRepository;

    @Autowired
    private ProductSerialRepository productSerialRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private DealerRepository dealerRepository;

    @Autowired
    private OrderRepository orderRepository;

    @BeforeEach
    void setUp() {
        warrantyRegistrationRepository.deleteAll();
        productSerialRepository.deleteAll();
        orderRepository.deleteAll();
        productRepository.deleteAll();
        dealerRepository.deleteAll();
    }

    @Test
    void warrantyLookupReturnsInvalidPayloadForUnactivatedSerial() throws Exception {
        Product product = productRepository.save(createProduct("PUBLIC-SERIAL-1"));
        ProductSerial serial = new ProductSerial();
        serial.setProduct(product);
        serial.setSerial("PUBLIC-SERIAL-1");
        serial.setStatus(ProductSerialStatus.ASSIGNED);
        productSerialRepository.save(serial);

        mockMvc.perform(get("/api/v1/warranty/check/{serial}", "public-serial-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("invalid"))
                .andExpect(jsonPath("$.data.serialNumber").value("PUBLIC-SERIAL-1"))
                .andExpect(jsonPath("$.data.productName").doesNotExist())
                .andExpect(jsonPath("$.data.productSerial").doesNotExist());
    }

    @Test
    void publicDealerPageReturnsOnlyActiveDealers() throws Exception {
        dealerRepository.save(createDealer("active-public@example.com", CustomerStatus.ACTIVE));
        dealerRepository.save(createDealer("pending-public@example.com", CustomerStatus.UNDER_REVIEW));

        mockMvc.perform(get("/api/v1/user/dealer/page")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.items.length()").value(1))
                .andExpect(jsonPath("$.data.items[0].email").value("active-public@example.com"));
    }

    private Product createProduct(String sku) {
        Product product = new Product();
        product.setName("Product " + sku);
        product.setSku(sku);
        product.setIsDeleted(false);
        product.setPublishStatus(PublishStatus.PUBLISHED);
        return product;
    }

    private Dealer createDealer(String email, CustomerStatus status) {
        Dealer dealer = new Dealer();
        dealer.setUsername(email);
        dealer.setEmail(email);
        dealer.setPassword("encoded-password");
        dealer.setBusinessName("Dealer " + email);
        dealer.setCustomerStatus(status);
        return dealer;
    }
}
