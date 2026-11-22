package com.mzlhsc.dish;

import org.mybatis.spring.annotation.MapperScan;
import com.mzlhsc.api.config.DefaultFeignConfig;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableFeignClients(basePackages = "com.mzlhsc.api", defaultConfiguration = DefaultFeignConfig.class)
@MapperScan("com.mzlhsc.dish.mapper")
@EnableScheduling
@EnableCaching
public class dishApplication {

    public static void main(String[] args) {
        SpringApplication.run(dishApplication.class, args);
    }

}
