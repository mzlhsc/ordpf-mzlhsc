package com.mzlhsc.user.controller.inner;

import cn.hutool.core.bean.BeanUtil;
import com.mzlhsc.api.dto.AddressBookSimpleDTO;
import com.mzlhsc.api.dto.DateCountDTO;
import com.mzlhsc.api.dto.UserSimpleDTO;
import com.mzlhsc.user.domain.po.AddressBook;
import com.mzlhsc.user.domain.po.User;
import com.mzlhsc.user.mapper.UserMapper;
import com.mzlhsc.user.service.IAddressBookService;
import com.mzlhsc.user.service.IUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/**
 * 用户服务内部接口，供其他微服务通过 Feign 调用。
 * 返回值均为裸对象，不要用 R 包装。
 */
@RestController
@RequestMapping("/inner")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "用户内部接口", description = "供其他微服务通过 Feign 调用")
public class UserInnerController {

    private final IUserService userService;

    private final IAddressBookService addressBookService;

    private final UserMapper userMapper;

    /**
     * 根据id查询用户
     */
    @GetMapping("/user/{id}")
    @Operation(description = "根据id查询用户")
    public UserSimpleDTO getUserById(@PathVariable("id") Long id) {
        log.info("内部接口-根据id查询用户: {}", id);
        User user = userService.getById(id);
        return user == null ? null : BeanUtil.copyProperties(user, UserSimpleDTO.class);
    }

    /**
     * 根据id查询地址簿
     */
    @GetMapping("/addressBook/{id}")
    @Operation(description = "根据id查询地址簿")
    public AddressBookSimpleDTO getAddressBookById(@PathVariable("id") Long id) {
        log.info("内部接口-根据id查询地址簿: {}", id);
        AddressBook addressBook = addressBookService.getById(id);
        return addressBook == null ? null : BeanUtil.copyProperties(addressBook, AddressBookSimpleDTO.class);
    }

    /**
     * 按日期统计每日新增用户
     */
    @GetMapping("/user/countByDate")
    @Operation(description = "按日期统计每日新增用户")
    public List<DateCountDTO> countUserByDate(
            @RequestParam("begin") @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate begin,
            @RequestParam("end") @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate end) {
        log.info("内部接口-按日期统计新增用户: {} ~ {}", begin, end);
        return userMapper.countByDate(begin.atStartOfDay(), end.plusDays(1).atStartOfDay());
    }

    /**
     * 统计时间区间内新增用户总数
     */
    @GetMapping("/user/count")
    @Operation(description = "统计时间区间内新增用户总数")
    public Long countUser(
            @RequestParam("begin") @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate begin,
            @RequestParam("end") @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate end) {
        log.info("内部接口-统计新增用户总数: {} ~ {}", begin, end);
        return userService.lambdaQuery()
                .ge(User::getCreateTime, begin.atStartOfDay())
                .lt(User::getCreateTime, end.plusDays(1).atStartOfDay())
                .count();
    }
}
