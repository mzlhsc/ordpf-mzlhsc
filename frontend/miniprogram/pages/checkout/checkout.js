const http = require('../../utils/request');
const util = require('../../utils/util');
const app = getApp();

Page({
  data: {
    address: null,
    addressText: '',
    items: [],
    totalCount: 0,
    goodsAmountText: '0.00',
    totalAmountText: '0.00',
    remark: '',
    tablewareNumber: 1,
    submitting: false
  },

  onLoad() {
    this.load();
  },

  onShow() {
    if (app.globalData.selectedAddress) {
      this.applyAddress(app.globalData.selectedAddress);
    } else if (!this.data.address) {
      this.loadDefaultAddress();
    }
  },

  async load() {
    try {
      await app.login();
      await Promise.all([this.loadCart(), this.loadDefaultAddress()]);
    } catch (e) {
      util.errorToast(e);
    }
  },

  async loadCart() {
    try {
      const list = await http.get('/shopping-cart/list') || [];
      let count = 0;
      let amount = 0;
      const items = list.map((item) => {
        const n = Number(item.number || 0);
        const line = n * Number(item.amount || 0);
        count += n;
        amount += line;
        return {
          ...item,
          number: n,
          priceText: util.money(item.amount),
          lineTotal: util.money(line)
        };
      });
      this.setData({
        items,
        totalCount: count,
        goodsAmountText: util.money(amount),
        totalAmountText: util.money(amount)
      });
      if (!items.length) {
        wx.showToast({ title: '购物车为空', icon: 'none' });
      }
    } catch (e) {
      util.errorToast(e);
    }
  },

  async loadDefaultAddress() {
    try {
      const address = await http.get('/addressBook/default');
      if (address) {
        this.applyAddress(address);
        return;
      }
    } catch (e) {
      // 没有默认地址时，退化为使用地址列表第一条
    }
    try {
      const list = await http.get('/addressBook/list') || [];
      if (list.length) this.applyAddress(list[0]);
    } catch (e) {
      // 仍无地址则保持空态
    }
  },

  applyAddress(address) {
    if (!address) return;
    const full = [address.provinceName, address.cityName, address.districtName, address.detail]
      .filter(Boolean)
      .join(' ');
    this.setData({ address, addressText: full });
  },

  chooseAddress() {
    wx.navigateTo({ url: '/pages/address/list?select=1' });
  },

  onRemark(e) {
    this.setData({ remark: e.detail.value });
  },

  minusTableware() {
    this.setData({ tablewareNumber: Math.max(0, this.data.tablewareNumber - 1) });
  },

  plusTableware() {
    this.setData({ tablewareNumber: Math.min(20, this.data.tablewareNumber + 1) });
  },

  async submit() {
    if (this.data.submitting) return;
    if (!this.data.address || !this.data.address.id) {
      return util.toast('请先选择收货地址');
    }
    if (!this.data.items.length) {
      return util.toast('购物车为空，无法下单');
    }
    this.setData({ submitting: true });
    try {
      const data = await http.post('/user/order/submit', {
        addressBookId: this.data.address.id,
        payMethod: 1,
        remark: this.data.remark,
        packAmount: 0,
        tablewareNumber: this.data.tablewareNumber,
        tablewareStatus: 1,
        deliveryStatus: 1
      });
      app.globalData.selectedAddress = null;
      app.setCartCount(0);
      wx.showToast({ title: '下单成功', icon: 'success' });
      setTimeout(() => {
        wx.redirectTo({ url: '/pages/order-detail/order-detail?id=' + data.id });
      }, 800);
    } catch (e) {
      util.errorToast(e);
    } finally {
      this.setData({ submitting: false });
    }
  }
});

