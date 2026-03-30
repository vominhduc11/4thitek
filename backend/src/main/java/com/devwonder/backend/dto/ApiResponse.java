package com.devwonder.backend.dto;

public record ApiResponse<T>(
        boolean success,
        T data,
        String error,
        String errorCode
) {
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, data, null, null);
    }

    public static <T> ApiResponse<T> failure(String error) {
        return new ApiResponse<>(false, null, error, null);
    }

    public static <T> ApiResponse<T> failure(String error, String errorCode) {
        return new ApiResponse<>(false, null, error, errorCode);
    }
}
