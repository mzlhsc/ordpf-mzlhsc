package com.mzlhsc.dish.controller.admin;


import com.mzlhsc.common.result.PageDTO;
import com.mzlhsc.dish.domain.dto.DishDTO;
import com.mzlhsc.dish.domain.dto.DishPageQueryDTO;
import com.mzlhsc.dish.domain.po.Dish;
import com.mzlhsc.dish.domain.vo.DishVO;
import com.mzlhsc.dish.mapper.DishFlavorsMapper;
import com.mzlhsc.dish.service.IDishService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 菜品管理
 */
@RequestMapping("/admin/dish")
@RestController
@RequiredArgsConstructor
@Tag(name = "菜品相关接口",description = "菜品的增删改查接口")
@Slf4j
public class DishController {
    private final IDishService dishService;
    private final DishFlavorsMapper dishFlavorsMapper;


    /**
     * 新增菜品
     * @param dishDTO
     * @return
     */

    @PostMapping
    @Operation(summary = "新增菜品", description = "传入菜品信息保存一条记录")
    @CacheEvict(cacheNames = "dishCache" ,key = "#dishDTO.categoryId")
    public void save(@RequestBody DishDTO dishDTO){
        log.info("新增菜品: {}", dishDTO);
        dishService.saveWithFlavor(dishDTO);
    }



    /**
     * 分页查询菜品
     * @param dishPageQueryDTO
     * @return
     */
    @GetMapping("/page")
    @Operation(summary = "分页查询菜品", description = "有条件查询")
    public PageDTO<DishVO> page(@ParameterObject DishPageQueryDTO dishPageQueryDTO){
        log.info("分页查询菜品 : {}", dishPageQueryDTO);
        return dishService.pageQuery(dishPageQueryDTO);
    }


    /**
     * 根据id查询菜品
     * @param id
     * @return
     */
    @GetMapping("{id}")
    @Operation(summary = "根据id查询菜品")
    public DishVO getId(@PathVariable Long id){
        log.info("根据id查询菜品: {}",id);
        DishVO dishVO= dishService.getByIdWithFlavor(id);
        return dishVO;
    }


    /**
     * 根据分类id查询菜品
     * @param categoryId
     * @return
     */
    @GetMapping("/list")
    @Operation(summary = "根据分类id查询菜品")
    public List<Dish> list(Long categoryId){
        log.info("根据分类id查询菜品: {}",categoryId);
        return dishService.lambdaQuery().eq(Dish::getCategoryId,categoryId).list();
    }

    /**
     * 修改菜品
     * @param dishDTO
     * @return
     */
    @PutMapping
    @Operation( summary = "修改菜品")
    @CacheEvict(cacheNames = "dishCache" ,allEntries = true)
    public void update(@RequestBody DishDTO dishDTO){
        log.info("修改菜品: {}", dishDTO);
        dishService.updateWithFlavor(dishDTO);

    }

    /**
     *
     * 批量删除菜品
     * @param ids
     * @return
     */
    @DeleteMapping
    @Operation(summary = "批量删除菜品")
    @CacheEvict(cacheNames = "dishCache" ,allEntries = true)
    public void deleteWithFlavor(@RequestParam List<Long> ids){
        log.info("批量删除菜品: {}" ,ids);
        dishService.deleteWithFlavor(ids);
    }

    /**
     * 菜品停起售
     * @param status
     * @param id
     * @return
     */
    @PostMapping("/status/{status}")
    @Operation(summary = "菜品停起售")
    @CacheEvict(cacheNames = "dishCache" ,allEntries = true)
    public void status(@PathVariable Integer status, Long id){
        log.info("菜品停起售: {} {}",status , id);
        dishService.lambdaUpdate().set(Dish::getStatus,status).eq(Dish::getId,id).update();
    }
}
