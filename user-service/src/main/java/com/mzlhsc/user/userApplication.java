package com.mzlhsc.user;

import org.mybatis.spring.annotation.MapperScan;
import com.mzlhsc.api.config.DefaultFeignConfig;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableFeignClients(basePackages = "com.mzlhsc.api", defaultConfiguration = DefaultFeignConfig.class)
@MapperScan("com.mzlhsc.user.mapper")
@EnableScheduling
@EnableCaching
public class userApplication {

    public static void main(String[] args) {
        SpringApplication.run(userApplication.class, args);
    }

}
