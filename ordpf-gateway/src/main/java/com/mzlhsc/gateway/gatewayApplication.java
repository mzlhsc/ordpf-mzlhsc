package com.mzlhsc.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

/**
 * 网关启动类。
 * <p>
 * 网关是 WebFlux 栈，不连数据库：父 pom 已不再全局引入 mybatis / JDBC，
 * 所以这里不需要（也不能）再 exclude DataSourceAutoConfiguration —— 那个类根本不在 classpath 上。
 */
@SpringBootApplication
@EnableDiscoveryClient
public class gatewayApplication {
    public static void main(String[] args) {
        SpringApplication.run(gatewayApplication.class, args);
    }
}
