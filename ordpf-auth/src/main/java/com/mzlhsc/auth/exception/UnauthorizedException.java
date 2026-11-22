package com.mzlhsc.auth.exception;

/**
 * 令牌缺失 / 无效 / 过期时抛出。
 * 网关捕获后转成 401，业务服务签发令牌时正常不会用到。
 */
public class UnauthorizedException extends RuntimeException {

    public UnauthorizedException(String message) {
        super(message);
    }

    public UnauthorizedException(String message, Throwable cause) {
        super(message, cause);
    }
}
