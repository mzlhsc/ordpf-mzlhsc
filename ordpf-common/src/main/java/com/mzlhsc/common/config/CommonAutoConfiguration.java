package com.mzlhsc.common.config;

import com.mzlhsc.common.advice.CommonExceptionAdvice;
import com.mzlhsc.common.aspect.AutoFillAspect;
import com.mzlhsc.common.utils.MyMetaObjectHandler;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.context.annotation.Bean;

/**
 * 公共组件自动装配。
 * <p>
 * 业务服务的启动类只扫描自己的包，扫描不到本模块下的 advice / aspect / utils，
 * 因此这里统一以自动装配的方式注册，避免每个服务重复写 @ComponentScan。
 * 使用 @ConditionalOnMissingBean 保证被业务服务主动扫描时不会重复注册。
 */
@AutoConfiguration
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
public class CommonAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    public CommonExceptionAdvice commonExceptionAdvice() {
        return new CommonExceptionAdvice();
    }

    @Bean
    @ConditionalOnMissingBean
    public AutoFillAspect autoFillAspect() {
        return new AutoFillAspect();
    }

    @Bean
    @ConditionalOnMissingBean
    public MyMetaObjectHandler myMetaObjectHandler() {
        return new MyMetaObjectHandler();
    }

    @Bean
    @ConditionalOnClass(OpenAPI.class)
    @ConditionalOnMissingBean(OpenAPI.class)
    public OpenAPI commonOpenAPI() {
        return new OpenAPI().info(new Info()
                .title("ordpf-mzlhsc 接口文档")
                .description("订单平台微服务接口文档")
                .version("1.0")
                .contact(new Contact().name("mzlhsc")));
    }
}