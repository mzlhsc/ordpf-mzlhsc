package com.mzlhsc.shop;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@MapperScan("com.mzlhsc.shop.mapper")
@EnableScheduling
@EnableCaching
public class shopApplication {

    public static void main(String[] args) {
        SpringApplication.run(shopApplication.class, args);
    }

}
