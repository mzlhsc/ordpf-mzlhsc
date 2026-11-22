package com.mzlhsc.api.config;

import com.mzlhsc.common.context.UserContext;
import feign.RequestInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Feign 全局配置：把当前登录者身份透传给被调用的微服务。
 * <p>
 * 必须通过各启动类的
 * {@code @EnableFeignClients(basePackages = "com.mzlhsc.api", defaultConfiguration = DefaultFeignConfig.class)}
 * 显式引入，否则本类里的 Bean 不会生效（它不在服务的组件扫描范围内）。
 */
@Configuration
public class DefaultFeignConfig {

    @Bean
    public RequestInterceptor userInfoRequestInterceptor() {
        return template -> {
            // 1.获取当前登录者
            Long id = UserContext.getCurrentId();
            if (id == null) {
                // 没有登录者（比如定时任务、公开接口调用），不带头
                return;
            }
            // 2.按身份只传一个头：员工 -> empId，用户 -> userId
            //   两个都传的话，下游会拿员工 id 当用户 id 用
            String header = UserContext.isAdmin() ? "empId" : "userId";
            template.removeHeader(header);
            template.header(header, id.toString());
        };
    }
}
