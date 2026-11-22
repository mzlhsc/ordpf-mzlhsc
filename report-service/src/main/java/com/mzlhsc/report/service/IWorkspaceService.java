package com.mzlhsc.report.service;

import com.mzlhsc.api.vo.DishOverViewVO;
import com.mzlhsc.api.vo.OrderOverViewVO;
import com.mzlhsc.api.vo.SetmealOverViewVO;
import com.mzlhsc.report.domain.vo.BusinessDataVO;

import java.time.LocalDateTime;

public interface IWorkspaceService {

    /**
     * 根据时间段统计营业数据
     * @param begin
     * @param end
     */
    BusinessDataVO getBusinessData(LocalDateTime begin, LocalDateTime end);

    /**
     * 查询订单管理数据
     */
    OrderOverViewVO getOrderOverView();

    /**
     * 查询菜品总览
     */
    DishOverViewVO getDishOverView();

    /**
     * 查询套餐总览
     */
    SetmealOverViewVO getSetmealOverView();

}
