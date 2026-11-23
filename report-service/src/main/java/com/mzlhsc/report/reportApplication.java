package com.mzlhsc.report;

import com.mzlhsc.api.config.DefaultFeignConfig;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

/**
 * 报表服务启动类。
 * <p>
 * 报表数据全部通过 Feign 聚合订单/用户服务，本服务不直接访问数据库，
 * 因此不需要 @MapperScan。
 */
@SpringBootApplication
@EnableFeignClients(basePackages = "com.mzlhsc.api", defaultConfiguration = DefaultFeignConfig.class)
public class reportApplication {

    public static void main(String[] args) {
        SpringApplication.run(reportApplication.class, args);
    }

}
