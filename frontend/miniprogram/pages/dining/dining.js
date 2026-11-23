const http = require('../../utils/request');
const util = require('../../utils/util');
const app = getApp();

const TABLE_STATUS = { 0: '空闲', 1: '就餐中', 2: '待结账' };

Page({
  data: {
    tables: [],
    areas: [],
    activeSession: null,
    reservations: [],
    loading: true
  },

  onShow() {
    this.loadAll();
  },

  onPullDownRefresh() {
    this.loadAll().finally(() => wx.stopPullDownRefresh());
  },

  async loadAll() {
    this.setData({ loading: true });
    await Promise.all([this.loadTables(), this.loadMine(), this.loadReservations()]);
    this.setData({ loading: false });
  },

  async loadTables() {
    try {
      const list = await http.get('/user/dining/table/list') || [];
      const tables = list.map((item) => ({
        ...item,
        statusText: TABLE_STATUS[item.status] || '未知'
      }));
      const map = {};
      tables.forEach((table) => {
        const area = table.area || '大厅';
        if (!map[area]) map[area] = [];
        map[area].push(table);
      });
      const areas = Object.keys(map).map((name) => ({ name, tables: map[name] }));
      this.setData({ tables, areas });
    } catch (e) {
      util.errorToast(e);
    }
  },

  async loadMine() {
    if (!wx.getStorageSync(http.TOKEN_KEY)) return;
    try {
      const session = await http.get('/user/dining/session/mine');
      if (!session || !session.id) {
        this.setData({ activeSession: null });
        return;
      }
      this.setData({
        activeSession: {
          ...session,
          statusText: util.statusText(util.DINING_SESSION_STATUS, session.status)
        }
      });
    } catch (e) {
      this.setData({ activeSession: null });
    }
  },

  async loadReservations() {
    if (!wx.getStorageSync(http.TOKEN_KEY)) return;
    try {
      const list = await http.get('/user/dining/reservation/mine') || [];
      this.setData({
        reservations: list.map((item) => ({
          ...item,
          reserveTimeText: util.formatTimeText(item.reserveTime),
          statusText: util.statusText(util.RESERVATION_STATUS, item.status)
        }))
      });
    } catch (e) {
      this.setData({ reservations: [] });
    }
  },

  async scanTable() {
    wx.scanCode({
      onlyFromCamera: false,
      success: async (res) => {
        const raw = String(res.result || '').trim();
        const token = raw.indexOf('DINING_TABLE:') === 0
          ? raw.substring('DINING_TABLE:'.length)
          : raw;
        if (!token) return util.toast('不是有效的桌台二维码');
        try {
          await app.login();
          const data = await http.get('/user/dining/scan/' + encodeURIComponent(token));
          if (data && data.session && data.session.id) {
            this.goSession(data.session.id);
          } else if (data && data.table) {
            this.askGuestCount(data.table).then((count) => {
              if (count) this.openTable(data.table.id, count);
            });
          }
        } catch (e) {
          util.errorToast(e);
        }
      }
    });
  },

  chooseTable() {
    if (this.data.areas.length) {
      wx.pageScrollTo({ scrollTop: 600, duration: 300 });
    } else {
      this.loadTables();
    }
  },

  onTableTap(e) {
    const id = Number(e.currentTarget.dataset.id);
    const status = Number(e.currentTarget.dataset.status);
    const sessionId = e.currentTarget.dataset.session;
    if (status !== 0 && sessionId) {
      this.goSession(sessionId);
      return;
    }
    if (status !== 0) return util.toast('该桌台正在就餐中');
    const table = this.data.tables.find((item) => Number(item.id) === id);
    if (!table) return;
    this.askGuestCount(table).then((count) => {
      if (count) this.openTable(id, count);
    });
  },

  askGuestCount(table) {
    return new Promise((resolve) => {
      const seats = Number(table.seats || 4);
      const options = [2, 4, 6, 8, 10].filter((n) => n <= Math.max(seats, 2));
      const list = (options.length ? options : [2, 4]).map((n) => n + ' 人');
      wx.showActionSheet({
        itemList: list,
        success: (res) => {
          const n = Number(list[res.tapIndex].replace(' 人', ''));
          resolve(n);
        },
        fail: () => resolve(0)
      });
    });
  },

  async openTable(tableId, guestCount, reservationId) {
    try {
      const user = await app.login();
      const session = await http.post('/user/dining/open', {
        tableId,
        guestCount,
        nickname: user.name || '微信用户',
        reservationId
      });
      util.toast('开台成功', 'success');
      this.goSession(session.id);
    } catch (e) {
      util.errorToast(e);
    }
  },

  goSession(id) {
    wx.navigateTo({ url: '/pages/session/session?id=' + id });
  },

  goActiveSession() {
    if (this.data.activeSession) this.goSession(this.data.activeSession.id);
  },

  goReservation() {
    wx.navigateTo({ url: '/pages/reservation/reservation' });
  },

  goReservationList() {
    wx.navigateTo({ url: '/pages/reservation-list/reservation-list' });
  },

  onShareAppMessage() {
    return { title: 'ordpf 餐饮 · 到店慢慢吃', path: '/pages/dining/dining' };
  }
});
