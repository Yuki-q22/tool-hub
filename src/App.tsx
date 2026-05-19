import React, { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  BookOpen,
  Box,
  Check,
  CheckCircle2,
  Clock,
  Code,
  Copy,
  Download,
  ExternalLink,
  FileCode,
  FileJson,
  Filter,
  Globe,
  Info,
  Layers,
  Link as LinkIcon,
  Megaphone,
  Monitor,
  PackageOpen,
  Play,
  Puzzle,
  RefreshCw,
  ScrollText,
  Search,
  Sparkles,
  Tag,
  Terminal,
  Zap
} from 'lucide-react'
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

const detailTabs: Array<{ key: DetailTab; label: string; icon: React.ReactNode }> = [
  { key: 'overview', label: '版本信息', icon: <Info size={14} /> },
  { key: 'usage', label: '安装使用', icon: <BookOpen size={14} /> },
  { key: 'changelog', label: '更新日志', icon: <ScrollText size={14} /> }
]

const kindIcons: Record<ToolKind, React.ReactNode> = {
  userscript: <FileCode size={13} strokeWidth={2.5} />,
  'browser-extension': <Puzzle size={13} strokeWidth={2.5} />,
  'web-tool': <Globe size={13} strokeWidth={2.5} />,
  'python-script': <Terminal size={13} strokeWidth={2.5} />
}

const kindIconLarge: Record<ToolKind, React.ReactNode> = {
  userscript: <FileCode size={18} strokeWidth={2} />,
  'browser-extension': <Puzzle size={18} strokeWidth={2} />,
  'web-tool': <Globe size={18} strokeWidth={2} />,
  'python-script': <Terminal size={18} strokeWidth={2} />
}

function getPrimaryAction(tool: ToolItem): { label: string; url: string; isExternal: boolean; icon: React.ReactNode } {
  if (tool.kind === 'userscript') {
    return { label: '安装脚本', url: tool.installUrl || '', isExternal: false, icon: <Play size={15} /> }
  }
  if (tool.kind === 'browser-extension') {
    return { label: '下载最新版 zip', url: tool.downloadUrl || '', isExternal: true, icon: <Download size={15} /> }
  }
  if (tool.kind === 'web-tool') {
    return { label: '打开工具', url: tool.openUrl || '', isExternal: true, icon: <ExternalLink size={15} /> }
  }
  return { label: '下载最新版', url: tool.downloadUrl || '', isExternal: true, icon: <Download size={15} /> }
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

function getSearchableText(tool: ToolItem): string {
  return normalizeText(
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
}

/* ---------- 高亮组件 ---------- */

function HighlightText({ text, keyword }: { text: string; keyword: string }): React.ReactElement {
  if (!keyword.trim()) return <>{text}</>
  const q = normalizeText(keyword)
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  const parts = text.split(regex)
  return (
    <>
      {parts.map((part, i) =>
        normalizeText(part) === q ? (
          <mark key={i} className="search-highlight">{part}</mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  )
}

/* ---------- 通用组件 ---------- */

function CopyButton({
  text,
  label = '复制链接',
  copiedLabel = '已复制',
  className = 'ghost-button',
  icon = <Copy size={14} />
}: {
  text: string
  label?: string
  copiedLabel?: string
  className?: string
  icon?: React.ReactNode
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

  return (
    <button className={className} type="button" onClick={handleCopy} disabled={!text}>
      {copied ? <Check size={14} className="btn-icon" /> : icon}
      <span>{copied ? copiedLabel : label}</span>
    </button>
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
  return (
    <span className={enabled ? 'pill pill-success' : 'pill pill-warning'}>
      {enabled ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
      <span>{enabled ? trueText : falseText}</span>
    </span>
  )
}

/* ---------- 文档渲染 ---------- */

function renderDocBlocks(doc: string, keyPrefix = 'doc'): React.ReactElement[] {
  const lines = doc.trim().split('\n')
  const result: React.ReactElement[] = []

  lines.forEach((line, index) => {
    const trimmed = line.trim()
    const key = `${keyPrefix}-${index}`

    if (!trimmed) {
      result.push(<div key={key} className="doc-space" />)
      return
    }
    if (trimmed.startsWith('### ')) {
      result.push(<h4 key={key} className="doc-title">{trimmed.replace(/^###\s+/, '')}</h4>)
      return
    }
    if (trimmed.startsWith('- ')) {
      result.push(
        <div key={key} className="doc-bullet">
          <span>•</span>
          <p>{trimmed.replace(/^-\s+/, '')}</p>
        </div>
      )
      return
    }
    if (/^\d+\.\s+/.test(trimmed)) {
      result.push(
        <div key={key} className="doc-step">
          <span>{trimmed.match(/^\d+/)?.[0] || ''}</span>
          <p>{trimmed.replace(/^\d+\.\s+/, '')}</p>
        </div>
      )
      return
    }
    result.push(<p key={key} className="doc-paragraph">{trimmed.replace(/`/g, '')}</p>)
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

  return (
    <div className="doc-accordion">
      {safeSections.map((section, index) => (
        <details key={`${section.title}-${index}`} className="doc-collapse" open={index === 0}>
          <summary>{section.title}</summary>
          <div className="doc-content">
            {renderDocBlocks(section.body.join('\n'), `${section.title}-${index}`)}
          </div>
        </details>
      ))}
    </div>
  )
}

/* ---------- 子组件 ---------- */

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

  return (
    <section className="update-board">
      <div className="update-board-main">
        <div className="section-heading compact">
          <Megaphone size={16} />
          <span>最新更新公告</span>
        </div>
        <h2>
          {featuredTool.name} v{featuredTool.version}
        </h2>
        <p className="update-summary">{featuredTool.summary}</p>
        <div className="update-meta-row">
          <span>
            <Clock size={12} />
            更新时间：{getAnnouncementDate(featuredTool)}
          </span>
          <span>{kindLabels[featuredTool.kind]}</span>
          <span>
            {featuredTool.supportAutoUpdate ? (
              <>
                <Zap size={12} /> 支持自动/直接同步
              </>
            ) : (
              <>
                <Download size={12} /> 需手动下载更新
              </>
            )}
          </span>
        </div>
        <div className="update-actions">
          <button className="primary-button" type="button" onClick={() => onSelect(featuredTool)}>
            <Info size={15} />
            <span>查看详情</span>
          </button>
          {featuredAction.url && (
            <a
              className="ghost-button"
              href={featuredAction.url}
              target={featuredAction.isExternal ? '_blank' : '_self'}
              rel="noreferrer"
            >
              {featuredAction.icon}
              <span>{featuredAction.label}</span>
            </a>
          )}
          <CopyButton text={announcementText} label="复制公告" copiedLabel="已复制" icon={<Copy size={14} />} />
        </div>
      </div>
      <div className="update-board-list">
        {latestTools.map((tool) => {
          const latestLog = tool.changelog[0]
          return (
            <button
              key={tool.id}
              className="update-mini-card"
              type="button"
              onClick={() => onSelect(tool)}
            >
              <div className="update-mini-header">
                <span className={`tool-kind mini kind-${tool.kind}`}>
                  {kindIcons[tool.kind]}
                  {kindLabels[tool.kind]}
                </span>
              </div>
              <strong>{tool.name}</strong>
              <small>
                v{tool.version} · {getAnnouncementDate(tool)}
              </small>
              {latestLog?.items?.[0] ? <p>{latestLog.items[0]}</p> : null}
            </button>
          )
        })}
      </div>
    </section>
  )
}

function ToolCard({
  tool,
  active,
  keyword,
  onSelect
}: {
  tool: ToolItem
  active: boolean
  keyword: string
  onSelect: (tool: ToolItem) => void
}): React.ReactElement {
  const primaryAction = getPrimaryAction(tool)
  const cardClassName = active
    ? `tool-card tool-card-active kind-${tool.kind}`
    : `tool-card kind-${tool.kind}`

  return (
    <article className={cardClassName} onClick={() => onSelect(tool)}>
      <div className="tool-card-accent" />
      <div className="tool-card-header">
        <div>
          <div className={`tool-kind kind-${tool.kind}`}>
            {kindIcons[tool.kind]}
            {kindLabels[tool.kind]}
          </div>
          <h3>
            <HighlightText text={tool.name} keyword={keyword} />
          </h3>
        </div>
        <div className="version-badge">
          <Tag size={11} />
          v{tool.version}
        </div>
      </div>
      <p className="tool-summary">
        <HighlightText text={tool.summary} keyword={keyword} />
      </p>
      <div className="tag-row">
        {tool.tags.map((tag) => (
          <span key={tag} className="tag">
            <Filter size={10} />
            <HighlightText text={tag} keyword={keyword} />
          </span>
        ))}
      </div>
      <div className="meta-grid">
        <div>
          <span className="meta-label">
            <Clock size={12} />
            更新时间
          </span>
          <strong>{tool.updateTime}</strong>
        </div>
        <div>
          <span className="meta-label">
            <RefreshCw size={12} />
            更新方式
          </span>
          <strong>{tool.supportAutoUpdate ? '可自动/直接同步' : '需手动下载'}</strong>
        </div>
      </div>
      <div
        className="card-actions"
        onClick={(event: React.MouseEvent<HTMLDivElement>) => event.stopPropagation()}
      >
        {primaryAction.url ? (
          <a
            className="primary-button"
            href={primaryAction.url}
            target={primaryAction.isExternal ? '_blank' : '_self'}
            rel="noreferrer"
          >
            {primaryAction.icon}
            <span>{primaryAction.label}</span>
          </a>
        ) : (
          <button className="primary-button disabled" type="button" disabled>
            <AlertCircle size={15} />
            <span>未配置链接</span>
          </button>
        )}
        <CopyButton text={getAbsoluteUrl(primaryAction.url)} />
      </div>
    </article>
  )
}

function ChangelogList({ tool }: { tool: ToolItem }): React.ReactElement {
  return (
    <div className="changelog-list">
      {tool.changelog.map((log) => (
        <div key={`${tool.id}-${log.version}`} className="changelog-item">
          <div className="changelog-top">
            <div className="changelog-badge">
              <Tag size={12} />
              <strong>v{log.version}</strong>
            </div>
            <span>
              <Clock size={12} />
              {log.date}
            </span>
          </div>
          <ul>
            {log.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

function DetailPanel({ tool }: { tool: ToolItem }): React.ReactElement {
  const primaryAction = getPrimaryAction(tool)
  const [activeTab, setActiveTab] = useState<DetailTab>('overview')

  useEffect(() => {
    setActiveTab('overview')
  }, [tool.id])

  const pythonCommand = useMemo(() => {
    if (tool.kind !== 'python-script') return ''
    return `cd <解压文件夹>\npip install -r requirements.txt\npython main.py`
  }, [tool.kind])

  return (
    <aside className="detail-panel">
      <div className="detail-sticky">
        <section className="detail-block detail-head">
          <div className={`tool-kind kind-${tool.kind}`}>
            {kindIconLarge[tool.kind]}
            {kindLabels[tool.kind]}
          </div>
          <h2>{tool.name}</h2>
          <p className="detail-summary">{tool.summary}</p>
          <div className="detail-actions">
            {primaryAction.url && (
              <a
                className="primary-button"
                href={primaryAction.url}
                target={primaryAction.isExternal ? '_blank' : '_self'}
                rel="noreferrer"
              >
                {primaryAction.icon}
                <span>{primaryAction.label}</span>
              </a>
            )}
            <CopyButton text={getAbsoluteUrl(primaryAction.url)} />
            {tool.sourceUrl && (
              <a className="ghost-button" href={tool.sourceUrl} target="_blank" rel="noreferrer">
                <Code size={14} />
                <span>查看源码</span>
              </a>
            )}
            {pythonCommand && (
              <CopyButton text={pythonCommand} label="复制运行命令" copiedLabel="命令已复制" icon={<Terminal size={14} />} />
            )}
          </div>
        </section>

        <section className="detail-block tabbed-detail">
          <div className="detail-tab-list">
            {detailTabs.map((tab) => (
              <button
                key={tab.key}
                className={activeTab === tab.key ? 'detail-tab active' : 'detail-tab'}
                type="button"
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div className="detail-tab-panel">
              <div className="version-table">
                <div>
                  <span>
                    <Tag size={12} />
                    当前版本
                  </span>
                  <strong>v{tool.version}</strong>
                </div>
                <div>
                  <span>
                    <Clock size={12} />
                    更新时间
                  </span>
                  <strong>{tool.updateTime}</strong>
                </div>
                <div>
                  <span>
                    <Layers size={12} />
                    工具类型
                  </span>
                  <strong>{kindLabels[tool.kind]}</strong>
                </div>
                <div>
                  <span>
                    <Monitor size={12} />
                    适用平台
                  </span>
                  <strong>{tool.platform.join(' / ')}</strong>
                </div>
              </div>
              <div className="status-row">
                <StatusPill
                  enabled={tool.supportAutoUpdate}
                  trueText="支持自动/直接同步"
                  falseText="不支持自动更新"
                />
                <StatusPill
                  enabled={!tool.needReinstallWhenUpdate}
                  trueText="无需重新安装"
                  falseText="更新后需重新安装"
                />
              </div>
              <p className="version-note">{tool.versionNote}</p>
              {tool.matchUrls && tool.matchUrls.length > 0 && (
                <div className="match-box">
                  <span>
                    <LinkIcon size={12} />
                    适用页面 / 场景
                  </span>
                  {tool.matchUrls.map((url) => (
                    <code key={url}>{url}</code>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'usage' && (
            <div className="detail-tab-panel">{renderDocSections(tool.doc)}</div>
          )}

          {activeTab === 'changelog' && (
            <div className="detail-tab-panel">
              <ChangelogList tool={tool} />
            </div>
          )}
        </section>
      </div>
    </aside>
  )
}

/* ---------- URL 同步 ---------- */

function getInitialToolId(): string {
  if (typeof window === 'undefined') return tools[0]?.id ?? ''
  const params = new URLSearchParams(window.location.search)
  const toolId = params.get('tool')
  if (toolId && tools.some((t) => t.id === toolId)) {
    return toolId
  }
  return tools[0]?.id ?? ''
}

function updateUrlTool(toolId: string): void {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  if (toolId && toolId !== tools[0]?.id) {
    url.searchParams.set('tool', toolId)
  } else {
    url.searchParams.delete('tool')
  }
  window.history.replaceState({}, '', url.toString())
}

/* ---------- 主组件 ---------- */

export default function App(): React.ReactElement {
  const [activeKind, setActiveKind] = useState<FilterKind>('all')
  const [keyword, setKeyword] = useState('')
  const [selectedId, setSelectedId] = useState(getInitialToolId)

  const latestTools = useMemo(() => getLatestTools(tools, 3), [])

  const filteredTools = useMemo(() => {
    const q = normalizeText(keyword)
    return tools.filter((tool) => {
      const kindMatched = activeKind === 'all' || tool.kind === activeKind
      if (!kindMatched) return false
      if (!q) return true
      return getSearchableText(tool).includes(q)
    })
  }, [activeKind, keyword])

  const selectedTool = useMemo(() => {
    const byId = tools.find((tool) => tool.id === selectedId)
    if (byId && filteredTools.some((t) => t.id === selectedId)) {
      return byId
    }
    return filteredTools[0] ?? tools[0]
  }, [filteredTools, selectedId])

  useEffect(() => {
    updateUrlTool(selectedTool?.id ?? '')
  }, [selectedTool])

  function handleSelect(tool: ToolItem): void {
    setSelectedId(tool.id)
  }

  return (
    <main className="page-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">
            <Sparkles size={14} />
            <span>tool-hub</span>
          </p>
          <h1>工具发布中心</h1>
          <p className="hero-desc">
            统一发布篡改猴脚本、浏览器插件 zip、网页工具和 Python
            脚本。用户只需要收藏这个页面，就可以查看最新版本、安装说明和更新日志。
          </p>
        </div>
        <div className="hero-card">
          <div className="hero-card-icon">
            <Box size={28} />
          </div>
          <div className="hero-card-body">
            <span>工具总数</span>
            <strong>{tools.length}</strong>
            <p>修改 src/tools.ts 后重新部署即可更新页面。</p>
          </div>
        </div>
      </header>

      <HomeAnnouncement latestTools={latestTools} onSelect={handleSelect} />

      <section className="toolbar">
        <div className="filter-tabs">
          {filters.map((filter) => (
            <button
              key={filter.key}
              className={activeKind === filter.key ? 'tab-button active' : 'tab-button'}
              type="button"
              onClick={() => setActiveKind(filter.key)}
            >
              {filter.key !== 'all' && kindIcons[filter.key as ToolKind]}
              {filter.label}
            </button>
          ))}
        </div>
        <label className="search-box">
          <Search size={16} className="search-icon" />
          <input
            value={keyword}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setKeyword(event.target.value)}
            placeholder="输入工具名称、标签、版本或适用页面"
          />
        </label>
      </section>

      <section className="content-grid">
        <div className="tool-list">
          {filteredTools.length > 0 ? (
            filteredTools.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                active={selectedTool?.id === tool.id}
                keyword={keyword}
                onSelect={handleSelect}
              />
            ))
          ) : (
            <div className="empty-box">
              <PackageOpen size={40} strokeWidth={1.5} />
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
