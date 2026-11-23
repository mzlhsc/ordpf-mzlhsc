const config = require('./config');
const http = require('./utils/request');

App({
  globalData: {
    user: null,
    selectedAddress: null,
    cartCount: 0,
    sessionRefresh: false
  },

  onLaunch() {
    const token = wx.getStorageSync(http.TOKEN_KEY);
    const user = wx.getStorageSync(http.USER_KEY);
    if (token && user) {
      this.globalData.user = user;
    }
  },

  /**
   * 确保已登录。已经有 token 时直接返回缓存用户。
   * 微信开发者工具 + 本地后端未配 appid 时，使用固定 code 作为 openid。
   */
  login(force = false) {
    if (!force) {
      const token = wx.getStorageSync(http.TOKEN_KEY);
      const user = wx.getStorageSync(http.USER_KEY);
      if (token && user) {
        this.globalData.user = user;
        return Promise.resolve(user);
      }
    }
    if (this._loginPromise) return this._loginPromise;

    this._loginPromise = this._doLogin().finally(() => {
      this._loginPromise = null;
    });
    return this._loginPromise;
  },

  async _doLogin() {
    http.clearAuth();
    const code = config.useFixedDevCode ? config.devLoginCode : await http.wxLogin();
    const data = await http.post('/user/user/login', { code }, { skipAuth: true });
    if (!data || !data.token) throw new Error('登录失败：后端没有返回令牌');

    const user = {
      id: data.id,
      openid: data.openid,
      token: data.token,
      name: data.name || data.nickName || '微信用户'
    };
    wx.setStorageSync(http.TOKEN_KEY, data.token);
    wx.setStorageSync(http.USER_KEY, user);
    this.globalData.user = user;
    return user;
  },

  logout() {
    http.clearAuth();
    this.globalData.user = null;
    this.globalData.cartCount = 0;
    this.globalData.selectedAddress = null;
  },

  setCartCount(count) {
    this.globalData.cartCount = Number(count || 0);
  }
});
