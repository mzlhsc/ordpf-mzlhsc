package com.mzlhsc.user.domain.dto;

import lombok.Data;

import java.io.Serializable;

@Data
public class UserLoginDTO implements Serializable {
    //微信授权码
    private String code;
}
