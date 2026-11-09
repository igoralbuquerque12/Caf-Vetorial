import { useEffect, useMemo, useState } from 'react'
import { getHighlighter, type CodeLanguage } from './highlighter'

export type { CodeLanguage }

const LANGUAGE_LABELS: Record<CodeLanguage, string> = {
  java: 'Java',
  yaml: 'YAML',
  sql: 'SQL',
  http: 'HTTP',
  json: 'JSON',
  typescript: 'Nest / TypeScript',
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function fallbackHtml(code: string, highlight?: [number, number]): string {
  const [start, end] = highlight ?? [0, -1]
  const lines = code
    .split('\n')
    .map((line, idx) => {
      const n = idx + 1
      const hl = n >= start && n <= end ? ' hl' : ''
      return `<span class="line${hl}">${escapeHtml(line)}</span>`
    })
    .join('\n')
  return `<pre><code>${lines}</code></pre>`
}

export function CodeBlock({
  code,
  language,
  highlight,
  title,
  caption,
}: {
  code: string
  language: CodeLanguage
  highlight?: [number, number]
  title?: string
  /** Para Java, o padrão é "Trecho ilustrativo do backend". */
  caption?: string
}) {
  const trimmed = useMemo(() => code.replace(/^\n+|\n+$/g, ''), [code])
  const [start, end] = highlight ?? [0, -1]
  const cacheKey = `${language}:${start}:${end}:${trimmed}`
  const [highlighted, setHighlighted] = useState<{ key: string; html: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    getHighlighter()
      .then((highlighter) => {
        if (cancelled) return
        const rendered = highlighter.codeToHtml(trimmed, {
          lang: language,
          theme: 'copilot-metro',
          transformers: [
            {
              line(node, line) {
                if (line >= start && line <= end) this.addClassToHast(node, 'hl')
              },
            },
          ],
        })
        setHighlighted({ key: cacheKey, html: rendered })
      })
      .catch(() => {
        /* mantém o fallback */
      })
    return () => {
      cancelled = true
    }
  }, [cacheKey, trimmed, language, start, end])

  const html = highlighted?.key === cacheKey ? highlighted.html : fallbackHtml(trimmed, [start, end])
  const effectiveCaption = caption ?? (language === 'java' ? 'Trecho ilustrativo do backend' : undefined)

  return (
    <figure className="m-0 overflow-hidden rounded-xl border border-slate-800/90 bg-[#090f1e]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/90 bg-slate-900/70 px-3.5 py-2 text-xs text-slate-400">
        <span className="font-mono font-medium text-slate-200">{title ?? LANGUAGE_LABELS[language]}</span>
        {effectiveCaption && <span className="text-[11px] text-slate-400">{effectiveCaption}</span>}
      </div>
      <div className="code-block" dangerouslySetInnerHTML={{ __html: html }} />
    </figure>
  )
}
