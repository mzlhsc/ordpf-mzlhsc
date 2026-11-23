const config = require('../config');

const TOKEN_KEY = 'ordpf.mp.token';
const USER_KEY = 'ordpf.mp.user';

function queryString(data) {
  const parts = [];
  Object.keys(data || {}).forEach((key) => {
    const value = data[key];
    if (value === undefined || value === null || value === '') return;
    parts.push(key + '=' + encodeURIComponent(value));
  });
  return parts.length ? '?' + parts.join('&') : '';
}

function clearAuth() {
  wx.removeStorageSync(TOKEN_KEY);
  wx.removeStorageSync(USER_KEY);
}

function request(path, method = 'GET', data = {}, options = {}) {
  const token = wx.getStorageSync(TOKEN_KEY);
  const upper = String(method || 'GET').toUpperCase();
  const url = config.baseUrl + path + (upper === 'GET' ? queryString(data) : '');
  const header = {
    'content-type': 'application/json'
  };
  if (token && !options.skipAuth) header.authorization = token;

  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method: upper,
      data: upper === 'GET' ? undefined : data,
      header,
      timeout: options.timeout || 15000,
      success(res) {
        const body = res.data;
        if (res.statusCode === 401) {
          clearAuth();
          const err = new Error('登录状态已失效，请重新进入页面');
          err.code = 401;
          reject(err);
          return;
        }
        if (res.statusCode < 200 || res.statusCode >= 300) {
          const msg = (body && (body.msg || body.message)) || ('请求失败（HTTP ' + res.statusCode + '）');
          const err = new Error(msg);
          err.code = res.statusCode;
          reject(err);
          return;
        }
        // 兼容 {code,msg,data} 与裸对象/数组/数字
        if (body && typeof body === 'object' && body.code !== undefined) {
          if (Number(body.code) === 200) {
            resolve(body.data);
          } else {
            const err = new Error(body.msg || '业务处理失败');
            err.code = body.code;
            reject(err);
          }
          return;
        }
        resolve(body);
      },
      fail(err) {
        const message = err && err.errMsg ? err.errMsg : '网络请求失败';
        const e = new Error(
          message.indexOf('timeout') >= 0
            ? '请求超时，请检查后端服务'
            : '连接不上服务，请确认 Nginx 8090 和后端已启动'
        );
        e.code = 'NETWORK';
        reject(e);
      }
    });
  });
}

function wxLogin() {
  return new Promise((resolve, reject) => {
    wx.login({
      success(res) {
        if (res.code) resolve(res.code);
        else reject(new Error('微信登录失败：没有返回 code'));
      },
      fail(err) {
        reject(new Error(err.errMsg || '微信登录失败'));
      }
    });
  });
}

module.exports = {
  TOKEN_KEY,
  USER_KEY,
  request,
  wxLogin,
  clearAuth,
  get: (path, data, options) => request(path, 'GET', data, options),
  post: (path, data, options) => request(path, 'POST', data, options),
  put: (path, data, options) => request(path, 'PUT', data, options),
  del: (path, data, options) => request(path, 'DELETE', data, options)
};
