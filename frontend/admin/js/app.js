/* ==========================================================================
   ordpf 餐饮 · 管理后台（Vue 3 + Element Plus，无构建，直接由 Nginx 托管）
   页面：登录 / 工作台 / 订单 / 堂食 / 菜品 / 套餐 / 分类 / 员工 / 报表 / 店铺
   ========================================================================== */
(function () {
    'use strict';

    const { createApp, reactive, ref, computed, onMounted } = Vue;
    const { ElMessage, ElMessageBox } = ElementPlus;

    /* ==================== 常量 & 工具 ==================== */

    const ORDER_STATUS = {
        1: { text: '待付款', type: 'info' },
        2: { text: '待接单', type: 'warning' },
        3: { text: '已接单', type: 'primary' },
        4: { text: '派送中', type: 'primary' },
        5: { text: '已完成', type: 'success' },
        6: { text: '已取消', type: 'danger' }
    };

    const DINE_IN_STATUS = {
        1: { text: '点单中', type: 'info' },
        2: { text: '待结账', type: 'warning' },
        3: { text: '已结账', type: 'success' },
        4: { text: '已取消', type: 'danger' }
    };

    const PAY_METHOD = { 1: '微信', 2: '支付宝', 3: '现金' };

    const MENU = [
        { key: 'dashboard', label: '工作台', icon: '◈' },
        { key: 'orders', label: '订单管理', icon: '▤' },
        { key: 'dinein', label: '堂食管理', icon: '▣' },
        { key: 'dish', label: '菜品管理', icon: '◉' },
        { key: 'setmeal', label: '套餐管理', icon: '◎' },
        { key: 'category', label: '分类管理', icon: '▥' },
        { key: 'employee', label: '员工管理', icon: '☗' },
        { key: 'report', label: '数据报表', icon: '◐' },
        { key: 'shop', label: '店铺状态', icon: '◍' }
    ];

    const PAGE_TITLE = {
        dashboard: '工作台', orders: '订单管理', dinein: '堂食管理', dish: '菜品管理',
        setmeal: '套餐管理', category: '分类管理', employee: '员工管理',
        report: '数据报表', shop: '店铺状态'
    };

    function money(v) {
        return v === null || v === undefined || v === '' ? '-' : '¥' + Number(v).toFixed(2);
    }

    function pct(v) {
        return v === null || v === undefined ? '-' : (Number(v) * 100).toFixed(1) + '%';
    }

    function timeText(v) {
        if (!v) return '-';
        return String(v).replace('T', ' ').slice(0, 19);
    }

    function todayStr() {
        const d = new Date();
        const p = n => (n < 10 ? '0' + n : '' + n);
        return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
    }

    function daysAgoStr(n) {
        const d = new Date(Date.now() - n * 86400000);
        const p = x => (x < 10 ? '0' + x : '' + x);
        return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
    }

    /** CSV 字符串转数组（报表接口返回的是逗号拼接串） */
    function csv(s) {
        if (!s) return [];
        return String(s).split(',').map(x => x.trim());
    }

    /* ==================== 全局状态 ==================== */

    const store = reactive({
        logged: api.auth.isLogin(),
        route: 'dashboard',
        user: api.auth.getUser()
    });

    /** 统一错误处理：401 直接踢回登录页 */
    function fail(e) {
        const msg = (e && e.message) || '操作失败';
        ElMessage.error(msg);
        if (msg.indexOf('登录已过期') >= 0) {
            store.logged = false;
            api.auth.clearAuth();
            location.hash = '';
        }
    }

    /* ==================== 登录 ==================== */

    const LoginView = {
        template: `
        <div class="login-page">
          <div class="login-card">
            <div class="login-brand">
              <div class="logo">O</div>
              <h1>ordpf 餐饮</h1>
              <p>外卖 + 堂食 · 商家管理后台</p>
            </div>
            <el-form :model="form" @keyup.enter="submit">
              <el-form-item>
                <el-input v-model="form.username" size="large" placeholder="用户名" clearable />
              </el-form-item>
              <el-form-item>
                <el-input v-model="form.password" size="large" type="password" placeholder="密码" show-password />
              </el-form-item>
              <el-button type="primary" size="large" style="width:100%" :loading="loading" @click="submit">
                登 录
              </el-button>
            </el-form>
            <div class="login-tip">
              默认账号 admin / 123456<br>登录态保存在浏览器本地，接口通过请求头 zmlhsc 携带令牌
            </div>
          </div>
        </div>`,
        emits: ['success'],
        setup(props, ctx) {
            const form = reactive({ username: 'admin', password: '123456' });
            const loading = ref(false);

            async function submit() {
                if (!form.username || !form.password) {
                    ElMessage.warning('请输入用户名和密码');
                    return;
                }
                loading.value = true;
                try {
                    // 该接口是裸返回（没有 R 包装），api 层已兼容
                    const vo = await api.post('/employee/login', { username: form.username, password: form.password });
                    if (!vo || !vo.token) throw new Error('登录失败：未返回令牌');
                    api.auth.setAuth(vo);
                    store.user = api.auth.getUser();
                    store.logged = true;
                    location.hash = '#/dashboard';
                    ElMessage.success('欢迎回来，' + (vo.name || vo.userName || ''));
                } catch (e) {
                    fail(e);
                } finally {
                    loading.value = false;
                }
            }

            return { form, loading, submit };
        }
    };

    /* ==================== 工作台 ==================== */

    const DashboardView = {
        template: `
        <div>
          <div class="stat-grid">
            <div class="stat">
              <div class="label">今日营业额</div>
              <div class="value">{{ money(biz.turnover) }}</div>
            </div>
            <div class="stat">
              <div class="label">有效订单</div>
              <div class="value">{{ num(biz.validOrderCount) }}<small>单</small></div>
            </div>
            <div class="stat">
              <div class="label">订单完成率</div>
              <div class="value">{{ pct(biz.orderCompletionRate) }}</div>
            </div>
            <div class="stat">
              <div class="label">平均客单价</div>
              <div class="value">{{ money(biz.unitPrice) }}</div>
            </div>
            <div class="stat">
              <div class="label">新增用户</div>
              <div class="value">{{ num(biz.newUsers) }}<small>人</small></div>
            </div>
          </div>

          <div class="card">
            <div class="card-title">订单总览 <span class="sub">今日</span></div>
            <div class="stat-grid" style="margin-bottom:0">
              <div class="stat" style="box-shadow:none;padding:12px 16px">
                <div class="label">全部订单</div><div class="value" style="font-size:20px">{{ num(order.allOrders) }}</div>
              </div>
              <div class="stat" style="box-shadow:none;padding:12px 16px">
                <div class="label">已完成</div><div class="value" style="font-size:20px">{{ num(order.completedOrders) }}</div>
              </div>
              <div class="stat" style="box-shadow:none;padding:12px 16px">
                <div class="label">待接单</div><div class="value" style="font-size:20px">{{ num(order.waitingOrders) }}</div>
              </div>
              <div class="stat" style="box-shadow:none;padding:12px 16px">
                <div class="label">派送中</div><div class="value" style="font-size:20px">{{ num(order.deliveredOrders) }}</div>
              </div>
              <div class="stat" style="box-shadow:none;padding:12px 16px">
                <div class="label">已取消</div><div class="value" style="font-size:20px">{{ num(order.cancelledOrders) }}</div>
              </div>
            </div>
          </div>

          <div class="stat-grid">
            <div class="stat">
              <div class="label">在售菜品 / 停售</div>
              <div class="value" style="font-size:20px">{{ num(dish.sold) }} <small>/ {{ num(dish.discontinued) }}</small></div>
            </div>
            <div class="stat">
              <div class="label">在售套餐 / 停售</div>
              <div class="value" style="font-size:20px">{{ num(setmeal.sold) }} <small>/ {{ num(setmeal.discontinued) }}</small></div>
            </div>
            <div class="stat">
              <div class="label">店铺状态</div>
              <div class="value" style="font-size:20px">
                <el-tag :type="shopStatus === 1 ? 'success' : 'info'" size="large">
                  {{ shopStatus === 1 ? '营业中' : '已打烊' }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>`,
        setup() {
            const biz = ref({});
            const order = ref({});
            const dish = ref({});
            const setmeal = ref({});
            const shopStatus = ref(null);

            function num(v) {
                return v === null || v === undefined ? 0 : v;
            }

            async function load() {
                try {
                    const [b, o, d, s, st] = await Promise.all([
                        api.get('/workspace/businessData'),
                        api.get('/workspace/overviewOrders'),
                        api.get('/workspace/overviewDishes'),
                        api.get('/workspace/overviewSetmeals'),
                        api.get('/shop/status')
                    ]);
                    biz.value = b || {};
                    order.value = o || {};
                    dish.value = d || {};
                    setmeal.value = s || {};
                    shopStatus.value = st;
                } catch (e) {
                    fail(e);
                }
            }

            onMounted(load);
            return { biz, order, dish, setmeal, shopStatus, num, money, pct };
        }
    };

    /* ==================== 订单管理 ==================== */

    const OrdersView = {
        template: `
        <div>
          <div class="card">
            <div class="toolbar">
              <el-input v-model="q.number" placeholder="订单号" clearable style="width:170px" @keyup.enter="search" />
              <el-input v-model="q.phone" placeholder="手机号" clearable style="width:150px" @keyup.enter="search" />
              <el-select v-model="q.status" placeholder="订单状态" clearable style="width:140px">
                <el-option v-for="(v,k) in statusMap" :key="k" :label="v.text" :value="Number(k)" />
              </el-select>
              <el-button type="primary" @click="search">查询</el-button>
              <el-button @click="reset">重置</el-button>
              <span class="grow"></span>
              <span class="muted">共 {{ total }} 条</span>
            </div>

            <el-table :data="rows" v-loading="loading" border stripe>
              <el-table-column prop="number" label="订单号" width="170" />
              <el-table-column label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="(statusMap[row.status]||{}).type" size="small">
                    {{ (statusMap[row.status]||{}).text || row.status }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="菜品" min-width="220">
                <template #default="{ row }">
                  <div class="dishes">{{ row.orderDishes || '-' }}</div>
                </template>
              </el-table-column>
              <el-table-column prop="userName" label="下单人" width="110" />
              <el-table-column prop="phone" label="手机号" width="130" />
              <el-table-column prop="address" label="地址" min-width="180" show-overflow-tooltip />
              <el-table-column label="金额" width="100" align="right">
                <template #default="{ row }">{{ money(row.amount) }}</template>
              </el-table-column>
              <el-table-column label="下单时间" width="165">
                <template #default="{ row }">{{ timeText(row.orderTime) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="210" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" @click="detail(row)">详情</el-button>
                  <el-button v-if="row.status === 2" link type="success" @click="confirmOrder(row)">接单</el-button>
                  <el-button v-if="row.status === 2" link type="danger" @click="reject(row)">拒单</el-button>
                  <el-button v-if="row.status === 3" link type="primary" @click="delivery(row)">派送</el-button>
                  <el-button v-if="row.status === 4" link type="success" @click="complete(row)">完成</el-button>
                  <el-button v-if="row.status === 1 || row.status === 2" link type="danger" @click="cancel(row)">取消</el-button>
                </template>
              </el-table-column>
            </el-table>

            <div class="pager">
              <el-pagination background layout="total, sizes, prev, pager, next"
                :total="total" :page-size="q.pageSize" :current-page="q.page"
                :page-sizes="[10,20,50]" @current-change="p => { q.page = p; load(); }"
                @size-change="s => { q.pageSize = s; q.page = 1; load(); }" />
            </div>
          </div>

          <el-dialog v-model="dlg" title="订单详情" width="720px">
            <template v-if="current">
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="订单号">{{ current.number }}</el-descriptions-item>
                <el-descriptions-item label="状态">
                  {{ (statusMap[current.status]||{}).text }}
                </el-descriptions-item>
                <el-descriptions-item label="下单人">{{ current.userName || '-' }}</el-descriptions-item>
                <el-descriptions-item label="手机号">{{ current.phone || '-' }}</el-descriptions-item>
                <el-descriptions-item label="地址" :span="2">{{ current.address || '-' }}</el-descriptions-item>
                <el-descriptions-item label="金额">{{ money(current.amount) }}</el-descriptions-item>
                <el-descriptions-item label="支付状态">{{ current.payStatus === 1 ? '已支付' : '未支付' }}</el-descriptions-item>
                <el-descriptions-item label="下单时间">{{ timeText(current.orderTime) }}</el-descriptions-item>
                <el-descriptions-item label="结账时间">{{ timeText(current.checkoutTime) }}</el-descriptions-item>
                <el-descriptions-item label="备注" :span="2">{{ current.remark || '-' }}</el-descriptions-item>
                <el-descriptions-item v-if="current.cancelReason" label="取消原因" :span="2">
                  {{ current.cancelReason }}
                </el-descriptions-item>
                <el-descriptions-item v-if="current.rejectionReason" label="拒单原因" :span="2">
                  {{ current.rejectionReason }}
                </el-descriptions-item>
              </el-descriptions>

              <el-table :data="current.orderDetailList || []" size="small" border style="margin-top:14px">
                <el-table-column prop="name" label="商品" />
                <el-table-column prop="dishFlavor" label="口味" width="120" />
                <el-table-column prop="number" label="数量" width="80" align="center" />
                <el-table-column label="单价" width="100" align="right">
                  <template #default="{ row }">{{ money(row.amount) }}</template>
                </el-table-column>
              </el-table>
            </template>
          </el-dialog>
        </div>`,
        setup() {
            const q = reactive({ page: 1, pageSize: 10, number: '', phone: '', status: null });
            const rows = ref([]);
            const total = ref(0);
            const loading = ref(false);
            const dlg = ref(false);
            const current = ref(null);

            async function load() {
                loading.value = true;
                try {
                    const data = await api.get('/order/conditionSearch', {
                        page: q.page, pageSize: q.pageSize,
                        number: q.number || undefined,
                        phone: q.phone || undefined,
                        status: q.status === null || q.status === '' ? undefined : q.status
                    });
                    rows.value = (data && data.list) || [];
                    total.value = (data && data.total) || 0;
                } catch (e) {
                    fail(e);
                } finally {
                    loading.value = false;
                }
            }

            function search() { q.page = 1; load(); }
            function reset() { q.number = ''; q.phone = ''; q.status = null; search(); }

            async function detail(row) {
                try {
                    current.value = await api.get('/order/details/' + row.id);
                    dlg.value = true;
                } catch (e) { fail(e); }
            }

            async function confirmOrder(row) {
                try {
                    await api.put('/order/confirm', { id: row.id });
                    ElMessage.success('已接单');
                    load();
                } catch (e) { fail(e); }
            }

            async function delivery(row) {
                try {
                    await api.put('/order/delivery/' + row.id);
                    ElMessage.success('已开始派送');
                    load();
                } catch (e) { fail(e); }
            }

            async function complete(row) {
                try {
                    await api.put('/order/complete/' + row.id);
                    ElMessage.success('订单已完成');
                    load();
                } catch (e) { fail(e); }
            }

            async function reject(row) {
                try {
                    const r = await ElMessageBox.prompt('请输入拒单原因', '拒单', { inputPlaceholder: '如：菜品已售罄' });
                    await api.put('/order/rejection', { id: row.id, rejectionReason: r.value });
                    ElMessage.success('已拒单，已支付订单会自动发起退款');
                    load();
                } catch (e) {
                    if (e !== 'cancel') fail(e);
                }
            }

            async function cancel(row) {
                try {
                    const r = await ElMessageBox.prompt('请输入取消原因', '取消订单', { inputPlaceholder: '如：用户主动取消' });
                    await api.put('/order/cancel', { id: row.id, cancelReason: r.value });
                    ElMessage.success('订单已取消');
                    load();
                } catch (e) {
                    if (e !== 'cancel') fail(e);
                }
            }

            onMounted(load);
            return {
                q, rows, total, loading, dlg, current, statusMap: ORDER_STATUS,
                money, timeText, load, search, reset, detail,
                confirmOrder, delivery, complete, reject, cancel
            };
        }
    };

    /* ==================== 堂食管理 ==================== */

    const DineInView = {
        template: `
        <div>
          <el-tabs v-model="tab" @tab-change="onTab">
            <el-tab-pane label="桌台" name="tables">
              <div class="card">
                <div class="toolbar">
                  <el-select v-model="tableQ.status" placeholder="桌台状态" clearable style="width:150px">
                    <el-option label="空闲" :value="0" />
                    <el-option label="就餐中" :value="1" />
                    <el-option label="待结账" :value="2" />
                  </el-select>
                  <el-input v-model="tableQ.area" placeholder="区域，如大厅" clearable style="width:150px" @keyup.enter="loadTables" />
                  <el-button type="primary" @click="loadTables">查询</el-button>
                  <span class="grow"></span>
                  <el-button type="primary" plain @click="openTableCreate">+ 新增桌台</el-button>
                </div>
                <el-table :data="tables" v-loading="tableLoading" border stripe>
                  <el-table-column prop="name" label="桌台" width="110" />
                  <el-table-column prop="area" label="区域" width="110" />
                  <el-table-column prop="seats" label="座位" width="80" align="center" />
                  <el-table-column label="状态" width="100">
                    <template #default="{ row }">
                      <el-tag :type="tableStatusMap[row.status].type" size="small">{{ tableStatusMap[row.status].text }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="currentSessionNo" label="当前会话" width="150" />
                  <el-table-column label="二维码令牌" min-width="210">
                    <template #default="{ row }"><span class="muted">{{ short(row.qrToken) }}</span></template>
                  </el-table-column>
                  <el-table-column label="操作" width="300" fixed="right">
                    <template #default="{ row }">
                      <el-button v-if="row.status === 0" link type="primary" @click="openTable(row)">开台</el-button>
                      <el-button link type="primary" @click="showQr(row)">二维码</el-button>
                      <el-button link type="primary" @click="editTable(row)">编辑</el-button>
                      <el-button link type="warning" @click="refreshQr(row)">刷新码</el-button>
                      <el-button link type="danger" @click="removeTable(row)">删除</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-tab-pane>

            <el-tab-pane label="会话" name="sessions">
              <div class="card">
                <div class="toolbar">
                  <el-select v-model="sessionQ.status" placeholder="会话状态" clearable style="width:150px">
                    <el-option label="就餐中" :value="1" />
                    <el-option label="待结账" :value="2" />
                    <el-option label="已结账" :value="3" />
                    <el-option label="已取消" :value="4" />
                  </el-select>
                  <el-button type="primary" @click="loadSessions">查询</el-button>
                  <el-button @click="sessionQ.status = null; loadSessions()">重置</el-button>
                  <span class="grow"></span>
                  <span class="muted">共 {{ sessions.length }} 个会话</span>
                </div>
                <el-table :data="sessions" v-loading="sessionLoading" border stripe>
                  <el-table-column prop="sessionNo" label="会话号" width="160" />
                  <el-table-column label="桌台" width="130">
                    <template #default="{ row }">{{ (row.tableNames || []).join('、') || row.tableName || '-' }}</template>
                  </el-table-column>
                  <el-table-column label="状态" width="100">
                    <template #default="{ row }"><el-tag :type="sessionStatusMap[row.status].type" size="small">{{ sessionStatusMap[row.status].text }}</el-tag></template>
                  </el-table-column>
                  <el-table-column prop="guestCount" label="人数" width="70" align="center" />
                  <el-table-column prop="memberCount" label="成员" width="70" align="center" />
                  <el-table-column label="账单" width="100" align="right"><template #default="{ row }">{{ money(row.totalAmount) }}</template></el-table-column>
                  <el-table-column label="已付/未付" width="150" align="right"><template #default="{ row }">{{ money(row.paidAmount) }} / {{ money(row.unpaidAmount) }}</template></el-table-column>
                  <el-table-column label="开台时间" width="165"><template #default="{ row }">{{ timeText(row.openTime) }}</template></el-table-column>
                  <el-table-column label="操作" width="300" fixed="right">
                    <template #default="{ row }">
                      <el-button link type="primary" @click="detail(row)">详情</el-button>
                      <el-button v-if="row.status === 1 || row.status === 2" link type="success" @click="openCheckout(row)">结账</el-button>
                      <el-button v-if="row.status === 1" link type="primary" @click="openTransfer(row)">转台</el-button>
                      <el-button v-if="row.status === 1" link type="warning" @click="merge(row)">并桌</el-button>
                      <el-button v-if="row.status === 1 || row.status === 2" link type="danger" @click="cancelSession(row)">取消</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-tab-pane>

            <el-tab-pane label="预约" name="reservations">
              <div class="card">
                <div class="toolbar">
                  <el-select v-model="resQ.status" placeholder="预约状态" clearable style="width:150px">
                    <el-option label="待确认" :value="1" />
                    <el-option label="已确认" :value="2" />
                    <el-option label="已到店" :value="3" />
                    <el-option label="已取消" :value="4" />
                    <el-option label="已过期" :value="5" />
                  </el-select>
                  <el-date-picker v-model="resQ.date" type="date" value-format="YYYY-MM-DD" placeholder="预约日期" style="width:150px" />
                  <el-button type="primary" @click="loadReservations">查询</el-button>
                  <el-button @click="resQ.status = null; resQ.date = ''; loadReservations()">重置</el-button>
                </div>
                <el-table :data="reservations" v-loading="resLoading" border stripe>
                  <el-table-column label="桌台" width="120"><template #default="{ row }">{{ tableName(row.tableId) }}</template></el-table-column>
                  <el-table-column prop="contactName" label="联系人" width="110" />
                  <el-table-column prop="contactPhone" label="电话" width="140" />
                  <el-table-column label="预约时间" width="170"><template #default="{ row }">{{ timeText(row.reserveTime) }}</template></el-table-column>
                  <el-table-column prop="guestCount" label="人数" width="70" align="center" />
                  <el-table-column label="状态" width="100"><template #default="{ row }"><el-tag :type="resStatusMap[row.status].type" size="small">{{ resStatusMap[row.status].text }}</el-tag></template></el-table-column>
                  <el-table-column prop="remark" label="备注" min-width="140" show-overflow-tooltip />
                  <el-table-column label="操作" width="230" fixed="right">
                    <template #default="{ row }">
                      <el-button v-if="row.status === 1" link type="primary" @click="confirmRes(row)">确认</el-button>
                      <el-button v-if="row.status === 1 || row.status === 2" link type="success" @click="arriveRes(row)">到店</el-button>
                      <el-button v-if="row.status === 1 || row.status === 2" link type="danger" @click="cancelRes(row)">取消</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-tab-pane>

            <el-tab-pane label="报表" name="report">
              <div class="card">
                <div class="toolbar">
                  <el-date-picker v-model="reportQ.begin" type="date" value-format="YYYY-MM-DD" placeholder="开始日期" style="width:150px" />
                  <span class="muted">至</span>
                  <el-date-picker v-model="reportQ.end" type="date" value-format="YYYY-MM-DD" placeholder="结束日期" style="width:150px" />
                  <el-button type="primary" @click="loadReport">查询</el-button>
                </div>
                <div class="stat-grid">
                  <div class="stat"><span>结账会话</span><b>{{ report.sessionCount || 0 }}</b></div>
                  <div class="stat"><span>堂食营收</span><b>{{ money(report.totalRevenue) }}</b></div>
                  <div class="stat"><span>到店人数</span><b>{{ report.totalGuests || 0 }}</b></div>
                  <div class="stat"><span>客单价</span><b>{{ money(report.avgAmount) }}</b></div>
                  <div class="stat"><span>桌均人数</span><b>{{ report.avgGuests || 0 }}</b></div>
                  <div class="stat"><span>周转率</span><b>{{ report.turnoverRate || 0 }} 次/桌</b></div>
                </div>
                <el-table :data="report.daily || []" border stripe>
                  <el-table-column prop="day" label="日期" width="150" />
                  <el-table-column prop="session_count" label="会话数" width="120" />
                  <el-table-column prop="guests" label="人数" width="120" />
                  <el-table-column label="营收" align="right"><template #default="{ row }">{{ money(row.revenue) }}</template></el-table-column>
                </el-table>
              </div>
            </el-tab-pane>
          </el-tabs>

          <el-dialog v-model="tableDlg" :title="tableForm.id ? '编辑桌台' : '新增桌台'" width="460px">
            <el-form :model="tableForm" label-width="90px">
              <el-form-item label="桌台名称"><el-input v-model="tableForm.name" placeholder="如 A01" /></el-form-item>
              <el-form-item label="座位数"><el-input-number v-model="tableForm.seats" :min="1" :max="20" /></el-form-item>
              <el-form-item label="区域"><el-input v-model="tableForm.area" placeholder="如大厅/包间" /></el-form-item>
              <el-form-item label="允许预约"><el-switch v-model="tableForm.reservationEnabled" :active-value="1" :inactive-value="0" /></el-form-item>
            </el-form>
            <template #footer><el-button @click="tableDlg=false">取消</el-button><el-button type="primary" :loading="tableSaving" @click="saveTable">保存</el-button></template>
          </el-dialog>

          <el-dialog v-model="openDlg" title="员工代客开台" width="440px">
            <el-form :model="openForm" label-width="90px">
              <el-form-item label="桌台"><b>{{ openForm.tableName }}</b></el-form-item>
              <el-form-item label="人数"><el-input-number v-model="openForm.guestCount" :min="1" :max="20" /></el-form-item>
              <el-form-item label="备注"><el-input v-model="openForm.remark" type="textarea" :rows="2" /></el-form-item>
            </el-form>
            <template #footer><el-button @click="openDlg=false">取消</el-button><el-button type="primary" :loading="openSaving" @click="submitOpen">开台</el-button></template>
          </el-dialog>

          <el-dialog v-model="qrDlg" title="桌台二维码" width="360px">
            <div class="qr-wrap"><div id="adminQrBox" class="qr-box"></div></div>
            <div class="qr-tip">扫码内容：{{ qrContent }}</div>
            <div class="qr-tip">令牌：{{ short(qrToken, 18) }}</div>
            <template #footer><el-button @click="copyQr">复制扫码内容</el-button><el-button type="primary" @click="qrDlg=false">关闭</el-button></template>
          </el-dialog>

          <el-dialog v-model="sessionDlg" title="堂食会话详情" width="820px">
            <template v-if="session">
              <el-descriptions :column="3" border size="small">
                <el-descriptions-item label="会话号">{{ session.sessionNo }}</el-descriptions-item>
                <el-descriptions-item label="桌台">{{ (session.tableNames || []).join('、') || session.tableName }}</el-descriptions-item>
                <el-descriptions-item label="状态">{{ sessionStatusMap[session.status].text }}</el-descriptions-item>
                <el-descriptions-item label="人数">{{ session.guestCount }}</el-descriptions-item>
                <el-descriptions-item label="成员">{{ session.memberCount }}</el-descriptions-item>
                <el-descriptions-item label="开台">{{ timeText(session.openTime) }}</el-descriptions-item>
                <el-descriptions-item label="总额">{{ money(session.totalAmount) }}</el-descriptions-item>
                <el-descriptions-item label="已付">{{ money(session.paidAmount) }}</el-descriptions-item>
                <el-descriptions-item label="未付">{{ money(session.unpaidAmount) }}</el-descriptions-item>
              </el-descriptions>
              <el-divider content-position="left">成员</el-divider>
              <el-table :data="session.members || []" size="small" border>
                <el-table-column prop="nickname" label="昵称" />
                <el-table-column prop="userId" label="用户ID" width="100" />
                <el-table-column prop="payStatus" label="支付状态" width="110" />
                <el-table-column label="已付金额" width="110" align="right"><template #default="{ row }">{{ money(row.paidAmount) }}</template></el-table-column>
              </el-table>
              <el-divider content-position="left">共享购物车</el-divider>
              <el-table :data="session.cartItems || []" size="small" border>
                <el-table-column prop="name" label="菜品" />
                <el-table-column prop="dishFlavor" label="口味" width="120" />
                <el-table-column prop="number" label="数量" width="80" align="center" />
                <el-table-column label="小计" width="100" align="right"><template #default="{ row }">{{ money((row.amount || 0) * (row.number || 0)) }}</template></el-table-column>
              </el-table>
              <el-divider content-position="left">已提交订单</el-divider>
              <el-table :data="session.orders || []" size="small" border>
                <el-table-column prop="number" label="订单号" width="170" />
                <el-table-column label="状态" width="90"><template #default="{ row }">{{ orderStatusText(row.status) }}</template></el-table-column>
                <el-table-column label="金额" align="right"><template #default="{ row }">{{ money(row.amount) }}</template></el-table-column>
                <el-table-column label="下单时间" width="165"><template #default="{ row }">{{ timeText(row.orderTime) }}</template></el-table-column>
              </el-table>
            </template>
            <template #footer><el-button type="primary" @click="sessionDlg=false">关闭</el-button></template>
          </el-dialog>

          <el-dialog v-model="checkoutDlg" title="整单结账" width="440px">
            <el-form :model="checkoutForm" label-width="100px">
              <el-form-item label="支付方式">
                <el-select v-model="checkoutForm.payMethod" style="width:100%">
                  <el-option label="微信" :value="1" /><el-option label="支付宝" :value="2" /><el-option label="现金" :value="3" />
                </el-select>
              </el-form-item>
              <el-form-item label="结清未付"><el-switch v-model="checkoutForm.settleUnpaid" /></el-form-item>
              <el-form-item label="备注"><el-input v-model="checkoutForm.remark" type="textarea" :rows="2" /></el-form-item>
            </el-form>
            <template #footer><el-button @click="checkoutDlg=false">取消</el-button><el-button type="primary" :loading="checkoutSaving" @click="submitCheckout">确认结账</el-button></template>
          </el-dialog>

          <el-dialog v-model="transferDlg" title="转台" width="440px">
            <el-form :model="transferForm" label-width="90px">
              <el-form-item label="目标桌台">
                <el-select v-model="transferForm.targetTableId" placeholder="选择空闲桌台" style="width:100%">
                  <el-option v-for="t in freeTables" :key="t.id" :label="t.name + ' / ' + (t.area || '')" :value="t.id" />
                </el-select>
              </el-form-item>
              <el-form-item label="备注"><el-input v-model="transferForm.remark" /></el-form-item>
            </el-form>
            <template #footer><el-button @click="transferDlg=false">取消</el-button><el-button type="primary" :loading="transferSaving" @click="submitTransfer">确认转台</el-button></template>
          </el-dialog>
        </div>`,
        setup() {
            const tab = ref('tables');
            const tableQ = reactive({ status: null, area: '' });
            const tables = ref([]);
            const tableLoading = ref(false);
            const tableDlg = ref(false);
            const tableSaving = ref(false);
            const tableForm = reactive({ id: null, name: '', seats: 4, area: '大厅', reservationEnabled: 1 });
            const openDlg = ref(false);
            const openSaving = ref(false);
            const openForm = reactive({ tableId: null, tableName: '', guestCount: 2, remark: '' });
            const qrDlg = ref(false);
            const qrContent = ref('');
            const qrToken = ref('');
            const sessionQ = reactive({ status: null });
            const sessions = ref([]);
            const sessionLoading = ref(false);
            const sessionDlg = ref(false);
            const session = ref(null);
            const checkoutDlg = ref(false);
            const checkoutSaving = ref(false);
            const checkoutForm = reactive({ sessionId: null, payMethod: 1, settleUnpaid: false, remark: '' });
            const transferDlg = ref(false);
            const transferSaving = ref(false);
            const transferForm = reactive({ sessionId: null, targetTableId: null, remark: '' });
            const resQ = reactive({ status: null, date: todayStr() });
            const reservations = ref([]);
            const resLoading = ref(false);
            const reportQ = reactive({ begin: daysAgoStr(6), end: todayStr() });
            const report = ref({});

            const tableStatusMap = { 0: { text: '空闲', type: 'success' }, 1: { text: '就餐中', type: 'warning' }, 2: { text: '待结账', type: 'danger' } };
            const sessionStatusMap = { 1: { text: '就餐中', type: 'warning' }, 2: { text: '待结账', type: 'danger' }, 3: { text: '已结账', type: 'success' }, 4: { text: '已取消', type: 'info' } };
            const resStatusMap = { 1: { text: '待确认', type: 'warning' }, 2: { text: '已确认', type: 'primary' }, 3: { text: '已到店', type: 'success' }, 4: { text: '已取消', type: 'info' }, 5: { text: '已过期', type: 'info' } };
            const freeTables = computed(() => (tables.value || []).filter(t => t.status === 0));

            function short(v, n) { v = String(v || ''); return v.length > (n || 12) ? v.slice(0, n || 12) + '…' : v; }
            function tableName(id) { const t = (tables.value || []).find(x => x.id === id); return t ? t.name : ('#' + id); }

            async function loadTables() {
                tableLoading.value = true;
                try { tables.value = await api.get('/dining/table/list', { status: tableQ.status === null || tableQ.status === '' ? undefined : tableQ.status, area: tableQ.area || undefined }) || []; }
                catch (e) { fail(e); } finally { tableLoading.value = false; }
            }

            function openTableCreate() { Object.assign(tableForm, { id: null, name: '', seats: 4, area: '大厅', reservationEnabled: 1 }); tableDlg.value = true; }
            function editTable(row) { Object.assign(tableForm, { id: row.id, name: row.name, seats: row.seats, area: row.area, reservationEnabled: row.reservationEnabled }); tableDlg.value = true; }
            async function saveTable() {
                if (!tableForm.name) { ElMessage.warning('请填写桌台名称'); return; }
                tableSaving.value = true;
                try {
                    const body = { name: tableForm.name, seats: tableForm.seats, area: tableForm.area, reservationEnabled: tableForm.reservationEnabled };
                    if (tableForm.id) await api.put('/dining/table/' + tableForm.id, body); else await api.post('/dining/table', body);
                    ElMessage.success('保存成功'); tableDlg.value = false; loadTables();
                } catch (e) { fail(e); } finally { tableSaving.value = false; }
            }
            async function removeTable(row) {
                try { await ElMessageBox.confirm('确定删除桌台「' + row.name + '」吗？仅空闲且无历史记录可删。', '提示', { type: 'warning' }); await api.del('/dining/table/' + row.id); ElMessage.success('已删除'); loadTables(); }
                catch (e) { if (e !== 'cancel' && e !== 'close') fail(e); }
            }
            async function refreshQr(row) {
                try { const r = await api.post('/dining/table/' + row.id + '/refresh-qr'); ElMessage.success('二维码已刷新'); await loadTables(); showQr(r); }
                catch (e) { fail(e); }
            }
            function showQr(row) {
                qrContent.value = row.qrContent || ''; qrToken.value = row.qrToken || ''; qrDlg.value = true;
                setTimeout(() => {
                    const box = document.getElementById('adminQrBox');
                    if (!box) return;
                    box.innerHTML = '';
                    if (typeof QRCode === 'undefined') { box.innerHTML = '<div class="qr-tip">二维码库未加载，可直接复制扫码内容</div>'; return; }
                    new QRCode(box, { text: qrContent.value, width: 200, height: 200, correctLevel: QRCode.CorrectLevel.H });
                }, 60);
            }
            async function copyQr() {
                try { await navigator.clipboard.writeText(qrContent.value); ElMessage.success('已复制'); } catch (e) { ElMessage.warning('复制失败，请手动选择文本'); }
            }
            function openTable(row) { Object.assign(openForm, { tableId: row.id, tableName: row.name, guestCount: 2, remark: '' }); openDlg.value = true; }
            async function submitOpen() {
                openSaving.value = true;
                try { await api.post('/dining/session/open', { tableId: openForm.tableId, guestCount: openForm.guestCount, remark: openForm.remark }); ElMessage.success('开台成功'); openDlg.value = false; await loadTables(); await loadSessions(); }
                catch (e) { fail(e); } finally { openSaving.value = false; }
            }

            async function loadSessions() {
                sessionLoading.value = true;
                try { sessions.value = await api.get('/dining/session/list', { status: sessionQ.status === null || sessionQ.status === '' ? undefined : sessionQ.status }) || []; }
                catch (e) { fail(e); } finally { sessionLoading.value = false; }
            }
            async function detail(row) {
                try { session.value = await api.get('/dining/session/' + row.id); sessionDlg.value = true; }
                catch (e) { fail(e); }
            }
            function openCheckout(row) { Object.assign(checkoutForm, { sessionId: row.id, payMethod: 1, settleUnpaid: false, remark: '' }); checkoutDlg.value = true; }
            async function submitCheckout() {
                checkoutSaving.value = true;
                try { await api.post('/dining/session/checkout', { sessionId: checkoutForm.sessionId, payMethod: checkoutForm.payMethod, settleUnpaid: checkoutForm.settleUnpaid, remark: checkoutForm.remark }); ElMessage.success('结账完成'); checkoutDlg.value = false; await loadSessions(); await loadTables(); }
                catch (e) { fail(e); } finally { checkoutSaving.value = false; }
            }
            async function cancelSession(row) {
                try { const r = await ElMessageBox.prompt('请输入取消原因（会取消未完成订单并回补库存）', '取消会话', { inputPlaceholder: '如：客人离店' }); await api.post('/dining/session/' + row.id + '/cancel', null, { reason: r.value }); ElMessage.success('已取消'); await loadSessions(); await loadTables(); }
                catch (e) { if (e !== 'cancel' && e !== 'close') fail(e); }
            }
            function openTransfer(row) { Object.assign(transferForm, { sessionId: row.id, targetTableId: null, remark: '' }); transferDlg.value = true; }
            async function submitTransfer() {
                if (!transferForm.targetTableId) { ElMessage.warning('请选择目标桌台'); return; }
                transferSaving.value = true;
                try { await api.post('/dining/session/' + transferForm.sessionId + '/transfer', { targetTableId: transferForm.targetTableId, remark: transferForm.remark }); ElMessage.success('转台成功'); transferDlg.value = false; await loadSessions(); await loadTables(); }
                catch (e) { fail(e); } finally { transferSaving.value = false; }
            }
            async function merge(row) {
                try {
                    const r = await ElMessageBox.prompt('输入要并入当前会话的源会话 ID，多个用逗号分隔', '并桌', { inputPlaceholder: '如 101,102' });
                    const ids = String(r.value || '').split(',').map(x => Number(x.trim())).filter(x => x > 0 && x !== row.id);
                    if (!ids.length) { ElMessage.warning('请输入有效的源会话 ID'); return; }
                    await api.post('/dining/session/' + row.id + '/merge', { sourceSessionIds: ids, remark: '后台并桌' });
                    ElMessage.success('并桌成功'); await loadSessions(); await loadTables();
                } catch (e) { if (e !== 'cancel' && e !== 'close') fail(e); }
            }

            async function loadReservations() {
                resLoading.value = true;
                try {
                    reservations.value = await api.get('/dining/reservation/list', { status: resQ.status === null || resQ.status === '' ? undefined : resQ.status, date: resQ.date || undefined }) || [];
                    if (!tables.value.length) await loadTables();
                } catch (e) { fail(e); } finally { resLoading.value = false; }
            }
            async function confirmRes(row) { try { await api.post('/dining/reservation/' + row.id + '/confirm'); ElMessage.success('已确认'); loadReservations(); } catch (e) { fail(e); } }
            async function cancelRes(row) { try { await ElMessageBox.confirm('确定取消该预约吗？', '提示', { type: 'warning' }); await api.post('/dining/reservation/' + row.id + '/cancel'); ElMessage.success('已取消'); loadReservations(); } catch (e) { if (e !== 'cancel' && e !== 'close') fail(e); } }
            async function arriveRes(row) { try { await api.post('/dining/reservation/' + row.id + '/arrive'); ElMessage.success('已标记到店'); loadReservations(); } catch (e) { fail(e); } }
            async function loadReport() {
                try { report.value = await api.get('/dining/report', { begin: reportQ.begin ? reportQ.begin + ' 00:00:00' : undefined, end: reportQ.end ? reportQ.end + ' 23:59:59' : undefined }) || {}; }
                catch (e) { fail(e); }
            }
            function orderStatusText(status) { return ({ 1: '待付款', 2: '待接单', 3: '已接单', 4: '派送中', 5: '已完成', 6: '已取消' }[status]) || status; }
            function onTab(name) { if (name === 'tables') loadTables(); if (name === 'sessions') loadSessions(); if (name === 'reservations') loadReservations(); if (name === 'report') loadReport(); }

            onMounted(() => { loadTables(); loadSessions(); });
            return { tab, tableQ, tables, tableLoading, tableDlg, tableSaving, tableForm, openDlg, openSaving, openForm, qrDlg, qrContent, qrToken, sessionQ, sessions, sessionLoading, sessionDlg, session, checkoutDlg, checkoutSaving, checkoutForm, transferDlg, transferSaving, transferForm, resQ, reservations, resLoading, reportQ, report, tableStatusMap, sessionStatusMap, resStatusMap, freeTables, short, tableName, loadTables, openTableCreate, editTable, saveTable, removeTable, refreshQr, showQr, copyQr, openTable, submitOpen, loadSessions, detail, openCheckout, submitCheckout, cancelSession, openTransfer, submitTransfer, merge, loadReservations, confirmRes, cancelRes, arriveRes, loadReport, orderStatusText, onTab, money, timeText };
        }
    };

    /* ==================== 分类管理 ==================== *//* ==================== 分类管理 ==================== */

    const CategoryView = {
        template: `
        <div>
          <div class="card">
            <div class="toolbar">
              <el-radio-group v-model="q.type" @change="search">
                <el-radio-button :value="1">菜品分类</el-radio-button>
                <el-radio-button :value="2">套餐分类</el-radio-button>
              </el-radio-group>
              <el-input v-model="q.name" placeholder="分类名称" clearable style="width:160px" @keyup.enter="search" />
              <el-button type="primary" @click="search">查询</el-button>
              <span class="grow"></span>
              <el-button type="primary" plain @click="openCreate">+ 新增分类</el-button>
            </div>

            <el-table :data="rows" v-loading="loading" border stripe>
              <el-table-column prop="name" label="分类名称" min-width="160" />
              <el-table-column prop="sort" label="排序" width="90" align="center" />
              <el-table-column label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
                    {{ row.status === 1 ? '启用' : '禁用' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="更新时间" width="170">
                <template #default="{ row }">{{ timeText(row.updateTime) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="220" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
                  <el-button link :type="row.status === 1 ? 'warning' : 'success'" @click="toggle(row)">
                    {{ row.status === 1 ? '禁用' : '启用' }}
                  </el-button>
                  <el-button link type="danger" @click="remove(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>

            <div class="pager">
              <el-pagination background layout="total, prev, pager, next"
                :total="total" :page-size="q.pageSize" :current-page="q.page"
                @current-change="p => { q.page = p; load(); }" />
            </div>
          </div>

          <el-dialog v-model="dlg" :title="form.id ? '编辑分类' : '新增分类'" width="420px">
            <el-form :model="form" label-width="80px">
              <el-form-item label="名称"><el-input v-model="form.name" placeholder="分类名称" /></el-form-item>
              <el-form-item label="排序"><el-input-number v-model="form.sort" :min="0" :max="999" /></el-form-item>
              <el-form-item label="状态">
                <el-radio-group v-model="form.status">
                  <el-radio :value="1">启用</el-radio>
                  <el-radio :value="0">禁用</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-form>
            <template #footer>
              <el-button @click="dlg = false">取消</el-button>
              <el-button type="primary" :loading="saving" @click="save">保存</el-button>
            </template>
          </el-dialog>
        </div>`,
        setup() {
            const q = reactive({ page: 1, pageSize: 10, name: '', type: 1 });
            const rows = ref([]);
            const total = ref(0);
            const loading = ref(false);
            const dlg = ref(false);
            const saving = ref(false);
            const form = reactive({ id: null, name: '', sort: 0, status: 1 });

            async function load() {
                loading.value = true;
                try {
                    const data = await api.get('/category/page', {
                        page: q.page, pageSize: q.pageSize, name: q.name || undefined, type: q.type
                    });
                    rows.value = (data && data.list) || [];
                    total.value = (data && data.total) || 0;
                } catch (e) {
                    fail(e);
                } finally {
                    loading.value = false;
                }
            }

            function search() { q.page = 1; load(); }

            function openCreate() {
                Object.assign(form, { id: null, name: '', sort: 0, status: 1 });
                dlg.value = true;
            }

            function openEdit(row) {
                Object.assign(form, { id: row.id, name: row.name, sort: row.sort, status: row.status });
                dlg.value = true;
            }

            async function save() {
                if (!form.name) { ElMessage.warning('请填写分类名称'); return; }
                saving.value = true;
                try {
                    const body = { id: form.id, name: form.name, sort: form.sort, status: form.status, type: q.type };
                    if (form.id) await api.put('/category', body);
                    else await api.post('/category', body);
                    ElMessage.success('保存成功');
                    dlg.value = false;
                    load();
                } catch (e) {
                    fail(e);
                } finally {
                    saving.value = false;
                }
            }

            async function toggle(row) {
                try {
                    await api.post('/category/status/' + (row.status === 1 ? 0 : 1), null, { id: row.id });
                    ElMessage.success('状态已更新');
                    load();
                } catch (e) { fail(e); }
            }

            async function remove(row) {
                try {
                    await ElMessageBox.confirm('确定删除分类「' + row.name + '」吗？', '提示', { type: 'warning' });
                    await api.del('/category', { id: row.id });
                    ElMessage.success('已删除');
                    load();
                } catch (e) {
                    if (e !== 'cancel') fail(e);
                }
            }

            onMounted(load);
            return { q, rows, total, loading, dlg, saving, form, timeText, load, search, openCreate, openEdit, save, toggle, remove };
        }
    };

    /* ==================== 菜品管理 ==================== */

    const DishView = {
        template: `
        <div>
          <div class="card">
            <div class="toolbar">
              <el-input v-model="q.name" placeholder="菜品名称" clearable style="width:160px" @keyup.enter="search" />
              <el-select v-model="q.categoryId" placeholder="分类" clearable style="width:160px">
                <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
              </el-select>
              <el-select v-model="q.status" placeholder="状态" clearable style="width:120px">
                <el-option label="起售" :value="1" />
                <el-option label="停售" :value="0" />
              </el-select>
              <el-button type="primary" @click="search">查询</el-button>
              <el-button @click="reset">重置</el-button>
              <span class="grow"></span>
              <el-button type="primary" plain @click="openCreate">+ 新增菜品</el-button>
            </div>

            <el-table :data="rows" v-loading="loading" border stripe>
              <el-table-column label="图片" width="70">
                <template #default="{ row }">
                  <img v-if="row.image" class="thumb" :src="row.image" />
                  <div v-else class="thumb"></div>
                </template>
              </el-table-column>
              <el-table-column prop="name" label="菜品名称" min-width="150" />
              <el-table-column prop="categoryName" label="分类" width="120" />
              <el-table-column label="价格" width="100" align="right">
                <template #default="{ row }">{{ money(row.price) }}</template>
              </el-table-column>
              <el-table-column label="库存" width="90" align="center">
                <template #default="{ row }"><el-tag :type="row.stock > 0 ? 'success' : 'danger'" size="small">{{ row.stock === null || row.stock === undefined ? '-' : row.stock }}</el-tag></template>
              </el-table-column>
              <el-table-column label="状态" width="90">
                <template #default="{ row }">
                  <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
                    {{ row.status === 1 ? '起售' : '停售' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="口味" min-width="140">
                <template #default="{ row }">
                  <span class="muted">{{ (row.flavors || []).map(f => f.name).join('、') || '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="更新时间" width="165">
                <template #default="{ row }">{{ timeText(row.updateTime) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="180" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
                  <el-button link :type="row.status === 1 ? 'warning' : 'success'" @click="toggle(row)">
                    {{ row.status === 1 ? '停售' : '起售' }}
                  </el-button>
                  <el-button link type="danger" @click="remove(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>

            <div class="pager">
              <el-pagination background layout="total, sizes, prev, pager, next"
                :total="total" :page-size="q.pageSize" :current-page="q.page"
                :page-sizes="[10,20,50]" @current-change="p => { q.page = p; load(); }"
                @size-change="s => { q.pageSize = s; q.page = 1; load(); }" />
            </div>
          </div>

          <el-dialog v-model="dlg" :title="form.id ? '编辑菜品' : '新增菜品'" width="560px">
            <el-form :model="form" label-width="90px">
              <el-form-item label="名称"><el-input v-model="form.name" /></el-form-item>
              <el-form-item label="分类">
                <el-select v-model="form.categoryId" placeholder="请选择" style="width:100%">
                  <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
                </el-select>
              </el-form-item>
              <el-form-item label="价格">
                <el-input-number v-model="form.price" :min="0" :precision="2" :step="1" />
              </el-form-item>
              <el-form-item label="库存">
                <el-input-number v-model="form.stock" :min="0" :step="1" />
              </el-form-item>
              <el-form-item label="图片地址"><el-input v-model="form.image" placeholder="http://... 或上传后的 OSS 地址" /></el-form-item>
              <el-form-item label="描述">
                <el-input v-model="form.description" type="textarea" :rows="3" />
              </el-form-item>
              <el-form-item label="状态">
                <el-radio-group v-model="form.status">
                  <el-radio :value="1">起售</el-radio>
                  <el-radio :value="0">停售</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-form>
            <template #footer>
              <el-button @click="dlg = false">取消</el-button>
              <el-button type="primary" :loading="saving" @click="save">保存</el-button>
            </template>
          </el-dialog>
        </div>`,
        setup() {
            const q = reactive({ page: 1, pageSize: 10, name: '', categoryId: null, status: null });
            const rows = ref([]);
            const total = ref(0);
            const loading = ref(false);
            const categories = ref([]);
            const dlg = ref(false);
            const saving = ref(false);
            const form = reactive({ id: null, name: '', categoryId: null, price: 0, stock: 100, image: '', description: '', status: 1, flavors: [] });

            async function loadCategories() {
                try {
                    categories.value = await api.get('/category/list', { type: 1 }) || [];
                } catch (e) { /* 分类列表失败不阻塞列表 */ }
            }

            async function load() {
                loading.value = true;
                try {
                    const data = await api.get('/dish/page', {
                        page: q.page, pageSize: q.pageSize,
                        name: q.name || undefined,
                        categoryId: q.categoryId || undefined,
                        status: q.status === null || q.status === '' ? undefined : q.status
                    });
                    rows.value = (data && data.list) || [];
                    total.value = (data && data.total) || 0;
                } catch (e) {
                    fail(e);
                } finally {
                    loading.value = false;
                }
            }

            function search() { q.page = 1; load(); }
            function reset() { q.name = ''; q.categoryId = null; q.status = null; search(); }

            function openCreate() {
                Object.assign(form, { id: null, name: '', categoryId: null, price: 0, stock: 100, image: '', description: '', status: 1, flavors: [] });
                dlg.value = true;
            }

            function openEdit(row) {
                Object.assign(form, {
                    id: row.id, name: row.name, categoryId: row.categoryId, price: Number(row.price),
                    stock: row.stock === null || row.stock === undefined ? 100 : row.stock,
                    image: row.image, description: row.description, status: row.status, flavors: row.flavors || []
                });
                dlg.value = true;
            }

            async function save() {
                if (!form.name) { ElMessage.warning('请填写菜品名称'); return; }
                if (!form.categoryId) { ElMessage.warning('请选择分类'); return; }
                saving.value = true;
                try {
                    const body = {
                        id: form.id, name: form.name, categoryId: form.categoryId,
                        price: form.price, stock: form.stock, image: form.image, description: form.description, status: form.status,
                        flavors: form.flavors || []
                    };
                    if (form.id) await api.put('/dish', body);
                    else await api.post('/dish', body);
                    ElMessage.success('保存成功');
                    dlg.value = false;
                    load();
                } catch (e) {
                    fail(e);
                } finally {
                    saving.value = false;
                }
            }

            async function toggle(row) {
                try {
                    await api.post('/dish/status/' + (row.status === 1 ? 0 : 1), null, { id: row.id });
                    ElMessage.success('状态已更新');
                    load();
                } catch (e) { fail(e); }
            }

            async function remove(row) {
                try {
                    await ElMessageBox.confirm('确定删除菜品「' + row.name + '」吗？', '提示', { type: 'warning' });
                    await api.del('/dish', { ids: row.id });
                    ElMessage.success('已删除');
                    load();
                } catch (e) {
                    if (e !== 'cancel') fail(e);
                }
            }

            onMounted(() => { loadCategories(); load(); });
            return { q, rows, total, loading, categories, dlg, saving, form, money, timeText, load, search, reset, openCreate, openEdit, save, toggle, remove };
        }
    };

    /* ==================== 套餐管理 ==================== */

    const SetmealView = {
        template: `
        <div>
          <div class="card">
            <div class="toolbar">
              <el-input v-model="q.name" placeholder="套餐名称" clearable style="width:160px" @keyup.enter="search" />
              <el-select v-model="q.categoryId" placeholder="分类" clearable style="width:160px">
                <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
              </el-select>
              <el-select v-model="q.status" placeholder="状态" clearable style="width:120px">
                <el-option label="起售" :value="1" />
                <el-option label="停售" :value="0" />
              </el-select>
              <el-button type="primary" @click="search">查询</el-button>
              <el-button @click="reset">重置</el-button>
              <span class="grow"></span>
              <el-button type="primary" plain @click="openCreate">+ 新增套餐</el-button>
            </div>

            <el-table :data="rows" v-loading="loading" border stripe>
              <el-table-column label="图片" width="70">
                <template #default="{ row }">
                  <img v-if="row.image" class="thumb" :src="row.image" />
                  <div v-else class="thumb"></div>
                </template>
              </el-table-column>
              <el-table-column prop="name" label="套餐名称" min-width="150" />
              <el-table-column prop="categoryName" label="分类" width="120" />
              <el-table-column label="价格" width="100" align="right">
                <template #default="{ row }">{{ money(row.price) }}</template>
              </el-table-column>
              <el-table-column label="状态" width="90">
                <template #default="{ row }">
                  <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
                    {{ row.status === 1 ? '起售' : '停售' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="包含菜品" min-width="160">
                <template #default="{ row }">
                  <span class="muted">{{ (row.setmealDishes || []).map(d => d.name).join('、') || '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="180" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
                  <el-button link :type="row.status === 1 ? 'warning' : 'success'" @click="toggle(row)">
                    {{ row.status === 1 ? '停售' : '起售' }}
                  </el-button>
                  <el-button link type="danger" @click="remove(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>

            <div class="pager">
              <el-pagination background layout="total, sizes, prev, pager, next"
                :total="total" :page-size="q.pageSize" :current-page="q.page"
                :page-sizes="[10,20,50]" @current-change="p => { q.page = p; load(); }"
                @size-change="s => { q.pageSize = s; q.page = 1; load(); }" />
            </div>
          </div>

          <el-dialog v-model="dlg" :title="form.id ? '编辑套餐' : '新增套餐'" width="520px">
            <el-form :model="form" label-width="90px">
              <el-form-item label="名称"><el-input v-model="form.name" /></el-form-item>
              <el-form-item label="分类">
                <el-select v-model="form.categoryId" placeholder="请选择" style="width:100%">
                  <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
                </el-select>
              </el-form-item>
              <el-form-item label="价格">
                <el-input-number v-model="form.price" :min="0" :precision="2" :step="1" />
              </el-form-item>
              <el-form-item label="图片地址"><el-input v-model="form.image" /></el-form-item>
              <el-form-item label="描述">
                <el-input v-model="form.description" type="textarea" :rows="3" />
              </el-form-item>
              <el-form-item label="状态">
                <el-radio-group v-model="form.status">
                  <el-radio :value="1">起售</el-radio>
                  <el-radio :value="0">停售</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-form>
            <template #footer>
              <el-button @click="dlg = false">取消</el-button>
              <el-button type="primary" :loading="saving" @click="save">保存</el-button>
            </template>
          </el-dialog>
        </div>`,
        setup() {
            const q = reactive({ page: 1, pageSize: 10, name: '', categoryId: null, status: null });
            const rows = ref([]);
            const total = ref(0);
            const loading = ref(false);
            const categories = ref([]);
            const dlg = ref(false);
            const saving = ref(false);
            const form = reactive({ id: null, name: '', categoryId: null, price: 0, image: '', description: '', status: 1 });

            async function loadCategories() {
                try { categories.value = await api.get('/category/list', { type: 2 }) || []; } catch (e) { }
            }

            async function load() {
                loading.value = true;
                try {
                    const data = await api.get('/setmeal/page', {
                        page: q.page, pageSize: q.pageSize,
                        name: q.name || undefined,
                        categoryId: q.categoryId || undefined,
                        status: q.status === null || q.status === '' ? undefined : q.status
                    });
                    rows.value = (data && data.list) || [];
                    total.value = (data && data.total) || 0;
                } catch (e) {
                    fail(e);
                } finally {
                    loading.value = false;
                }
            }

            function search() { q.page = 1; load(); }
            function reset() { q.name = ''; q.categoryId = null; q.status = null; search(); }

            function openCreate() {
                Object.assign(form, { id: null, name: '', categoryId: null, price: 0, image: '', description: '', status: 1 });
                dlg.value = true;
            }

            function openEdit(row) {
                Object.assign(form, {
                    id: row.id, name: row.name, categoryId: row.categoryId, price: Number(row.price),
                    image: row.image, description: row.description, status: row.status
                });
                dlg.value = true;
            }

            async function save() {
                if (!form.name) { ElMessage.warning('请填写套餐名称'); return; }
                if (!form.categoryId) { ElMessage.warning('请选择分类'); return; }
                saving.value = true;
                try {
                    const body = {
                        id: form.id, name: form.name, categoryId: form.categoryId,
                        price: form.price, image: form.image, description: form.description, status: form.status,
                        setmealDishes: []
                    };
                    if (form.id) await api.put('/setmeal', body);
                    else await api.post('/setmeal', body);
                    ElMessage.success('保存成功');
                    dlg.value = false;
                    load();
                } catch (e) {
                    fail(e);
                } finally {
                    saving.value = false;
                }
            }

            async function toggle(row) {
                try {
                    await api.post('/setmeal/status/' + (row.status === 1 ? 0 : 1), null, { id: row.id });
                    ElMessage.success('状态已更新');
                    load();
                } catch (e) { fail(e); }
            }

            async function remove(row) {
                try {
                    await ElMessageBox.confirm('确定删除套餐「' + row.name + '」吗？', '提示', { type: 'warning' });
                    await api.del('/setmeal', { ids: row.id });
                    ElMessage.success('已删除');
                    load();
                } catch (e) {
                    if (e !== 'cancel') fail(e);
                }
            }

            onMounted(() => { loadCategories(); load(); });
            return { q, rows, total, loading, categories, dlg, saving, form, money, load, search, reset, openCreate, openEdit, save, toggle, remove };
        }
    };

    /* ==================== 员工管理 ==================== */

    const EmployeeView = {
        template: `
        <div>
          <div class="card">
            <div class="toolbar">
              <el-input v-model="q.name" placeholder="员工姓名" clearable style="width:160px" @keyup.enter="search" />
              <el-button type="primary" @click="search">查询</el-button>
              <el-button @click="reset">重置</el-button>
              <span class="grow"></span>
              <el-button type="primary" plain @click="openCreate">+ 新增员工</el-button>
            </div>

            <el-table :data="rows" v-loading="loading" border stripe>
              <el-table-column prop="name" label="姓名" width="120" />
              <el-table-column prop="username" label="账号" width="140" />
              <el-table-column prop="phone" label="手机号" width="140" />
              <el-table-column label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
                    {{ row.status === 1 ? '启用' : '禁用' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="更新时间" min-width="170">
                <template #default="{ row }">{{ timeText(row.updateTime) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="150" fixed="right">
                <template #default="{ row }">
                  <el-button link :type="row.status === 1 ? 'warning' : 'success'" @click="toggle(row)">
                    {{ row.status === 1 ? '禁用' : '启用' }}
                  </el-button>
                </template>
              </el-table-column>
            </el-table>

            <div class="pager">
              <el-pagination background layout="total, prev, pager, next"
                :total="total" :page-size="q.pageSize" :current-page="q.page"
                @current-change="p => { q.page = p; load(); }" />
            </div>
          </div>

          <el-dialog v-model="dlg" title="新增员工" width="460px">
            <el-form :model="form" label-width="80px">
              <el-form-item label="姓名"><el-input v-model="form.name" /></el-form-item>
              <el-form-item label="账号"><el-input v-model="form.username" /></el-form-item>
              <el-form-item label="手机号"><el-input v-model="form.phone" /></el-form-item>
              <el-form-item label="性别">
                <el-radio-group v-model="form.sex">
                  <el-radio value="1">男</el-radio>
                  <el-radio value="0">女</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="身份证"><el-input v-model="form.idNumber" /></el-form-item>
            </el-form>
            <template #footer>
              <el-button @click="dlg = false">取消</el-button>
              <el-button type="primary" :loading="saving" @click="save">保存</el-button>
            </template>
          </el-dialog>
        </div>`,
        setup() {
            const q = reactive({ page: 1, pageSize: 10, name: '' });
            const rows = ref([]);
            const total = ref(0);
            const loading = ref(false);
            const dlg = ref(false);
            const saving = ref(false);
            const form = reactive({ name: '', username: '', phone: '', sex: '1', idNumber: '' });

            async function load() {
                loading.value = true;
                try {
                    const data = await api.get('/employee/page', { page: q.page, pageSize: q.pageSize, name: q.name || undefined });
                    rows.value = (data && data.list) || [];
                    total.value = (data && data.total) || 0;
                } catch (e) {
                    fail(e);
                } finally {
                    loading.value = false;
                }
            }

            function search() { q.page = 1; load(); }
            function reset() { q.name = ''; search(); }

            function openCreate() {
                Object.assign(form, { name: '', username: '', phone: '', sex: '1', idNumber: '' });
                dlg.value = true;
            }

            async function save() {
                if (!form.name || !form.username) { ElMessage.warning('姓名和账号必填'); return; }
                saving.value = true;
                try {
                    await api.post('/employee', { ...form });
                    ElMessage.success('新增成功，初始密码由后端默认生成');
                    dlg.value = false;
                    load();
                } catch (e) {
                    fail(e);
                } finally {
                    saving.value = false;
                }
            }

            async function toggle(row) {
                try {
                    await api.post('/employee/status/' + (row.status === 1 ? 0 : 1), null, { id: row.id });
                    ElMessage.success('状态已更新');
                    load();
                } catch (e) { fail(e); }
            }

            onMounted(load);
            return { q, rows, total, loading, dlg, saving, form, timeText, load, search, reset, openCreate, save, toggle };
        }
    };

    /* ==================== 数据报表 ==================== */

    const ReportView = {
        template: `
        <div>
          <div class="card">
            <div class="toolbar">
              <el-date-picker v-model="range" type="daterange" value-format="YYYY-MM-DD"
                start-placeholder="开始日期" end-placeholder="结束日期" style="width:260px" />
              <el-button type="primary" @click="load">查询</el-button>
              <el-button type="success" plain @click="exportExcel">导出 Excel</el-button>
              <span class="grow"></span>
              <span class="muted">统计区间：{{ range[0] }} ~ {{ range[1] }}</span>
            </div>

            <el-tabs v-model="tab" @tab-change="load">
              <el-tab-pane label="营业额" name="turnover" />
              <el-tab-pane label="订单" name="orders" />
              <el-tab-pane label="用户" name="users" />
              <el-tab-pane label="销量 Top10" name="top10" />
            </el-tabs>

            <!-- 营业额 -->
            <template v-if="tab === 'turnover'">
              <el-table :data="turnoverRows" border stripe size="small">
                <el-table-column prop="date" label="日期" width="140" />
                <el-table-column label="营业额" align="right">
                  <template #default="{ row }">{{ money(row.value) }}</template>
                </el-table-column>
              </el-table>
            </template>

            <!-- 订单 -->
            <template v-if="tab === 'orders'">
              <div class="stat-grid" style="margin-bottom:12px">
                <div class="stat" style="box-shadow:none">
                  <div class="label">订单总数</div>
                  <div class="value" style="font-size:20px">{{ orderTotal.totalOrderCount || 0 }}</div>
                </div>
                <div class="stat" style="box-shadow:none">
                  <div class="label">有效订单</div>
                  <div class="value" style="font-size:20px">{{ orderTotal.validOrderCount || 0 }}</div>
                </div>
                <div class="stat" style="box-shadow:none">
                  <div class="label">完成率</div>
                  <div class="value" style="font-size:20px">{{ pct(orderTotal.orderCompletionRate) }}</div>
                </div>
              </div>
              <el-table :data="orderRows" border stripe size="small">
                <el-table-column prop="date" label="日期" width="140" />
                <el-table-column prop="total" label="订单总数" align="right" />
                <el-table-column prop="valid" label="有效订单" align="right" />
              </el-table>
            </template>

            <!-- 用户 -->
            <template v-if="tab === 'users'">
              <el-table :data="userRows" border stripe size="small">
                <el-table-column prop="date" label="日期" width="140" />
                <el-table-column prop="total" label="累计用户" align="right" />
                <el-table-column prop="newUser" label="新增用户" align="right" />
              </el-table>
            </template>

            <!-- Top10 -->
            <template v-if="tab === 'top10'">
              <el-table :data="top10Rows" border stripe size="small">
                <el-table-column prop="index" label="排名" width="80" align="center" />
                <el-table-column prop="name" label="商品名称" />
                <el-table-column prop="number" label="销量" align="right" />
              </el-table>
              <div v-if="!top10Rows.length" class="empty-block">该区间暂无销量数据</div>
            </template>
          </div>
        </div>`,
        setup() {
            const range = ref([daysAgoStr(6), todayStr()]);
            const tab = ref('turnover');
            const turnoverRows = ref([]);
            const orderRows = ref([]);
            const orderTotal = ref({});
            const userRows = ref([]);
            const top10Rows = ref([]);

            function params() {
                return { begin: range.value[0], end: range.value[1] };
            }

            async function load() {
                try {
                    if (tab.value === 'turnover') {
                        const d = await api.get('/report/turnoverStatistics', params());
                        const dates = csv(d && d.dateList);
                        const vals = csv(d && d.turnoverList);
                        turnoverRows.value = dates.map((dt, i) => ({ date: dt, value: vals[i] }));
                    } else if (tab.value === 'orders') {
                        const d = await api.get('/report/ordersStatistics', params());
                        const dates = csv(d && d.dateList);
                        const totals = csv(d && d.orderCountList);
                        const valids = csv(d && d.validOrderCountList);
                        orderRows.value = dates.map((dt, i) => ({ date: dt, total: totals[i], valid: valids[i] }));
                        orderTotal.value = d || {};
                    } else if (tab.value === 'users') {
                        const d = await api.get('/report/userStatistics', params());
                        const dates = csv(d && d.dateList);
                        const totals = csv(d && d.totalUserList);
                        const news = csv(d && d.newUserList);
                        userRows.value = dates.map((dt, i) => ({ date: dt, total: totals[i], newUser: news[i] }));
                    } else {
                        const d = await api.get('/report/top10', params());
                        const names = csv(d && d.nameList);
                        const nums = csv(d && d.numberList);
                        top10Rows.value = names.map((n, i) => ({ index: i + 1, name: n, number: nums[i] }));
                    }
                } catch (e) {
                    fail(e);
                }
            }

            async function exportExcel() {
                try {
                    await api.download('/report/export', null, '运营数据报表.xlsx');
                    ElMessage.success('已开始下载');
                } catch (e) {
                    fail(e);
                }
            }

            onMounted(load);
            return { range, tab, turnoverRows, orderRows, orderTotal, userRows, top10Rows, money, pct, load, exportExcel };
        }
    };

    /* ==================== 店铺状态 ==================== */

    const ShopView = {
        template: `
        <div>
          <div class="card" style="max-width:520px">
            <div class="card-title">店铺营业状态 <span class="sub">状态保存在 Redis，小程序端读同一个 key</span></div>
            <div style="display:flex;align-items:center;gap:18px;padding:18px 0">
              <el-tag :type="status === 1 ? 'success' : 'info'" size="large" style="font-size:15px;padding:0 16px;height:34px;line-height:34px">
                {{ status === 1 ? '营业中' : '已打烊' }}
              </el-tag>
              <el-button :type="status === 1 ? 'warning' : 'success'" @click="toggle" :loading="saving">
                {{ status === 1 ? '设为打烊' : '开始营业' }}
              </el-button>
              <el-button @click="load">刷新</el-button>
            </div>
            <div class="muted" style="font-size:12px;line-height:1.8">
              打烊后小程序端会提示「店铺已打烊」，但已下单的订单不受影响。
            </div>
          </div>
        </div>`,
        setup() {
            const status = ref(null);
            const saving = ref(false);

            async function load() {
                try { status.value = await api.get('/shop/status'); } catch (e) { fail(e); }
            }

            async function toggle() {
                saving.value = true;
                try {
                    await api.put('/shop/' + (status.value === 1 ? 0 : 1));
                    ElMessage.success('已更新');
                    load();
                } catch (e) {
                    fail(e);
                } finally {
                    saving.value = false;
                }
            }

            onMounted(load);
            return { status, saving, load, toggle };
        }
    };

    /* ==================== 布局 & 启动 ==================== */

    const VIEWS = {
        dashboard: DashboardView, orders: OrdersView, dinein: DineInView,
        dish: DishView, setmeal: SetmealView, category: CategoryView,
        employee: EmployeeView, report: ReportView, shop: ShopView
    };

    const LayoutView = {
        template: `
        <div class="layout">
          <aside class="aside">
            <div class="brand"><span class="dot">O</span> ordpf 餐饮</div>
            <nav class="menu">
              <div v-for="m in menu" :key="m.key" class="menu-item"
                   :class="{ active: route === m.key }" @click="go(m.key)">
                <span class="ico">{{ m.icon }}</span>{{ m.label }}
              </div>
            </nav>
            <div class="aside-foot">ordpf · 微服务版</div>
          </aside>

          <div class="main">
            <header class="header">
              <div class="crumb">
                {{ title }}
                <small>{{ subtitle }}</small>
              </div>
              <div class="user">
                <span>{{ user.name || user.userName || '管理员' }}</span>
                <div class="avatar">{{ (user.name || 'A').slice(0, 1) }}</div>
                <el-button link type="danger" @click="logout">退出</el-button>
              </div>
            </header>
            <main class="content">
              <component :is="view" :key="route" />
            </main>
          </div>
        </div>`,
        setup() {
            const route = ref(store.route);

            function sync() {
                const h = (location.hash || '').replace(/^#\/?/, '');
                route.value = VIEWS[h] ? h : 'dashboard';
                store.route = route.value;
            }

            function go(key) {
                location.hash = '#/' + key;
            }

            async function logout() {
                try { await api.post('/employee/logout'); } catch (e) { /* 忽略 */ }
                api.auth.clearAuth();
                store.logged = false;
                location.hash = '';
                ElMessage.success('已退出登录');
            }

            window.addEventListener('hashchange', sync);
            onMounted(sync);

            const view = computed(() => VIEWS[route.value] || DashboardView);
            const title = computed(() => PAGE_TITLE[route.value] || '工作台');
            const subtitle = computed(() => {
                if (route.value === 'orders') return '接单 / 派送 / 完成 / 拒单';
                if (route.value === 'dinein') return '扫码点餐与收银台';
                if (route.value === 'report') return '营业额、订单、用户、销量榜';
                return '';
            });

            return { menu: MENU, route, view, title, subtitle, user: store.user, go, logout };
        }
    };

    const App = {
        template: `
        <login v-if="!store.logged" @success="onLogin" />
        <layout v-else />`,
        components: { login: LoginView, layout: LayoutView },
        setup() {
            function onLogin() { location.hash = '#/dashboard'; }
            return { store, onLogin };
        }
    };

    createApp(App).use(ElementPlus).mount('#app');
})();




