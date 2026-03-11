package com.devwonder.backend.service.support;

import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.repository.DealerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DealerAccountSupport {

    private final DealerRepository dealerRepository;
    private final PasswordEncoder passwordEncoder;

    public void changePassword(Dealer dealer, String currentPassword, String newPassword) {
        if (!passwordEncoder.matches(currentPassword, dealer.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }
        AccountValidationSupport.assertStrongPassword(newPassword, "newPassword");
        dealer.setPassword(passwordEncoder.encode(newPassword));
        dealerRepository.save(dealer);
    }
}
