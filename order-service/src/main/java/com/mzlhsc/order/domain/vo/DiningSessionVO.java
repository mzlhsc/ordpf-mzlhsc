package com.mzlhsc.order.domain.vo;

import com.mzlhsc.order.domain.po.DiningSessionMember;
import com.mzlhsc.order.domain.po.Orders;
import com.mzlhsc.order.domain.po.ShoppingCart;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Schema(description = "堂食会话详情")
public class DiningSessionVO implements Serializable {

    private Long id;

    private String sessionNo;

    private Long tableId;

    private String tableName;

    private Integer status;

    private Integer guestCount;

    private Long ownerUserId;

    private Integer aaEnabled;

    private String remark;

    private BigDecimal totalAmount;

    private BigDecimal paidAmount;

    private BigDecimal unpaidAmount;

    private BigDecimal perPersonAmount;

    private Integer memberCount;

    private LocalDateTime openTime;

    private LocalDateTime checkoutTime;

    private List<String> tableNames = new ArrayList<>();

    private List<DiningSessionMember> members = new ArrayList<>();

    private List<ShoppingCart> cartItems = new ArrayList<>();

    private List<Orders> orders = new ArrayList<>();

    private BigDecimal cartAmount;
}
