package com.mzlhsc.ctgy.service.impl;

import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.spring.service.impl.ServiceImpl;
import com.mzlhsc.api.client.DishClient;
import com.mzlhsc.api.client.SetmealClient;
import com.mzlhsc.common.exception.BizIllegalException;
import com.mzlhsc.common.result.PageDTO;
import com.mzlhsc.ctgy.domain.dto.CategoryPageQueryDTO;
import com.mzlhsc.ctgy.domain.po.Category;
import com.mzlhsc.ctgy.mapper.CategoryMapper;
import com.mzlhsc.ctgy.service.ICategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * <p>
 * 菜品及套餐分类 服务实现类
 * </p>
 *
 * @author mzlhsc
 * @since 2026-11-06
 */
@Service
@RequiredArgsConstructor
public class CategoryServiceImpl extends ServiceImpl<CategoryMapper, Category> implements ICategoryService {

    private final DishClient dishClient;
    private final SetmealClient setmealClient;

    /**
     * 分页查询
     * @param categoryPageQueryDTO
     * @return
     */
    @Override
    public PageDTO<Category> pageQuery(CategoryPageQueryDTO categoryPageQueryDTO) {
        // 交由 MyBatis-Plus 的 PaginationInnerInterceptor 做物理分页
        Page<Category> page = new Page<>(categoryPageQueryDTO.getPage(), categoryPageQueryDTO.getPageSize());
        lambdaQuery()
                .like(StrUtil.isNotBlank(categoryPageQueryDTO.getName()), Category::getName, categoryPageQueryDTO.getName())
                .eq(categoryPageQueryDTO.getType() != null, Category::getType, categoryPageQueryDTO.getType())
                .orderByAsc(Category::getSort)
                .orderByDesc(Category::getCreateTime)
                .page(page);
        return PageDTO.of(page);
    }

    /**
     * 删除没有菜品的菜品分类
     * @param id
     */
    @Override
    public void removeNoDishByIds(Long id) {
        //查询当前分类是否关联了菜品，如果关联了就抛出业务异常
        Integer dishCount = dishClient.countByCategoryId(id);
        if (dishCount != null && dishCount > 0) {
            throw new BizIllegalException("当前分类下有菜品，不能删除");
        }

        //查询当前分类是否关联了套餐，如果关联了就抛出业务异常
        Integer setmealCount = setmealClient.countByCategoryId(id);
        if (setmealCount != null && setmealCount > 0) {
            throw new BizIllegalException("当前分类下有套餐，不能删除");
        }
        removeById(id);
    }
}
