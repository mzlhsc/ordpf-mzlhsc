package com.mzlhsc.gateway.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.List;

@Data
@Component
@ConfigurationProperties(prefix = "mzlhsc.auth")
public class AuthProperties {

    /** 管理端令牌（请求头 zmlhsc）可访问的路径 */
    private List<String> adminIncludePaths;
    /** 用户端令牌（请求头 authorization）可访问的路径 */
    private List<String> userIncludePaths;

    /** 无需登录校验的路径 */
    private List<String> excludePaths;



}
