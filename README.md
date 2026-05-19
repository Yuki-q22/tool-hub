# Yuki 工具发布中心

用于统一发布：

- 篡改猴脚本
- 浏览器插件 zip 包
- 网页工具入口
- Python 脚本下载入口
- 版本说明
- 说明文档
- 更新日志

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

## 部署到 Cloudflare Pages

构建命令：

```bash
npm run build
```

输出目录：

```text
dist
```

## 如何新增工具

修改：

```text
src/tools.ts
```

新增一个对象即可。

## 篡改猴脚本自动更新要求

脚本头部必须有：

```js
// @version      1.0.1
// @updateURL    https://你的域名/userscripts/xxx.user.js
// @downloadURL  https://你的域名/userscripts/xxx.user.js
```

每次更新必须提高 `@version`。

## 浏览器插件 zip

推荐上传到 GitHub Releases，然后使用：

```text
https://github.com/你的账号/你的仓库/releases/latest/download/插件文件名.zip
```

## Python 脚本

推荐打包成 zip，上传到 GitHub Releases，然后在 `src/tools.ts` 中配置最新版下载地址。
