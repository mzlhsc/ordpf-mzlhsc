const http = require('../../utils/request');
const util = require('../../utils/util');
const app = getApp();

Page({
  data: {
    list: [],
    loading: true
  },

  onShow() {
    this.load();
  },

  onPullDownRefresh() {
    this.load().finally(() => wx.stopPullDownRefresh());
  },

  async load() {
    this.setData({ loading: true });
    try {
      await app.login();
      const [reservations, tables] = await Promise.all([
        http.get('/user/dining/reservation/mine') || [],
        http.get('/user/dining/table/list') || []
      ]);
      const tableMap = {};
      (tables || []).forEach((table) => {
        tableMap[table.id] = table.name;
      });
      const list = (reservations || []).map((item) => {
        const time = util.formatTimeText(item.reserveTime);
        return {
          ...item,
          dateText: time ? time.substring(5, 10) : '',
          timeText: time ? time.substring(11) : '',
          tableName: tableMap[item.tableId] || ('桌台 #' + item.tableId),
          statusText: util.statusText(util.RESERVATION_STATUS, item.status),
          canCancel: item.status === 1 || item.status === 2
        };
      });
      this.setData({ list, loading: false });
    } catch (e) {
      this.setData({ loading: false });
      util.errorToast(e);
    }
  },

  async cancel(e) {
    const item = this.data.list[Number(e.currentTarget.dataset.index)];
    if (!item) return;
    if (!(await util.confirm('确定取消这个预约吗？'))) return;
    try {
      await http.post('/user/dining/reservation/' + item.id + '/cancel');
      util.toast('预约已取消');
      this.load();
    } catch (err) {
      util.errorToast(err);
    }
  },

  goReservation() {
    wx.navigateTo({ url: '/pages/reservation/reservation' });
  }
});
