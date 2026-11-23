const http = require('../../utils/request');
const util = require('../../utils/util');
const app = getApp();

Page({
  data: {
    tabs: [
      { label: '全部', value: null },
      { label: '待接单', value: 2 },
      { label: '配送中', value: 4 },
      { label: '已完成', value: 5 },
      { label: '已取消', value: 6 }
    ],
    activeTab: 0,
    orders: [],
    page: 1,
    pageSize: 10,
    pages: 0,
    loading: true,
    loadingMore: false
  },

  onShow() {
    this.reload();
  },

  onPullDownRefresh() {
    this.reload().finally(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (this.data.page < this.data.pages && !this.data.loadingMore) {
      this.load(this.data.page + 1, true);
    }
  },

  async reload() {
    this.setData({ page: 1, pages: 0 });
    return this.load(1, false);
  },

  async load(page, append) {
    this.setData(append ? { loadingMore: true } : { loading: true });
    try {
      await app.login();
      const status = this.data.tabs[this.data.activeTab].value;
      const data = await http.get('/user/order/historyOrders', {
        page,
        pageSize: this.data.pageSize,
        status: status === null ? undefined : status
      }) || {};
      const list = (data.list || []).map(this.decorateOrder);
      this.setData({
        orders: append ? this.data.orders.concat(list) : list,
        page: data.page || page,
        pages: data.pages || (list.length ? 1 : 0),
        loading: false,
        loadingMore: false
      });
    } catch (e) {
      this.setData({ loading: false, loadingMore: false });
      util.errorToast(e);
    }
  },

  decorateOrder(item) {
    const statusClass = {
      1: 'muted',
      2: 'warning',
      3: 'primary',
      4: 'primary',
      5: 'success',
      6: 'muted'
    }[item.status] || 'muted';
    const dishes = item.orderDishes || (item.orderDetailList || [])
      .map((d) => (d.name || '') + '×' + (d.number || 1))
      .join('、');
    return {
      ...item,
      statusText: util.statusText(util.ORDER_STATUS, item.status),
      statusClass,
      amountText: util.money(item.amount),
      timeText: util.formatTimeText(item.orderTime),
      dishesText: dishes || '订单菜品'
    };
  },

  switchTab(e) {
    const index = Number(e.currentTarget.dataset.index);
    if (index === this.data.activeTab) return;
    this.setData({ activeTab: index, orders: [] });
    this.reload();
  },

  noop() {},

  openDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/order-detail/order-detail?id=' + id });
  },

  async cancelOrder(e) {
    const id = e.currentTarget.dataset.id;
    if (!(await util.confirm('确定取消这个订单吗？'))) return;
    try {
      await http.put('/user/order/cancel', { id, cancelReason: '用户取消订单' });
      util.toast('订单已取消');
      this.reload();
    } catch (err) {
      util.errorToast(err);
    }
  },

  async remind(e) {
    const id = e.currentTarget.dataset.id;
    try {
      await http.get('/user/order/reminder/' + id);
      util.toast('已提醒商家尽快处理', 'success');
    } catch (err) {
      util.errorToast(err);
    }
  },

  async makeAgain(e) {
    const id = e.currentTarget.dataset.id;
    try {
      await http.post('/user/order/repetition/' + id);
      util.toast('已加入购物车', 'success');
      setTimeout(() => wx.navigateTo({ url: '/pages/cart/cart' }), 700);
    } catch (err) {
      util.errorToast(err);
    }
  },

  goMenu() {
    wx.switchTab({ url: '/pages/index/index' });
  }
});
