import type { ToolItem } from './types'

export const SITE_URL = 'https://tool-hub-2vw.pages.dev'

/**
 * 工具清单。
 *
 * 后续维护主要改这里：
 * 1. 新增工具：复制一个对象，修改字段
 * 2. 更新工具：改 version、updateTime、versionNote、changelog
 * 3. 篡改猴脚本：installUrl 使用 /userscripts/xxx.user.js
 * 4. 浏览器插件 / Python 脚本：downloadUrl 建议使用 GitHub Releases latest download 地址
 * 5. 网页工具：openUrl 填线上页面地址
 */
export const tools: ToolItem[] = [
  {
  id: 'gaokao-update-link-helper',
  name: '掌上高考数据更新链接助手',
  kind: 'userscript',
  version: '1.1.0',
  updateTime: '2026-05-19',
  summary: '在掌上高考页面生成常用数据更新链接，输入学校 ID 后自动替换链接中的数字，支持按分类 Tab 复制和打开。',
  tags: ['篡改猴', '掌上高考', '数据更新', '链接助手'],
  platform: ['Tampermonkey', 'Chrome', 'Edge'],
  matchUrls: ['https://www.gaokao.cn/', 'https://www.gaokao.cn/*'],
  installUrl: '/userscripts/gaokao-update-link-helper.user.js',
  sourceUrl: '',
  supportAutoUpdate: true,
  needReinstallWhenUpdate: false,
  versionNote:
    '支持 Tampermonkey 自动检查更新。更新脚本时，需要同步提高脚本头部的 @version，并保持 @updateURL / @downloadURL 指向当前线上脚本地址。',
  doc: `
### 使用说明

1. 先安装 Tampermonkey。
2. 点击「安装脚本」。
3. 在 Tampermonkey 安装页面确认安装。
4. 打开 https://www.gaokao.cn/。
5. 页面右侧会出现「数据更新链接」入口。
6. 输入学校 ID 后，脚本会自动替换链接中的学校 ID。
7. 可以按「普通高考」「高职单招」等分类 Tab 复制或打开对应链接。

### 功能说明

- 支持输入学校 ID 后自动生成数据更新链接。
- 支持普通高考相关链接。
- 支持高职单招相关链接。
- 支持复制当前 Tab 静态链接。
- 支持复制当前 Tab 全部链接。
- 支持打开当前 Tab 更新链接。
- 支持复制单条链接。
- 支持收起和展开悬浮面板。

### 更新说明

这个脚本支持自动更新。发布新版本时需要同时修改：

1. public/userscripts/gaokao-update-link-helper.user.js 里的 @version。
2. src/tools.ts 里本工具的 version。
3. src/tools.ts 里本工具的 updateTime。
4. src/tools.ts 里本工具的 changelog。

如果用户没有自动更新，可以进入 Tampermonkey 管理面板，手动点击「检查用户脚本更新」。
`,
  changelog: [
    {
      version: '1.1.0',
      date: '2026-05-19',
      items: [
        '加入工具发布中心',
        '配置 @updateURL 和 @downloadURL',
        '支持从 tool-hub 页面安装脚本',
        '保留原有链接生成、复制和打开逻辑'
      ]
    }
  ]
},
{
  id: 'video-automatic-review',
  name: '视频自动审核工具',
  kind: 'userscript',
  version: '1.1',
  updateTime: '2026-05-19',
  summary: '自动审核视频内容',
  tags: ['篡改猴', '视频审核', '自动审核', '内容安全'],
  platform: ['Tampermonkey', 'Chrome', 'Edge'],
  matchUrls: ['http://v.admin.eol.com.cn/video-review', 'http://v.admin.eol.com.cn/video-review/*'],
  installUrl: '/userscripts/video-automatic-review.user.js',
  sourceUrl: '',
  supportAutoUpdate: true,
  needReinstallWhenUpdate: false,
  versionNote:
    '支持 Tampermonkey 自动检查更新。更新脚本时，需要同步提高脚本头部的 @version，并保持 @updateURL / @downloadURL 指向当前线上脚本地址。',
  doc: `
### 使用说明

1. 先安装 Tampermonkey。
2. 点击「安装脚本」。
3. 在 Tampermonkey 安装页面确认安装。
4. 打开 http://v.admin.eol.com.cn/#/video/audit/lists。
5. 页面自动开始视频审核。
6. 如需停止，关掉 Tampermonkey 中对应脚本并刷新页面即可。

### 功能说明

- 支持自动审核视频。


### 更新说明

这个脚本支持自动更新。发布新版本时需要同时修改：

1. public/userscripts/video-automatic-review.user.js 里的 @version。
2. src/tools.ts 里本工具的 version。
3. src/tools.ts 里本工具的 updateTime。
4. src/tools.ts 里本工具的 changelog。

如果用户没有自动更新，可以进入 Tampermonkey 管理面板，手动点击「检查用户脚本更新」。
`,
  changelog: [
    {
      version: '1.1',
      date: '2026-05-19',
      items: [
        '加入工具发布中心',
        '配置 @updateURL 和 @downloadURL',
        '支持从 tool-hub 页面安装脚本',
        '保留原有链接生成、复制和打开逻辑'
      ]
    }
  ]
},
{
  id: 'academic-bridge-score-synchronization',
  name: '学业桥分数同步 - 半自动',
  kind: 'userscript',
  version: '1.1',
  updateTime: '2026-05-19',
  summary: '在高招数据管理-同步数据-专业分中同步学业桥分数。',
  tags: ['篡改猴', '学业桥', '分数同步', '半自动'],
  platform: ['Tampermonkey', 'Chrome', 'Edge'],
  matchUrls: ['http://data.admin.eol.com.cn/', 'http://data.admin.eol.com.cn/*'],
  installUrl: '/userscripts/academic-bridge-score-synchronization.user.js',
  sourceUrl: '',
  supportAutoUpdate: true,
  needReinstallWhenUpdate: false,
  versionNote:
    '支持 Tampermonkey 自动检查更新。更新脚本时，需要同步提高脚本头部的 @version，并保持 @updateURL / @downloadURL 指向当前线上脚本地址。',
  doc: `
### 使用说明

1. 先安装 Tampermonkey。
2. 点击「安装脚本」。
3. 在 Tampermonkey 安装页面确认安装。
4. 打开 http://data.admin.eol.com.cn/#/xyq/score/lists。
5. 页面会出现「学业桥助手」入口。
6. 输入学校名称和省份后，点击连续执行，脚本会自动同步该省份分数。

### 功能说明

- 支持输入学校名称和省份后自动同步学业桥分数。

### 更新说明

这个脚本支持自动更新。发布新版本时需要同时修改：

1. public/userscripts/academic-bridge-score-synchronization.user.js 里的 @version。
2. src/tools.ts 里本工具的 version。
3. src/tools.ts 里本工具的 updateTime。
4. src/tools.ts 里本工具的 changelog。

如果用户没有自动更新，可以进入 Tampermonkey 管理面板，手动点击「检查用户脚本更新」。
`,
  changelog: [
    {
      version: '1.1',
      date: '2026-05-19',
      items: [
        '加入工具发布中心',
        '配置 @updateURL 和 @downloadURL',
        '修正页面展示版本与脚本 @version 保持一致',
        '保留原有分数同步逻辑'
      ]
    }
  ]
},
  {
  id: 'table-collector-extension',
  name: '表格采集器',
  kind: 'browser-extension',
  version: '1.0.5',
  updateTime: '2026-05-19',
  summary: '独立浏览器扩展：模拟人工点击遍历网页筛选项，抓取动态表格，支持断点续采、标题区域识别和 XLSX 导出。',
  tags: ['浏览器插件', '表格采集', '动态表格', 'xlsx', '断点续采'],
  platform: ['Chrome', 'Edge'],
  matchUrls: ['招生网站历史分数页', '招生计划页', '录取查询页', '其他动态表格页面'],
  downloadUrl: '/downloads/table-collector-extension.zip',
  sourceUrl: '',
  supportAutoUpdate: false,
  needReinstallWhenUpdate: true,
  versionNote:
    '当前为 zip 分享版，不支持浏览器自动更新。你更新插件包后，用户需要重新下载 zip，并在 chrome://extensions 或 edge://extensions 页面重新加载插件。',
  doc: `
### 安装说明

1. 点击「下载最新版 zip」。
2. 将 zip 解压到本地文件夹。
3. 打开 Chrome 或 Edge 的扩展管理页。
4. 开启「开发者模式」。
5. 点击「加载已解压的扩展程序」。
6. 选择解压后的插件文件夹。
7. 安装完成后，在需要采集表格的页面点击插件图标使用。

### Chrome 扩展管理页

在地址栏输入：

chrome://extensions

### Edge 扩展管理页

在地址栏输入：

edge://extensions

### 更新说明

zip 安装版不会自动更新。发布新版本后，用户需要：

1. 重新下载最新版 zip。
2. 解压覆盖旧文件夹，或解压到一个新文件夹。
3. 打开扩展管理页。
4. 点击该插件卡片上的「重新加载」。

### 使用场景

适合采集需要按省份、年份、科类、类型等字段切换后才显示不同表格的招生网站页面。

### 注意事项

如果重新安装为新扩展，浏览器可能会清空旧扩展的本地缓存。建议优先覆盖原文件夹后点击「重新加载」，不要随意删除旧扩展。
`,
  changelog: [
    {
      version: '1.0.5',
      date: '2026-05-19',
      items: [
        '加入 tool-hub 工具发布中心',
        '提供 zip 下载入口',
        '支持动态表格采集',
        '支持断点续采',
        '支持标题区域识别',
        '支持 XLSX 导出'
      ]
    }
  ]
},
  {
    id: 'score-fill-web',
    name: '数据处理工具平台',
    kind: 'web-tool',
    version: '1.0.0',
    updateTime: '2026-05-19',
    summary: '用于日常处理数据。',
    tags: ['网页工具', '分数处理', '高峰期数据处理'],
    platform: ['浏览器'],
    matchUrls: ['内部工具页面'],
    openUrl: 'https://data-processing.pages.dev/',
    sourceUrl: '',
    supportAutoUpdate: true,
    needReinstallWhenUpdate: false,
    versionNote:
      '网页工具直接打开线上地址即可使用。你更新并重新部署后，用户刷新页面就可以看到最新版本。',
    doc: `

### 更新说明

网页工具无需安装。更新代码并部署后，用户重新打开或刷新页面即可使用新版。
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
  id: 'anhui-single-admission-pdf-downloader',
  name: '安徽高职单招 PDF 批量下载',
  kind: 'python-script',
  version: '1.0.0',
  updateTime: '2026-05-19',
  summary: '用于批量抓取安徽招生考试网高职单招/对口招生相关页面中的 PDF 文件，并保存到本地目录。',
  tags: ['Python', 'PDF下载', '安徽高职单招', '批量下载'],
  platform: ['Windows', 'Python 3.10+'],
  downloadUrl: '/downloads/python-tools/anhui-single-admission-pdf-downloader.zip',
  sourceUrl: '',
  supportAutoUpdate: false,
  needReinstallWhenUpdate: true,
  versionNote:
    'Python 脚本 zip 分享版不支持自动更新。发布新版后，用户需要重新下载最新版 zip，并按 README.md 安装依赖和运行。',
  doc: `
### 使用说明

1. 点击「下载最新版」。
2. 解压 zip。
3. 在命令行进入解压后的文件夹。
4. 执行依赖安装：

pip install -r requirements.txt

5. 打开 main.py，修改 save_dir 为本地保存目录。
6. 执行：

python main.py

### 依赖说明

- requests
- beautifulsoup4

### 注意事项

如果目标网站页面结构变化，可能需要修改页面地址、文章链接选择器或 PDF 链接匹配逻辑。
`,
  changelog: [
    {
      version: '1.0.0',
      date: '2026-05-19',
      items: [
        '加入 tool-hub 工具发布中心',
        '提供 Python zip 下载入口',
        '加入 requirements.txt 和 README.md 说明'
      ]
    }
  ]
},

{
  id: 'exam-question-cutter',
  name: '高考真题题目截图处理',
  kind: 'python-script',
  version: '1.0.0',
  updateTime: '2026-05-19',
  summary: '用于按题号批量截图 PDF 试题，支持跨页拼接，并尽量排除试卷头部、大标题和注意事项。',
  tags: ['Python', 'PDF', '题目截图', '高考真题', '批处理'],
  platform: ['Windows', 'Python 3.10+'],
  downloadUrl: '/downloads/python-tools/exam-question-cutter.zip',
  sourceUrl: '',
  supportAutoUpdate: false,
  needReinstallWhenUpdate: true,
  versionNote:
    'Python 脚本不会自动更新。发布新版后，用户需要重新下载最新版 zip。该脚本需要用户本地配置 INPUT_PATH 和 OUTPUT_DIR。',
  doc: `
### 使用说明

1. 点击「下载最新版」。
2. 解压 zip。
3. 在命令行进入解压后的文件夹。
4. 执行依赖安装：

pip install -r requirements.txt

5. 先把 Word / WPS / DOCX 转成 PDF。
6. 打开 main.py，修改：

INPUT_PATH = r"你的PDF路径"
OUTPUT_DIR = r"截图输出目录"

7. 执行：

python main.py

### 依赖说明

- pymupdf
- pillow

### 注意事项

当前脚本更适合文本型 PDF。如果 PDF 是纯扫描图片，题号识别可能失败，需要另行 OCR 或调整处理方式。
`,
  changelog: [
    {
      version: '1.0.0',
      date: '2026-05-19',
      items: [
        '加入 tool-hub 工具发布中心',
        '提供 Python zip 下载入口',
        '加入 PDF 题目截图处理说明'
      ]
    }
  ]
},

{
  id: 'tianjin-single-admission-pdf-extractor',
  name: '天津高职单招 PDF 提取',
  kind: 'python-script',
  version: '1.0.0',
  updateTime: '2026-05-19',
  summary: '用于从天津高职单招 PDF 中提取院校、专业、计划、语种、学制、学费等字段，并导出 CSV。',
  tags: ['Python', 'PDF提取', '天津高职单招', 'CSV', 'pdfplumber'],
  platform: ['Windows', 'Python 3.10+'],
  downloadUrl: '/downloads/python-tools/tianjin-single-admission-pdf-extractor.zip',
  sourceUrl: '',
  supportAutoUpdate: false,
  needReinstallWhenUpdate: true,
  versionNote:
    'Python 脚本 zip 分享版不支持自动更新。发布新版后，用户需要重新下载最新版 zip。该脚本需要用户本地配置 INPUT_PATH 和 OUTPUT_CSV。',
  doc: `
### 使用说明

1. 点击「下载最新版」。
2. 解压 zip。
3. 在命令行进入解压后的文件夹。
4. 执行依赖安装：

pip install -r requirements.txt

5. 打开 main.py，修改：

INPUT_PATH = r"你的PDF文件或PDF目录"
OUTPUT_CSV = r"输出CSV路径"

6. 执行：

python main.py

### 依赖说明

- pdfplumber
- pandas

### 注意事项

该脚本依赖 PDF 的文本排版结构。如果 PDF 是扫描件，或版式变化较大，需要调整正则或裁剪逻辑。
`,
  changelog: [
    {
      version: '1.0.0',
      date: '2026-05-19',
      items: [
        '加入 tool-hub 工具发布中心',
        '提供 Python zip 下载入口',
        '加入 CSV 导出说明'
      ]
    }
  ]
},

]

export const kindLabels: Record<ToolItem['kind'], string> = {
  userscript: '篡改猴脚本',
  'browser-extension': '浏览器插件',
  'web-tool': '网页工具',
  'python-script': 'Python 脚本'
}
