const http = require('../../utils/request');
const util = require('../../utils/util');
const app = getApp();

function buildTimeList() {
  const list = [];
  for (let h = 11; h <= 21; h++) {
    list.push(util.pad(h) + ':00');
    list.push(util.pad(h) + ':30');
  }
  return list;
}

Page({
  data: {
    tables: [],
    tableLabels: [],
    tableIndex: 0,
    date: '',
    minDate: '',
    maxDate: '',
    timeList: [],
    timeIndex: 0,
    guestOptions: ['2 人', '4 人', '6 人', '8 人', '10 人', '12 人'],
    guestIndex: 0,
    contactName: '',
    contactPhone: '',
    remark: '',
    submitting: false
  },

  onLoad() {
    const now = new Date();
    const today = util.formatDate(now);
    const max = new Date(now.getTime() + 6 * 24 * 3600 * 1000);
    const timeList = buildTimeList();
    let date = today;
    let timeIndex = 0;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const target = Math.ceil((currentMinutes + 30) / 30) * 30;
    if (target < 11 * 60) {
      timeIndex = 0;
    } else if (target > 21 * 60 + 30) {
      date = util.formatDate(new Date(now.getTime() + 24 * 3600 * 1000));
      timeIndex = 0;
    } else {
      const h = Math.floor(target / 60);
      const m = target % 60;
      const text = util.pad(h) + ':' + util.pad(m);
      const idx = timeList.indexOf(text);
      timeIndex = idx >= 0 ? idx : 0;
    }
    const user = app.globalData.user;
    this.setData({
      date,
      minDate: today,
      maxDate: util.formatDate(max),
      timeList,
      timeIndex,
      contactName: user && user.name ? user.name : ''
    });
    this.loadTables();
  },

  async loadTables() {
    try {
      const list = await http.get('/user/dining/table/list') || [];
      const tables = list
        .filter((item) => Number(item.reservationEnabled) === 1)
        .map((item) => ({
          ...item,
          label: (item.area ? item.area + ' · ' : '') + item.name + '（' + item.seats + ' 人桌）'
        }));
      this.setData({
        tables,
        tableLabels: tables.map((item) => item.label),
        tableIndex: 0
      });
    } catch (e) {
      util.errorToast(e);
    }
  },

  onTableChange(e) {
    this.setData({ tableIndex: Number(e.detail.value) });
  },

  onDateChange(e) {
    this.setData({ date: e.detail.value });
  },

  onTimeChange(e) {
    this.setData({ timeIndex: Number(e.detail.value) });
  },

  onGuestChange(e) {
    this.setData({ guestIndex: Number(e.detail.value) });
  },

  onContactName(e) {
    this.setData({ contactName: e.detail.value });
  },

  onContactPhone(e) {
    this.setData({ contactPhone: e.detail.value });
  },

  onRemark(e) {
    this.setData({ remark: e.detail.value });
  },

  async submit() {
    if (this.data.submitting) return;
    const table = this.data.tables[this.data.tableIndex];
    if (!table) return util.toast('暂无可预约桌台');
    if (!this.data.contactName.trim()) return util.toast('请填写联系人');
    if (!/^1[3-9]\d{9}$/.test(this.data.contactPhone || '')) return util.toast('请填写正确的手机号');

    this.setData({ submitting: true });
    try {
      await app.login();
      const guestCount = parseInt(this.data.guestOptions[this.data.guestIndex], 10);
      const reserveTime = this.data.date + ' ' + this.data.timeList[this.data.timeIndex] + ':00';
      await http.post('/user/dining/reservation', {
        tableId: table.id,
        reserveTime,
        guestCount,
        contactName: this.data.contactName.trim(),
        contactPhone: this.data.contactPhone.trim(),
        remark: this.data.remark.trim()
      });
      util.toast('预约已提交，等待门店确认', 'success');
      setTimeout(() => {
        wx.redirectTo({ url: '/pages/reservation-list/reservation-list' });
      }, 900);
    } catch (e) {
      util.errorToast(e);
    } finally {
      this.setData({ submitting: false });
    }
  }
});
