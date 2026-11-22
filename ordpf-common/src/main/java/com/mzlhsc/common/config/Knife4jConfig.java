package com.mzlhsc.common.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 接口文档（Knife4j / springdoc）全局信息配置
 */
@Configuration
public class Knife4jConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("点单平台客户端项目接口文档")
                        .description("Ordering platform（ordpf-mzlhsc）后端接口文档")
                        .version("v1.0.0")
                        .contact(new Contact().name("mzlhsc")));
    }
}
