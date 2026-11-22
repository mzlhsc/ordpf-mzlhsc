package com.mzlhsc.gateway.filter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.stereotype.Component;

/**
 * 简易的请求打印过滤器。
 * <p>
 * application.yml 里 default-filters 配置了 {@code PrintAny}，
 * Spring Cloud Gateway 按「Xxx -> XxxGatewayFilterFactory」的约定查找实现类，
 * 缺少这个类启动会直接报 Unable to find GatewayFilterFactory with name PrintAny。
 */
@Slf4j
@Component
public class PrintAnyGatewayFilterFactory extends AbstractGatewayFilterFactory<PrintAnyGatewayFilterFactory.Config> {

    public PrintAnyGatewayFilterFactory() {
        super(Config.class);
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            log.info("[gateway] {} {}", exchange.getRequest().getMethod(), exchange.getRequest().getURI());
            return chain.filter(exchange);
        };
    }

    public static class Config {
    }
}
