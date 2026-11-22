package com.mzlhsc.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 跨服务传输的用户信息
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSimpleDTO implements Serializable {

    private Long id;

    /** 用户姓名 */
    private String name;

    /** 手机号 */
    private String phone;

    /** 注册时间 */
    private LocalDateTime createTime;
}
