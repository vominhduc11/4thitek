package com.devwonder.backend.exception;

public class BadRequestException extends RuntimeException {
    private final String errorCode;

    public BadRequestException(String message) {
        super(message);
        this.errorCode = null;
    }

    public BadRequestException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
