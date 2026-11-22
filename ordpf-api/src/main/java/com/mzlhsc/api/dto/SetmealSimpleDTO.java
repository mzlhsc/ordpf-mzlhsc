package com.mzlhsc.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;

/**
 * 跨服务传输的套餐精简信息
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SetmealSimpleDTO implements Serializable {

    private Long id;

    /** 套餐名称 */
    private String name;

    /** 套餐价格 */
    private BigDecimal price;

    /** 图片 */
    private String image;

    /** 描述信息 */
    private String description;

    /** 分类id */
    private Long categoryId;

    /** 0 停售 1 起售 */
    private Integer status;
}
