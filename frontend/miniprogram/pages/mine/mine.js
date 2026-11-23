const config = require('../../config');
const http = require('../../utils/request');
const util = require('../../utils/util');
const app = getApp();

Page({
  data: {
    hasLogin: false,
    user: null,
    avatarLetter: 'O',
    openidShort: '',
    serverHost: config.baseUrl.replace(/^https?:\/\//, '').replace(/\/client$/, '')
  },

  onShow() {
    this.refreshUser();
  },

  refreshUser() {
    const token = wx.getStorageSync(http.TOKEN_KEY);
    const user = wx.getStorageSync(http.USER_KEY);
    if (token && user) {
      this.setData({
        hasLogin: true,
        user,
        avatarLetter: (user.name || 'O').substring(0, 1),
        openidShort: user.openid ? String(user.openid).substring(0, 12) : ('ID ' + user.id)
      });
    } else {
      this.setData({ hasLogin: false, user: null, avatarLetter: 'O' });
    }
  },

  async login() {
    try {
      const user = await app.login(true);
      util.toast('登录成功', 'success');
      this.setData({
        hasLogin: true,
        user,
        avatarLetter: (user.name || 'O').substring(0, 1),
        openidShort: user.openid ? String(user.openid).substring(0, 12) : ('ID ' + user.id)
      });
    } catch (e) {
      util.errorToast(e);
    }
  },

  async logout() {
    if (!(await util.confirm('确定退出当前账号吗？'))) return;
    app.logout();
    this.setData({ hasLogin: false, user: null, avatarLetter: 'O', openidShort: '' });
    util.toast('已退出登录');
  },

  goOrders() {
    wx.switchTab({ url: '/pages/orders/orders' });
  },

  goAddress() {
    wx.navigateTo({ url: '/pages/address/list' });
  },

  goReservations() {
    wx.navigateTo({ url: '/pages/reservation-list/reservation-list' });
  },

  goDining() {
    wx.switchTab({ url: '/pages/dining/dining' });
  },

  copyServer() {
    wx.setClipboardData({ data: config.baseUrl });
  }
});
