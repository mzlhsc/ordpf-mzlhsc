package com.mzlhsc.emp;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(scanBasePackages = {
        "com.mzlhsc.emp",
        "com.mzlhsc.common.jwt",
        "com.mzlhsc.common.config",
        "com.mzlhsc.common.advice"
})
@MapperScan("com.mzlhsc.emp.mapper")
@EnableScheduling
public class empApplication {

    public static void main(String[] args) {
        SpringApplication.run(empApplication.class, args);
    }

}
