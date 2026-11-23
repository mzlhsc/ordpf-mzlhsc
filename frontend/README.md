# ordpf 前端

本目录包含两个前端：

| 目录 | 端 | 技术栈 | 访问方式 |
| --- | --- | --- | --- |
| `admin` | 员工管理端 | Vue3 3.4.38 + Element Plus（无构建，本地 vendor） | 浏览器 `http://localhost:8090/` |
| `miniprogram` | 顾客端 | 原生微信小程序 WXML/WXSS/JS | 微信开发者工具导入 |

管理端由项目内 Nginx 托管，Nginx 同时把接口反向代理到 Gateway；小程序不直连微服务，统一走 Nginx `/client/`。

## 1. 启动

前置：后端 Gateway（8080）及服务已启动。

```powershell
# 只启动管理端 Nginx
pwsh -File ..\scripts\start-web.ps1

# 只停止管理端（不会停止旧项目的 80 端口 Nginx）
pwsh -File ..\scripts\stop-web.ps1

# 重载配置
pwsh -File ..\scripts\reload-web.ps1
```

`scripts/start-all.ps1` 会在启动微服务后联动启动管理端；`stop-all.ps1` 会联动停止本项目 8090 Nginx。

- 管理端：`http://localhost:8090/`，默认 `admin / 123456`
- 健康检查：`http://localhost:8090/health` → `ordpf-admin-ok`
- Knife4j：`http://localhost:8090/docs/doc.html`
- Sentinel：`http://localhost:8090/sentinel/`（可选）

## 2. 管理端

### 2.1 目录

```text
admin/
├─ index.html
├─ 50x.html
├─ css/app.css
├─ js/api.js          # /api 基址、token、401
├─ js/app.js          # Vue 组件与页面
├─ vendor/            # vue、element-plus、qrcode
└─ tools/
   ├─ check-tpl.js    # 模板编译检查
   └─ browser-smoke.js# Chrome CDP 冒烟
```

### 2.2 页面

- 工作台：今日/订单/营业额统计。
- 外卖订单：条件查询、接单/拒单/派送/完成、详情。
- 堂食：桌台、会话、预约、报表 4 个 Tab；二维码使用本地 `qrcode.min.js`，扫码内容来自后端 `qrContent`。
- 菜品：分类、起停售、库存列、库存编辑；保留口味 `flavors`。
- 分类/套餐/员工/报表/店铺状态。

### 2.3 接口约定

- 基址：`/api`，Nginx 映射为 Gateway `/admin/`。
- 登录：`POST /api/employee/login`，body `{username,password}`。
- 请求头：`zmlhsc: <token>`。
- localStorage：`ordpf.admin.token`、`ordpf.admin.user`。
- 响应兼容 `{code,msg,data}` 与裸对象；401 清理 token 并回登录页。

### 2.4 检查

```powershell
node tools\check-tpl.js
node tools\browser-smoke.js
```

`check-tpl.js` 当前 12 个模板，编译失败 0。`browser-smoke.js` 使用本机 Chrome CDP，验证登录、工作台、堂食、菜品库存渲染。

## 3. 微信小程序

### 3.1 导入

1. 打开微信开发者工具，选择“导入项目”。
2. 目录选择 `frontend/miniprogram`。
3. AppID 可先用测试号/游客模式；正式发布替换 `project.config.json` 的 `appid`。
4. 详情 → 本地设置 → 勾选“不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书”。

### 3.2 配置

`config.js`：

```js
module.exports = {
  baseUrl: 'http://127.0.0.1:8090/client',
  devLoginCode: 'ordpf-mp-local-user'
}
```

- 开发者工具访问本机：保持 `127.0.0.1`。
- 真机预览：把 `baseUrl` 改成电脑局域网 IP，如 `http://192.168.1.10:8090/client`，手机与电脑同一局域网，并放行 8090。
- 生产：必须使用 HTTPS 合法域名，配置真实微信 appid/secret，`wx.login` 返回真实 code。

### 3.3 页面与能力

13 个页面 + 4 个 tabBar：

- 首页（外卖分类/套餐/菜品、购物车悬浮条）
- 购物车、确认订单
- 订单列表、订单详情（取消/催单/再来一单）
- 地址列表、地址编辑
- 堂食主页（扫码/桌台/我的预约）
- 同桌点菜（共享购物车）
- 会话账单（成员、AA、申请结账、加入同桌）
- 预约、我的预约
- 个人中心

请求层 `utils/request.js` 自动携带 `authorization`，兼容 `{code,msg,data}` 与裸返回；401 清 token。

### 3.4 本地联调固定用户

`devLoginCode` 固定为 `ordpf-mp-local-user`，后端未配置微信 appid/secret 时会把 code 当 openid，保证本地用户稳定。首次进入首页会自动登录；个人中心可手动登录/退出。

> 该固定 code 只用于本地开发，生产必须改成真实 `wx.login` code。

### 3.5 静态检查

```powershell
node tools\check-wxml.js
```

全部 JS 用 `node --check`、全部 JSON 用 `ConvertFrom-Json` 校验；当前 13 个 WXML 标签配对全部通过。

## 4. Nginx

- 二进制/配置：`middleware/nginx/nginx.exe`、`middleware/nginx/conf/nginx.conf`
- 监听：`8090`
- 静态根：`../../frontend/admin`
- `/api/` → `http://127.0.0.1:8080/admin/`
- `/client/` → `http://127.0.0.1:8080/`
- `/docs/doc.html` → `http://127.0.0.1:8092/`
- `/sentinel/` → `http://127.0.0.1:8088/`
- 旧项目 Nginx 仍占用 80 端口，本项目不要改 80。

## 5. 已知限制

- 本机已安装微信开发者工具（版本 `2.02.2608080`，路径 `D:\Jobs\App\微信web开发者工具`）。原 `frontend/miniprogram` 的 `project.config.json` 为 `touristappid`，CLI 直接打开会报 code 10“不存在此 AppID”，因此真实编译验证使用临时副本（appid 改为教程项目已有的 `wxc69c75f8ef2056d2`）；原项目配置未改，生产前仍需替换为正式 appid。临时副本已用 `cli auto` + `miniprogram-automator` 跑通首页、堂食、订单、我的、预约、同桌点菜页，并取得真实接口数据与模拟器截图。`cli preview` 当前报开发者工具内部错误 `UNKNOWN: unknown error, read`，二维码预览不可用；真机预览需解决该问题后补做。
- 管理端堂食页动作按钮（开台/转台/并桌/取消/结账）已完成页面渲染与底层 API 验证，UI 逐按钮点击尚未全部覆盖。
- 自动化环境中 `switchTab` 可能不切页，页面验收改用 `reLaunch` / `navigateTo` 并留足加载等待；这不影响真机运行。
