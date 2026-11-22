package com.mzlhsc.setmeal.service.impl;

import cn.hutool.core.bean.BeanUtil;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.spring.service.impl.ServiceImpl;
import com.mzlhsc.api.vo.DishItemVO;
import com.mzlhsc.common.constant.MessageConstant;
import com.mzlhsc.common.exception.BizIllegalException;
import com.mzlhsc.common.exception.CommonException;
import com.mzlhsc.common.result.PageDTO;
import com.mzlhsc.setmeal.constant.StatusConstant;
import com.mzlhsc.setmeal.domain.dto.SetmealDTO;
import com.mzlhsc.setmeal.domain.dto.SetmealPageQueryDTO;
import com.mzlhsc.setmeal.domain.po.Setmeal;
import com.mzlhsc.setmeal.domain.po.SetmealDish;
import com.mzlhsc.setmeal.domain.vo.SetmealVO;
import com.mzlhsc.setmeal.mapper.SetmealDishMapper;
import com.mzlhsc.setmeal.mapper.SetmealMapper;
import com.mzlhsc.setmeal.service.ISetmealService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * <p>
 * 套餐 服务实现类
 * </p>
 *
 * @author mzlhsc
 * @since 2026-11-09
 */
@Service
@RequiredArgsConstructor
public class SetmealServiceImpl extends ServiceImpl<SetmealMapper, Setmeal> implements ISetmealService {
    private final SetmealMapper setmealMapper;

    private final SetmealDishMapper setmealDishMapper;


    /**
     * 添加套餐和对应菜品
     * @param setmealDTO
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void saveInDish(SetmealDTO setmealDTO) {
        Setmeal setmeal = new Setmeal();
        BeanUtil.copyProperties(setmealDTO,Setmeal.class);
        //添加套餐
        save(setmeal);

        //获取套餐id
        Long setmealId = setmeal.getId();

        //添加套餐菜品
        insertBatch(setmealDTO.getSetmealDishes(),setmealId);
    }

    /**
     * 套餐分页查询
     * @param setmealPageQueryDTO
     * @return
     */
    @Override
    public PageDTO<SetmealVO> pageQuery(SetmealPageQueryDTO setmealPageQueryDTO) {
        // 第一个参数为 IPage 时，MyBatis-Plus 分页拦截器自动拼接 count 与 limit
        Page<SetmealVO> page = new Page<>(setmealPageQueryDTO.getPage(), setmealPageQueryDTO.getPageSize());
        setmealMapper.pageQuery(page, setmealPageQueryDTO);
        return PageDTO.of(page);
    }


    /**
     * 修改套餐和对应菜品
     * @param setmealDTO
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateInDish(SetmealDTO setmealDTO) {
        Setmeal setmeal = new Setmeal();
        BeanUtil.copyProperties(setmealDTO,Setmeal.class);
        //修改套餐
        updateById(setmeal);

        //获取套餐id
        Long setmealId = setmeal.getId();

        //删除套餐菜品
        setmealDishMapper.deletBySetmalId(setmealId);

        //添加套餐菜品
        insertBatch(setmealDTO.getSetmealDishes(),setmealId);

    }

    /**
     * 删除套餐和关联的菜品
     * @param ids
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void removeNoDishByIds(List<Long> ids) {
        //判断当前套餐是否能删除--是否存在在售套餐
        List<Setmeal> setmeals = listByIds(ids);
        for(Setmeal setmeal : setmeals){
            if(setmeal.getStatus() == StatusConstant.ENABLE){
                //当前套餐处于售中,不能删除
                throw new BizIllegalException(MessageConstant.SETMEAL_ON_SALE);
            }
        }
        //根据套餐id批量删除套餐
        removeByIds(ids);

        //根据套餐id集合批量删除关联的菜品数据
        setmealDishMapper.deletBySetmalIds(ids);


    }

    /**
     * 根据套餐id查询菜品选项
     * @param id
     * @return
     */
    @Override
    public List<DishItemVO> getDishItemById(Long id) {
        return setmealMapper.getDishItemBySetmealId(id);
    }

    /**
     * 根据id查询套餐及其关联的菜品关系
     * @param id
     * @return
     */
    @Override
    public SetmealVO getByIdWithDishes(Long id) {
        Setmeal setmeal = this.getById(id);
        if (setmeal == null) {
            // 套餐不存在
            throw new CommonException(MessageConstant.SETMEAL_NOT_FOUND, 404);
        }
        SetmealVO setmealVO = new SetmealVO();
        BeanUtils.copyProperties(setmeal, setmealVO);
        setmealVO.setSetmealDishes(setmealDishMapper.getByDishId(id));
        return setmealVO;
    }



    /**
     * 添加套餐菜品
     * @param dishes
     * @param setmealId
     */
    public void insertBatch(List<SetmealDish> dishes,Long setmealId){
        if (dishes != null  &&  dishes.size() >0){
            dishes.forEach(setmealDish ->  setmealDish.setSetmealId(setmealId));
            //向菜品表插入n条数据
            setmealDishMapper.insertBatch(dishes);

        }
    }

}
