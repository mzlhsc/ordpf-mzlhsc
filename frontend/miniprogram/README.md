# ordpf 顾客端（微信小程序）

原生微信小程序，不使用 uni-app/Taro。完整运行说明见 `../README.md`。

## 快速开始

1. 微信开发者工具导入本目录。
2. 本地设置勾选“不校验合法域名、web-view、TLS 版本以及 HTTPS 证书”。
3. 确认 `config.js`：

```js
baseUrl: 'http://127.0.0.1:8090/client'
```

4. 确保后端 Gateway 8080 与本项目 Nginx 8090 已启动。

## 目录

```text
app.js / app.json / app.wxss
config.js                 # API 基址、开发 code
utils/request.js          # wx.request 封装、token、401
utils/util.js             # 金额/日期/状态工具
pages/index               # 首页点餐
pages/cart                # 购物车
pages/checkout            # 确认订单
pages/orders              # 订单列表
pages/order-detail        # 订单详情
pages/address             # 地址列表/编辑
pages/dining              # 堂食主页
pages/dining-menu         # 同桌点菜
pages/session             # 会话账单/AA
pages/reservation         # 预约
pages/reservation-list    # 我的预约
pages/mine                # 个人中心
assets/                   # tab 图标
tools/check-wxml.js       # WXML 标签配对检查
```

## 真机/生产

- 真机：`baseUrl` 改为电脑局域网 IP，如 `http://192.168.x.x:8090/client`。
- 生产：HTTPS 合法域名、真实微信 appid/secret、真实 `wx.login` code；`project.config.json` 的 `appid` 不要保留 `touristappid`。
