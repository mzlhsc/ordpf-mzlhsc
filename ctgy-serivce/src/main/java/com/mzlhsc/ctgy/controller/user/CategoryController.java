package com.mzlhsc.ctgy.controller.user;



import com.mzlhsc.ctgy.domain.po.Category;
import com.mzlhsc.ctgy.service.ICategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * <p>
 * 菜品及套餐分类 前端控制器
 * </p>
 *
 * @author mzlhsc
 * @since 2026-11-06
 */
@RestController("userCategoryController")
@RequestMapping("/user/category")
@RequiredArgsConstructor
@Tag(name = "菜品及套餐分类")
@Slf4j
public class CategoryController {

    private final ICategoryService categoryService;



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




}
