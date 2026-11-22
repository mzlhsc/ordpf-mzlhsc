package com.mzlhsc.order.service.impl;

import com.alibaba.fastjson.JSON;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.spring.service.impl.ServiceImpl;
import com.mzlhsc.api.dto.AddressBookSimpleDTO;
import com.mzlhsc.api.client.UserClient;
import com.mzlhsc.common.constant.MessageConstant;
import com.mzlhsc.common.exception.BizIllegalException;
import com.mzlhsc.common.exception.CommonException;
import com.mzlhsc.common.result.PageDTO;
import com.mzlhsc.common.context.UserContext;
import com.mzlhsc.order.domain.dto.OrdersCancelDTO;
import com.mzlhsc.order.domain.dto.OrdersPageQueryDTO;
import com.mzlhsc.order.domain.dto.OrdersRejectionDTO;
import com.mzlhsc.order.domain.dto.OrdersSubmitDTO;
import com.mzlhsc.order.domain.po.OrderDetail;
import com.mzlhsc.order.domain.po.Orders;
import com.mzlhsc.order.domain.po.ShoppingCart;
import com.mzlhsc.order.domain.vo.OrderStatisticsVO;
import com.mzlhsc.order.domain.vo.OrderSubmitVO;
import com.mzlhsc.order.domain.vo.OrderVO;
import com.mzlhsc.order.mapper.OrderDetailMapper;
import com.mzlhsc.order.mapper.OrdersMapper;
import com.mzlhsc.order.service.IOrdersService;
import org.apache.seata.spring.annotation.GlobalTransactional;
import com.mzlhsc.order.service.IShoppingCartService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * <p>
 * 订单表 服务实现类
 * </p>
 *
 * @author mzlhsc
 * @since 2026-11-09
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OrdersServiceImpl extends ServiceImpl<OrdersMapper, Orders> implements IOrdersService {
    private final OrdersMapper ordersMapper;
    private final OrderDetailMapper orderDetailMapper;
    private final UserClient userClient;
    private final IShoppingCartService shoppingCartService;



    /**
     * 订单搜索
     * @param ordersPageQueryDTO
     * @return
     */
    @Override
    public PageDTO<OrderVO> conditionSearch(OrdersPageQueryDTO ordersPageQueryDTO) {
        // 交由 MyBatis-Plus 的 PaginationInnerInterceptor 做物理分页
        Page<Orders> page = new Page<>(ordersPageQueryDTO.getPage(), ordersPageQueryDTO.getPageSize());

        ordersMapper.pageQuery(page, ordersPageQueryDTO);

        // 部分订单状态，需要额外返回订单菜品信息，将Orders转化为OrderVO
        List<OrderVO> orderVOList = getOrderVOList(page.getRecords());

        return PageDTO.of(page, orderVOList);
    }
    private List<OrderVO> getOrderVOList(List<Orders> ordersList) {
        // 需要返回订单菜品信息，自定义OrderVO响应结果
        List<OrderVO> orderVOList = new ArrayList<>();

        if (!CollectionUtils.isEmpty(ordersList)) {
            for (Orders orders : ordersList) {
                // 将共同字段复制到OrderVO
                OrderVO orderVO = new OrderVO();
                BeanUtils.copyProperties(orders, orderVO);
                String orderDishes = getOrderDishesStr(orders);

                // 将订单菜品信息封装到orderVO中，并添加到orderVOList
                orderVO.setOrderDishes(orderDishes);
                orderVOList.add(orderVO);
            }
        }
        return orderVOList;
    }
    /**
     * 根据订单id获取菜品信息字符串
     *
     * @param orders
     * @return
     */
    private String getOrderDishesStr(Orders orders) {
        // 查询订单菜品详情信息（订单中的菜品和数量）
        List<OrderDetail> orderDetailList = orderDetailMapper.getByOrderId(orders.getId());

        // 将每一条订单菜品信息拼接为字符串（格式：宫保鸡丁*3；）
        List<String> orderDishList = orderDetailList.stream().map(x -> {
            String orderDish = x.getName() + "*" + x.getNumber() + ";";
            return orderDish;
        }).collect(Collectors.toList());

        // 将该订单对应的所有菜品信息拼接在一起
        return String.join("", orderDishList);
    }



    /**
     * 查询订单详情
     * @param id
     * @return orderVO
     */
    @Override
    public OrderVO details(Long id) {
        //根据id查询订单
        Orders orders = this.getById(id);
        if (orders == null) {
            throw new CommonException(MessageConstant.ORDER_NOT_FOUND, 404);
        }

        //查询该订单对应的菜品/套餐明细
        List<OrderDetail> orderDetailList = orderDetailMapper.getByOrderId(orders.getId());

        //将该订单及其详细封装到OrderVO并返回
        OrderVO orderVO = new OrderVO();
        BeanUtils.copyProperties(orders, orderVO);
        orderVO.setOrderDetailList(orderDetailList);

        return orderVO;
    }

    /**
     * 接单
     * @param id
     */
    @Override
    public void confirm(Long id) {
        // 根据id查询订单
        Orders ordersDB = this.getById(id);
        if (ordersDB == null) {
            throw new CommonException(MessageConstant.ORDER_NOT_FOUND, 404);
        }
        // 订单只有存在且状态为2（待接单）才可以接单
        if (!Objects.equals(ordersDB.getStatus(), Orders.TO_BE_CONFIRMED)) {
            throw new BizIllegalException(MessageConstant.ORDER_STATUS_ERROR);
        }
        // 接单后订单状态为“已接单(3)”，等待派送
        ordersDB.setStatus(Orders.CONFIRMED);
        this.updateById(ordersDB);
    }


    /**
     * 派送中
     * @param id
     */
    @Override
    public void delivery(Long id) {
        // 根据id查询订单
        Orders ordersDB = this.getById(id);
        if (ordersDB == null) {
            throw new CommonException(MessageConstant.ORDER_NOT_FOUND, 404);
        }
        // 订单只有存在且状态为3（已接单）才可以派送
        if (!Objects.equals(ordersDB.getStatus(), Orders.CONFIRMED)) {
            throw new BizIllegalException(MessageConstant.ORDER_NOT_CONFIRM);
        }
        ordersDB.setStatus(Orders.DELIVERY_IN_PROGRESS);
        this.updateById(ordersDB);
    }

    /**
     * 完成订单
     * @param id
     */
    @Override
    public void complete(Long id) {
        // 根据id查询订单
        Orders ordersDB = this.getById(id);
        if (ordersDB == null) {
            throw new CommonException(MessageConstant.ORDER_NOT_FOUND, 404);
        }
        // 订单只有存在且状态为4（派送中）才可以完成
        if (!Objects.equals(ordersDB.getStatus(), Orders.DELIVERY_IN_PROGRESS)) {
            throw new BizIllegalException(MessageConstant.ORDER_NOT_ELIVERY);
        }
        ordersDB.setStatus(Orders.COMPLETED);
        this.updateById(ordersDB);
    }
    /**
     * 拒单
     *
     * @param ordersRejectionDTO
     */
    @Override
    public void rejection(OrdersRejectionDTO ordersRejectionDTO) {
        // 根据id查询订单
        Orders ordersDB = this.getById(ordersRejectionDTO.getId());
        if (ordersDB == null) {
            throw new CommonException(MessageConstant.ORDER_NOT_FOUND, 404);
        }

        // 订单只有存在且状态为2（待接单）才可以拒单
        if (!Objects.equals(ordersDB.getStatus(), Orders.TO_BE_CONFIRMED)) {
            throw new BizIllegalException(MessageConstant.ORDER_STATUS_ERROR);
        }

        //支付状态
        Integer payStatus = ordersDB.getPayStatus();
//        if (payStatus == Orders.PAID) {
//            //用户已支付，需要退款
//            String refund = weChatPayUtil.refund(
//                    ordersDB.getNumber(),
//                    ordersDB.getNumber(),
//                    new BigDecimal(0.01),
//                    new BigDecimal(0.01));
//            log.info("申请退款：{}", refund);
//        }

        // 拒单需要退款，根据订单id更新订单状态、拒单原因、取消时间
        Orders orders = new Orders();
        orders.setId(ordersDB.getId());
        orders.setStatus(Orders.CANCELLED);
        orders.setRejectionReason(ordersRejectionDTO.getRejectionReason());
        orders.setCancelTime(LocalDateTime.now());

        this.updateById(orders);
    }

    /**
     * 取消订单
     *
     * @param ordersCancelDTO
     */
    @Override
    public void cancel(OrdersCancelDTO ordersCancelDTO){
        // 根据id查询订单
        Orders ordersDB = this.getById(ordersCancelDTO.getId());
        if (ordersDB == null) {
            throw new CommonException(MessageConstant.ORDER_NOT_FOUND, 404);
        }
        // 已完成或已取消的订单不能再次取消
        if (Objects.equals(ordersDB.getStatus(), Orders.COMPLETED)
                || Objects.equals(ordersDB.getStatus(), Orders.CANCELLED)) {
            throw new BizIllegalException(MessageConstant.ORDER_STATUS_ERROR);
        }

        //支付状态
        Integer payStatus = ordersDB.getPayStatus();
//        if (payStatus == 1) {
//            //用户已支付，需要退款
//            String refund = weChatPayUtil.refund(
//                    ordersDB.getNumber(),
//                    ordersDB.getNumber(),
//                    new BigDecimal(0.01),
//                    new BigDecimal(0.01));
//            log.info("申请退款：{}", refund);
//        }

        // 管理端取消订单需要退款，根据订单id更新订单状态、取消原因、取消时间
        Orders orders = new Orders();
        orders.setId(ordersCancelDTO.getId());
        orders.setStatus(Orders.CANCELLED);
        orders.setCancelReason(ordersCancelDTO.getCancelReason());
        orders.setCancelTime(LocalDateTime.now());
        this.updateById(orders);
    }



    /**
     * 各个状态的订单数量统计
     *
     * @return
     */
    @Override
    public OrderStatisticsVO statistics() {
        // 根据状态，分别查询出待接单、待派送、派送中的订单数量
        Integer toBeConfirmed = ordersMapper.countStatus(Orders.TO_BE_CONFIRMED);
        Integer confirmed = ordersMapper.countStatus(Orders.CONFIRMED);
        Integer deliveryInProgress = ordersMapper.countStatus(Orders.DELIVERY_IN_PROGRESS);

        // 将查询出的数据封装到orderStatisticsVO中响应
        OrderStatisticsVO orderStatisticsVO = new OrderStatisticsVO();
        orderStatisticsVO.setToBeConfirmed(toBeConfirmed);
        orderStatisticsVO.setConfirmed(confirmed);
        orderStatisticsVO.setDeliveryInProgress(deliveryInProgress);
        return orderStatisticsVO;
    }


    /**
     * 用户下单
     * @param ordersSubmitDTO
     * @return
     */
    /**
     * 全局事务：下单过程中会跨服务调用用户服务查地址簿，
     * 一旦后续步骤失败，Seata 会回滚这里写入的订单/订单明细/购物车变更。
     */
    @GlobalTransactional(name = "submit-order", rollbackFor = Exception.class)
    @Override
    public OrderSubmitVO submitOrder(OrdersSubmitDTO ordersSubmitDTO) {
        //异常情况的处理（收货地址为空、购物车为空）
        if (ordersSubmitDTO.getAddressBookId() == null) {
            throw new BizIllegalException(MessageConstant.ADDRESS_BOOK_IS_NULL);
        }
        AddressBookSimpleDTO addressBook = userClient.getAddressBookById(ordersSubmitDTO.getAddressBookId());
        if (addressBook == null) {
            throw new CommonException(MessageConstant.ADDRESS_BOOK_IS_NULL, 404);
        }
        // 校验收货地址是否超出配送范围 TODO



        //查询当前用户的购物车数据
        List<ShoppingCart> shoppingCartList = shoppingCartService.lambdaQuery()
                .eq(ShoppingCart::getUserId, UserContext.getCurrentId())
                .list();
        if (shoppingCartList == null || shoppingCartList.size() == 0) {
            throw new BizIllegalException(MessageConstant.SHOPPING_CART_IS_NULL);
        }

        //构造订单数据
        Orders order = new Orders();
        BeanUtils.copyProperties(ordersSubmitDTO, order);
        order.setPhone(addressBook.getPhone());
        order.setAddress(addressBook.getDetail());
        order.setConsignee(addressBook.getConsignee());
        order.setNumber(String.valueOf(System.currentTimeMillis()));
        order.setUserId(UserContext.getCurrentId());
        order.setStatus(Orders.PENDING_PAYMENT);
        order.setPayStatus(Orders.UN_PAID);
        order.setOrderTime(LocalDateTime.now());

        //向订单表插入1条数据
        save(order);

        //订单明细数据
        List<OrderDetail> orderDetailList = new ArrayList<>();
        for (ShoppingCart cart : shoppingCartList) {
            OrderDetail orderDetail = new OrderDetail();
            BeanUtils.copyProperties(cart, orderDetail);
            orderDetail.setOrderId(order.getId());
            orderDetailList.add(orderDetail);
        }

        //向明细表插入n条数据
        orderDetailMapper.insertBatch(orderDetailList);

        //清理购物车中的数据
        shoppingCartService.lambdaUpdate().eq(ShoppingCart::getUserId, UserContext.getCurrentId()).remove();

        //封装返回结果
        OrderSubmitVO orderSubmitVO = OrderSubmitVO.builder()
                .id(order.getId())
                .orderNumber(order.getNumber())
                .orderAmount(order.getAmount())
                .orderTime(order.getOrderTime())
                .build();


        return orderSubmitVO;
    }


    /**
     * 用户端订单分页查询（历史订单）
     * @param page
     * @param pageSize
     * @param status
     * @return
     */
    @Override
    public PageDTO<OrderVO> pageQuery4User(int page, int pageSize, Integer status) {
        // 设置分页（MyBatis-Plus 物理分页）
        Page<Orders> mpPage = new Page<>(page, pageSize);

        // 封装查询条件：当前登录用户 + 订单状态（状态为空则查全部）
        OrdersPageQueryDTO ordersPageQueryDTO = new OrdersPageQueryDTO();
        ordersPageQueryDTO.setUserId(UserContext.getCurrentId());
        ordersPageQueryDTO.setStatus(status);

        // 分页条件查询
        ordersMapper.pageQuery(mpPage, ordersPageQueryDTO);

        // 查询出订单明细，并封装入OrderVO进行响应
        List<OrderVO> orderVOList = new ArrayList<>();
        if (!CollectionUtils.isEmpty(mpPage.getRecords())) {
            for (Orders orders : mpPage.getRecords()) {
                Long orderId = orders.getId();// 订单id

                // 查询订单明细
                List<OrderDetail> orderDetailList = orderDetailMapper.getByOrderId(orderId);

                OrderVO orderVO = new OrderVO();
                BeanUtils.copyProperties(orders, orderVO);
                orderVO.setOrderDetailList(orderDetailList);

                orderVOList.add(orderVO);
            }
        }

        return PageDTO.of(mpPage, orderVOList);
    }


    /**
     * 再来一单
     * @param id
     */
    @Override
    public void repetition(Long id) {
        // 查询当前用户id
        Long userId = UserContext.getCurrentId();

        // 根据订单id查询当前订单详情
        List<OrderDetail> orderDetailList = orderDetailMapper.getByOrderId(id);
        if (CollectionUtils.isEmpty(orderDetailList)) {
            throw new CommonException(MessageConstant.ORDER_NOT_FOUND, 404);
        }

        // 将订单详情对象转换为购物车对象
        List<ShoppingCart> shoppingCartList = orderDetailList.stream().map(x -> {
            ShoppingCart shoppingCart = new ShoppingCart();

            // 将原订单详情里面的菜品信息重新复制到购物车对象中
            BeanUtils.copyProperties(x, shoppingCart, "id");
            shoppingCart.setUserId(userId);
            shoppingCart.setCreateTime(LocalDateTime.now());

            return shoppingCart;
        }).collect(Collectors.toList());

        // 将购物车对象批量添加到数据库
        shoppingCartService.saveBatch(shoppingCartList);
    }


    /**
     * 用户催单
     * @param id
     */
    @Override
    public void reminder(Long id) {
        // 查询订单是否存在
        Orders orders = this.getById(id);
        if (orders == null) {
            throw new CommonException(MessageConstant.ORDER_NOT_FOUND, 404);
        }

        //基于WebSocket实现催单 TODO 项目暂未接入 WebSocketServer，先记录日志
        Map map = new HashMap();
        map.put("type", 2);//2代表用户催单
        map.put("orderId", id);
        map.put("content", "订单号: " + orders.getNumber());
        log.info("用户催单: {}", JSON.toJSONString(map));
    }


}
