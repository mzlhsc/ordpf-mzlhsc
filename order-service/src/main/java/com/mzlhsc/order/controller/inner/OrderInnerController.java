package com.mzlhsc.order.controller.inner;

import com.mzlhsc.api.dto.DateAmountDTO;
import com.mzlhsc.api.dto.GoodsSalesDTO;
import com.mzlhsc.api.vo.OrderOverViewVO;
import com.mzlhsc.order.domain.po.Orders;
import com.mzlhsc.order.mapper.OrdersMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * <p>
 * 订单内部接口，供报表、工作台等模块通过 Feign 调用
 * 注意：返回裸对象，不使用 R 包装
 * </p>
 *
 * @author mzlhsc
 */
@RestController
@RequestMapping("/inner/order")
@Tag(name = "订单内部接口", description = "服务间调用的订单统计接口")
@RequiredArgsConstructor
@Slf4j
public class OrderInnerController {

    private final OrdersMapper ordersMapper;

    /**
     * 订单总览：各状态订单数量
     */
    @GetMapping("/overview")
    @Operation(summary = "订单总览", description = "统计全部/待接单/待派送/已完成/已取消订单数量")
    public OrderOverViewVO getOverView() {
        return OrderOverViewVO.builder()
                .allOrders(count(buildQuery(null, null, null)))
                .waitingOrders(ordersMapper.countStatus(Orders.TO_BE_CONFIRMED))
                .deliveredOrders(ordersMapper.countStatus(Orders.CONFIRMED))
                .completedOrders(ordersMapper.countStatus(Orders.COMPLETED))
                .cancelledOrders(ordersMapper.countStatus(Orders.CANCELLED))
                .build();
    }

    /**
     * 按日期统计每日营业额（只统计已完成订单）
     */
    @GetMapping("/turnover")
    @Operation(summary = "每日营业额", description = "按日统计已完成订单的营业额")
    public List<DateAmountDTO> listTurnover(
            @RequestParam(value = "begin", required = false) LocalDate begin,
            @RequestParam(value = "end", required = false) LocalDate end) {
        return ordersMapper.sumAmountByDate(beginTime(begin), endTime(end));
    }

    /**
     * 统计区间内某状态的订单数量，status 不传表示全部
     */
    @GetMapping("/count")
    @Operation(summary = "订单数量统计", description = "按时间区间与订单状态统计订单数量")
    public Long countOrders(
            @RequestParam(value = "begin", required = false) LocalDate begin,
            @RequestParam(value = "end", required = false) LocalDate end,
            @RequestParam(value = "status", required = false) Integer status) {
        return Long.valueOf(count(buildQuery(begin, end, status)));
    }

    /**
     * 统计区间内某状态的订单金额合计
     */
    @GetMapping("/sum")
    @Operation(summary = "订单金额合计", description = "按时间区间与订单状态统计订单金额")
    public BigDecimal sumOrders(
            @RequestParam(value = "begin", required = false) LocalDate begin,
            @RequestParam(value = "end", required = false) LocalDate end,
            @RequestParam(value = "status", required = false) Integer status) {
        BigDecimal sum = ordersMapper.sumByMap(buildQuery(begin, end, status));
        return sum == null ? BigDecimal.ZERO : sum;
    }

    /**
     * 销量排名 top10
     */
    @GetMapping("/top10")
    @Operation(summary = "销量排名top10", description = "统计区间内已完成订单的商品销量前10")
    public List<GoodsSalesDTO> listSalesTop10(
            @RequestParam(value = "begin", required = false) LocalDate begin,
            @RequestParam(value = "end", required = false) LocalDate end) {
        return ordersMapper.getSalesTop10(beginTime(begin), endTime(end));
    }

    /**
     * 统计全部订单数量
     */
    private Integer count(Map<String, Object> query) {
        Integer count = ordersMapper.countByMap(query);
        return count == null ? 0 : count;
    }

    /**
     * 组装时间段（含首尾整天）+ 状态的查询条件
     */
    private Map<String, Object> buildQuery(LocalDate begin, LocalDate end, Integer status) {
        Map<String, Object> map = new HashMap<>(4);
        map.put("begin", beginTime(begin));
        map.put("end", endTime(end));
        map.put("status", status);
        return map;
    }

    /**
     * 起始时间：当天 00:00:00（含）
     */
    private LocalDateTime beginTime(LocalDate begin) {
        return begin == null ? null : begin.atStartOfDay();
    }

    /**
     * 截止时间：次日 00:00:00（不含），保证 end 当天的数据被统计进来
     */
    private LocalDateTime endTime(LocalDate end) {
        return end == null ? null : end.plusDays(1).atStartOfDay();
    }
}
