import type { ToolItem } from './types'

/**
 * 这里是整个工具发布页的唯一数据源。
 *
 * 你后续新增/修改工具时，主要改这个文件：
 * 1. 改 version
 * 2. 改 updateTime
 * 3. 改 installUrl / downloadUrl / openUrl
 * 4. 改 versionNote
 * 5. 在 changelog 最前面追加一条更新记录
 */
export const tools: ToolItem[] = [
  {
    id: 'eol-data-helper',
    name: 'EOL 数据更新助手',
    kind: 'userscript',
    version: '1.0.0',
    updateTime: '2026-05-19',
    summary: '用于 data.admin.eol.com.cn 后台页面的自动筛选、跳转、编辑辅助和批量处理。',
    tags: ['篡改猴', 'EOL后台', '自动化', '数据更新'],
    platform: ['Tampermonkey', 'Chrome', 'Edge'],
    matchUrls: ['http://data.admin.eol.com.cn/*', 'https://data.admin.eol.com.cn/*'],
    installUrl: '/userscripts/eol-helper.user.js',
    sourceUrl: '',
    supportAutoUpdate: true,
    needReinstallWhenUpdate: false,
    versionNote:
      '支持自动检查更新。更新脚本时必须同步提高 UserScript 头部的 @version，并保持 @updateURL / @downloadURL 指向线上固定地址。',
    doc: `
### 使用说明

1. 先安装 Tampermonkey。
2. 点击「安装脚本」。
3. 浏览器会打开 Tampermonkey 安装页，确认安装。
4. 打开适用页面后，脚本会自动生效。

### 更新方式

- 正常情况下 Tampermonkey 会根据 @updateURL 自动检查新版本。
- 如果没有及时更新，可以进入 Tampermonkey 管理面板，手动点击「检查用户脚本更新」。
- 每次发布新版本时，需要修改脚本头部的 @version。
`,
    changelog: [
      {
        version: '1.0.0',
        date: '2026-05-19',
        items: ['建立初始发布入口', '支持从工具中心安装脚本', '加入自动更新说明']
      }
    ]
  },
  {
    id: 'table-collector-extension',
    name: '表格采集器插件',
    kind: 'browser-extension',
    version: '1.0.0',
    updateTime: '2026-05-19',
    summary: '用于采集招生网站中按省份、年份、科类、类型等字段切换后的表格数据，并导出 xlsx。',
    tags: ['浏览器插件', '表格采集', 'xlsx', '招生网站'],
    platform: ['Chrome', 'Edge'],
    matchUrls: ['招生网站历史分数页', '招生计划页', '录取查询页'],
    downloadUrl: 'https://github.com/yuki1022qi/tool-hub/releases/latest/download/table-collector-extension.zip',
    sourceUrl: '',
    supportAutoUpdate: false,
    needReinstallWhenUpdate: true,
    versionNote:
      'zip 分享版不支持浏览器自动更新。你更新插件包后，用户需要重新下载 zip，并在 chrome://extensions 或 edge://extensions 页面重新加载。',
    doc: `
### 安装说明

1. 点击「下载最新版 zip」。
2. 解压到本地文件夹。
3. 打开 Chrome 或 Edge 的扩展管理页。
4. 开启「开发者模式」。
5. 点击「加载已解压的扩展程序」。
6. 选择解压后的插件文件夹。

### 更新说明

zip 安装方式不会自动更新。你发布新版本后，用户需要：

1. 下载最新版 zip。
2. 解压覆盖旧文件夹，或解压到新文件夹。
3. 在扩展管理页点击「重新加载」。

### 注意事项

不要直接删除旧插件后再安装，除非不需要保留插件本地缓存和采集进度。
`,
    changelog: [
      {
        version: '1.0.0',
        date: '2026-05-19',
        items: ['建立插件下载入口', '加入手动更新说明', '加入适用场景说明']
      }
    ]
  },
  {
    id: 'score-fill-web',
    name: '专业分模板智能填充平台',
    kind: 'web-tool',
    version: '1.0.0',
    updateTime: '2026-05-19',
    summary: '用于把原始专业分数据和招生计划数据处理成标准专业分模板，并处理异常匹配。',
    tags: ['网页工具', '专业分', '招生计划', 'Excel'],
    platform: ['浏览器'],
    matchUrls: ['内部工具页面'],
    openUrl: 'https://example.com/professional-score-fill',
    sourceUrl: '',
    supportAutoUpdate: true,
    needReinstallWhenUpdate: false,
    versionNote:
      '网页工具直接打开线上地址即可使用。你更新并重新部署后，用户刷新页面就可以看到最新版本。如用户看到旧页面，通常是浏览器缓存或部署缓存。',
    doc: `
### 使用说明

1. 点击「打开工具」。
2. 上传原始专业分数据。
3. 上传招生计划数据。
4. 按页面步骤完成字段识别、匹配、异常处理和导出。

### 更新说明

网页工具无需安装。你更新代码并部署后，用户重新打开或刷新页面即可使用新版。

### 常见问题

如果用户仍看到旧版本：

- 让用户强制刷新页面。
- 检查 Cloudflare Pages / GitHub Pages 是否完成部署。
- 检查页面底部或工具卡片中的版本号是否已变化。
`,
    changelog: [
      {
        version: '1.0.0',
        date: '2026-05-19',
        items: ['建立网页工具导航入口', '加入版本说明', '加入说明文档入口']
      }
    ]
  },
  {
    id: 'question-cutter-python',
    name: '题目截图 Python 工具',
    kind: 'python-script',
    version: '1.0.0',
    updateTime: '2026-05-19',
    summary: '用于将试卷 PDF 或转换后的文档按题号切分成图片，辅助整理题目截图。',
    tags: ['Python', 'PDF', '题目截图', '批处理'],
    platform: ['Windows', 'Python 3.10+'],
    downloadUrl: 'https://github.com/yuki1022qi/tool-hub/releases/latest/download/question-cutter.zip',
    sourceUrl: '',
    supportAutoUpdate: false,
    needReinstallWhenUpdate: true,
    versionNote:
      'Python 脚本只展示最新版下载入口。用户下载后本地运行，不会自动更新。你发布新版 zip 后，用户需要重新下载。',
    doc: `
### 使用说明

1. 点击「下载最新版」。
2. 解压 zip。
3. 按说明安装依赖。
4. 运行脚本处理文件。

### 推荐目录结构

\`\`\`text
question-cutter/
├─ main.py
├─ requirements.txt
├─ README.md
└─ examples/
\`\`\`

### 更新说明

Python 脚本不会自动更新。你更新后，用户需要重新下载最新版压缩包。
`,
    changelog: [
      {
        version: '1.0.0',
        date: '2026-05-19',
        items: ['建立 Python 工具下载入口', '加入运行说明', '加入版本更新说明']
      }
    ]
  }
]

export const kindLabels: Record<ToolItem['kind'], string> = {
  userscript: '篡改猴脚本',
  'browser-extension': '浏览器插件',
  'web-tool': '网页工具',
  'python-script': 'Python 脚本'
}
