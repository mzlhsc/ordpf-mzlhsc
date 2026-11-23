const http = require('../../utils/request');
const util = require('../../utils/util');
const app = getApp();

const ORDER_STATUS = util.ORDER_STATUS;
const SESSION_STATUS = util.DINING_SESSION_STATUS;

Page({
  data: {
    session: null,
    needJoin: false,
    loading: true,
    cartCount: 0,
    cartAmountText: '0.00'
  },

  onLoad(options) {
    this.id = Number(options.id);
    this.load();
  },

  onShow() {
    if (this.id && this.data.session) this.load();
  },

  async load() {
    this.setData({ loading: true });
    try {
      await app.login();
      const data = await http.get('/user/dining/session/' + this.id);
      const cartItems = (data.cartItems || []).map((item) => {
        const n = Number(item.number || 0);
        const unit = Number(item.amount || 0);
        return {
          ...item,
          number: n,
          priceText: util.money(unit),
          lineTotal: util.money(n * unit)
        };
      });
      let cartCount = 0;
      let cartAmount = 0;
      cartItems.forEach((item) => {
        cartCount += item.number;
        cartAmount += item.number * Number(item.amount || 0);
      });
      const members = (data.members || []).map((member) => ({
        ...member,
        initial: (member.nickname || '客').substring(0, 1),
        roleText: member.isOwner === 1 ? '发起人' : (member.payStatus === 1 ? '已付' : '同桌'),
        paidText: util.money(member.paidAmount)
      }));
      const orders = (data.orders || []).map((order) => ({
        ...order,
        statusText: util.statusText(ORDER_STATUS, order.status),
        timeText: util.formatTimeText(order.orderTime),
        amountText: util.money(order.amount)
      }));
      const tableName = data.tableName || (data.tableNames || []).join(' + ') || '堂食';
      this.setData({
        session: {
          ...data,
          tableName,
          tableLabel: tableName,
          members,
          orders,
          cartItems,
          memberCount: data.memberCount || members.length,
          statusText: util.statusText(SESSION_STATUS, data.status),
          openTimeText: util.formatTimeText(data.openTime),
          checkoutTimeText: util.formatTimeText(data.checkoutTime),
          totalAmountText: util.money(data.totalAmount),
          paidAmountText: util.money(data.paidAmount),
          unpaidAmountText: util.money(data.unpaidAmount),
          perPersonAmountText: util.money(data.perPersonAmount)
        },
        cartCount,
        cartAmountText: util.money(cartAmount),
        needJoin: false,
        loading: false
      });
    } catch (e) {
      if (e.code === 403) {
        this.setData({ needJoin: true, session: null, loading: false });
        return;
      }
      this.setData({ loading: false });
      util.errorToast(e);
    }
  },

  copyNo() {
    if (this.data.session) {
      wx.setClipboardData({ data: this.data.session.sessionNo || '' });
    }
  },

  async joinSession() {
    try {
      const user = await app.login();
      await http.post('/user/dining/join', {
        sessionId: this.id,
        nickname: user.name || '微信用户'
      });
      util.toast('已加入同桌', 'success');
      this.load();
    } catch (e) {
      util.errorToast(e);
    }
  },

  goAddDish() {
    if (!this.data.session) return;
    wx.navigateTo({
      url: '/pages/dining-menu/dining-menu?sessionId=' + this.id +
        '&tableName=' + encodeURIComponent(this.data.session.tableName || '')
    });
  },

  async plusCart(e) {
    await this.changeCart(e.currentTarget.dataset.index, 1);
  },

  async minusCart(e) {
    await this.changeCart(e.currentTarget.dataset.index, -1);
  },

  async changeCart(index, delta) {
    const item = this.data.session.cartItems[Number(index)];
    if (!item) return;
    try {
      const body = {
        sessionId: this.id,
        dishId: item.dishId,
        number: delta
      };
      if (item.dishFlavor) body.dishFlavor = item.dishFlavor;
      await http.post('/user/dining/cart', body);
      this.load();
    } catch (e) {
      util.errorToast(e);
    }
  },

  async clearCart() {
    if (!(await util.confirm('确定清空同桌菜单吗？'))) return;
    try {
      await http.post('/user/dining/cart/' + this.id + '/clear');
      util.toast('已清空同桌菜单');
      this.load();
    } catch (e) {
      util.errorToast(e);
    }
  },

  async submitOrder() {
    if (!(await util.confirm('提交这桌菜？提交后会生成订单并扣减库存。'))) return;
    try {
      await http.post('/user/dining/session/' + this.id + '/submit');
      util.toast('下单成功，后厨马上开做', 'success');
      this.load();
    } catch (e) {
      util.errorToast(e);
    }
  },

  async requestCheckout() {
    if (!(await util.confirm('申请结账后，服务员会到桌边为你结账。'))) return;
    try {
      await http.post('/user/dining/session/' + this.id + '/checkout-request');
      util.toast('已申请结账');
      this.load();
    } catch (e) {
      util.errorToast(e);
    }
  },

  async enableAa() {
    if (!(await util.confirm('开启 AA 后，同桌成员可以各自支付人均金额。'))) return;
    try {
      await http.post('/user/dining/session/' + this.id + '/aa-enable');
      util.toast('AA 已开启', 'success');
      this.load();
    } catch (e) {
      util.errorToast(e);
    }
  },

  async aaPay() {
    const session = this.data.session;
    if (!(await util.confirm('确认支付 ¥' + session.perPersonAmountText + ' 的 AA 分摊？'))) return;
    try {
      const res = await http.post('/user/dining/aa-pay', {
        sessionId: this.id,
        payMethod: 1
      });
      util.toast(res && res.settled ? '已结清，感谢光临' : '支付成功', 'success');
      this.load();
    } catch (e) {
      util.errorToast(e);
    }
  },

  waitCheckout() {
    const session = this.data.session;
    if (!session) return;
    wx.showModal({
      title: '等待结账',
      content: '账单已提交结账，请稍候服务员到桌边处理。\n应付金额 ¥' + session.unpaidAmountText,
      showCancel: false,
      confirmColor: '#ff6b35'
    });
  },

  goDining() {
    wx.switchTab({ url: '/pages/dining/dining' });
  }
});
