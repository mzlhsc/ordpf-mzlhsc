package com.mzlhsc.order.service.impl;

import com.mzlhsc.api.dto.DishSimpleDTO;
import com.mzlhsc.api.dto.SetmealSimpleDTO;
import com.mzlhsc.api.client.DishClient;
import com.mzlhsc.api.client.SetmealClient;
import com.baomidou.mybatisplus.spring.service.impl.ServiceImpl;
import com.mzlhsc.common.constant.MessageConstant;
import com.mzlhsc.common.exception.BizIllegalException;
import com.mzlhsc.common.exception.CommonException;
import com.mzlhsc.common.context.UserContext;
import com.mzlhsc.order.domain.dto.ShoppingCartDTO;
import com.mzlhsc.order.domain.po.ShoppingCart;
import com.mzlhsc.order.mapper.ShoppingCartMapper;
import com.mzlhsc.order.service.IShoppingCartService;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * <p>
 * 购物车 服务实现类
 * </p>
 *
 * @author mzlhsc
 * @since 2026-11-13
 */
@Service
@RequiredArgsConstructor
public class ShoppingCartServiceImpl extends ServiceImpl<ShoppingCartMapper, ShoppingCart> implements IShoppingCartService {
    private final ShoppingCartMapper shoppingCartMapper;

    private final DishClient dishClient;

    private final SetmealClient setmealClient;

    /**
     * 添加购物车
     *
     * @param shoppingCartDTO
     */
    @Override
    public void addShoppingCart(ShoppingCartDTO shoppingCartDTO) {
        ShoppingCart shoppingCart = new ShoppingCart();
        BeanUtils.copyProperties(shoppingCartDTO, shoppingCart);
        //只能查询自己的购物车数据
        shoppingCart.setUserId(UserContext.getCurrentId());

        //判断当前商品是否在购物车中
        List<ShoppingCart> shoppingCartList = lambdaQuery()
                .eq(ShoppingCart::getUserId,shoppingCart.getUserId())
                .eq(ShoppingCart::getDishId, shoppingCart.getDishId())
                .eq(ShoppingCart::getSetmealId, shoppingCart.getSetmealId())
                .eq(ShoppingCart::getDishFlavor, shoppingCart.getDishFlavor())
                .list();
        if (shoppingCartList != null && shoppingCartList.size() == 1) {
            //如果已经存在,就更新数量,数量加一
            shoppingCart = shoppingCartList.get(0);
            shoppingCart.setNumber(shoppingCart.getNumber() + 1);
            lambdaUpdate()
                    .set(ShoppingCart::getNumber, shoppingCart.getNumber())
                    .eq(ShoppingCart::getId, shoppingCart.getId())
                    .update();
        } else {
            //如果不存在,插入数据,数量为一
            Long dishId = shoppingCartDTO.getDishId();
            if (dishId != null) {
                //添加到购物车的是菜品
                DishSimpleDTO dish = dishClient.getById(dishId);
                if (dish == null) {
                    throw new CommonException(MessageConstant.DISH_NOT_FOUND, 404);
                }
                shoppingCart.setName(dish.getName());
                shoppingCart.setImage(dish.getImage());
                shoppingCart.setAmount(dish.getPrice());

            } else {
                //添加到购物车的是套餐
                SetmealSimpleDTO setmeal = setmealClient.getById(shoppingCartDTO.getSetmealId());
                if (setmeal == null) {
                    throw new CommonException(MessageConstant.SETMEAL_NOT_FOUND, 404);
                }
                shoppingCart.setName(setmeal.getName());
                shoppingCart.setImage(setmeal.getImage());
                shoppingCart.setAmount(setmeal.getPrice());
            }
            shoppingCart.setNumber(1);
            shoppingCart.setCreateTime(LocalDateTime.now());
            save(shoppingCart);
        }
    }

    /**
     * 删除购物车中一个商品
     *
     * @param shoppingCartDTO
     */
    @Override
    public void subShoppingCart(ShoppingCartDTO shoppingCartDTO) {
        ShoppingCart shoppingCart = new ShoppingCart();
        BeanUtils.copyProperties(shoppingCartDTO, shoppingCart);
        //只能查询自己的购物车数据
        shoppingCart.setUserId(UserContext.getCurrentId());

        //判断当前商品是否在购物车中
        List<ShoppingCart> shoppingCartList = lambdaQuery()
                .eq(ShoppingCart::getUserId,shoppingCart.getUserId())
                .eq(ShoppingCart::getDishId, shoppingCart.getDishId())
                .eq(ShoppingCart::getSetmealId, shoppingCart.getSetmealId())
                .eq(ShoppingCart::getDishFlavor, shoppingCart.getDishFlavor())
                .list();
        //更新数量,数量减一
        if (shoppingCartList == null || shoppingCartList.isEmpty()) {
            throw new BizIllegalException(MessageConstant.SHOPPING_CART_NOT_FOUND);
        }
        shoppingCart = shoppingCartList.get(0);
        if (shoppingCart.getNumber() == null || shoppingCart.getNumber() <= 0) {
            throw new BizIllegalException(MessageConstant.SHOPPING_CART_NOT_FOUND);
        }
        shoppingCart.setNumber(shoppingCart.getNumber() - 1);
        lambdaUpdate()
                .set(ShoppingCart::getNumber, shoppingCart.getNumber())
                .eq(ShoppingCart::getId, shoppingCart.getId())
                .update();

        if (shoppingCart.getNumber() == 0) {
            // 数量减到 0，直接删除该条购物车记录
            lambdaUpdate()
                    .eq(ShoppingCart::getId, shoppingCart.getId())
                    .remove();
        }
    }

}
