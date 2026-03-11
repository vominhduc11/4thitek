package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.devwonder.backend.dto.warranty.CreateWarrantyRegistrationRequest;
import com.devwonder.backend.dto.warranty.WarrantyRegistrationResponse;
import com.devwonder.backend.entity.Customer;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.ProductSerial;
import com.devwonder.backend.entity.WarrantyRegistration;
import com.devwonder.backend.entity.enums.ProductSerialStatus;
import com.devwonder.backend.entity.enums.WarrantyStatus;
import com.devwonder.backend.repository.AccountRepository;
import com.devwonder.backend.repository.CustomerRepository;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.NotifyRepository;
import com.devwonder.backend.repository.OrderRepository;
import com.devwonder.backend.repository.ProductRepository;
import com.devwonder.backend.repository.ProductSerialRepository;
import com.devwonder.backend.repository.WarrantyRegistrationRepository;
import com.devwonder.backend.service.DealerWarrantyManagementService;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import java.time.Instant;
import java.util.Properties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mail.javamail.JavaMailSender;

@SpringBootTest(properties = {
        "app.mail.enabled=true",
        "app.mail.from=test@4thitek.local",
        "app.password-reset.base-url=https://4thitek.vn/reset-password"
})
class WarrantyCustomerProvisioningTests {

    @Autowired
    private DealerWarrantyManagementService dealerWarrantyManagementService;

    @Autowired
    private WarrantyRegistrationRepository warrantyRegistrationRepository;

    @Autowired
    private ProductSerialRepository productSerialRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private DealerRepository dealerRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private NotifyRepository notifyRepository;

    @Autowired
    private OrderRepository orderRepository;

    @MockBean
    private JavaMailSender javaMailSender;

    @BeforeEach
    void setUp() {
        notifyRepository.deleteAll();
        warrantyRegistrationRepository.deleteAll();
        productSerialRepository.deleteAll();
        orderRepository.deleteAll();
        productRepository.deleteAll();
        customerRepository.deleteAll();
        dealerRepository.deleteAll();
        accountRepository.deleteAll();
        reset(javaMailSender);
        when(javaMailSender.createMimeMessage()).thenReturn(
                new MimeMessage(Session.getInstance(new Properties()))
        );
    }

    @Test
    void createCreatesCustomerFromEmailAndSendsWarrantyMail() throws Exception {
        Dealer dealer = dealerRepository.save(createDealer("dealer-warranty@example.com"));
        Product product = productRepository.save(createProduct("SERIAL-LOCK", "Smart Lock Pro"));
        ProductSerial serial = productSerialRepository.save(createSerial(product, "SERIAL-0001"));

        WarrantyRegistrationResponse response = dealerWarrantyManagementService.create(
                new CreateWarrantyRegistrationRequest(
                        serial.getId(),
                        dealer.getId(),
                        null,
                        null,
                        "Nguyen Van A",
                        "customer.warranty@example.com",
                        "0901234567",
                        "123 Le Loi, District 1",
                        Instant.parse("2026-03-01T00:00:00Z"),
                        null,
                        WarrantyStatus.ACTIVE
                )
        );

        Customer customer = customerRepository.findByEmailIgnoreCase("customer.warranty@example.com").orElseThrow();
        WarrantyRegistration registration = warrantyRegistrationRepository.findByProductSerialId(serial.getId()).orElseThrow();

        assertThat(response.customerId()).isEqualTo(customer.getId());
        assertThat(response.customerName()).isEqualTo("Nguyen Van A");
        assertThat(response.customerEmail()).isEqualTo("customer.warranty@example.com");
        assertThat(response.customerPhone()).isEqualTo("0901234567");
        assertThat(response.customerAddress()).isEqualTo("123 Le Loi, District 1");
        assertThat(customer.getUsername()).isEqualTo("customer.warranty@example.com");
        assertThat(customer.getPassword()).isNotBlank();
        assertThat(registration.getCustomer()).extracting(Customer::getId).isEqualTo(customer.getId());
        assertThat(registration.getCustomerEmail()).isEqualTo("customer.warranty@example.com");

        ArgumentCaptor<MimeMessage> mailCaptor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(javaMailSender).send(mailCaptor.capture());
        String content = String.valueOf(mailCaptor.getValue().getContent());
        assertThat(content).contains("customer.warranty@example.com");
        assertThat(content).contains("SERIAL-0001");
        assertThat(content).contains("https://4thitek.vn/account");
    }

    @Test
    void createReusesExistingCustomerFoundByEmail() {
        Dealer dealer = dealerRepository.save(createDealer("dealer-existing@example.com"));
        Product product = productRepository.save(createProduct("SERIAL-CAM", "Camera Hub"));
        ProductSerial serial = productSerialRepository.save(createSerial(product, "SERIAL-0002"));

        Customer customer = new Customer();
        customer.setUsername("existing.customer@example.com");
        customer.setEmail("existing.customer@example.com");
        customer.setPassword("encoded-password");
        customer.setFullName("Existing Customer");
        customer.setPhone("0909999999");
        customer = customerRepository.save(customer);

        WarrantyRegistrationResponse response = dealerWarrantyManagementService.create(
                new CreateWarrantyRegistrationRequest(
                        serial.getId(),
                        dealer.getId(),
                        null,
                        null,
                        "Override Name",
                        "existing.customer@example.com",
                        "0911111111",
                        "456 Nguyen Hue",
                        Instant.parse("2026-03-02T00:00:00Z"),
                        null,
                        WarrantyStatus.ACTIVE
                )
        );

        assertThat(customerRepository.findAll()).hasSize(1);
        assertThat(response.customerId()).isEqualTo(customer.getId());

        WarrantyRegistration registration = warrantyRegistrationRepository.findByProductSerialId(serial.getId()).orElseThrow();
        assertThat(registration.getCustomer()).extracting(Customer::getId).isEqualTo(customer.getId());
        assertThat(registration.getCustomerEmail()).isEqualTo("existing.customer@example.com");
        verify(javaMailSender).send(any(MimeMessage.class));
    }

    private Dealer createDealer(String email) {
        Dealer dealer = new Dealer();
        dealer.setUsername(email);
        dealer.setEmail(email);
        dealer.setPassword("encoded-password");
        dealer.setBusinessName("Dealer " + email);
        dealer.setContactName("Dealer Contact");
        dealer.setPhone("0900000000");
        return dealer;
    }

    private Product createProduct(String sku, String name) {
        Product product = new Product();
        product.setSku(sku);
        product.setName(name);
        product.setWarrantyPeriod(12);
        product.setStock(10);
        return product;
    }

    private ProductSerial createSerial(Product product, String serialValue) {
        ProductSerial serial = new ProductSerial();
        serial.setProduct(product);
        serial.setSerial(serialValue);
        serial.setStatus(ProductSerialStatus.AVAILABLE);
        return serial;
    }
}
