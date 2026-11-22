package com.mzlhsc.api.client;

import com.mzlhsc.api.dto.SetmealDishItemDTO;
import com.mzlhsc.api.dto.SetmealSimpleDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

/**
 * 套餐服务对外提供的内部接口
 */
@FeignClient(contextId = "setmealClient", name = "setmeal-service", path = "/inner/setmeal")
public interface SetmealClient {

    /**
     * 根据id查询套餐
     */
    @GetMapping("/{id}")
    SetmealSimpleDTO getById(@PathVariable("id") Long id);

    /**
     * 根据id集合批量查询套餐
     */
    @PostMapping("/batch")
    List<SetmealSimpleDTO> listByIds(@RequestBody List<Long> ids);

    /**
     * 根据套餐id查询套餐内的菜品项
     */
    @GetMapping("/dishes/{setmealId}")
    List<SetmealDishItemDTO> listDishesBySetmealId(@PathVariable("setmealId") Long setmealId);

    /**
     * 统计某个分类下的套餐数量（分类删除前校验）
     */
    @GetMapping("/count")
    Integer countByCategoryId(@RequestParam("categoryId") Long categoryId);

    /**
     * 统计这些菜品被多少个套餐引用（菜品删除前校验）
     */
    @GetMapping("/countByDishIds")
    Integer countByDishIds(@RequestParam("dishIds") List<Long> dishIds);

    /**
     * 统计某个状态的套餐数量（工作台套餐总览）
     */
    @GetMapping("/countByStatus")
    Integer countByStatus(@RequestParam("status") Integer status);
}
