# tool-hub

工具发布中心，用于统一发布：

- 篡改猴脚本
- 浏览器插件 zip 包
- 网页工具入口
- Python 脚本下载入口
- 版本说明
- 说明文档
- 更新日志

## 当前固定网址

```text
https://tool-hub-2vw.pages.dev/
```

## 本地运行

```bash
npm install
npm run dev
```

浏览器打开：

```text
http://localhost:5173
```

## 打包

```bash
npm run build
```

打包结果在：

```text
dist
```

## Cloudflare Pages 配置

```text
Build command: npm run build
Build output directory: dist
```

## 如何新增工具

修改：

```text
src/tools.ts
```

新增一个工具对象即可。

## 篡改猴脚本自动更新要求

脚本头部必须有：

```js
// @version      1.0.1
// @updateURL    https://tool-hub-2vw.pages.dev/userscripts/xxx.user.js
// @downloadURL  https://tool-hub-2vw.pages.dev/userscripts/xxx.user.js
```

每次更新必须提高 `@version`。
