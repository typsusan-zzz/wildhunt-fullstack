package com.wildhunt.common.exception;

public class BizException extends RuntimeException {
    private final ErrorCode code;

    public BizException(ErrorCode code, String message) {
        super(message);
        this.code = code;
    }

    public ErrorCode code() {
        return code;
    }
}
