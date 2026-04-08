package com.devwonder.backend;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.ProductSerial;
import com.devwonder.backend.entity.WarrantyRegistration;
import com.devwonder.backend.entity.enums.CustomerStatus;
import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.entity.enums.PaymentMethod;
import com.devwonder.backend.entity.enums.PaymentStatus;
import com.devwonder.backend.entity.enums.ProductSerialStatus;
import com.devwonder.backend.entity.enums.WarrantyStatus;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.OrderRepository;
import com.devwonder.backend.repository.ProductRepository;
import com.devwonder.backend.repository.ProductSerialRepository;
import com.devwonder.backend.repository.WarrantyRegistrationRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:dealer_inventory_contract;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "app.mail.enabled=false"
})
@AutoConfigureMockMvc
class DealerInventoryApiContractTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private DealerRepository dealerRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductSerialRepository productSerialRepository;

    @Autowired
    private WarrantyRegistrationRepository warrantyRegistrationRepository;

    @BeforeEach
    void setUp() {
        warrantyRegistrationRepository.deleteAll();
        productSerialRepository.deleteAll();
        orderRepository.deleteAll();
        productRepository.deleteAll();
        dealerRepository.deleteAll();
    }

    @Test
    void dealerInventoryEndpointsExposeSummarySerialsAndTimeline() throws Exception {
        Dealer dealer = registerActiveDealer("inventory-api");
        String dealerToken = login(dealer.getEmail(), "Dealer#123");

        Product product = new Product();
        product.setSku("INV-API-1");
        product.setName("Loa kiểm kê");
        product.setIsDeleted(false);
        product = productRepository.save(product);

        Order order = new Order();
        order.setDealer(dealer);
        order.setOrderCode("ORD-INV-001");
        order.setStatus(OrderStatus.COMPLETED);
        order.setPaymentMethod(PaymentMethod.BANK_TRANSFER);
        order.setPaymentStatus(PaymentStatus.PAID);
        order.setPaidAmount(BigDecimal.valueOf(5_000_000));
        order = orderRepository.save(order);

        ProductSerial availableSerial = new ProductSerial();
        availableSerial.setProduct(product);
        availableSerial.setDealer(dealer);
        availableSerial.setSerial("INV-AVAILABLE-001");
        availableSerial.setStatus(ProductSerialStatus.AVAILABLE);
        availableSerial.setWarehouseId("main");
        availableSerial.setWarehouseName("Kho chính");
        productSerialRepository.save(availableSerial);

        ProductSerial assignedSerial = new ProductSerial();
        assignedSerial.setProduct(product);
        assignedSerial.setOrder(order);
        assignedSerial.setSerial("INV-ASSIGNED-001");
        assignedSerial.setStatus(ProductSerialStatus.ASSIGNED);
        assignedSerial.setWarehouseId("main");
        assignedSerial.setWarehouseName("Kho chính");
        assignedSerial = productSerialRepository.save(assignedSerial);

        ProductSerial warrantySerial = new ProductSerial();
        warrantySerial.setProduct(product);
        warrantySerial.setSerial("INV-WARRANTY-001");
        warrantySerial.setStatus(ProductSerialStatus.WARRANTY);
        warrantySerial = productSerialRepository.save(warrantySerial);

        WarrantyRegistration warranty = new WarrantyRegistration();
        warranty.setDealer(dealer);
        warranty.setOrder(order);
        warranty.setProductSerial(warrantySerial);
        warranty.setCustomerName("Nguyễn Văn A");
        warranty.setWarrantyCode("WH-INV-001");
        warranty.setStatus(WarrantyStatus.ACTIVE);
        warranty.setPurchaseDate(LocalDate.now());
        warranty.setWarrantyStart(Instant.now());
        warranty.setWarrantyEnd(Instant.now().plusSeconds(86_400));
        warrantyRegistrationRepository.save(warranty);

        mockMvc.perform(get("/api/v1/dealer/inventory/summary")
                        .header("Authorization", "Bearer " + dealerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalProducts").value(1))
                .andExpect(jsonPath("$.data.totalSerials").value(3))
                .andExpect(jsonPath("$.data.readySerials").value(2))
                .andExpect(jsonPath("$.data.warrantySerials").value(1));

        mockMvc.perform(get("/api/v1/dealer/inventory/serials")
                        .header("Authorization", "Bearer " + dealerToken)
                        .param("productId", product.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(3))
                .andExpect(jsonPath("$.data[?(@.serial=='INV-ASSIGNED-001')].orderCode").isNotEmpty());

        mockMvc.perform(get("/api/v1/dealer/inventory/serials/{id}", assignedSerial.getId())
                        .header("Authorization", "Bearer " + dealerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.serial.serial").value("INV-ASSIGNED-001"))
                .andExpect(jsonPath("$.data.timeline.length()").value(org.hamcrest.Matchers.greaterThanOrEqualTo(3)))
                .andExpect(jsonPath("$.data.timeline[?(@.type=='current_status')]").isNotEmpty());
    }

    private Dealer registerActiveDealer(String prefix) throws Exception {
        String username = prefix + "@example.com";
        String email = "mail+" + prefix + "@example.com";

        mockMvc.perform(post("/api/v1/auth/register-dealer")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "%s",
                                  "password": "Dealer#123",
                                  "businessName": "Dealer %s",
                                  "contactName": "Dealer %s",
                                  "taxCode": "TAX-%s",
                                  "phone": "0901234567",
                                  "email": "%s",
                                  "addressLine": "123 Inventory Street",
                                  "district": "District 1",
                                  "city": "Ho Chi Minh City",
                                  "country": "Vietnam"
                                }
                                """.formatted(username, prefix, prefix, prefix, email)))
                .andExpect(status().isOk());

        Dealer dealer = dealerRepository.findByUsername(username).orElseThrow();
        dealer.setCustomerStatus(CustomerStatus.ACTIVE);
        return dealerRepository.save(dealer);
    }

    private String login(String username, String password) throws Exception {
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "%s",
                                  "password": "%s"
                                }
                                """.formatted(username, password)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode payload = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        return payload.path("data").path("accessToken").asText();
    }
}
