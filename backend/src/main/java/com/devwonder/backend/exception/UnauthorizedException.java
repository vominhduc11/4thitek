package com.devwonder.backend.exception;

public class UnauthorizedException extends RuntimeException {
    private final String errorCode;

    public UnauthorizedException(String message) {
        super(message);
        this.errorCode = null;
    }

    public UnauthorizedException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
