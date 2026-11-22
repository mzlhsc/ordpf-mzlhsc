package com.mzlhsc.common.interceptor;

import cn.hutool.core.util.StrUtil;
import com.mzlhsc.common.context.UserContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.servlet.HandlerInterceptor;


public class UserInfoInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // 1.用户端请求头 userId：存在就说明是 C 端用户
        Long id = parseId(request.getHeader("userId"));
        if (id != null) {
            UserContext.setCurrentId(id, UserContext.Identity.USER);
            return true;
        }
        // 2.管理端请求头 empId：存在就说明是管理端员工
        id = parseId(request.getHeader("empId"));
        if (id != null) {
            UserContext.setCurrentId(id, UserContext.Identity.ADMIN);
        }

        // 3.放行（公开接口没有身份是正常的，不能在这里返回 401）
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        // 移除用户，避免线程池复用导致串号
        UserContext.removeCurrent();
    }

    /**
     * 请求头转 id，非法值当作没有（防止伪造头导致 500）
     */
    private Long parseId(String value) {
        if (StrUtil.isBlank(value)) {
            return null;
        }
        try {
            return Long.valueOf(value.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
