package com.devwonder.backend.service.support;

import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.NoSuchMessageException;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AppMessageSupport {

    private final MessageSource messageSource;

    public String get(String key, Object... args) {
        Locale locale = LocaleContextHolder.getLocale();
        if (locale == null) {
            locale = Locale.getDefault();
        }
        try {
            return messageSource.getMessage(key, args, locale);
        } catch (NoSuchMessageException ex) {
            return key;
        }
    }
}
