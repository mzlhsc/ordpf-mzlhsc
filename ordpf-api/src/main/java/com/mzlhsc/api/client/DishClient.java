package com.mzlhsc.api.client;

import com.mzlhsc.api.dto.DishSimpleDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

/**
 * 菜品服务对外提供的内部接口
 */
@FeignClient(contextId = "dishClient", name = "dish-service", path = "/inner/dish")
public interface DishClient {

    /**
     * 根据id查询菜品
     */
    @GetMapping("/{id}")
    DishSimpleDTO getById(@PathVariable("id") Long id);

    /**
     * 根据id集合批量查询菜品
     */
    @PostMapping("/batch")
    List<DishSimpleDTO> listByIds(@RequestBody List<Long> ids);

    /**
     * 根据分类id查询菜品
     */
    @GetMapping("/list")
    List<DishSimpleDTO> listByCategoryId(@RequestParam(value = "categoryId", required = false) Long categoryId);

    /**
     * 统计某个分类下的菜品数量（分类删除前校验）
     */
    @GetMapping("/count")
    Integer countByCategoryId(@RequestParam("categoryId") Long categoryId);

    /**
     * 统计某个状态的菜品数量（工作台菜品总览）
     */
    @GetMapping("/countByStatus")
    Integer countByStatus(@RequestParam("status") Integer status);

    /**
     * 查询菜品剩余库存
     */
    @GetMapping("/stock/{dishId}")
    Integer getStock(@PathVariable("dishId") Long dishId);

    /**
     * 扣减库存（内部使用，失败会返回 Feign 异常）
     */
    @PostMapping("/stock/deduct")
    Boolean deductStock(@RequestParam("dishId") Long dishId, @RequestParam("number") Integer number);

    /**
     * 回补库存（取消/拒单）
     */
    @PostMapping("/stock/restore")
    Boolean restoreStock(@RequestParam("dishId") Long dishId, @RequestParam("number") Integer number);
}
