package com.mzlhsc.order.controller.user;


import com.mzlhsc.common.result.R;
import com.mzlhsc.common.context.UserContext;
import com.mzlhsc.order.domain.dto.ShoppingCartDTO;
import com.mzlhsc.order.domain.po.ShoppingCart;
import com.mzlhsc.order.service.IShoppingCartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * <p>
 * 购物车 前端控制器
 * </p>
 *
 * @author mzlhsc
 * @since 2026-11-13
 */
@RestController
@RequestMapping("/shopping-cart")
@RequiredArgsConstructor
@Tag(name = "购物车", description = "用户端购物车接口")
@Slf4j
public class ShoppingCartController {
    private final IShoppingCartService shoppingCartService;


    /**
     * 添加购物车
     * @param shoppingCartDTO
     * @return
     */
    @PostMapping("add")
    @Operation(summary = "添加购物车", description = "添加菜品或套餐到购物车")
    public R<Void> add(@RequestBody ShoppingCartDTO shoppingCartDTO){
        log.info("添加购物车 :{}",shoppingCartDTO);
        shoppingCartService.addShoppingCart(shoppingCartDTO);
        return R.ok();
    }


    /**
     * 查看购物车
     * @return
     */
    @GetMapping("/list")
    @Operation(summary = "查看购物车", description = "查询当前用户的购物车列表")
    public R<List<ShoppingCart>> list(){
        log.info("查看购物车");
        return R.ok(shoppingCartService.lambdaQuery()
                .eq(ShoppingCart::getUserId, UserContext.getCurrentId())
                .list());
    }

    /**
     * 删除购物车中一个商品
     * @param shoppingCartDTO
     * @return
     */
    @PostMapping("/sub")
    @Operation(summary = "删除购物车中一个商品", description = "购物车商品数量减一，减到0则删除记录")
    public R<Void> sub(@RequestBody ShoppingCartDTO shoppingCartDTO){
        log.info("删除购物车中一个商品: {}"  , shoppingCartDTO);
        shoppingCartService.subShoppingCart(shoppingCartDTO);
        return R.ok();
    }

    /**
     * 清除购物车
     * @return
     */
    @DeleteMapping("/clean")
    @Operation(summary = "清除购物车", description = "清空当前用户的购物车")
    public R<Void> clean() {
        log.info("清除购物车");
        shoppingCartService.removeById(UserContext.getCurrentId());
        return R.ok();
    }
}
