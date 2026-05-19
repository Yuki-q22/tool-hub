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
 *
 * 注意：updateTime 请填写该工具实际最后更新的日期，不要批量写成同一天。
 */

/** 篡改猴脚本通用使用说明模板 */
function buildUserscriptDoc(opts: {
  /** 脚本在 public 目录下的路径 */
  installUrlPath: string
  /** 目标匹配页面 */
  matchUrl: string
  /** 额外的使用步骤（从第 4 步开始） */
  extraUsageSteps?: string[]
  /** 功能列表 */
  featureItems: string[]
}): string {
  const extraSteps = opts.extraUsageSteps?.length
    ? opts.extraUsageSteps.map((s, i) => `${i + 4}. ${s}`).join('\n') + '\n'
    : ''

  return `### 使用说明

1. 先安装 Tampermonkey。
2. 点击「安装脚本」。
3. 在 Tampermonkey 安装页面确认安装。
${extraSteps}
### 功能说明

${opts.featureItems.map((item) => `- ${item}`).join('\n')}

### 更新说明

这个脚本支持自动更新。发布新版本时需要同时修改：

1. \`${opts.installUrlPath}\` 里的 \`@version\`。
2. \`src/tools.ts\` 里本工具的 \`version\`。
3. \`src/tools.ts\` 里本工具的 \`updateTime\`。
4. \`src/tools.ts\` 里本工具的 \`changelog\`。

如果用户没有自动更新，可以进入 Tampermonkey 管理面板，手动点击「检查用户脚本更新」。`
}

export const tools: ToolItem[] = [
  {
    id: 'gaokao-update-link-helper',
    name: '掌上高考数据更新链接助手',
    kind: 'userscript',
    version: '1.1.0',
    updateTime: '2026-05-19',
    summary:
      '在掌上高考页面生成常用数据更新链接，输入学校 ID 后自动替换链接中的数字，支持按分类 Tab 复制和打开。',
    tags: ['篡改猴', '掌上高考', '数据更新', '链接助手'],
    platform: ['Tampermonkey', 'Chrome', 'Edge'],
    matchUrls: ['https://www.gaokao.cn/', 'https://www.gaokao.cn/*'],
    installUrl: '/userscripts/gaokao-update-link-helper.user.js',
    sourceUrl: '',
    supportAutoUpdate: true,
    needReinstallWhenUpdate: false,
    versionNote:
      '支持 Tampermonkey 自动检查更新。更新脚本时，需要同步提高脚本头部的 @version，并保持 @updateURL / @downloadURL 指向当前线上脚本地址。',
    doc: buildUserscriptDoc({
      installUrlPath: 'public/userscripts/gaokao-update-link-helper.user.js',
      matchUrl: 'https://www.gaokao.cn/',
      extraUsageSteps: [
        '打开 https://www.gaokao.cn/。',
        '页面右侧会出现「数据更新链接」入口。',
        '输入学校 ID 后，脚本会自动替换链接中的学校 ID。',
        '可以按「普通高考」「高职单招」等分类 Tab 复制或打开对应链接。'
      ],
      featureItems: [
        '支持输入学校 ID 后自动生成数据更新链接。',
        '支持普通高考相关链接。',
        '支持高职单招相关链接。',
        '支持复制当前 Tab 静态链接。',
        '支持复制当前 Tab 全部链接。',
        '支持打开当前 Tab 更新链接。',
        '支持复制单条链接。',
        '支持收起和展开悬浮面板。'
      ]
    }),
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
    version: '1.1.0',
    updateTime: '2026-05-19',
    summary:
      '在视频审核后台自动播放并审核视频内容，按预设规则批量标记审核结果，显著减少人工逐条点击的工作量。',
    tags: ['篡改猴', '视频审核', '自动审核', '内容安全'],
    platform: ['Tampermonkey', 'Chrome', 'Edge'],
    matchUrls: [
      'http://v.admin.eol.com.cn/video-review',
      'http://v.admin.eol.com.cn/video-review/*'
    ],
    installUrl: '/userscripts/video-automatic-review.user.js',
    sourceUrl: '',
    supportAutoUpdate: true,
    needReinstallWhenUpdate: false,
    versionNote:
      '支持 Tampermonkey 自动检查更新。更新脚本时，需要同步提高脚本头部的 @version，并保持 @updateURL / @downloadURL 指向当前线上脚本地址。',
    doc: buildUserscriptDoc({
      installUrlPath: 'public/userscripts/video-automatic-review.user.js',
      matchUrl: 'http://v.admin.eol.com.cn/#/video/audit/lists',
      extraUsageSteps: [
        '打开视频审核列表页面。',
        '页面自动开始按顺序播放并审核视频。',
        '审核结果会根据预设规则自动标记（通过 / 驳回）。',
        '如需停止，关掉 Tampermonkey 中对应脚本并刷新页面即可。'
      ],
      featureItems: [
        '自动播放待审核视频，无需人工逐条点击。',
        '按预设规则自动判断并标记审核结果。',
        '支持连续批量审核，减少重复操作。',
        '可随时通过 Tampermonkey 开关控制启停。'
      ]
    }),
    changelog: [
      {
        version: '1.1.0',
        date: '2026-05-19',
        items: [
          '加入工具发布中心',
          '配置 @updateURL 和 @downloadURL',
          '支持从 tool-hub 页面安装脚本',
          '优化自动审核稳定性'
        ]
      }
    ]
  },
  {
    id: 'academic-bridge-score-synchronization',
    name: '学业桥分数同步 - 半自动',
    kind: 'userscript',
    version: '1.1.0',
    updateTime: '2026-05-19',
    summary:
      '在高招数据管理「同步数据-专业分」页面中，按学校和省份自动同步学业桥分数，减少手动逐条比对和录入的工作量。',
    tags: ['篡改猴', '学业桥', '分数同步', '半自动'],
    platform: ['Tampermonkey', 'Chrome', 'Edge'],
    matchUrls: [
      'http://data.admin.eol.com.cn/',
      'http://data.admin.eol.com.cn/*'
    ],
    installUrl: '/userscripts/academic-bridge-score-synchronization.user.js',
    sourceUrl: '',
    supportAutoUpdate: true,
    needReinstallWhenUpdate: false,
    versionNote:
      '支持 Tampermonkey 自动检查更新。更新脚本时，需要同步提高脚本头部的 @version，并保持 @updateURL / @downloadURL 指向当前线上脚本地址。',
    doc: buildUserscriptDoc({
      installUrlPath:
        'public/userscripts/academic-bridge-score-synchronization.user.js',
      matchUrl: 'http://data.admin.eol.com.cn/#/xyq/score/lists',
      extraUsageSteps: [
        '打开「高招数据管理 → 同步数据 → 专业分」页面。',
        '页面会出现「学业桥助手」入口。',
        '输入学校名称和省份后，点击连续执行，脚本会自动同步该省份分数。'
      ],
      featureItems: [
        '支持按学校名称和省份自动匹配学业桥分数。',
        '支持连续执行模式，批量同步多个条目。',
        '自动填充分数数据，减少手动录入错误。',
        '执行过程可视化，方便随时暂停或调整。'
      ]
    }),
    changelog: [
      {
        version: '1.1.0',
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
    version: '1.0.7',
    updateTime: '2026-05-19',
    summary:
      '独立浏览器扩展：点击浏览器工具栏图标后按需打开采集面板，模拟人工点击遍历网页筛选项，抓取动态表格，支持分页采集、断点续采和 XLSX 导出。',
    tags: ['浏览器插件', '表格采集', '动态表格', '分页采集', 'xlsx', '断点续采'],
    platform: ['Chrome', 'Edge'],
    matchUrls: [
      '招生网站历史分数页',
      '招生计划页',
      '录取查询页',
      '其他动态表格页面'
    ],
    downloadUrl: '/downloads/table-collector-extension.zip',
    sourceUrl: '',
    supportAutoUpdate: false,
    needReinstallWhenUpdate: true,
    versionNote:
      '当前为 zip 分享版，不支持浏览器自动更新。你更新插件包后，用户需要重新下载 zip，并在 chrome://extensions 或 edge://extensions 页面重新加载插件。',
    doc: `### 安装说明

1. 点击「下载最新版 zip」。
2. 将 zip 解压到本地文件夹。
3. 打开 Chrome 或 Edge 的扩展管理页。
4. 开启「开发者模式」。
5. 点击「加载已解压的扩展程序」。
6. 选择解压后的插件文件夹。
7. 安装完成后，在需要采集表格的页面点击浏览器右上角插件图标使用。

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
4. 找到「表格采集器」。
5. 点击该插件卡片上的「重新加载」。
6. 回到目标网页，刷新页面后再点击浏览器工具栏图标打开采集面板。

### 使用场景

适合采集需要按省份、年份、科类、类型等字段切换后才显示不同表格的招生网站页面。

### 主要功能

- 支持模拟人工点击字段选项。
- 支持动态表格采集。
- 支持分页采集。
- 支持断点续采。
- 支持只采集汇总选项。
- 支持标题区域识别。
- 支持 XLSX 导出。
- 支持点击浏览器工具栏图标后按需打开面板。

### 注意事项

如果重新安装为新扩展，浏览器可能会清空旧扩展的本地缓存。建议优先覆盖原文件夹后点击「重新加载」，不要随意删除旧扩展。`,
    changelog: [
      {
        version: '1.0.7',
        date: '2026-05-19',
        items: [
          '插件面板改为点击浏览器工具栏图标后按需打开',
          '新增分页采集能力，可采集表格下方翻页后的内容',
          '优化表格区域选择，减少误选字段区域的问题',
          '字段配置和表格选择页面精简展示项',
          '汇总选项处理新增「只采集汇总选项」',
          '继续支持断点续采和 XLSX 导出'
        ]
      },
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
    summary:
      '提供多种常用数据格式转换、清洗和预处理功能的在线工具平台，无需安装即可在浏览器中直接使用，适合日常数据处理和高峰期批量操作。',
    tags: ['网页工具', '分数处理', '高峰期数据处理', '格式转换'],
    platform: ['浏览器'],
    matchUrls: ['内部工具页面'],
    openUrl: 'https://data-processing.pages.dev/',
    sourceUrl: '',
    supportAutoUpdate: true,
    needReinstallWhenUpdate: false,
    versionNote:
      '网页工具直接打开线上地址即可使用。你更新并重新部署后，用户刷新页面就可以看到最新版本。',
    doc: `### 使用说明

1. 点击「打开工具」进入线上页面。
2. 根据当前需求选择对应的数据处理功能模块。
3. 按页面提示上传或粘贴原始数据。
4. 调整处理参数后执行转换 / 清洗 / 计算。
5. 下载处理后的结果文件，或复制到剪贴板。

### 功能说明

- 支持常用数据格式转换（如 Excel、CSV、JSON 互转）。
- 支持数据清洗（去重、补全、格式化）。
- 支持批量分数处理和统计计算。
- 支持高峰期大数据量的前端预处理。
- 无需安装任何软件，浏览器打开即用。

### 注意事项

由于涉及数据处理，建议在操作前备份原始文件，防止误操作导致数据丢失。`,
    changelog: [
      {
        version: '1.0.0',
        date: '2026-05-19',
        items: [
          '建立网页工具导航入口',
          '加入版本说明',
          '加入说明文档入口',
          '提供常用数据格式转换与清洗功能'
        ]
      }
    ]
  },
  {
    id: 'anhui-single-admission-pdf-downloader',
    name: '安徽高职单招 PDF 批量下载',
    kind: 'python-script',
    version: '1.0.0',
    updateTime: '2026-05-19',
    summary:
      '用于批量抓取安徽招生考试网高职单招/对口招生相关页面中的 PDF 文件，并保存到本地目录。',
    tags: ['Python', 'PDF下载', '安徽高职单招', '批量下载'],
    platform: ['Windows', 'Python 3.10+'],
    downloadUrl: '/downloads/python-tools/anhui-single-admission-pdf-downloader.zip',
    sourceUrl: '',
    supportAutoUpdate: false,
    needReinstallWhenUpdate: true,
    versionNote:
      'Python 脚本 zip 分享版不支持自动更新。发布新版后，用户需要重新下载最新版 zip，并按 README.md 安装依赖和运行。',
    doc: `### 使用说明

1. 点击「下载最新版」。
2. 解压 zip。
3. 在命令行进入解压后的文件夹。
4. 执行依赖安装：

\`\`\`
pip install -r requirements.txt
\`\`\`

5. 打开 main.py，修改 save_dir 为本地保存目录。
6. 执行：

\`\`\`
python main.py
\`\`\`

### 依赖说明

- requests
- beautifulsoup4

### 注意事项

如果目标网站页面结构变化，可能需要修改页面地址、文章链接选择器或 PDF 链接匹配逻辑。`,
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
    summary:
      '用于按题号批量截图 PDF 试题，支持跨页拼接，并尽量排除试卷头部、大标题和注意事项。',
    tags: ['Python', 'PDF', '题目截图', '高考真题', '批处理'],
    platform: ['Windows', 'Python 3.10+'],
    downloadUrl: '/downloads/python-tools/exam-question-cutter.zip',
    sourceUrl: '',
    supportAutoUpdate: false,
    needReinstallWhenUpdate: true,
    versionNote:
      'Python 脚本不会自动更新。发布新版后，用户需要重新下载最新版 zip。该脚本需要用户本地配置 INPUT_PATH 和 OUTPUT_DIR。',
    doc: `### 使用说明

1. 点击「下载最新版」。
2. 解压 zip。
3. 在命令行进入解压后的文件夹。
4. 执行依赖安装：

\`\`\`
pip install -r requirements.txt
\`\`\`

5. 先把 Word / WPS / DOCX 转成 PDF。
6. 打开 main.py，修改：

\`\`\`
INPUT_PATH = r"你的PDF路径"
OUTPUT_DIR = r"截图输出目录"
\`\`\`

7. 执行：

\`\`\`
python main.py
\`\`\`

### 依赖说明

- pymupdf
- pillow

### 注意事项

当前脚本更适合文本型 PDF。如果 PDF 是纯扫描图片，题号识别可能失败，需要另行 OCR 或调整处理方式。`,
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
    summary:
      '用于从天津高职单招 PDF 中提取院校、专业、计划、语种、学制、学费等字段，并导出 CSV。',
    tags: ['Python', 'PDF提取', '天津高职单招', 'CSV', 'pdfplumber'],
    platform: ['Windows', 'Python 3.10+'],
    downloadUrl: '/downloads/python-tools/tianjin-single-admission-pdf-extractor.zip',
    sourceUrl: '',
    supportAutoUpdate: false,
    needReinstallWhenUpdate: true,
    versionNote:
      'Python 脚本 zip 分享版不支持自动更新。发布新版后，用户需要重新下载最新版 zip。该脚本需要用户本地配置 INPUT_PATH 和 OUTPUT_CSV。',
    doc: `### 使用说明

1. 点击「下载最新版」。
2. 解压 zip。
3. 在命令行进入解压后的文件夹。
4. 执行依赖安装：

\`\`\`
pip install -r requirements.txt
\`\`\`

5. 打开 main.py，修改：

\`\`\`
INPUT_PATH = r"你的PDF文件或PDF目录"
OUTPUT_CSV = r"输出CSV路径"
\`\`\`

6. 执行：

\`\`\`
python main.py
\`\`\`

### 依赖说明

- pdfplumber
- pandas

### 注意事项

该脚本依赖 PDF 的文本排版结构。如果 PDF 是扫描件，或版式变化较大，需要调整正则或裁剪逻辑。`,
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
  }
]

export const kindLabels: Record<ToolItem['kind'], string> = {
  userscript: '篡改猴脚本',
  'browser-extension': '浏览器插件',
  'web-tool': '网页工具',
  'python-script': 'Python 脚本'
}
