package com.mzlhsc.dish.mapper;


import com.mzlhsc.dish.domain.po.DishFlavor;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface DishFlavorsMapper {

    /**
     * 口味数据批量插入
     * @param flavors
     */
    void insertBatch(@Param("flavors") List<DishFlavor> flavors);


    /**
     * 根据id查询菜品对应的口味数据
     * @param dishIds
     * @return
     */
    @Select("select * from dish_flavor where dish_id = #{dishIds}")
    List<DishFlavor> getByDishId(@Param("dishIds") Long dishIds);


    /**
     * 根据id删除口味
     * @param dishId
     */
    @Delete("delete from dish_flavor where dish_id = #{dishId}")
    void deleteByDishId(Long dishId);


    //根据菜品id集合批量删除关联的口味数据
    void deleteByDishIds(@Param("dishIds") List<Long> dishIds);
}
