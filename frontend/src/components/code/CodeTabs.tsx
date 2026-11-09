import { useState } from 'react'
import type { Snippet } from '../../flows/types'
import { Tabs } from '../ui/Tabs'
import { CodeBlock, type CodeLanguage } from './CodeBlock'

export interface CodeTab {
  id: string
  label: string
  snippet: { language: CodeLanguage; code: string; highlight?: [number, number] } | Snippet
  note?: string
}

export function CodeTabs({ tabs, ariaLabel }: { tabs: CodeTab[]; ariaLabel: string }) {
  const [activeId, setActiveId] = useState(tabs[0]?.id ?? '')
  const current = tabs.find((t) => t.id === activeId) ?? tabs[0]
  if (!current) return null

  return (
    <div className="flex flex-col gap-3">
      <Tabs
        ariaLabel={ariaLabel}
        items={tabs.map((t) => ({ id: t.id, label: t.label }))}
        value={current.id}
        onChange={setActiveId}
      />
      {current.note && <p className="prose-copilot text-sm text-cream-muted">{current.note}</p>}
      <CodeBlock
        code={current.snippet.code}
        language={current.snippet.language}
        highlight={current.snippet.highlight}
        title={current.label}
      />
    </div>
  )
}
