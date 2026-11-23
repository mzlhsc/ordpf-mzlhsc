const http = require('../../utils/request');
const util = require('../../utils/util');
const app = getApp();

Page({
  data: {
    items: [],
    totalCount: 0,
    totalAmountText: '0.00',
    loading: true
  },

  onShow() {
    this.loadCart();
  },

  async loadCart() {
    this.setData({ loading: true });
    try {
      await app.login();
      const list = await http.get('/shopping-cart/list') || [];
      let count = 0;
      let amount = 0;
      const items = list.map((item) => {
        const n = Number(item.number || 0);
        const unit = Number(item.amount || 0);
        count += n;
        amount += n * unit;
        return {
          ...item,
          number: n,
          priceText: util.money(unit),
          lineTotal: util.money(n * unit)
        };
      });
      this.setData({
        items,
        totalCount: count,
        totalAmountText: util.money(amount),
        loading: false
      });
      app.setCartCount(count);
    } catch (e) {
      this.setData({ loading: false });
      util.errorToast(e);
    }
  },

  async change(index, delta) {
    const item = this.data.items[index];
    if (!item) return;
    const body = {};
    if (item.dishId) body.dishId = item.dishId;
    else if (item.setmealId) body.setmealId = item.setmealId;
    else return;
    if (item.dishFlavor) body.dishFlavor = item.dishFlavor;
    try {
      await http.post(delta > 0 ? '/shopping-cart/add' : '/shopping-cart/sub', body);
      await this.loadCart();
    } catch (e) {
      util.errorToast(e);
    }
  },

  plus(e) {
    this.change(Number(e.currentTarget.dataset.index), 1);
  },

  minus(e) {
    this.change(Number(e.currentTarget.dataset.index), -1);
  },

  async clearCart() {
    if (!(await util.confirm('确定清空购物车吗？'))) return;
    try {
      await http.del('/shopping-cart/clean');
      util.toast('已清空');
      this.loadCart();
    } catch (e) {
      util.errorToast(e);
    }
  },

  goMenu() {
    wx.switchTab({ url: '/pages/index/index' });
  },

  goCheckout() {
    if (!this.data.items.length) return;
    wx.navigateTo({ url: '/pages/checkout/checkout' });
  }
});
