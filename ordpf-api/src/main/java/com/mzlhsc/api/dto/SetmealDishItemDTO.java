package com.mzlhsc.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;

/**
 * 套餐内的菜品项（跨服务传输）
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SetmealDishItemDTO implements Serializable {

    /** 套餐id */
    private Long setmealId;

    /** 菜品id */
    private Long dishId;

    /** 菜品名称 */
    private String name;

    /** 菜品原价 */
    private BigDecimal price;

    /** 份数 */
    private Integer copies;
}
