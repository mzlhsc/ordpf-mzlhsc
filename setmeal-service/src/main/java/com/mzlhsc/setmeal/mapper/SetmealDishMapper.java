package com.mzlhsc.setmeal.mapper;

import com.mzlhsc.setmeal.domain.po.SetmealDish;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface SetmealDishMapper {

    /**
     * 菜品数据批量插入
     * @param dishes
     */
    void insertBatch(@Param("dishes") List<SetmealDish> dishes);

    /**
     * 根据id查询套餐对应的菜品
     * @param setmealId
     * @return
     */
    @Select("select * from setmeal_dish where setmeal_id = #{setmealId}")
    List<SetmealDish> getByDishId(Long setmealId);


    /**
     * 根据idsc套餐对应的菜品
     * @param setmealId
     */
    @Delete("delete from setmeal_dish where setmeal_id = #{setmealId}")
    void deletBySetmalId(Long setmealId);

    /**
     * 根据套餐id集合批量删除关联的菜品数据
     * @param ids
     */
    void deletBySetmalIds(@Param("ids") List<Long> ids);

    /**
     * 判断当前菜品是否能删除-是否被套餐关联
     * @param ids
     * @return
     */
    List<Long> getSetmealIdsByDishIds(@Param("dishIds") List<Long> ids);
}
