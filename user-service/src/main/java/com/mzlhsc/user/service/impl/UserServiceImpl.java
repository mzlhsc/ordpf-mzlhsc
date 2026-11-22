package com.mzlhsc.user.service.impl;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.baomidou.mybatisplus.spring.service.impl.ServiceImpl;
import com.mzlhsc.common.constant.MessageConstant;
import com.mzlhsc.common.exception.BizIllegalException;
import com.mzlhsc.common.properties.WeChatProperties;
import com.mzlhsc.common.utils.HttpClientUtil;
import com.mzlhsc.auth.config.JwtProperties;
import com.mzlhsc.auth.util.JwtTool;
import com.mzlhsc.user.domain.dto.UserLoginDTO;
import com.mzlhsc.user.domain.po.User;
import com.mzlhsc.user.domain.vo.UserLoginVo;
import com.mzlhsc.user.mapper.UserMapper;
import com.mzlhsc.user.service.IUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * <p>
 * 用户信息 服务实现类
 * </p>
 *
 * @author mzlhsc
 * @since 2026-11-12
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements IUserService {

    //微信服务接口地址
    public static final String WX_LOGIN = "https://api.weixin.qq.com/sns/jscode2session";

    private final WeChatProperties weChatProperties;

    private final JwtTool jwtTool;

    private final JwtProperties jwtProperties;

    @Override
    public UserLoginVo login(UserLoginDTO userLoginDTO) {
        //获取微信用户openid
        String openid = getOpenid(userLoginDTO.getCode());

        //判断openid是否为空,如果为空表示登录失败,抛出业务异常
        if(openid == null){
            throw new BizIllegalException(MessageConstant.LOGIN_FAILED);
        }
        //判断当前用户是否为新用户
        User user = lambdaQuery().eq(User::getOpenid,openid).one();
        if(user == null){
            user = User.builder()
                    .openid(openid)
                    .build();
            save(user);
        }
        //为用户生成令牌
        //Map<String,Object> claims = new HashMap<>();
        //claims.put("userId", user.getId());
        //String token = JwtUtils.generateToken(claims);
        String token = jwtTool.userCreateToken(user.getId(),jwtProperties.getTokenTTL());

        return UserLoginVo.builder()
                .id(user.getId())
                .openid(openid)
                .token(token)
                .build();
    }

    /**
     * 调用微信接口服务,获取微信用户openid
     * @param code
     * @return
     */
    private String getOpenid(String code) {
        Map<String, String> map = new HashMap<>();
        map.put("appid",weChatProperties.getAppid());
        map.put("secret", weChatProperties.getSecret());
        map.put("js_code",code);
        map.put("grant_type","authorization_code");
        String json = HttpClientUtil.doGet(WX_LOGIN, map);

        JSONObject jsonObject = JSON.parseObject(json);
        return jsonObject.getString("openid");
    }
}
