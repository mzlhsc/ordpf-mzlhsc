package com.mzlhsc.ctgy;

import org.mybatis.spring.annotation.MapperScan;
import com.mzlhsc.api.config.DefaultFeignConfig;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@EnableFeignClients(basePackages = "com.mzlhsc.api", defaultConfiguration = DefaultFeignConfig.class)
@MapperScan("com.mzlhsc.ctgy.mapper")
public class ctgyApplication {

    public static void main(String[] args) {
        SpringApplication.run(ctgyApplication.class, args);
    }

}
