package com.mzlhsc.user.service;

import com.baomidou.mybatisplus.spring.service.IService;
import com.mzlhsc.user.domain.dto.UserLoginDTO;
import com.mzlhsc.user.domain.po.User;
import com.mzlhsc.user.domain.vo.UserLoginVo;

/**
 * <p>
 * 用户信息 服务类
 * </p>
 *
 * @author mzlhsc
 * @since 2026-11-12
 */
public interface IUserService extends IService<User> {

    UserLoginVo login(UserLoginDTO userLoginDTO);
}
