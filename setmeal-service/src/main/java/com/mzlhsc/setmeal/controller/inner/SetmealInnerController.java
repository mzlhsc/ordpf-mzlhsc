package com.mzlhsc.setmeal.controller.inner;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.collection.CollUtil;
import com.mzlhsc.api.dto.SetmealDishItemDTO;
import com.mzlhsc.api.dto.SetmealSimpleDTO;
import com.mzlhsc.setmeal.domain.po.Setmeal;
import com.mzlhsc.setmeal.domain.po.SetmealDish;
import com.mzlhsc.setmeal.mapper.SetmealDishMapper;
import com.mzlhsc.setmeal.mapper.SetmealMapper;
import com.mzlhsc.setmeal.service.ISetmealService;
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

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;

/**
 * 套餐服务内部接口，供其他微服务通过 Feign 调用。
 * 返回值均为裸对象，不要用 R 包装。
 */
@RestController
@RequestMapping("/inner/setmeal")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "套餐内部接口", description = "供其他微服务通过 Feign 调用")
public class SetmealInnerController {

    private final ISetmealService setmealService;

    private final SetmealMapper setmealMapper;

    private final SetmealDishMapper setmealDishMapper;

    /**
     * 根据id查询套餐
     */
    @GetMapping("/{id}")
    @Operation(description = "根据id查询套餐")
    public SetmealSimpleDTO getById(@PathVariable("id") Long id) {
        log.info("内部接口-根据id查询套餐: {}", id);
        Setmeal setmeal = setmealService.getById(id);
        return setmeal == null ? null : BeanUtil.copyProperties(setmeal, SetmealSimpleDTO.class);
    }

    /**
     * 根据id集合批量查询套餐
     */
    @PostMapping("/batch")
    @Operation(description = "根据id集合批量查询套餐")
    public List<SetmealSimpleDTO> listByIds(@RequestBody List<Long> ids) {
        log.info("内部接口-根据id集合批量查询套餐: {}", ids);
        if (CollUtil.isEmpty(ids)) {
            return List.of();
        }
        return setmealService.listByIds(ids).stream()
                .map(setmeal -> BeanUtil.copyProperties(setmeal, SetmealSimpleDTO.class))
                .toList();
    }

    /**
     * 根据套餐id查询套餐内的菜品项
     */
    @GetMapping("/dishes/{setmealId}")
    @Operation(description = "根据套餐id查询套餐内的菜品项")
    public List<SetmealDishItemDTO> listDishesBySetmealId(@PathVariable("setmealId") Long setmealId) {
        log.info("内部接口-根据套餐id查询套餐内菜品项: {}", setmealId);
        List<SetmealDish> setmealDishes = setmealDishMapper.getBySetmealId(setmealId);
        return setmealDishes.stream()
                .map(setmealDish -> BeanUtil.copyProperties(setmealDish, SetmealDishItemDTO.class))
                .toList();
    }

    /**
     * 统计某个分类下的套餐数量（分类删除前校验）
     */
    @GetMapping("/count")
    @Operation(description = "统计某个分类下的套餐数量")
    public Integer countByCategoryId(@RequestParam("categoryId") Long categoryId) {
        log.info("内部接口-统计分类下的套餐数量: {}", categoryId);
        return setmealMapper.countByCategoryId(categoryId);
    }

    /**
     * 统计这些菜品被多少个套餐引用（菜品删除前校验）
     */
    @GetMapping("/countByDishIds")
    @Operation(description = "统计这些菜品被多少个套餐引用")
    public Integer countByDishIds(@RequestParam("dishIds") List<Long> dishIds) {
        log.info("内部接口-统计菜品被套餐引用数量: {}", dishIds);
        if (CollUtil.isEmpty(dishIds)) {
            return 0;
        }
        return new HashSet<>(setmealDishMapper.getSetmealIdsByDishIds(dishIds)).size();
    }

    /**
     * 统计某个状态的套餐数量（工作台套餐总览）
     */
    @GetMapping("/countByStatus")
    @Operation(description = "统计某个状态的套餐数量")
    public Integer countByStatus(@RequestParam("status") Integer status) {
        log.info("内部接口-统计套餐数量, 状态: {}", status);
        Map<String, Object> map = new HashMap<>(2);
        map.put("status", status);
        return setmealMapper.countByMap(map);
    }
}
