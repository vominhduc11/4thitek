package com.devwonder.backend.dto.admin;

import com.devwonder.backend.entity.enums.CustomerStatus;
import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.Payload;
import jakarta.validation.constraints.Size;
import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@SuspendedDealerReasonRequired
public record UpdateAdminDealerAccountStatusRequest(
        @NotNull(message = "status is required")
        CustomerStatus status,
        @Size(max = 500, message = "reason must be 500 characters or fewer")
        String reason
) {
}

@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = SuspendedDealerReasonRequiredValidator.class)
@Documented
@interface SuspendedDealerReasonRequired {
    String message() default "reason is required when suspending dealer account";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

final class SuspendedDealerReasonRequiredValidator
        implements ConstraintValidator<SuspendedDealerReasonRequired, UpdateAdminDealerAccountStatusRequest> {

    @Override
    public boolean isValid(
            UpdateAdminDealerAccountStatusRequest value,
            ConstraintValidatorContext context
    ) {
        if (value == null || value.status() != CustomerStatus.SUSPENDED) {
            return true;
        }
        if (value.reason() != null && !value.reason().trim().isEmpty()) {
            return true;
        }
        context.disableDefaultConstraintViolation();
        context.buildConstraintViolationWithTemplate(context.getDefaultConstraintMessageTemplate())
                .addPropertyNode("reason")
                .addConstraintViolation();
        return false;
    }
}
