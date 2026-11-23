const config = require('../config');

function pad(n) {
  return n < 10 ? '0' + n : '' + n;
}

function formatDate(date) {
  const d = date || new Date();
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

function formatDateTime(date) {
  const d = date || new Date();
  return formatDate(d) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
}

function formatTimeText(value) {
  if (!value) return '';
  return String(value).replace('T', ' ').substring(0, 16);
}

function money(value) {
  const n = Number(value || 0);
  return n.toFixed(2);
}

function toast(title, icon = 'none') {
  wx.showToast({ title: title || '操作完成', icon, duration: 1800 });
}

function errorToast(err) {
  const msg = err && err.message ? err.message : '操作失败，请稍后重试';
  wx.showToast({ title: msg.substring(0, 40), icon: 'none', duration: 2500 });
}

function confirm(content, title = '提示') {
  return new Promise((resolve) => {
    wx.showModal({
      title,
      content,
      confirmColor: '#ff6b35',
      success(res) { resolve(!!res.confirm); },
      fail() { resolve(false); }
    });
  });
}

function nav(url) {
  wx.navigateTo({ url });
}

function switchTab(url) {
  wx.switchTab({ url });
}

const ORDER_STATUS = {
  1: '待付款',
  2: '待接单',
  3: '已接单',
  4: '派送中',
  5: '已完成',
  6: '已取消'
};

const DINING_SESSION_STATUS = {
  1: '就餐中',
  2: '待结账',
  3: '已结账',
  4: '已取消'
};

const RESERVATION_STATUS = {
  1: '待确认',
  2: '已确认',
  3: '已到店',
  4: '已取消',
  5: '已过期'
};

function statusText(map, status) {
  return map[status] || '未知状态';
}

module.exports = {
  config,
  pad,
  formatDate,
  formatDateTime,
  formatTimeText,
  money,
  toast,
  errorToast,
  confirm,
  nav,
  switchTab,
  ORDER_STATUS,
  DINING_SESSION_STATUS,
  RESERVATION_STATUS,
  statusText
};
