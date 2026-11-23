const http = require('../../utils/request');
const util = require('../../utils/util');
const app = getApp();

Page({
  data: {
    list: [],
    selectMode: false,
    loading: true
  },

  onLoad(options) {
    this.setData({ selectMode: String(options.select) === '1' });
  },

  onShow() {
    this.load();
  },

  async load() {
    this.setData({ loading: true });
    try {
      await app.login();
      const list = await http.get('/addressBook/list') || [];
      this.setData({
        list: list.map((item) => ({
          ...item,
          fullText: [item.provinceName, item.cityName, item.districtName, item.detail]
            .filter(Boolean)
            .join(' ')
        })),
        loading: false
      });
    } catch (e) {
      this.setData({ loading: false });
      util.errorToast(e);
    }
  },

  noop() {},

  onCardTap(e) {
    if (!this.data.selectMode) return;
    const item = this.data.list[Number(e.currentTarget.dataset.index)];
    if (!item) return;
    app.globalData.selectedAddress = item;
    wx.navigateBack();
  },

  add() {
    wx.navigateTo({ url: '/pages/address/edit' });
  },

  edit(e) {
    const item = this.data.list[Number(e.currentTarget.dataset.index)];
    if (!item) return;
    wx.navigateTo({ url: '/pages/address/edit?id=' + item.id });
  },

  async setDefault(e) {
    const item = this.data.list[Number(e.currentTarget.dataset.index)];
    if (!item) return;
    try {
      await http.put('/addressBook/default', { id: item.id });
      util.toast('已设为默认地址');
      this.load();
    } catch (err) {
      util.errorToast(err);
    }
  },

  async remove(e) {
    const item = this.data.list[Number(e.currentTarget.dataset.index)];
    if (!item) return;
    if (!(await util.confirm('确定删除这个地址吗？'))) return;
    try {
      await http.del('/addressBook', { id: item.id });
      util.toast('已删除');
      this.load();
    } catch (err) {
      util.errorToast(err);
    }
  }
});
