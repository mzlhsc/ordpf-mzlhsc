const http = require('../../utils/request');
const util = require('../../utils/util');
const app = getApp();

Page({
  data: {
    sessionId: null,
    tableName: '',
    categories: [],
    activeCategory: 0,
    activeCategoryName: '全部菜品',
    dishes: [],
    cartCount: 0,
    cartAmountText: '0.00',
    loading: true
  },

  onLoad(options) {
    const sessionId = Number(options.sessionId);
    this.setData({ sessionId, tableName: options.tableName || '' });
    this.bootstrap();
  },

  async bootstrap() {
    await Promise.all([this.loadSession(), this.loadCategories()]);
    await this.loadDishes();
    this.refreshCart();
  },

  async loadSession() {
    if (!this.data.sessionId) return;
    try {
      await app.login();
      const session = await http.get('/user/dining/session/' + this.data.sessionId);
      if (session && session.tableName) this.setData({ tableName: session.tableName });
    } catch (e) {
      // 桌台名不是关键数据，失败不阻塞菜单
    }
  },

  async loadCategories() {
    try {
      const list = await http.get('/user/category/list', { type: 1 }) || [];
      this.setData({
        categories: [{ id: 0, name: '全部' }].concat(list.map((item) => ({ id: item.id, name: item.name })))
      });
    } catch (e) {
      util.errorToast(e);
    }
  },

  async loadDishes() {
    this.setData({ loading: true });
    try {
      const active = this.data.activeCategory;
      const categoryIds = active > 0
        ? [active]
        : this.data.categories.filter((item) => Number(item.id) > 0).map((item) => item.id);
      if (!categoryIds.length) {
        this.setData({ dishes: [], loading: false });
        return;
      }
      const responses = await Promise.all(categoryIds.map((id) =>
        http.get('/user/dish/list', { categoryId: id }).catch(() => [])
      ));
      const merged = [];
      const seen = {};
      responses.forEach((list) => {
        (list || []).forEach((item) => {
          if (!seen[item.id]) {
            seen[item.id] = true;
            merged.push(item);
          }
        });
      });
      this.setData({
        dishes: merged.map((item) => {
          const stock = item.stock;
          return {
            ...item,
            soldOut: stock !== null && stock !== undefined && Number(stock) <= 0,
            hasStock: stock !== null && stock !== undefined,
            priceText: util.money(item.price),
            flavors: Array.isArray(item.flavors) ? item.flavors : []
          };
        }),
        loading: false
      });
    } catch (e) {
      this.setData({ loading: false });
      util.errorToast(e);
    }
  },

  selectCategory(e) {
    const id = Number(e.currentTarget.dataset.id);
    const cat = this.data.categories.find((item) => Number(item.id) === id);
    this.setData({
      activeCategory: id,
      activeCategoryName: id > 0 && cat ? cat.name : '全部菜品'
    });
    this.loadDishes();
  },

  onImageError(e) {
    const index = Number(e.currentTarget.dataset.index);
    const list = (this.data.dishes || []).slice();
    if (index >= 0 && list[index]) {
      list[index] = Object.assign({}, list[index], { imageError: true });
      this.setData({ dishes: list });
    }
  },

  askFlavor(dish) {
    if (!dish.flavors.length) return Promise.resolve('');
    return new Promise((resolve) => {
      wx.showActionSheet({
        itemList: dish.flavors.map((f) => f.name).slice(0, 6),
        success: (res) => resolve(dish.flavors[res.tapIndex].name),
        fail: () => resolve(null)
      });
    });
  },

  async addDish(e) {
    const dish = this.data.dishes[Number(e.currentTarget.dataset.index)];
    if (!dish || dish.soldOut) return util.toast('这道菜已售罄');
    if (!this.data.sessionId) return util.toast('会话不存在，请重新扫码');
    const flavor = await this.askFlavor(dish);
    if (flavor === null) return;
    try {
      await app.login();
      const body = {
        sessionId: this.data.sessionId,
        dishId: dish.id,
        number: 1
      };
      if (flavor) body.dishFlavor = flavor;
      await http.post('/user/dining/cart', body);
      util.toast('已加入同桌菜单', 'success');
      this.refreshCart();
    } catch (err) {
      util.errorToast(err);
    }
  },

  async refreshCart() {
    try {
      const list = await http.get('/user/dining/cart/' + this.data.sessionId) || [];
      let count = 0;
      let amount = 0;
      list.forEach((item) => {
        const n = Number(item.number || 0);
        count += n;
        amount += n * Number(item.amount || 0);
      });
      this.setData({ cartCount: count, cartAmountText: util.money(amount) });
    } catch (e) {
      this.setData({ cartCount: 0, cartAmountText: '0.00' });
    }
  },

  goSession() {
    // 正常情况下本页由会话页进入，返回上一页即可，避免重复堆栈
    if (getCurrentPages().length > 1) {
      wx.navigateBack();
    } else {
      wx.navigateTo({ url: '/pages/session/session?id=' + this.data.sessionId });
    }
  }
});





