package com.mzlhsc.dish.controller.inner;

import cn.hutool.core.bean.BeanUtil;
import com.mzlhsc.api.dto.DishSimpleDTO;
import com.mzlhsc.dish.domain.po.Dish;
import com.mzlhsc.dish.mapper.DishMapper;
import com.mzlhsc.dish.service.IDishService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

/**
 * 菜品内部接口，供其他微服务通过 Feign 调用
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/inner/dish")
@Tag(name = "菜品内部接口", description = "服务间调用，返回裸 DTO")
@Slf4j
public class DishInnerController {

    private final IDishService dishService;
    private final DishMapper dishMapper;

    @GetMapping("/{id}")
    @Operation(summary = "根据id查询菜品")
    public DishSimpleDTO getById(@PathVariable("id") Long id) {
        Dish dish = dishService.getById(id);
        return dish == null ? null : BeanUtil.copyProperties(dish, DishSimpleDTO.class);
    }

    @PostMapping("/batch")
    @Operation(summary = "根据id集合批量查询菜品")
    public List<DishSimpleDTO> listByIds(@RequestBody List<Long> ids) {
        List<DishSimpleDTO> result = new ArrayList<>();
        if (ids == null || ids.isEmpty()) {
            return result;
        }
        List<Dish> dishes = dishService.listByIds(ids);
        dishes.forEach(dish -> result.add(BeanUtil.copyProperties(dish, DishSimpleDTO.class)));
        return result;
    }

    @GetMapping("/list")
    @Operation(summary = "根据分类id查询菜品")
    public List<DishSimpleDTO> listByCategoryId(@RequestParam(value = "categoryId", required = false) Long categoryId) {
        List<Dish> dishes = dishService.lambdaQuery()
                .eq(categoryId != null, Dish::getCategoryId, categoryId)
                .list();
        List<DishSimpleDTO> result = new ArrayList<>();
        dishes.forEach(dish -> result.add(BeanUtil.copyProperties(dish, DishSimpleDTO.class)));
        return result;
    }

    @GetMapping("/count")
    @Operation(summary = "统计某个分类下的菜品数量")
    public Integer countByCategoryId(@RequestParam("categoryId") Long categoryId) {
        return dishMapper.countByCategoryId(categoryId);
    }

    @GetMapping("/countByStatus")
    @Operation(summary = "统计某个状态的菜品数量")
    public Integer countByStatus(@RequestParam("status") Integer status) {
        return dishMapper.countByStatus(status);
    }
}
