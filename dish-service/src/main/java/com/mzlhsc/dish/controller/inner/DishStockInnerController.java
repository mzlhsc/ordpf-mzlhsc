package com.mzlhsc.dish.controller.inner;

import com.mzlhsc.dish.service.IDishStockService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 库存内部接口，供订单中心调用。
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/inner/dish/stock")
@Tag(name = "菜品库存内部接口")
@Slf4j
public class DishStockInnerController {

    private final IDishStockService stockService;

    @GetMapping("/{dishId}")
    @Operation(summary = "查询库存")
    public Integer getStock(@PathVariable Long dishId) {
        return stockService.getStock(dishId);
    }

    @PostMapping("/deduct")
    @Operation(summary = "扣减库存")
    public Boolean deduct(@RequestParam Long dishId, @RequestParam Integer number) {
        stockService.deduct(dishId, number == null ? 0 : number);
        return true;
    }

    @PostMapping("/restore")
    @Operation(summary = "回补库存")
    public Boolean restore(@RequestParam Long dishId, @RequestParam Integer number) {
        stockService.restore(dishId, number == null ? 0 : number);
        return true;
    }
}
