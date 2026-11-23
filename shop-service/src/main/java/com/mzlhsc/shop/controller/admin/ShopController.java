package com.mzlhsc.shop.controller.admin;

import com.mzlhsc.common.exception.BadRequestException;
import com.mzlhsc.common.result.R;
import com.mzlhsc.shop.constant.ShopConstant;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.web.bind.annotation.*;

/**
 * 店铺管理
 */
@RestController
@RequestMapping("/admin/shop")
@RequiredArgsConstructor
@Tag(name = "店铺操作相关接口", description = "店铺营业状态的查询与设置接口")
@Slf4j
public class ShopController {

    private final RedisTemplate<String, Object> redisTemplate;


    /**
     * 设置店铺营业状态
     * @param status
     * @return
     */
    @PutMapping("/{status}")
    @Operation(summary = "设置店铺营业状态", description = "1 营业中，0 打烊中")
    public R<Void> setStatus(@PathVariable Integer status){
        if (status == null || status != 0 && status != 1) {
            throw new BadRequestException("营业状态只能是 0 或 1");
        }
        log.info("设置营业状态为：{}", status == 1 ? "营业中" : "打烊中");

        redisTemplate.opsForValue().set(ShopConstant.KEY, status);

        return R.ok();

    }


    /**
     * 查询店铺营业状态
     * @return
     */
    @GetMapping("/status")
    @Operation(summary = "查询店铺营业状态")
    public R<Integer> getStatus(){
        Integer status = (Integer) redisTemplate.opsForValue().get(ShopConstant.KEY);
        // Redis 中还没有值时（首次启动）默认按打烊处理，避免自动拆箱 NPE
        if (status == null) {
            status = 0;
        }
        log.info("查询营业状态为：{}", status == 1 ? "营业中" : "打烊中");

        return R.ok(status);

    }


}
