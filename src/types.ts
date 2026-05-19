export type ToolKind = 'userscript' | 'browser-extension' | 'web-tool' | 'python-script'

export interface ChangeLogItem {
  version: string
  date: string
  items: string[]
}

export interface ToolItem {
  id: string
  name: string
  kind: ToolKind
  version: string
  updateTime: string
  summary: string
  tags: string[]
  platform: string[]
  matchUrls?: string[]
  installUrl?: string
  downloadUrl?: string
  openUrl?: string
  sourceUrl?: string
  supportAutoUpdate: boolean
  needReinstallWhenUpdate: boolean
  versionNote: string
  doc: string
  changelog: ChangeLogItem[]
  /** 是否在页面中作为重点更新展示 */
  important?: boolean
}
