package com.mzlhsc.report.service.impl;

import com.mzlhsc.api.client.DishClient;
import com.mzlhsc.api.client.OrderClient;
import com.mzlhsc.api.client.SetmealClient;
import com.mzlhsc.api.client.UserClient;
import com.mzlhsc.api.vo.DishOverViewVO;
import com.mzlhsc.api.vo.OrderOverViewVO;
import com.mzlhsc.api.vo.SetmealOverViewVO;
import com.mzlhsc.report.constant.StatusConstant;
import com.mzlhsc.report.domain.vo.BusinessDataVO;
import com.mzlhsc.report.service.IWorkspaceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkspaceServiceImpl implements IWorkspaceService {

    /** 订单状态：已完成 */
    private static final Integer ORDER_STATUS_COMPLETED = 5;

    private final OrderClient orderClient;
    private final UserClient userClient;
    private final DishClient dishClient;
    private final SetmealClient setmealClient;

    /**
     * 根据时间段统计营业数据
     * 营业额：已完成订单的金额合计
     * 有效订单：已完成订单的数量
     * 订单完成率：有效订单数 / 总订单数
     * 平均客单价：营业额 / 有效订单数
     * 新增用户：该时间段内新增用户数量
     */
    @Override
    public BusinessDataVO getBusinessData(LocalDateTime begin, LocalDateTime end) {
        LocalDate beginDate = begin.toLocalDate();
        LocalDate endDate = end.toLocalDate();

        // 总订单数
        Long totalOrderCount = orderClient.countOrders(beginDate, endDate, null);
        // 有效订单数（状态为已完成）
        Long validOrderCount = orderClient.countOrders(beginDate, endDate, ORDER_STATUS_COMPLETED);
        // 营业额（已完成订单金额合计）
        BigDecimal turnover = orderClient.sumOrders(beginDate, endDate, ORDER_STATUS_COMPLETED);
        // 新增用户数
        Long newUsers = userClient.countUser(beginDate, endDate);

        long total = totalOrderCount == null ? 0L : totalOrderCount;
        long valid = validOrderCount == null ? 0L : validOrderCount;
        double turnoverValue = turnover == null ? 0.0 : turnover.doubleValue();

        Double orderCompletionRate = 0.0;
        Double unitPrice = 0.0;
        if (total != 0 && valid != 0) {
            orderCompletionRate = (double) valid / total;
            unitPrice = turnoverValue / valid;
        }

        return BusinessDataVO.builder()
                .turnover(turnoverValue)
                .validOrderCount((int) valid)
                .orderCompletionRate(orderCompletionRate)
                .unitPrice(unitPrice)
                .newUsers(newUsers == null ? 0 : newUsers.intValue())
                .build();
    }

    /**
     * 查询订单管理数据（当天）
     */
    @Override
    public OrderOverViewVO getOrderOverView() {
        return orderClient.getOverView();
    }

    /**
     * 查询菜品总览
     */
    @Override
    public DishOverViewVO getDishOverView() {
        return DishOverViewVO.builder()
                .sold(dishClient.countByStatus(StatusConstant.ENABLE))
                .discontinued(dishClient.countByStatus(StatusConstant.DISABLE))
                .build();
    }

    /**
     * 查询套餐总览
     */
    @Override
    public SetmealOverViewVO getSetmealOverView() {
        return SetmealOverViewVO.builder()
                .sold(setmealClient.countByStatus(StatusConstant.ENABLE))
                .discontinued(setmealClient.countByStatus(StatusConstant.DISABLE))
                .build();
    }
}
