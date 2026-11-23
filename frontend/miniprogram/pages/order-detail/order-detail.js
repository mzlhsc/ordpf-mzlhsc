const http = require('../../utils/request');
const util = require('../../utils/util');
const app = getApp();

const STATUS_DESC = {
  1: '订单尚未支付',
  2: '订单已提交，等待商家接单',
  3: '商家已接单，正在为你准备',
  4: '骑手正在配送，请留意电话',
  5: '订单已完成，感谢你的光临',
  6: '订单已取消'
};

const STATUS_ICON = {
  1: '◷',
  2: '✓',
  3: '♨',
  4: '↗',
  5: '★',
  6: '×'
};

Page({
  data: {
    order: null,
    loading: true
  },

  onLoad(options) {
    this.id = Number(options.id);
    this.load();
  },

  async load() {
    this.setData({ loading: true });
    try {
      await app.login();
      const data = await http.get('/user/order/details/' + this.id);
      const items = (data.orderDetailList || []).map((item) => ({
        ...item,
        amountText: util.money(item.amount),
        number: Number(item.number || 1)
      }));
      let goodsAmount = 0;
      items.forEach((item) => {
        goodsAmount += Number(item.amount || 0) * Number(item.number || 0);
      });
      this.setData({
        order: {
          ...data,
          items,
          statusText: util.statusText(util.ORDER_STATUS, data.status),
          statusDesc: STATUS_DESC[data.status] || '',
          statusIcon: STATUS_ICON[data.status] || '·',
          showTimeline: data.status !== 6,
          timeText: util.formatTimeText(data.orderTime),
          amountText: util.money(data.amount),
          goodsAmountText: util.money(goodsAmount),
          packAmountText: util.money(data.packAmount || 0),
          payMethodText: Number(data.payMethod) === 1 ? '在线支付（演示）' : '其他方式'
        },
        loading: false
      });
    } catch (e) {
      this.setData({ loading: false });
      util.errorToast(e);
    }
  },

  copyNumber() {
    if (!this.data.order) return;
    wx.setClipboardData({ data: this.data.order.number || '' });
  },

  async cancelOrder() {
    if (!(await util.confirm('确定取消这个订单吗？'))) return;
    try {
      await http.put('/user/order/cancel', { id: this.id, cancelReason: '用户取消订单' });
      util.toast('订单已取消');
      this.load();
    } catch (e) {
      util.errorToast(e);
    }
  },

  async remind() {
    try {
      await http.get('/user/order/reminder/' + this.id);
      util.toast('已提醒商家尽快处理', 'success');
    } catch (e) {
      util.errorToast(e);
    }
  },

  async makeAgain() {
    try {
      await http.post('/user/order/repetition/' + this.id);
      util.toast('已加入购物车', 'success');
      setTimeout(() => wx.navigateTo({ url: '/pages/cart/cart' }), 700);
    } catch (e) {
      util.errorToast(e);
    }
  }
});


