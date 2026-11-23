package com.mzlhsc.common;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * 通用服务启动类（文件上传）。
 * <p>
 * 注意：本服务的包名 com.mzlhsc.common 与 ordpf-common 依赖包同名，
 * 如果直接扫描 com.mzlhsc.common 会把依赖里的 @Configuration、@Component
 * 和自动装配重复注册，导致 Bean 冲突。这里只扫描本服务实际需要的包。
 */
@SpringBootApplication(scanBasePackages = {
        "com.mzlhsc.common.controller",
        "com.mzlhsc.common.properties",
        "com.mzlhsc.common.utils"
})
public class commonApplication {

    public static void main(String[] args) {
        SpringApplication.run(commonApplication.class, args);
    }

}
