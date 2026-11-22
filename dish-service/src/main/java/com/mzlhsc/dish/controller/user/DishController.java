package com.mzlhsc.dish.controller.user;



import com.mzlhsc.dish.domain.vo.DishVO;
import com.mzlhsc.dish.mapper.DishFlavorsMapper;
import com.mzlhsc.dish.service.IDishService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 菜品管理
 */
@RequestMapping("/user/dish")
@RestController("userDishController")
@RequiredArgsConstructor
@Tag(name = "菜品相关接口",description = "菜品的增删改查接口")
@Slf4j
public class DishController {
    private final IDishService dishService;
    private final DishFlavorsMapper dishFlavorsMapper;




    /**
     * 根据分类id查询菜品
     * @param categoryId
     * @return
     */
    @GetMapping("/list")
    @Operation(summary = "根据分类id查询菜品")
    public List<DishVO> list(Long categoryId){
        log.info("根据分类id查询菜品: {}",categoryId);
        return dishService.listWithFlavor(categoryId);
    }

}
