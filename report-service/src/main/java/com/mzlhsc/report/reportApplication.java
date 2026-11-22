package com.mzlhsc.report;

import org.mybatis.spring.annotation.MapperScan;
import com.mzlhsc.api.config.DefaultFeignConfig;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableFeignClients(basePackages = "com.mzlhsc.api", defaultConfiguration = DefaultFeignConfig.class)
@MapperScan("com.mzlhsc.report.mapper")
@EnableScheduling
@EnableCaching
public class reportApplication {

    public static void main(String[] args) {
        SpringApplication.run(reportApplication.class, args);
    }

}
