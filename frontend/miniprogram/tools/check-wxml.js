/**
 * 极简 WXML 标签配对检查（不依赖微信开发者工具）
 * 只检查标签是否成对，不校验属性表达式。
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const files = [];
(function walk(dir) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.wxml')) files.push(full);
  });
})(root);

let failed = 0;
files.forEach((file) => {
  const source = fs.readFileSync(file, 'utf8');
  const stack = [];
  const tagRe = /<\/?([a-zA-Z][\w-]*)([^>]*)>/g;
  let match;
  while ((match = tagRe.exec(source))) {
    const raw = match[0];
    const tag = match[1];
    const rest = match[2] || '';
    if (raw.startsWith('</')) {
      const top = stack.pop();
      if (!top || top.tag !== tag) {
        console.error(`${path.relative(root, file)}: 闭合标签 </${tag}> 与栈顶 <${top ? top.tag : 'EMPTY'}> 不匹配`);
        failed += 1;
        break;
      }
    } else if (!/\/\s*$/.test(rest)) {
      stack.push({ tag });
    }
  }
  if (stack.length) {
    console.error(`${path.relative(root, file)}: 未闭合标签 ${stack.map((s) => '<' + s.tag + '>').join(', ')}`);
    failed += 1;
  }
});

if (failed) {
  console.error(`WXML 检查失败：${failed} 个文件`);
  process.exit(1);
}
console.log(`WXML 检查通过：${files.length} 个文件`);
