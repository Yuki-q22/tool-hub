import React, { useEffect, useMemo, useState } from 'react'
import { kindLabels, SITE_URL, tools } from './tools'
import type { ToolItem, ToolKind } from './types'

type FilterKind = 'all' | ToolKind
type DetailTab = 'overview' | 'usage' | 'changelog'

const filters: Array<{ key: FilterKind; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'userscript', label: '篡改猴脚本' },
  { key: 'browser-extension', label: '浏览器插件' },
  { key: 'web-tool', label: '网页工具' },
  { key: 'python-script', label: 'Python 脚本' }
]

const detailTabs: Array<{ key: DetailTab; label: string }> = [
  { key: 'overview', label: '版本信息' },
  { key: 'usage', label: '安装使用' },
  { key: 'changelog', label: '更新日志' }
]

function h(
  type: string | React.ComponentType<any>,
  props?: Record<string, any> | null,
  ...children: React.ReactNode[]
): React.ReactElement {
  return React.createElement(type as any, props, ...children)
}

function getPrimaryAction(tool: ToolItem): { label: string; url: string; isExternal: boolean } {
  if (tool.kind === 'userscript') {
    return {
      label: '安装脚本',
      url: tool.installUrl || '',
      isExternal: false
    }
  }

  if (tool.kind === 'browser-extension') {
    return {
      label: '下载最新版 zip',
      url: tool.downloadUrl || '',
      isExternal: true
    }
  }

  if (tool.kind === 'web-tool') {
    return {
      label: '打开工具',
      url: tool.openUrl || '',
      isExternal: true
    }
  }

  return {
    label: '下载最新版',
    url: tool.downloadUrl || '',
    isExternal: true
  }
}

function getAbsoluteUrl(url: string): string {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${SITE_URL.replace(/\/$/, '')}/${url.replace(/^\//, '')}`
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase()
}

function getLatestLog(tool: ToolItem): ToolItem['changelog'][number] | undefined {
  return tool.changelog[0]
}

function getAnnouncementDate(tool: ToolItem): string {
  return getLatestLog(tool)?.date || tool.updateTime
}

function parseDateValue(value: string): number {
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function getAnnouncementTime(tool: ToolItem): number {
  return Math.max(parseDateValue(getAnnouncementDate(tool)), parseDateValue(tool.updateTime))
}

function compareVersion(a: string, b: string): number {
  const left = a.match(/\d+/g)?.map(Number) ?? []
  const right = b.match(/\d+/g)?.map(Number) ?? []
  const maxLength = Math.max(left.length, right.length)

  for (let index = 0; index < maxLength; index += 1) {
    const leftValue = left[index] ?? 0
    const rightValue = right[index] ?? 0
    if (leftValue !== rightValue) return leftValue - rightValue
  }

  return 0
}

function getLatestTools(items: ToolItem[], limit = 3): ToolItem[] {
  return items
    .map((tool, index) => ({ tool, index }))
    .sort((a, b) => {
      const importantDiff = Number(Boolean(b.tool.important)) - Number(Boolean(a.tool.important))
      if (importantDiff !== 0) return importantDiff

      const timeDiff = getAnnouncementTime(b.tool) - getAnnouncementTime(a.tool)
      if (timeDiff !== 0) return timeDiff

      const versionDiff = compareVersion(b.tool.version, a.tool.version)
      if (versionDiff !== 0) return versionDiff

      return a.index - b.index
    })
    .slice(0, limit)
    .map((item) => item.tool)
}

function buildAnnouncementText(latestTools: ToolItem[]): string {
  if (latestTools.length === 0) return ''

  const latestDate = getAnnouncementDate(latestTools[0])
  const updateLines = latestTools.map((tool, index) => {
    const latestLog = getLatestLog(tool)
    const items = latestLog?.items?.slice(0, 3).join('；') || tool.summary
    return `${index + 1}. ${tool.name} v${tool.version}：${items}`
  })

  return [
    '【工具发布中心更新】',
    '',
    `更新时间：${latestDate}`,
    '',
    '最近更新工具：',
    ...updateLines,
    '',
    `访问地址：${SITE_URL}`
  ].join('\n')
}

function renderDocBlocks(doc: string, keyPrefix = 'doc'): React.ReactElement[] {
  const lines = doc.trim().split('\n')
  const result: React.ReactElement[] = []

  lines.forEach((line, index) => {
    const trimmed = line.trim()
    const key = `${keyPrefix}-${index}`

    if (!trimmed) {
      result.push(h('div', { key, className: 'doc-space' }))
      return
    }

    if (trimmed.startsWith('### ')) {
      result.push(
        h(
          'h4',
          { key, className: 'doc-title' },
          trimmed.replace(/^###\s+/, '')
        )
      )
      return
    }

    if (trimmed.startsWith('- ')) {
      result.push(
        h(
          'div',
          { key, className: 'doc-bullet' },
          h('span', null, '•'),
          h('p', null, trimmed.replace(/^-\s+/, ''))
        )
      )
      return
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      result.push(
        h(
          'div',
          { key, className: 'doc-step' },
          h('span', null, trimmed.match(/^\d+/)?.[0] || ''),
          h('p', null, trimmed.replace(/^\d+\.\s+/, ''))
        )
      )
      return
    }

    result.push(
      h(
        'p',
        { key, className: 'doc-paragraph' },
        trimmed.replace(/`/g, '')
      )
    )
  })

  return result
}

function renderDocSections(doc: string): React.ReactElement {
  const sections: Array<{ title: string; body: string[] }> = []
  let currentTitle = '使用说明'
  let currentBody: string[] = []

  doc.trim().split('\n').forEach((line) => {
    const trimmed = line.trim()

    if (trimmed.startsWith('### ')) {
      if (currentBody.some((item) => item.trim())) {
        sections.push({ title: currentTitle, body: currentBody })
      }
      currentTitle = trimmed.replace(/^###\s+/, '')
      currentBody = []
      return
    }

    currentBody.push(line)
  })

  if (currentBody.some((item) => item.trim())) {
    sections.push({ title: currentTitle, body: currentBody })
  }

  const safeSections = sections.length > 0 ? sections : [{ title: '使用说明', body: [doc] }]

  return h(
    'div',
    { className: 'doc-accordion' },
    ...safeSections.map((section, index) =>
      h(
        'details',
        { key: `${section.title}-${index}`, className: 'doc-collapse', open: index === 0 },
        h('summary', null, section.title),
        h(
          'div',
          { className: 'doc-content' },
          ...renderDocBlocks(section.body.join('\n'), `${section.title}-${index}`)
        )
      )
    )
  )
}

function CopyButton({
  text,
  label = '复制链接',
  copiedLabel = '已复制',
  className = 'ghost-button'
}: {
  text: string
  label?: string
  copiedLabel?: string
  className?: string
}): React.ReactElement {
  const [copied, setCopied] = useState(false)

  async function handleCopy(): Promise<void> {
    if (!text) return

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch {
      window.alert('复制失败，请手动复制。')
    }
  }

  return h(
    'button',
    {
      className,
      type: 'button',
      onClick: handleCopy,
      disabled: !text
    },
    copied ? copiedLabel : label
  )
}

function StatusPill({
  enabled,
  trueText,
  falseText
}: {
  enabled: boolean
  trueText: string
  falseText: string
}): React.ReactElement {
  return h(
    'span',
    {
      className: enabled ? 'pill pill-success' : 'pill pill-warning'
    },
    enabled ? trueText : falseText
  )
}

function HomeAnnouncement({
  latestTools,
  onSelect
}: {
  latestTools: ToolItem[]
  onSelect: (tool: ToolItem) => void
}): React.ReactElement | null {
  if (latestTools.length === 0) return null

  const featuredTool = latestTools[0]
  const featuredAction = getPrimaryAction(featuredTool)
  const announcementText = buildAnnouncementText(latestTools)

  return h(
    'section',
    { className: 'update-board' },
    h(
      'div',
      { className: 'update-board-main' },
      h('div', { className: 'section-heading compact' }, h('span', null, '最新更新公告')),
      h('h2', null, `${featuredTool.name} v${featuredTool.version}`),
      h('p', { className: 'update-summary' }, featuredTool.summary),
      h(
        'div',
        { className: 'update-meta-row' },
        h('span', null, `更新时间：${getAnnouncementDate(featuredTool)}`),
        h('span', null, kindLabels[featuredTool.kind]),
        h('span', null, featuredTool.supportAutoUpdate ? '支持自动/直接同步' : '需手动下载更新')
      ),
      h(
        'div',
        { className: 'update-actions' },
        h(
          'button',
          {
            className: 'primary-button',
            type: 'button',
            onClick: () => onSelect(featuredTool)
          },
          '查看详情'
        ),
        featuredAction.url
          ? h(
              'a',
              {
                className: 'ghost-button',
                href: featuredAction.url,
                target: featuredAction.isExternal ? '_blank' : '_self',
                rel: 'noreferrer'
              },
              featuredAction.label
            )
          : null,
        h(CopyButton, {
          text: announcementText,
          label: '复制公告',
          copiedLabel: '公告已复制'
        })
      )
    ),
    h(
      'div',
      { className: 'update-board-list' },
      ...latestTools.map((tool) => {
        const latestLog = tool.changelog[0]
        return h(
          'button',
          {
            key: tool.id,
            className: 'update-mini-card',
            type: 'button',
            onClick: () => onSelect(tool)
          },
          h(
            'span',
            { className: `tool-kind mini kind-${tool.kind}` },
            kindLabels[tool.kind]
          ),
          h('strong', null, tool.name),
          h('small', null, `v${tool.version} · ${getAnnouncementDate(tool)}`),
          latestLog?.items?.[0] ? h('p', null, latestLog.items[0]) : null
        )
      })
    )
  )
}

function ToolCard({
  tool,
  active,
  onSelect
}: {
  tool: ToolItem
  active: boolean
  onSelect: (tool: ToolItem) => void
}): React.ReactElement {
  const primaryAction = getPrimaryAction(tool)
  const cardClassName = active
    ? `tool-card tool-card-active kind-${tool.kind}`
    : `tool-card kind-${tool.kind}`

  return h(
    'article',
    {
      className: cardClassName,
      onClick: () => onSelect(tool)
    },
    h(
      'div',
      { className: 'tool-card-header' },
      h(
        'div',
        null,
        h('div', { className: `tool-kind kind-${tool.kind}` }, kindLabels[tool.kind]),
        h('h3', null, tool.name)
      ),
      h('div', { className: 'version-badge' }, `v${tool.version}`)
    ),

    h('p', { className: 'tool-summary' }, tool.summary),

    h(
      'div',
      { className: 'tag-row' },
      ...tool.tags.map((tag) =>
        h('span', { key: tag, className: 'tag' }, tag)
      )
    ),

    h(
      'div',
      { className: 'meta-grid' },
      h(
        'div',
        null,
        h('span', { className: 'meta-label' }, '更新时间'),
        h('strong', null, tool.updateTime)
      ),
      h(
        'div',
        null,
        h('span', { className: 'meta-label' }, '更新方式'),
        h('strong', null, tool.supportAutoUpdate ? '可自动/直接同步' : '需手动下载')
      )
    ),

    h(
      'div',
      {
        className: 'card-actions',
        onClick: (event: React.MouseEvent<HTMLDivElement>) => event.stopPropagation()
      },
      primaryAction.url
        ? h(
            'a',
            {
              className: 'primary-button',
              href: primaryAction.url,
              target: primaryAction.isExternal ? '_blank' : '_self',
              rel: 'noreferrer'
            },
            primaryAction.label
          )
        : h(
            'button',
            {
              className: 'primary-button disabled',
              type: 'button',
              disabled: true
            },
            '未配置链接'
          ),
      h(CopyButton, { text: getAbsoluteUrl(primaryAction.url) })
    )
  )
}

function ChangelogList({ tool }: { tool: ToolItem }): React.ReactElement {
  return h(
    'div',
    { className: 'changelog-list' },
    ...tool.changelog.map((log) =>
      h(
        'div',
        { key: `${tool.id}-${log.version}`, className: 'changelog-item' },
        h(
          'div',
          { className: 'changelog-top' },
          h('strong', null, `v${log.version}`),
          h('span', null, log.date)
        ),
        h(
          'ul',
          null,
          ...log.items.map((item) => h('li', { key: item }, item))
        )
      )
    )
  )
}

function DetailPanel({ tool }: { tool: ToolItem }): React.ReactElement {
  const primaryAction = getPrimaryAction(tool)
  const [activeTab, setActiveTab] = useState<DetailTab>('overview')

  useEffect(() => {
    setActiveTab('overview')
  }, [tool.id])

  return h(
    'aside',
    { className: 'detail-panel' },
    h(
      'div',
      { className: 'detail-sticky' },
      h(
        'section',
        { className: 'detail-block detail-head' },
        h('div', { className: `tool-kind kind-${tool.kind}` }, kindLabels[tool.kind]),
        h('h2', null, tool.name),
        h('p', { className: 'detail-summary' }, tool.summary),
        h(
          'div',
          { className: 'detail-actions' },
          primaryAction.url
            ? h(
                'a',
                {
                  className: 'primary-button',
                  href: primaryAction.url,
                  target: primaryAction.isExternal ? '_blank' : '_self',
                  rel: 'noreferrer'
                },
                primaryAction.label
              )
            : null,
          h(CopyButton, { text: getAbsoluteUrl(primaryAction.url) })
        )
      ),

      h(
        'section',
        { className: 'detail-block tabbed-detail' },
        h(
          'div',
          { className: 'detail-tab-list' },
          ...detailTabs.map((tab) =>
            h(
              'button',
              {
                key: tab.key,
                className: activeTab === tab.key ? 'detail-tab active' : 'detail-tab',
                type: 'button',
                onClick: () => setActiveTab(tab.key)
              },
              tab.label
            )
          )
        ),

        activeTab === 'overview'
          ? h(
              'div',
              { className: 'detail-tab-panel' },
              h(
                'div',
                { className: 'version-table' },
                h('div', null, h('span', null, '当前版本'), h('strong', null, `v${tool.version}`)),
                h('div', null, h('span', null, '更新时间'), h('strong', null, tool.updateTime)),
                h('div', null, h('span', null, '工具类型'), h('strong', null, kindLabels[tool.kind])),
                h('div', null, h('span', null, '适用平台'), h('strong', null, tool.platform.join(' / ')))
              ),
              h(
                'div',
                { className: 'status-row' },
                h(StatusPill, {
                  enabled: tool.supportAutoUpdate,
                  trueText: '支持自动/直接同步',
                  falseText: '不支持自动更新'
                }),
                h(StatusPill, {
                  enabled: !tool.needReinstallWhenUpdate,
                  trueText: '无需重新安装',
                  falseText: '更新后需重新安装'
                })
              ),
              h('p', { className: 'version-note' }, tool.versionNote),
              tool.matchUrls && tool.matchUrls.length > 0
                ? h(
                    'div',
                    { className: 'match-box' },
                    h('span', null, '适用页面 / 场景'),
                    ...tool.matchUrls.map((url) => h('code', { key: url }, url))
                  )
                : null
            )
          : null,

        activeTab === 'usage'
          ? h(
              'div',
              { className: 'detail-tab-panel' },
              renderDocSections(tool.doc)
            )
          : null,

        activeTab === 'changelog'
          ? h(
              'div',
              { className: 'detail-tab-panel' },
              h(ChangelogList, { tool })
            )
          : null
      )
    )
  )
}

function App(): React.ReactElement {
  const [activeKind, setActiveKind] = useState<FilterKind>('all')
  const [keyword, setKeyword] = useState('')
  const [selectedId, setSelectedId] = useState(tools[0]?.id ?? '')

  const latestTools = getLatestTools(tools, 3)

  const filteredTools = useMemo(() => {
    const q = normalizeText(keyword)

    return tools.filter((tool) => {
      const kindMatched = activeKind === 'all' || tool.kind === activeKind

      const searchText = normalizeText(
        [
          tool.name,
          kindLabels[tool.kind],
          tool.summary,
          tool.version,
          tool.updateTime,
          tool.tags.join(' '),
          tool.platform.join(' '),
          tool.matchUrls?.join(' ') ?? ''
        ].join(' ')
      )

      return kindMatched && (!q || searchText.includes(q))
    })
  }, [activeKind, keyword])

  const selectedTool = useMemo(() => {
    return tools.find((tool) => tool.id === selectedId) ?? filteredTools[0] ?? tools[0]
  }, [filteredTools, selectedId])

  function handleSelect(tool: ToolItem): void {
    setSelectedId(tool.id)
  }

  return h(
    'main',
    { className: 'page-shell' },

    h(
      'header',
      { className: 'hero' },
      h(
        'div',
        null,
        h('p', { className: 'eyebrow' }, 'tool-hub'),
        h('h1', null, '工具发布中心'),
        h(
          'p',
          { className: 'hero-desc' },
          '统一发布篡改猴脚本、浏览器插件 zip、网页工具和 Python 脚本。用户只需要收藏这个页面，就可以查看最新版本、安装说明和更新日志。'
        )
      ),
      h(
        'div',
        { className: 'hero-card' },
        h('span', null, '工具总数'),
        h('strong', null, String(tools.length)),
        h('p', null, '修改 src/tools.ts 后重新部署即可更新页面。')
      )
    ),

    h(HomeAnnouncement, { latestTools, onSelect: handleSelect }),

    h(
      'section',
      { className: 'toolbar' },
      h(
        'div',
        { className: 'filter-tabs' },
        ...filters.map((filter) =>
          h(
            'button',
            {
              key: filter.key,
              className: activeKind === filter.key ? 'tab-button active' : 'tab-button',
              type: 'button',
              onClick: () => setActiveKind(filter.key)
            },
            filter.label
          )
        )
      ),
      h(
        'label',
        { className: 'search-box' },
        h('span', null, '搜索'),
        h('input', {
          value: keyword,
          onChange: (event: React.ChangeEvent<HTMLInputElement>) => setKeyword(event.target.value),
          placeholder: '输入工具名称、标签、版本或适用页面'
        })
      )
    ),

    h(
      'section',
      { className: 'content-grid' },
      h(
        'div',
        { className: 'tool-list' },
        filteredTools.length > 0
          ? filteredTools.map((tool) =>
              h(ToolCard, {
                key: tool.id,
                tool,
                active: selectedTool?.id === tool.id,
                onSelect: handleSelect
              })
            )
          : h(
              'div',
              { className: 'empty-box' },
              h('strong', null, '没有找到匹配工具'),
              h('p', null, '可以换一个关键词，或切换到「全部」分类。')
            )
      ),

      selectedTool ? h(DetailPanel, { tool: selectedTool }) : null
    )
  )
}

export default App
