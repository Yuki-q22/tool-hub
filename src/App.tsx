import { useMemo, useState } from 'react'
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

function getPrimaryAction(tool: ToolItem) {
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

function normalizeText(value: string) {
  return value.trim().toLowerCase()
}

function renderDoc(doc: string) {
  const lines = doc.trim().split('\n')
  return lines.map((line, index) => {
    const trimmed = line.trim()

    if (!trimmed) {
      return <div key={index} className="doc-space" />
    }

    if (trimmed.startsWith('### ')) {
      return (
        <h4 key={index} className="doc-title">
          {trimmed.replace(/^###\s+/, '')}
        </h4>
      )
    }

    if (trimmed.startsWith('- ')) {
      return (
        <div key={index} className="doc-bullet">
          <span>•</span>
          <p>{trimmed.replace(/^-\s+/, '')}</p>
        </div>
      )
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      return (
        <div key={index} className="doc-step">
          <span>{trimmed.match(/^\d+/)?.[0]}</span>
          <p>{trimmed.replace(/^\d+\.\s+/, '')}</p>
        </div>
      )
    }

    if (trimmed.startsWith('```')) {
      return null
    }

    return (
      <p key={index} className="doc-paragraph">
        {trimmed.replace(/`/g, '')}
      </p>
    )
  })
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    if (!text) return

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch {
      setCopied(false)
      window.alert('复制失败，请手动复制链接。')
    }
  }

  return (
    <button className="ghost-button" type="button" onClick={handleCopy} disabled={!text}>
      {copied ? '已复制' : '复制链接'}
    </button>
  )
}

function StatusPill({ enabled, trueText, falseText }: { enabled: boolean; trueText: string; falseText: string }) {
  return <span className={enabled ? 'pill pill-success' : 'pill pill-warning'}>{enabled ? trueText : falseText}</span>
}

function ToolCard({
  tool,
  active,
  onSelect
}: {
  tool: ToolItem
  active: boolean
  onSelect: (tool: ToolItem) => void
}) {
  const primaryAction = getPrimaryAction(tool)

  return (
    <article className={active ? 'tool-card tool-card-active' : 'tool-card'} onClick={() => onSelect(tool)}>
      <div className="tool-card-header">
        <div>
          <div className="tool-kind">{kindLabels[tool.kind]}</div>
          <h3>{tool.name}</h3>
        </div>
        <div className="version-badge">v{tool.version}</div>
      </div>

      <p className="tool-summary">{tool.summary}</p>

      <div className="tag-row">
        {tool.tags.map((tag) => (
          <span key={tag} className="tag">
            {tag}
          </span>
        ))}
      </div>

      <div className="meta-grid">
        <div>
          <span className="meta-label">更新时间</span>
          <strong>{tool.updateTime}</strong>
        </div>
        <div>
          <span className="meta-label">更新方式</span>
          <strong>{tool.supportAutoUpdate ? '可自动/直接同步' : '需手动下载'}</strong>
        </div>
      </div>

      <div className="card-actions" onClick={(event) => event.stopPropagation()}>
        {primaryAction.url ? (
          <a
            className="primary-button"
            href={primaryAction.url}
            target={primaryAction.isExternal ? '_blank' : '_self'}
            rel="noreferrer"
          >
            {primaryAction.label}
          </a>
        ) : (
          <button className="primary-button disabled" type="button" disabled>
            未配置链接
          </button>
        )}

        <CopyButton text={primaryAction.url} />
      </div>
    </article>
  )
}

function DetailPanel({ tool }: { tool: ToolItem }) {
  const primaryAction = getPrimaryAction(tool)

  return (
    <aside className="detail-panel">
      <div className="detail-sticky">
        <section className="detail-block">
          <div className="section-heading">
            <span>版本说明</span>
          </div>

          <h2>{tool.name}</h2>
          <p className="detail-summary">{tool.summary}</p>

          <div className="version-table">
            <div>
              <span>当前版本</span>
              <strong>v{tool.version}</strong>
            </div>
            <div>
              <span>更新时间</span>
              <strong>{tool.updateTime}</strong>
            </div>
            <div>
              <span>工具类型</span>
              <strong>{kindLabels[tool.kind]}</strong>
            </div>
            <div>
              <span>适用平台</span>
              <strong>{tool.platform.join(' / ')}</strong>
            </div>
          </div>

          <div className="status-row">
            <StatusPill enabled={tool.supportAutoUpdate} trueText="支持自动/直接同步" falseText="不支持自动更新" />
            <StatusPill enabled={!tool.needReinstallWhenUpdate} trueText="无需重新安装" falseText="更新后需重新安装" />
          </div>

          <p className="version-note">{tool.versionNote}</p>

          {tool.matchUrls && tool.matchUrls.length > 0 ? (
            <div className="match-box">
              <span>适用页面 / 场景</span>
              {tool.matchUrls.map((url) => (
                <code key={url}>{url}</code>
              ))}
            </div>
          ) : null}

          <div className="detail-actions">
            {primaryAction.url ? (
              <a
                className="primary-button"
                href={primaryAction.url}
                target={primaryAction.isExternal ? '_blank' : '_self'}
                rel="noreferrer"
              >
                {primaryAction.label}
              </a>
            ) : null}

            <CopyButton text={primaryAction.url} />
          </div>
        </section>

        <section className="detail-block">
          <div className="section-heading">
            <span>说明文档</span>
          </div>
          <div className="doc-content">{renderDoc(tool.doc)}</div>
        </section>

        <section className="detail-block">
          <div className="section-heading">
            <span>更新日志</span>
          </div>

          <div className="changelog-list">
            {tool.changelog.map((log) => (
              <div key={`${tool.id}-${log.version}`} className="changelog-item">
                <div className="changelog-top">
                  <strong>v{log.version}</strong>
                  <span>{log.date}</span>
                </div>
                <ul>
                  {log.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>
    </aside>
  )
}

function App() {
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

  function handleSelect(tool: ToolItem) {
    setSelectedId(tool.id)
  }

  return (
    <main className="page-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Yuki Tool Hub</p>
          <h1>工具发布中心</h1>
          <p className="hero-desc">
            统一发布篡改猴脚本、浏览器插件 zip、网页工具和 Python 脚本。用户只需要收藏这个页面，就可以看到最新版本、说明文档和更新日志。
          </p>
        </div>

        <div className="hero-card">
          <span>工具总数</span>
          <strong>{tools.length}</strong>
          <p>修改 src/tools.ts 后重新部署即可更新页面。</p>
        </div>
      </header>

      <section className="toolbar">
        <div className="filter-tabs">
          {filters.map((filter) => (
            <button
              key={filter.key}
              className={activeKind === filter.key ? 'tab-button active' : 'tab-button'}
              type="button"
              onClick={() => setActiveKind(filter.key)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <label className="search-box">
          <span>搜索</span>
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="输入工具名称、标签、版本或适用页面"
          />
        </label>
      </section>

      <section className="content-grid">
        <div className="tool-list">
          {filteredTools.length > 0 ? (
            filteredTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} active={selectedTool?.id === tool.id} onSelect={handleSelect} />
            ))
          ) : (
            <div className="empty-box">
              <strong>没有找到匹配工具</strong>
              <p>可以换一个关键词，或切换到「全部」分类。</p>
            </div>
          )}
        </div>

        {selectedTool ? <DetailPanel tool={selectedTool} /> : null}
      </section>
    </main>
  )
}

export default App
