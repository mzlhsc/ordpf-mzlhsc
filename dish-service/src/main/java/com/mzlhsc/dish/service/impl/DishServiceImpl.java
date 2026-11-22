package com.mzlhsc.dish.service.impl;

import cn.hutool.core.bean.BeanUtil;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.spring.service.impl.ServiceImpl;
import com.mzlhsc.api.client.SetmealClient;
import com.mzlhsc.common.constant.MessageConstant;
import com.mzlhsc.common.exception.BizIllegalException;
import com.mzlhsc.common.exception.CommonException;
import com.mzlhsc.common.result.PageDTO;
import com.mzlhsc.dish.constant.StatusConstant;
import com.mzlhsc.dish.domain.dto.DishDTO;
import com.mzlhsc.dish.domain.dto.DishPageQueryDTO;
import com.mzlhsc.dish.domain.po.Dish;
import com.mzlhsc.dish.domain.po.DishFlavor;
import com.mzlhsc.dish.domain.vo.DishVO;
import com.mzlhsc.dish.mapper.DishFlavorsMapper;
import com.mzlhsc.dish.mapper.DishMapper;
import com.mzlhsc.dish.service.IDishService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DishServiceImpl extends ServiceImpl<DishMapper,Dish> implements IDishService {

    private final DishFlavorsMapper dishFlavorsMapper;
    private final DishMapper dishMapper;
    private final SetmealClient setmealClient;

    /**
     * 新增菜品和对应的口味
     * @param dishDTO
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void saveWithFlavor(DishDTO dishDTO) {

        //除口味外参数拷贝到菜品表
        Dish dish = BeanUtil.copyProperties(dishDTO,Dish.class);

        // status由前端完成默认1(起售)  0(停售)
        //向菜品表插入条数据
        save(dish);


        //获取添加表的id
        Long dishId = dish.getId();

        List<DishFlavor> flavors = dishDTO.getFlavors();
        if(!CollectionUtils.isEmpty(flavors)){
            flavors.forEach(dishFlavor -> dishFlavor.setDishId(dishId));
            //向口味表插入n条数据
            dishFlavorsMapper.insertBatch(flavors);
        }

    }


    /**
     * 分页查询菜品
     * @param dishPageQueryDTO
     * @return
     */
    @Override
    public PageDTO<DishVO> pageQuery(DishPageQueryDTO dishPageQueryDTO) {
        // MyBatis-Plus 物理分页：Mapper 方法第一个参数是 IPage 时自动拼 count / limit
        Page<DishVO> page = new Page<>(dishPageQueryDTO.getPage(), dishPageQueryDTO.getPageSize());

        // 自定义查询：关联 category 表，返回带 categoryName 的 DishVO
        dishMapper.pageQuery(page, dishPageQueryDTO);

        return PageDTO.of(page);
    }

    /**
     * 根据id查询菜品
     * @param id
     * @return
     */
    @Override
    public DishVO getByIdWithFlavor(Long id) {
        //根据id查询菜品数据
        Dish dish = this.getById(id);
        if (dish == null) {
            throw new CommonException(MessageConstant.DISH_NOT_FOUND, 404);
        }
        //根据id查询菜品对应的口味数据
        List<DishFlavor> dishFlavors = dishFlavorsMapper.getByDishId(id);
        //将查询到的数据封装到VO中
        DishVO dishVO = new DishVO();
        BeanUtils.copyProperties(dish,dishVO);
        dishVO.setFlavors(dishFlavors);
        return dishVO;
    }

    /**
     * 修改菜品
     * @param dishDTO
     */
    @Override
    @Transactional
    public void updateWithFlavor(DishDTO dishDTO) {
        Dish dish = BeanUtil.copyProperties(dishDTO,Dish.class);
        dish.setUpdateUser(1L);
        dish.setUpdateTime(LocalDateTime.now());
        //修改菜品
        this.updateById(dish);

        //删除原有的口味数据
        dishFlavorsMapper.deleteByDishId(dishDTO.getId());

        //重新插入口味数据
        List<DishFlavor> flavors = dishDTO.getFlavors();
        if(!CollectionUtils.isEmpty(flavors)){
            flavors.forEach(dishFlavor -> dishFlavor.setDishId(dishDTO.getId()));
            //向口味表插入n条数据
            dishFlavorsMapper.insertBatch(flavors);
        }
    }

    /**
     * 批量删除菜品
     * @param ids
     */
    @Override
    @Transactional
    public void deleteWithFlavor(List<Long> ids) {

        //判断当前菜品是否能删除-是否存在售中菜品??
        List<Dish> dishes = listByIds(ids);
        for(Dish dish : dishes){
            if(dish.getStatus() == StatusConstant.ENABLE){//变量 TODO
                //当前菜品处于售中,不能删除
                throw new BizIllegalException("当前菜品处于售中,不能删除");
            }
        }
        //判断当前菜品是否能删除-是否被套餐关联??
        Integer count = setmealClient.countByDishIds(ids);
        if (count != null && count > 0) {
            throw new BizIllegalException("当前菜品已被套餐绑定，不能删除");
        }


        //根据菜品id集合批量删除菜品数据
        removeBatchByIds(ids);

        //根据菜品id集合批量删除关联的口味数据
        dishFlavorsMapper.deleteByDishIds(ids);
    }

    @Override
    public List<DishVO> listWithFlavor(Long categoryId) {
        // 查询菜品
        List<Dish> dishes = lambdaQuery().eq(Dish::getCategoryId,categoryId).list();

        List<DishVO> dishVOList = new ArrayList<>();

        for (Dish dish : dishes){
            DishVO dishVO = new DishVO();
            BeanUtils.copyProperties(dish,dishVO);

            //查询口味
            List<DishFlavor> flavors = dishFlavorsMapper.getByDishId(dish.getId());

            dishVO.setFlavors(flavors);

            dishVOList.add(dishVO);
        }



        return dishVOList;
    }


}
