import React, { useMemo, useState } from 'react'
import { kindLabels, tools } from './tools'
import type { ToolItem, ToolKind } from './types'

type FilterKind = 'all' | ToolKind

const filters: Array<{ key: FilterKind; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'userscript', label: '篡改猴脚本' },
  { key: 'browser-extension', label: '浏览器插件' },
  { key: 'web-tool', label: '网页工具' },
  { key: 'python-script', label: 'Python 脚本' }
]

function h(type: string | React.ComponentType<any>, props?: Record<string, any> | null, ...children: React.ReactNode[]): React.ReactElement {
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

function normalizeText(value: string): string {
  return value.trim().toLowerCase()
}

function renderDoc(doc: string): React.ReactElement[] {
  const lines = doc.trim().split('\n')
  const result: React.ReactElement[] = []

  lines.forEach((line, index) => {
    const trimmed = line.trim()

    if (!trimmed) {
      result.push(h('div', { key: index, className: 'doc-space' }))
      return
    }

    if (trimmed.startsWith('### ')) {
      result.push(
        h(
          'h4',
          { key: index, className: 'doc-title' },
          trimmed.replace(/^###\s+/, '')
        )
      )
      return
    }

    if (trimmed.startsWith('- ')) {
      result.push(
        h(
          'div',
          { key: index, className: 'doc-bullet' },
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
          { key: index, className: 'doc-step' },
          h('span', null, trimmed.match(/^\d+/)?.[0] || ''),
          h('p', null, trimmed.replace(/^\d+\.\s+/, ''))
        )
      )
      return
    }

    result.push(
      h(
        'p',
        { key: index, className: 'doc-paragraph' },
        trimmed.replace(/`/g, '')
      )
    )
  })

  return result
}

function CopyButton({ text }: { text: string }): React.ReactElement {
  const [copied, setCopied] = useState(false)

  async function handleCopy(): Promise<void> {
    if (!text) return

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch {
      window.alert('复制失败，请手动复制链接。')
    }
  }

  return h(
    'button',
    {
      className: 'ghost-button',
      type: 'button',
      onClick: handleCopy,
      disabled: !text
    },
    copied ? '已复制' : '复制链接'
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

  return h(
    'article',
    {
      className: active ? 'tool-card tool-card-active' : 'tool-card',
      onClick: () => onSelect(tool)
    },
    h(
      'div',
      { className: 'tool-card-header' },
      h(
        'div',
        null,
        h('div', { className: 'tool-kind' }, kindLabels[tool.kind]),
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
      h(CopyButton, { text: primaryAction.url })
    )
  )
}

function DetailPanel({ tool }: { tool: ToolItem }): React.ReactElement {
  const primaryAction = getPrimaryAction(tool)

  return h(
    'aside',
    { className: 'detail-panel' },
    h(
      'div',
      { className: 'detail-sticky' },

      h(
        'section',
        { className: 'detail-block' },
        h('div', { className: 'section-heading' }, h('span', null, '版本说明')),
        h('h2', null, tool.name),
        h('p', { className: 'detail-summary' }, tool.summary),

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
          : null,

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
          h(CopyButton, { text: primaryAction.url })
        )
      ),

      h(
        'section',
        { className: 'detail-block' },
        h('div', { className: 'section-heading' }, h('span', null, '说明文档')),
        h('div', { className: 'doc-content' }, ...renderDoc(tool.doc))
      ),

      h(
        'section',
        { className: 'detail-block' },
        h('div', { className: 'section-heading' }, h('span', null, '更新日志')),
        h(
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
      )
    )
  )
}

function App(): React.ReactElement {
  const [activeKind, setActiveKind] = useState<FilterKind>('all')
  const [keyword, setKeyword] = useState('')
  const [selectedId, setSelectedId] = useState(tools[0]?.id ?? '')

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
          '统一发布篡改猴脚本、浏览器插件 zip、网页工具和 Python 脚本。用户只需要收藏这个页面，就可以看到最新版本、说明文档和更新日志。'
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