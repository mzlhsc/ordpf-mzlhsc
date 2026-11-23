const config = require('../../config');
const http = require('../../utils/request');
const util = require('../../utils/util');
const app = getApp();

Page({
  data: {
    shopOpen: true,
    categories: [],
    activeCategory: 0,
    activeCategoryName: '全部菜品',
    dishes: [],
    setmeals: [],
    cartCount: 0,
    cartAmountText: '0.00',
    loading: true
  },

  onLoad() {
    this.bootstrap();
  },

  onShow() {
    this.loadShopStatus();
    this.refreshCart();
  },

  onPullDownRefresh() {
    Promise.all([this.loadCategories(), this.loadSetmeals(), this.loadDishes()])
      .finally(() => wx.stopPullDownRefresh());
  },

  async bootstrap() {
    await Promise.all([this.loadShopStatus(), this.loadCategories(), this.loadSetmeals()]);
    await this.loadDishes();
    this.refreshCart();
  },

  async loadShopStatus() {
    try {
      const status = await http.get('/user/shop/status');
      this.setData({ shopOpen: Number(status) === 1 });
    } catch (e) {
      // 状态接口失败不阻塞菜单浏览
    }
  },

  async loadCategories() {
    try {
      const list = await http.get('/user/category/list', { type: 1 }) || [];
      const categories = [{ id: 0, name: '全部' }].concat(list.map((item) => ({
        id: item.id,
        name: item.name
      })));
      this.setData({ categories });
    } catch (e) {
      util.errorToast(e);
    }
  },

  async loadSetmeals() {
    try {
      const categories = await http.get('/user/category/list', { type: 2 }) || [];
      if (!categories.length) {
        this.setData({ setmeals: [] });
        return;
      }
      const responses = await Promise.all(categories.map((cat) =>
        http.get('/user/setmeal/list', { categoryId: cat.id }).catch(() => [])
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
        setmeals: merged.map((item) => ({
          ...item,
          priceText: util.money(item.price),
          description: item.description || ''
        }))
      });
    } catch (e) {
      // 套餐为空或接口异常时不显示套餐区
      this.setData({ setmeals: [] });
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
      // 后端 /user/dish/list 必须带 categoryId；选择“全部”时按分类并行拉取再合并
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
      const dishes = merged.map((item) => {
        const stock = item.stock;
        return {
          ...item,
          stock,
          soldOut: stock !== null && stock !== undefined && Number(stock) <= 0,
          hasStock: stock !== null && stock !== undefined,
          priceText: util.money(item.price),
          description: item.description || '',
          flavors: Array.isArray(item.flavors) ? item.flavors : []
        };
      });
      this.setData({ dishes, loading: false });
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

  showDish(e) {
    const dish = this.data.dishes[e.currentTarget.dataset.index];
    if (!dish) return;
    const flavorText = dish.flavors.length
      ? '\n口味：' + dish.flavors.map((f) => f.name).join('、')
      : '';
    wx.showModal({
      title: dish.name,
      content: (dish.description || '本店招牌菜品') + flavorText + '\n价格：¥' + dish.priceText,
      showCancel: false,
      confirmText: '知道了',
      confirmColor: '#ff6b35'
    });
  },

  onImageError(e) {
    const id = Number(e.currentTarget.dataset.id);
    const kind = e.currentTarget.dataset.kind;
    const key = kind === 'setmeal' ? 'setmeals' : 'dishes';
    const list = (this.data[key] || []).slice();
    const index = list.findIndex((item) => Number(item.id) === id);
    if (index >= 0) {
      list[index] = Object.assign({}, list[index], { imageError: true });
      this.setData({ [key]: list });
    }
  },

  async addDish(e) {
    const id = Number(e.currentTarget.dataset.id);
    const dish = this.data.dishes.find((item) => Number(item.id) === id);
    if (!dish) return;
    if (!this.data.shopOpen) return util.toast('门店休息中，暂不接单');
    if (dish.soldOut) return util.toast('这道菜已售罄');
    try {
      await app.login();
      await http.post('/shopping-cart/add', { dishId: id });
      util.toast('已加入购物车', 'success');
      this.refreshCart();
    } catch (err) {
      util.errorToast(err);
    }
  },

  async addSetmeal(e) {
    const id = Number(e.currentTarget.dataset.id);
    if (!this.data.shopOpen) return util.toast('门店休息中，暂不接单');
    try {
      await app.login();
      await http.post('/shopping-cart/add', { setmealId: id });
      util.toast('套餐已加入购物车', 'success');
      this.refreshCart();
    } catch (err) {
      util.errorToast(err);
    }
  },

  async refreshCart() {
    const token = wx.getStorageSync(http.TOKEN_KEY);
    if (!token) {
      this.setData({ cartCount: 0, cartAmountText: '0.00' });
      app.setCartCount(0);
      return;
    }
    try {
      const list = await http.get('/shopping-cart/list') || [];
      let count = 0;
      let amount = 0;
      list.forEach((item) => {
        const n = Number(item.number || 0);
        count += n;
        amount += n * Number(item.amount || 0);
      });
      this.setData({ cartCount: count, cartAmountText: util.money(amount) });
      app.setCartCount(count);
    } catch (e) {
      // 购物车为空时接口通常返回空数组，不打断首页
      this.setData({ cartCount: 0, cartAmountText: '0.00' });
    }
  },

  async goCart() {
    try {
      await app.login();
      wx.navigateTo({ url: '/pages/cart/cart' });
    } catch (e) {
      util.errorToast(e);
    }
  },

  onShareAppMessage() {
    return {
      title: config.shopName + ' · 今天吃点好的',
      path: '/pages/index/index'
    };
  }
});




