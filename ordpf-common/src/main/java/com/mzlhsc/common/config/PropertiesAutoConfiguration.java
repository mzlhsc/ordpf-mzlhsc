package com.mzlhsc.common.config;

import com.mzlhsc.common.properties.WeChatProperties;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

/**
 * 公共配置属性装配。
 * <p>
 * WeChatProperties 上的 @Component 只在被组件扫描到时才生效，
 * 而各服务扫描的是自己的包（com.mzlhsc.xxx），扫不到 com.mzlhsc.common，
 * 所以统一在这里注册成 Bean。
 */
@AutoConfiguration
@EnableConfigurationProperties(WeChatProperties.class)
public class PropertiesAutoConfiguration {
}
