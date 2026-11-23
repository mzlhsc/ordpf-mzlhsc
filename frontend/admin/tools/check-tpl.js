/**
 * 模板编译自检：
 * 用 vendor 里的 vue 全局构建，把 app.js 中所有模板字符串编译一遍。
 * 目的：在没有浏览器的情况下发现模板语法错误（否则页面直接白屏）。
 */
const fs = require('fs');
const vm = require('vm');

function decodeEntities(s) {
    return String(s)
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
}

// Vue 的 decodeHtmlBrowser 会用 createElement('div') + innerHTML 来解码实体，
// 这里必须实现 children[0].getAttribute，否则编译含 && 的属性时会崩。
global.window = global;
global.document = {
    createElement() {
        const el = { innerHTML: '' };
        el.children = [{
            getAttribute() {
                const m = /foo="([\s\S]*)"/.exec(el.innerHTML);
                return m ? decodeEntities(m[1]) : null;
            }
        }];
        return el;
    },
    addEventListener() { },
    querySelector: () => null
};

vm.runInThisContext(
    fs.readFileSync('D:/Jobs/Project/ordpf-mzlhsc/frontend/admin/vendor/vue.global.prod.js', 'utf8'),
    { filename: 'vue.global.prod.js' }
);
const Vue = global.Vue;
if (!Vue || typeof Vue.compile !== 'function') {
    console.error('❌ vendor 里的 Vue 不带模板编译器，页面会白屏');
    process.exit(1);
}
console.log('Vue ' + Vue.version + '（含模板编译器）');

const src = fs.readFileSync('D:/Jobs/Project/ordpf-mzlhsc/frontend/admin/js/app.js', 'utf8');
const names = ['Login', 'Dashboard', 'Orders', 'DineIn', 'Category', 'Dish', 'Setmeal', 'Employee', 'Report', 'Shop', 'Layout', 'App'];
const re = /template:\s*`([\s\S]*?)`\s*[,\n]/g;
const list = [];
let m;
while ((m = re.exec(src)) !== null) list.push(m[1]);

let bad = 0;
list.forEach((tpl, i) => {
    const name = names[i] || ('#' + (i + 1));
    try {
        Vue.compile(tpl);
    } catch (e) {
        bad++;
        console.error('❌ ' + name + ' 模板编译失败: ' + e.message);
    }
});
console.log('模板总数: ' + list.length + '，编译失败: ' + bad);
process.exit(bad === 0 ? 0 : 1);

