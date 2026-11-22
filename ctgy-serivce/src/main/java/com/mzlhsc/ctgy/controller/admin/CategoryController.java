package com.mzlhsc.ctgy.controller.admin;


import cn.hutool.core.bean.BeanUtil;

import com.mzlhsc.common.result.PageDTO;
import com.mzlhsc.ctgy.domain.dto.CategoryDTO;
import com.mzlhsc.ctgy.domain.dto.CategoryPageQueryDTO;
import com.mzlhsc.ctgy.domain.po.Category;
import com.mzlhsc.ctgy.service.ICategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * <p>
 * 菜品及套餐分类 前端控制器
 * </p>
 *
 * @author mzlhsc
 * @since 2026-11-06
 */
@RestController
@RequestMapping("/admin/category")
@RequiredArgsConstructor
@Tag(name = "菜品及套餐分类" ,description = "照片")
@Slf4j
public class CategoryController {

    private final ICategoryService categoryService;


    /**
     * 添加菜品分类
     * @param categoryDTO
     * @return
     */
    @PostMapping
    @Operation(summary = "添加菜品分类")
    public void save(@RequestBody CategoryDTO categoryDTO){
        log.info("添加菜品分类: {}", categoryDTO);

        categoryService.save(BeanUtil.copyProperties(categoryDTO, Category.class)
                .setStatus(1));
    }


    /**
     * 分页查询
     * @param categoryPageQueryDTO
     * @return
     */
    @GetMapping("/page")
    @Operation(summary = "分页查询")
    public PageDTO<Category> page(CategoryPageQueryDTO categoryPageQueryDTO){
        log.info("分页查询: {}", categoryPageQueryDTO);


        return categoryService.pageQuery(categoryPageQueryDTO);

    }

    /**
     * 根据类型查询分类
     * @param type
     * @return
     */
    @GetMapping("/list")
    @Operation(summary = "根据类型查询分类")
    public List<Category> list(Integer type){
        log.info("根据类型查询分类: {}", type);

//        List<Category> list = categoryService.listCategory(type);
        List<Category> list = categoryService.lambdaQuery().eq(Category::getType,type).list();



        return list;
    }


    /**
     * 修改菜品分类
     * @param categoryDTO
     * @return
     */
    @PutMapping
    @Operation(summary = "修改菜品分类")
    public void upate(@RequestBody CategoryDTO categoryDTO){
        log.info("修改菜品分类: {}", categoryDTO);

        categoryService.updateById(BeanUtil.copyProperties(categoryDTO,Category.class));
    }


    /**
     * 根据id删除
     * @param id
     * @return
     */
    @DeleteMapping
    @Operation(summary = "根据id删除")
    public void deletes(@RequestParam Long id){
        log.info("根据id删除: {}", id);

        //删除没有菜品的菜品分类
        categoryService.removeNoDishByIds(id);

    }

    /**
     * 启用、禁用分类
     * @param status
     * @param id
     * @return
     */
    @PostMapping("/status/{status}")
    @Operation(summary = "启用、禁用分类")
    public void status(@PathVariable Integer status,Long id){
        log.info("启用、禁用分类: {} {}", status,id);
        // return void.success(categoryService.updateById(Category.builder().id(id).status(status).build()));
        categoryService.lambdaUpdate().set(Category::getStatus,status).eq(Category::getId,id).
                update();
    }

}
