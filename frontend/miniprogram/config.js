/**
 * 小程序全局配置
 *
 * 本地开发：微信开发者工具 -> 详情 -> 本地设置 -> 勾选“不校验合法域名”。
 * 真机调试：把 baseUrl 换成电脑局域网 IP，例如 http://192.168.1.10:8090/client，
 *          并确保手机与电脑同一 Wi-Fi、Windows 防火墙放行 8090。
 * 正式发布：必须使用已备案的 HTTPS 域名，并在微信公众平台配置 request 合法域名。
 */
module.exports = {
  // 由 Nginx 统一反代到 Gateway；/client/ 会映射到网关根路径
  baseUrl: 'http://127.0.0.1:8090/client',

  // 后端未配置微信 appid/secret 时会走本地降级：code 直接当 openid。
  // 固定 code 可以保证每次调试都是同一个用户，购物车/地址不会丢。
  useFixedDevCode: true,
  devLoginCode: 'ordpf-mp-local-user',

  // 业务常量
  shopName: 'ordpf 餐饮',
  currency: '¥'
};
