package com.mzlhsc.docs;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Knife4j 文档聚合服务：把各微服务的 /v3/api-docs 聚到一个页面。
 * 访问 http://localhost:8092/doc.html
 */
@SpringBootApplication
public class DocsServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(DocsServiceApplication.class, args);
    }
}
