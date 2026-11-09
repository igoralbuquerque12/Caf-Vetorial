import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { listDocuments } from '../api/documents'
import { PromptsSection } from '../components/infra/PromptsSection'
import { QueueJourney } from '../components/infra/QueueJourney'
import { S3Flow } from '../components/infra/S3Flow'
import { SystemMap, type InsideSectionId } from '../components/infra/SystemMap'
import { VectorFlow } from '../components/infra/VectorFlow'
import { Tabs } from '../components/ui/Tabs'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { useDemo } from '../stores/demo'

const SECTION_TABS = [
  { id: 'fila' as const, label: 'Fila (RabbitMQ)' },
  { id: 's3' as const, label: 'Armazenamento (S3)' },
  { id: 'vetores' as const, label: 'Vetores (pgvector e RAG)' },
  { id: 'prompts' as const, label: 'Prompts' },
]

export function Inside() {
  const markDemo = useDemo((s) => s.mark)
  const reducedMotion = useReducedMotion()
  const [activeSection, setActiveSection] = useState<InsideSectionId>('fila')
  const filaRef = useRef<HTMLDivElement | null>(null)
  const s3Ref = useRef<HTMLDivElement | null>(null)
  const vetoresRef = useRef<HTMLDivElement | null>(null)
  const promptsRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    markDemo('journey')
  }, [markDemo])

  const documentsQuery = useQuery({
    queryKey: ['documents'],
    queryFn: listDocuments,
    refetchInterval: (query) => {
      const list = query.state.data ?? []
      return list.some((d) => d.status === 'PENDING' || d.status === 'PROCESSING') ? 2000 : false
    },
  })

  const latestDocument = documentsQuery.data?.[0] ?? null

  const jumpTo = (section: InsideSectionId) => {
    setActiveSection(section)
    const target =
      section === 'fila'
        ? filaRef.current
        : section === 's3'
          ? s3Ref.current
          : section === 'vetores'
            ? vetoresRef.current
            : promptsRef.current
    target?.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'start',
    })
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800/90 bg-slate-900/60 p-5">
        <div>
          <h1 className="text-xl font-semibold text-white">Por dentro da infraestrutura</h1>
          <p className="prose-copilot mt-1 text-sm text-slate-400">
            Como a fila RabbitMQ, o bucket S3, o índice HNSW no PostgreSQL e os templates de prompt conversam com a API
            Spring Boot.
          </p>
        </div>
        <Tabs
          ariaLabel="Seções de infraestrutura"
          items={SECTION_TABS}
          value={activeSection}
          onChange={jumpTo}
        />
      </header>

      <SystemMap activeSection={activeSection} onSelectSection={jumpTo} />

      <div ref={filaRef}>
        <QueueJourney latestDocument={latestDocument} />
      </div>

      <div ref={s3Ref}>
        <S3Flow />
      </div>

      <div ref={vetoresRef}>
        <VectorFlow />
      </div>

      <div ref={promptsRef}>
        <PromptsSection />
      </div>
    </main>
  )
}
