package com.mzlhsc.gateway.filter;


import com.mzlhsc.gateway.config.AuthProperties;
import com.mzlhsc.auth.exception.UnauthorizedException;
import com.mzlhsc.auth.util.JwtTool;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.util.CollectionUtils;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.List;

@RequiredArgsConstructor
@Component
@EnableConfigurationProperties(AuthProperties.class)
public class AuthGlobalFilter implements GlobalFilter , Ordered {

    /** 管理端请求头：携带员工（admin）令牌（兼容 zmlhsc / mzlhsc 两种拼写） */
    private static final String HEADER_ADMIN = "zmlhsc";
    private static final String HEADER_ADMIN_ALT = "mzlhsc";
    /** 用户端请求头：携带用户（user）令牌 */
    private static final String HEADER_USER = "authorization";

    /** 身份标识：管理端 */
    private static final int IDENTITY_ADMIN = 1;
    /** 身份标识：用户端 */
    private static final int IDENTITY_USER = 2;

    private final JwtTool jwtTool;

    private final AuthProperties authProperties;

    private final AntPathMatcher antPathMatcher = new AntPathMatcher();



    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {

        // 1.获取Request
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getPath().toString();

        // 2.判断是否不需要拦截（登录、注册等白名单，直接放行）
        if(isExclude(path)){
            return chain.filter(exchange);
        }

        // 3.根据请求头判断身份：zmlhsc -> 管理端，authorization -> 用户端
        HttpHeaders headers = request.getHeaders();
        List<String> tokens = headers.get(HEADER_ADMIN);
        if (CollectionUtils.isEmpty(tokens)) {
            tokens = headers.get(HEADER_ADMIN_ALT);
        }
        int identity;
        if (!CollectionUtils.isEmpty(tokens)) {
            identity = IDENTITY_ADMIN;
        } else if (!CollectionUtils.isEmpty(tokens = headers.get(HEADER_USER))) {
            identity = IDENTITY_USER;
        } else {
            // 两个头都没有，视为未登录
            return reject(exchange, 401, "未登录");
        }

        // 4.校验路径与身份是否匹配：
        //   管理端令牌只放行 /admin/**，用户端令牌只放行 /user/** 等用户态接口
        //   不匹配同样按「未认证」处理，统一返回 401
        if (!isIncludePaths(path, identity)) {
            return reject(exchange, 401, identity == IDENTITY_ADMIN
                    ? "员工令牌不能访问用户端接口"
                    : "用户令牌不能访问管理端接口");
        }

        // 5.校验并解析token（按身份读对应的载荷字段，防止员工令牌冒充用户）
        Long id;
        try {
            id = identity == IDENTITY_ADMIN
                    ? jwtTool.parseEmpToken(tokens.get(0))
                    : jwtTool.parseUserToken(tokens.get(0));
        } catch (UnauthorizedException e) {
            return reject(exchange, 401, e.getMessage());
        }

        // 6.把身份信息透传给下游微服务。
        //    必须先清掉客户端自带的 empId / userId，否则用户端可以伪造 empId 冒充管理员。
        ServerHttpRequest newRequest = request.mutate()
                .headers(h -> {
                    h.remove("empId");
                    h.remove("userId");
                })
                .header(identity == IDENTITY_ADMIN ? "empId" : "userId", id.toString())
                .build();

        return chain.filter(exchange.mutate().request(newRequest).build());
    }

    /**
     * 判断路径是否在指定身份的放行范围内
     *
     * @param antPath  请求路径
     * @param identity 身份：IDENTITY_ADMIN / IDENTITY_USER
     */
    private boolean isIncludePaths(String antPath,int identity) {
        List<String> patterns = identity == IDENTITY_ADMIN
                ? authProperties.getAdminIncludePaths()
                : authProperties.getUserIncludePaths();
        // 没有配置时按默认前缀兜底，避免全部 403
        if (CollectionUtils.isEmpty(patterns)) {
            return antPathMatcher.match(identity == IDENTITY_ADMIN ? "/admin/**" : "/user/**", antPath);
        }
        for (String pathPattern : patterns) {
            if (antPathMatcher.match(pathPattern, antPath)) {
                return true;
            }
        }
        return false;
    }

    private boolean isExclude(String antPath) {
        List<String> excludePaths = authProperties.getExcludePaths();
        if (CollectionUtils.isEmpty(excludePaths)) {
            return false;
        }
        for (String pathPattern : excludePaths) {
            if(antPathMatcher.match(pathPattern, antPath)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 直接返回错误响应，不再往下走
     */
    private Mono<Void> reject(ServerWebExchange exchange, int status, String message) {
        ServerHttpResponse response = exchange.getResponse();
        response.setRawStatusCode(status);
        response.getHeaders().setContentType(new MediaType(MediaType.APPLICATION_JSON, StandardCharsets.UTF_8));
        String body = "{\"code\":" + status + ",\"msg\":\"" + message + "\"}";
        DataBuffer buffer = response.bufferFactory().wrap(body.getBytes(StandardCharsets.UTF_8));
        return response.writeWith(Mono.just(buffer));
    }

    @Override
    public int getOrder() {
        return 0;
    }
}
