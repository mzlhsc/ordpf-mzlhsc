package com.mzlhsc.api.client;

import com.mzlhsc.api.dto.DateAmountDTO;
import com.mzlhsc.api.dto.GoodsSalesDTO;
import com.mzlhsc.api.vo.OrderOverViewVO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * 订单服务对外提供的内部接口（供报表、工作台聚合统计使用）
 */
@FeignClient(contextId = "orderClient", name = "order-service", path = "/inner/order")
public interface OrderClient {

    /**
     * 订单总览：各状态订单数量
     */
    @GetMapping("/overview")
    OrderOverViewVO getOverView();

    /**
     * 按日期统计每日营业额
     */
    @GetMapping("/turnover")
    List<DateAmountDTO> listTurnover(
            @RequestParam("begin") @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate begin,
            @RequestParam("end") @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate end);

    /**
     * 统计区间内某状态的订单数量；status 不传表示全部
     */
    @GetMapping("/count")
    Long countOrders(
            @RequestParam(value = "begin", required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate begin,
            @RequestParam(value = "end", required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate end,
            @RequestParam(value = "status", required = false) Integer status);

    /**
     * 统计区间内某状态的订单金额合计
     */
    @GetMapping("/sum")
    BigDecimal sumOrders(
            @RequestParam(value = "begin", required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate begin,
            @RequestParam(value = "end", required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate end,
            @RequestParam(value = "status", required = false) Integer status);

    /**
     * 销量排名 top10
     */
    @GetMapping("/top10")
    List<GoodsSalesDTO> listSalesTop10(
            @RequestParam("begin") @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate begin,
            @RequestParam("end") @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate end);
}
