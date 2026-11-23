# ordpf-mzlhsc / 苍穹外卖订单平台

Spring Boot 4.0.9 + Spring Cloud Alibaba 2025.1.0.0 + Java 25 的微服务版外卖/堂食平台后端。

## 1. 架构

| 领域 | 服务 | 端口 | 职责 |
| --- | --- | --- | --- |
| 接入层 | ordpf-gateway | 8080 | 统一路由、全局 JWT 鉴权、CORS、Knife4j 文档转发 |
| 前端 | admin（Nginx） | 8090 | Vue3 + Element Plus 管理端，Nginx 静态托管并反代 `/api/` |
| 前端 | miniprogram | - | 原生微信小程序顾客端，经 Nginx `/client/` 访问网关 |
| 菜品域 | dish-service | 8083 | 菜品、口味、库存、热点缓存 |
| 菜品域 | ctgy-serivce | 8082 | 菜品/套餐分类 |
| 菜品域 | setmeal-service | 8084 | 套餐与套餐菜品关系 |
| 订单域 | order-service | 8091 | 外卖订单、购物车、堂食桌台/预约/会话/AA/报表、库存扣减编排 |
| 用户域 | user-service | 8086 | 微信用户、地址簿 |
| 用户域 | emp-service | 8081 | 员工账号与登录 |
| 支撑域 | report-service | 8087 | 营业统计、工作台、Excel 导出 |
| 支撑域 | common-service | 8089 | 阿里云 OSS 文件上传 |
| 支撑域 | shop-service | 8100 | 店铺营业状态 |
| 文档 | docs-service | 8092 | Knife4j 聚合 9 个服务分组 |

中间件：

- Nacos 3.1.1：`8848` 服务 / `8849` 控制台，服务注册发现 + 共享配置（JDBC/Redis/日志/Swagger/Seata）。
- MySQL 8.0.34：业务库 `sky_take_out`。
- Redis 3.2.100（本地）：热点菜品缓存、库存缓存、下单限流。
- Redisson 3.50.0：限量菜品库存分布式锁。
- Sentinel Dashboard 1.8.8：`8088`，`sentinel/sentinel`。
- Seata 2.6.0 TC：`7091`，下单全局事务。

## 2. 快速启动

```powershell
# 1. 初始化数据库（首次）
mysql -uroot -proot < mysql/01-undo_log.sql
mysql -uroot -proot < mysql/02-nacos-auth.sql
mysql -uroot -proot < mysql/03-dining-and-stock.sql

# 2. 打包
mvn -B clean install -DskipTests

# 3. 启动 Sentinel Dashboard（可选，不启动时本地规则仍生效）
pwsh -File .\scripts\start-sentinel-dashboard.ps1

# 4. 启动全部服务（含 8090 管理端）
pwsh -File .\scripts\start-all.ps1

# 5. 只启动/停止/重载管理端 Nginx
pwsh -File .\scripts\start-web.ps1
pwsh -File .\scripts\stop-web.ps1
pwsh -File .\scripts\reload-web.ps1

# 6. 停止全部（含管理端；不影响旧项目 Nginx）
pwsh -File .\scripts\stop-all.ps1
```

访问：

- 管理端：`http://localhost:8090/`（默认账号 `admin/123456`）
- 小程序：微信开发者工具导入 `frontend/miniprogram`，API 走 `http://127.0.0.1:8090/client`
- 网关：`http://localhost:8080`
- Knife4j 聚合文档：`http://localhost:8092/doc.html`；同一入口 `http://localhost:8090/docs/doc.html`
- Sentinel Dashboard：`http://localhost:8088`；同一入口 `http://localhost:8090/sentinel/`

## 3. 核心能力

- 外卖：分类/菜品/套餐、购物车、地址簿、下单、接单/派送/完成/拒单/取消、再来一单。
- 堂食：桌台二维码、预约、开台/加入、共享购物车、加菜下单、转台、并桌、待结账、AA 分摊、整单结账、释放桌台、堂食报表。
- 库存：`dish.stock` + Redisson 锁 + `stock >= number` 条件更新；下单扣减，取消/拒单回补，并发不超卖。
- 缓存：菜品列表/库存 Redis 缓存，写操作统一失效。
- 限流：Redis + Lua 固定窗口，每人每分钟 10 次下单。
- 熔断：Sentinel 真实 Dashboard + 本地规则双保险，`submitOrder` / `submitDiningOrder` 降级提示。
- 文档：Knife4j 聚合全服务 OpenAPI。`docs-service` 不注册 Nacos，仅做文档聚合。
- 前端（管理端）：Vue3 + Element Plus 单页应用，覆盖工作台、外卖订单、堂食桌台/会话/预约/报表、菜品库存、分类、套餐、员工、报表、店铺状态；Nginx 8090 托管并反代网关。
- 前端（顾客端）：原生微信小程序，覆盖外卖分类点餐、购物车、确认订单、地址、订单列表/详情、堂食扫码/开台/同桌共享点菜/AA/结账、预约与个人中心。

## 4. 验收清单（对应需求）

- 微服务：根 pom + 14 个子模块，共 15 个 Maven 模块；菜品、订单、用户权限按业务域拆分。
- 注册发现：Nacos 8848/8849，服务均注册；配置集中管理，共享 JDBC/Redis/日志/Swagger/Seata 配置。
- 远程调用：`ordpf-api` 定义 Feign Client，订单服务远程调用菜品库存、用户地址、套餐等能力。
- 双场景：外卖（地址/购物车/下单/接单/派送/取消）+ 堂食（桌台/预约/开台/共享购物车/加菜/转台/并桌/AA/整单结账）。
- 数据层：MyBatis-Plus + 分页插件；菜品/分类/购物车/订单/地址/堂食共 18 张业务表 + `undo_log`，关键查询有索引。
- 缓存与并发：Redis 热点菜品缓存；Redisson 锁 + `stock >= number` 条件更新防止超卖；Redis+Lua 每分钟 10 次下单限流。
- 稳定性：Sentinel Dashboard 8088 + 本地规则双保险，`submitOrder`/`submitDiningOrder` QPS 限流与慢调用熔断，降级返回 429/503。
- 基础设施：阿里云 OSS 上传；Gateway 统一路由、全局鉴权、CORS、文档转发；Knife4j 8092 聚合 9 个分组。
- 前端交付：管理端 `frontend/admin` 由 Nginx 8090 托管，`/api/` 反代管理端接口；小程序 `frontend/miniprogram` 13 页 + 4 tab，`/client/` 反代顾客端接口；管理端模板编译 0 失败，小程序 JS/JSON/WXML 静态检查通过，外卖/堂食/预约链路已联调。

验收命令：

```powershell
mvn -B clean install -DskipTests
pwsh -File .\scripts\start-all.ps1
```

> 若服务已在运行，先执行 `pwsh -File .\scripts\stop-all.ps1`，避免 Windows 文件锁导致 repackage 失败。

## 5. 数据库迁移

- `mysql/01-undo_log.sql`：Seata AT 回滚日志表。
- `mysql/02-nacos-auth.sql`：Nacos 鉴权用户/角色。
- `mysql/03-dining-and-stock.sql`：菜品库存、堂食共享购物车、桌台二维码、预约、并桌、AA、支付流水、操作流水，可重复执行。

## 6. 文档

- `docs/接口文档.md`：全部管理端/用户端接口、Nginx 入口与前端调用方式。
- `docs/数据库文档.md`：表结构与字段说明（前端交付无表结构变更）。
- `docs/操作日志.md`：修复与改造记录、验证结果。
- `frontend/README.md`：管理端与小程序运行、联调、部署说明。
- `logs/`：各服务运行日志。









