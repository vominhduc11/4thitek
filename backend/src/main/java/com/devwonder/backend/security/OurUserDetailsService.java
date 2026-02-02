package com.devwonder.backend.security;

import com.devwonder.backend.entity.Account;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.devwonder.backend.repository.AccountRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OurUserDetailsService implements UserDetailsService {

    private final AccountRepository accountRepository;

    @Override
    public UserDetails loadUserByUsername(String username) {
        Account account = accountRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException(username));

        return account;
    }
}
