package com.mzlhsc.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * 跨服务传输的地址簿信息
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddressBookSimpleDTO implements Serializable {

    private Long id;

    /** 用户id */
    private Long userId;

    /** 收货人 */
    private String consignee;

    /** 手机号 */
    private String phone;

    /** 性别 */
    private String sex;

    /** 省级区划名称 */
    private String provinceName;

    /** 市级区划名称 */
    private String cityName;

    /** 区级区划名称 */
    private String districtName;

    /** 详细地址 */
    private String detail;

    /** 标签 */
    private String label;

    /** 是否默认地址 1是 0否 */
    private Integer isDefault;
}
