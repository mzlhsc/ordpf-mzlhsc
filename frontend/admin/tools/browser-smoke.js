/**
 * 管理端浏览器冒烟：通过 Chrome DevTools Protocol 登录并检查关键页面。
 * 使用：先启动 chrome --headless --remote-debugging-port=9223，再运行本脚本。
 */
const PORT = Number(process.env.CDP_PORT || 9223);
const ORIGIN = 'http://127.0.0.1:8090';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getPage() {
  const list = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
  const page = list.find((item) => item.type === 'page' && item.url.indexOf(ORIGIN) === 0);
  if (!page) throw new Error('找不到管理端页面，先启动 headless Chrome 打开 ' + ORIGIN);
  return page;
}

function connect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const pending = new Map();
    let nextId = 1;
    ws.onopen = () => resolve({
      send(method, params) {
        return new Promise((res, rej) => {
          const id = nextId++;
          pending.set(id, { res, rej });
          ws.send(JSON.stringify({ id, method, params }));
        });
      },
      close() { ws.close(); }
    });
    ws.onerror = (e) => reject(new Error('CDP WebSocket 连接失败'));
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (!msg.id || !pending.has(msg.id)) return;
      const { res, rej } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) rej(new Error(msg.error.message));
      else res(msg.result);
    };
  });
}

async function evaluate(cdp, expression) {
  const result = await cdp.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || 'JS 执行异常');
  }
  return result.result ? result.result.value : undefined;
}

async function waitFor(cdp, expression, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await evaluate(cdp, expression)) return true;
    await sleep(300);
  }
  return false;
}

(async () => {
  const page = await getPage();
  const cdp = await connect(page.webSocketDebuggerUrl);
  try {
    const rendered = await waitFor(cdp, `document.querySelector('#app') && document.querySelector('#app').innerText.includes('ordpf 餐饮')`);
    if (!rendered) throw new Error('登录页未渲染');

    await evaluate(cdp, `(() => {
      const inputs = document.querySelectorAll('input');
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(inputs[0], 'admin');
      inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
      setter.call(inputs[1], '123456');
      inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
      const btn = document.querySelector('button.el-button--primary');
      btn.click();
      return true;
    })()`);

    const logged = await waitFor(cdp, `!!localStorage.getItem('ordpf.admin.token')`);
    if (!logged) throw new Error('登录未成功：localStorage 没有 ordpf.admin.token');
    await sleep(800);

    const dashboard = await evaluate(cdp, `document.body.innerText`);
    const hasDashboard = dashboard.includes('工作台') || dashboard.includes('今日营业额');
    if (!hasDashboard) throw new Error('登录后未进入工作台');

    await evaluate(cdp, `location.hash = '#/dinein'`);
    await sleep(800);
    const dining = await evaluate(cdp, `document.body.innerText`);
    const hasDining = dining.includes('桌台') && dining.includes('预约');
    if (!hasDining) throw new Error('堂食管理页未渲染');

    await evaluate(cdp, `location.hash = '#/dish'`);
    await sleep(800);
    const dish = await evaluate(cdp, `document.body.innerText`);
    const hasStock = dish.includes('库存');
    if (!hasStock) throw new Error('菜品页缺少库存列');

    const files = await evaluate(cdp, `JSON.stringify(performance.getEntriesByType('resource').filter(r => r.name.includes('/js/') || r.name.includes('/css/')).map(r => r.name))`);
    console.log('browser-smoke: OK');
    console.log('dashboard=' + hasDashboard + ' dining=' + hasDining + ' stock=' + hasStock);
    console.log('资源=' + files);
  } finally {
    cdp.close();
  }
})().catch((err) => {
  console.error('browser-smoke: FAILED');
  console.error(err.message);
  process.exit(1);
});
