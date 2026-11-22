package com.mzlhsc.api.client;

import com.mzlhsc.api.dto.AddressBookSimpleDTO;
import com.mzlhsc.api.dto.DateCountDTO;
import com.mzlhsc.api.dto.UserSimpleDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.LocalDate;
import java.util.List;

/**
 * 用户服务对外提供的内部接口
 */
@FeignClient(contextId = "userClient", name = "user-service", path = "/inner")
public interface UserClient {

    /**
     * 根据id查询用户
     */
    @GetMapping("/user/{id}")
    UserSimpleDTO getUserById(@PathVariable("id") Long id);

    /**
     * 根据id查询地址簿
     */
    @GetMapping("/addressBook/{id}")
    AddressBookSimpleDTO getAddressBookById(@PathVariable("id") Long id);

    /**
     * 按日期统计每日新增用户（报表用户统计）
     */
    @GetMapping("/user/countByDate")
    List<DateCountDTO> countUserByDate(
            @RequestParam("begin") @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate begin,
            @RequestParam("end") @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate end);

    /**
     * 统计时间区间内新增用户总数（工作台）
     */
    @GetMapping("/user/count")
    Long countUser(
            @RequestParam("begin") @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate begin,
            @RequestParam("end") @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate end);
}
