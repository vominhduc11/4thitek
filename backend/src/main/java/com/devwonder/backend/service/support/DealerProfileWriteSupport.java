package com.devwonder.backend.service.support;

import com.devwonder.backend.dto.dealer.UpdateDealerProfileRequest;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.exception.ConflictException;
import com.devwonder.backend.repository.AccountRepository;
import com.devwonder.backend.repository.DealerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DealerProfileWriteSupport {

    private final DealerRepository dealerRepository;
    private final AccountRepository accountRepository;

    public void applyProfileUpdate(Dealer dealer, UpdateDealerProfileRequest request) {
        if (request.businessName() != null) {
            dealer.setBusinessName(DealerRequestSupport.requireNonBlank(request.businessName(), "businessName"));
        }
        if (request.contactName() != null) {
            dealer.setContactName(DealerRequestSupport.requireNonBlank(request.contactName(), "contactName"));
        }
        if (request.taxCode() != null) {
            String taxCode = DealerRequestSupport.requireNonBlank(request.taxCode(), "taxCode");
            if (dealerRepository.existsByTaxCodeAndIdNot(taxCode, dealer.getId())) {
                throw new ConflictException("Tax code already exists");
            }
            dealer.setTaxCode(taxCode);
        }
        if (request.phone() != null) {
            String phone = DealerRequestSupport.requireNonBlank(request.phone(), "phone");
            AccountValidationSupport.assertVietnamPhone(phone, "phone");
            if (dealerRepository.existsByPhoneAndIdNot(phone, dealer.getId())) {
                throw new ConflictException("Phone already exists");
            }
            dealer.setPhone(phone);
        }
        if (request.addressLine() != null) {
            dealer.setAddressLine(DealerRequestSupport.normalize(request.addressLine()));
        }
        if (request.ward() != null) {
            dealer.setWard(DealerRequestSupport.normalize(request.ward()));
        }
        if (request.district() != null) {
            dealer.setDistrict(DealerRequestSupport.normalize(request.district()));
        }
        if (request.city() != null) {
            dealer.setCity(DealerRequestSupport.normalize(request.city()));
        }
        if (request.country() != null) {
            dealer.setCountry(DealerRequestSupport.normalize(request.country()));
        }
        if (request.email() != null) {
            String email = AccountValidationSupport.normalizeEmail(request.email());
            if (email != null && accountRepository.existsByEmailIgnoreCaseAndIdNot(email, dealer.getId())) {
                throw new ConflictException("Email already exists");
            }
            dealer.setEmail(email);
        }
        if (request.avatarUrl() != null) {
            String avatarUrl = DealerRequestSupport.normalize(request.avatarUrl());
            if (avatarUrl != null && !DealerRequestSupport.isValidUrlOrUploadPath(avatarUrl)) {
                throw new BadRequestException("avatarUrl must be a valid URL");
            }
            dealer.setAvatarUrl(avatarUrl);
        }
        if (request.salesPolicy() != null) {
            dealer.setSalesPolicy(DealerRequestSupport.normalize(request.salesPolicy()));
        }
    }

    public Dealer saveProfile(Dealer dealer) {
        return dealerRepository.save(dealer);
    }
}
