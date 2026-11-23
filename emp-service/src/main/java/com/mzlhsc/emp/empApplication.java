package com.mzlhsc.emp;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * 员工服务启动类。
 * <p>
 * 只需要扫描本服务自己的包，公共组件（异常处理、字段自动填充、Knife4j）
 * 由 ordpf-common 的自动装配统一注册，避免重复扫描导致 Bean 冲突。
 */
@SpringBootApplication
@MapperScan("com.mzlhsc.emp.mapper")
public class empApplication {

    public static void main(String[] args) {
        SpringApplication.run(empApplication.class, args);
    }

}
