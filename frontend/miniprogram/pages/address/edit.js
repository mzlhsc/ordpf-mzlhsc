const http = require('../../utils/request');
const util = require('../../utils/util');
const app = getApp();

Page({
  data: {
    id: null,
    labels: ['家', '公司', '学校', '其他'],
    region: [],
    regionText: '',
    saving: false,
    form: {
      consignee: '',
      sex: '1',
      phone: '',
      provinceCode: '',
      provinceName: '',
      cityCode: '',
      cityName: '',
      districtCode: '',
      districtName: '',
      detail: '',
      label: '家',
      isDefault: false
    }
  },

  async onLoad(options) {
    const id = options.id ? Number(options.id) : null;
    this.setData({ id });
    if (id) {
      wx.setNavigationBarTitle({ title: '编辑地址' });
      await this.loadAddress(id);
    } else {
      this.setData({ 'form.isDefault': true });
    }
  },

  async loadAddress(id) {
    try {
      await app.login();
      const list = await http.get('/addressBook/list') || [];
      const item = list.find((a) => Number(a.id) === id);
      if (!item) {
        util.toast('地址不存在');
        return;
      }
      const region = [item.provinceName, item.cityName, item.districtName].filter(Boolean);
      this.setData({
        form: {
          ...this.data.form,
          ...item,
          sex: String(item.sex || '1'),
          isDefault: !!item.isDefault
        },
        region,
        regionText: region.join(' / ')
      });
    } catch (e) {
      util.errorToast(e);
    }
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ ['form.' + field]: e.detail.value });
  },

  setSex(e) {
    this.setData({ 'form.sex': e.currentTarget.dataset.sex });
  },

  onRegionChange(e) {
    const region = e.detail.value || [];
    this.setData({
      region,
      regionText: region.join(' / '),
      'form.provinceCode': '',
      'form.provinceName': region[0] || '',
      'form.cityCode': '',
      'form.cityName': region[1] || '',
      'form.districtCode': '',
      'form.districtName': region[2] || ''
    });
  },

  setLabel(e) {
    this.setData({ 'form.label': e.currentTarget.dataset.label });
  },

  onDefaultChange(e) {
    this.setData({ 'form.isDefault': e.detail.value });
  },

  async save() {
    if (this.data.saving) return;
    const form = this.data.form;
    if (!form.consignee.trim()) return util.toast('请填写收货人');
    if (!/^1[3-9]\d{9}$/.test(form.phone || '')) return util.toast('请填写正确的手机号');
    if (!form.provinceName || !form.cityName || !form.districtName) return util.toast('请选择所在地区');
    if (!form.detail.trim()) return util.toast('请填写详细地址');

    this.setData({ saving: true });
    try {
      await app.login();
      const body = {
        ...form,
        consignee: form.consignee.trim(),
        detail: form.detail.trim(),
        sex: String(form.sex || '1'),
        isDefault: !!form.isDefault
      };
      if (this.data.id) await http.put('/addressBook', body);
      else await http.post('/addressBook', body);
      // 后端规定“默认地址只能通过 /addressBook/default 设置”，保存后再单独调用
      if (body.isDefault) await this.applyDefaultAddress();
      util.toast('地址已保存', 'success');
      setTimeout(() => wx.navigateBack(), 700);
    } catch (e) {
      util.errorToast(e);
    } finally {
      this.setData({ saving: false });
    }
  },

  async applyDefaultAddress() {
    const list = await http.get('/addressBook/list') || [];
    let target = null;
    if (this.data.id) {
      target = list.find((item) => Number(item.id) === Number(this.data.id));
    } else {
      target = list.slice().sort((a, b) => Number(b.id) - Number(a.id))[0];
    }
    if (target) await http.put('/addressBook/default', { id: target.id });
  }
});

