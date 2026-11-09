import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Compass, PanelRightClose, PanelRightOpen } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { askQuestion } from '../api/chat'
import { listDocuments, uploadDocument } from '../api/documents'
import { ApiError, messageOf } from '../api/problem'
import type { DocumentResponse } from '../api/types'
import { AskBox } from '../components/chat/AskBox'
import { ChatThread } from '../components/chat/ChatThread'
import type { ChatMessage } from '../components/chat/MessageBubble'
import { PromptAnatomy } from '../components/chat/PromptAnatomy'
import { DocumentList } from '../components/documents/DocumentList'
import { UploadZone } from '../components/documents/UploadZone'
import { MetroMap } from '../components/metro/MetroMap'
import { Button } from '../components/ui/Button'
import { StatusBadge } from '../components/ui/StatusBadge'
import { toneForHttpStatus } from '../components/ui/statusHelpers'
import { Tabs } from '../components/ui/Tabs'
import { getFlow, getVariant } from '../flows/catalog'
import { chatAsk } from '../flows/documentFlows'
import { useDemo } from '../stores/demo'
import { countLabel, useInspector } from '../stores/inspector'
import { useToasts } from '../stores/toasts'

type MobilePane = 'documentos' | 'conversa' | 'raiox'

const MOBILE_TABS = [
  { id: 'documentos' as const, label: 'Documentos' },
  { id: 'conversa' as const, label: 'Conversa' },
  { id: 'raiox' as const, label: 'Raio-X' },
]

export function Workspace() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const pushToast = useToasts((s) => s.push)
  const markDemo = useDemo((s) => s.mark)
  const records = useInspector((s) => s.records)
  const selectRecord = useInspector((s) => s.select)

  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [messagesByDoc, setMessagesByDoc] = useState<Record<string, ChatMessage[]>>({})
  const [asking, setAsking] = useState(false)
  const [questionFieldError, setQuestionFieldError] = useState<string | null>(null)
  const [promptModalMessage, setPromptModalMessage] = useState<ChatMessage | null>(null)
  const [xrayCollapsed, setXrayCollapsed] = useState(false)
  const [mobilePane, setMobilePane] = useState<MobilePane>('documentos')

  const documentsQuery = useQuery({
    queryKey: ['documents'],
    queryFn: listDocuments,
    refetchInterval: (query) => {
      const list = query.state.data ?? []
      return list.some((d) => d.status === 'PENDING' || d.status === 'PROCESSING') ? 2000 : false
    },
  })

  const documents = useMemo(() => documentsQuery.data ?? [], [documentsQuery.data])
  const hasCompletedDocument = useMemo(() => documents.some((d) => d.status === 'COMPLETED'), [documents])

  useEffect(() => {
    if (hasCompletedDocument) {
      markDemo('track')
    }
  }, [hasCompletedDocument, markDemo])

  const effectiveDocId = useMemo(() => {
    if (selectedDocId && documents.some((d) => d.id === selectedDocId)) {
      return selectedDocId
    }
    return documents.find((d) => d.status === 'COMPLETED')?.id ?? documents[0]?.id ?? null
  }, [documents, selectedDocId])

  const selectedDocument: DocumentResponse | null = useMemo(
    () => documents.find((d) => d.id === effectiveDocId) ?? null,
    [documents, effectiveDocId],
  )

  const currentMessages = effectiveDocId ? messagesByDoc[effectiveDocId] ?? [] : []

  const appendMessage = (docId: string, msg: ChatMessage) => {
    setMessagesByDoc((prev) => ({
      ...prev,
      [docId]: [...(prev[docId] ?? []), msg],
    }))
  }

  const handleUpload = async (file: File, onProgress: (fraction: number) => void) => {
    const { document } = await uploadDocument(file, onProgress)
    pushToast('PDF enviado', 'ok')
    markDemo('upload')
    setSelectedDocId(document.id)
    await queryClient.invalidateQueries({ queryKey: ['documents'] })
  }

  const handleSelectDocument = (doc: DocumentResponse) => {
    setSelectedDocId(doc.id)
    if (doc.status === 'COMPLETED') {
      setMobilePane('conversa')
    }
  }

  const handleAsk = async (question: string) => {
    if (!selectedDocument) return
    const docId = selectedDocument.id
    setQuestionFieldError(null)
    appendMessage(docId, {
      id: `u-${Date.now()}`,
      role: 'user',
      text: question,
    })
    setAsking(true)
    try {
      const response = await askQuestion(question, docId)
      const latestRecord = useInspector.getState().records[useInspector.getState().records.length - 1]
      markDemo('ask')
      appendMessage(docId, {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: response.answer,
        question,
        sources: response.sources,
        inspectorRecordId: latestRecord?.id,
      })
    } catch (error) {
      const latestRecord = useInspector.getState().records[useInspector.getState().records.length - 1]
      if (error instanceof ApiError) {
        if (error.status === 400 && error.fieldErrors.question) {
          setQuestionFieldError(error.fieldErrors.question)
          return
        }
        if (error.status === 409 || error.status === 404 || error.status === 502) {
          const docStatus = error.documentStatus
          const extra =
            error.status === 409 && docStatus
              ? ` (documentStatus reportado pela API: ${docStatus})`
              : ''
          appendMessage(docId, {
            id: `s-${Date.now()}`,
            role: 'system',
            text: `${messageOf(error)}${extra}`,
            httpStatus: error.status,
            documentStatus: docStatus,
            inspectorRecordId: latestRecord?.id,
          })
          return
        }
      }
      appendMessage(docId, {
        id: `s-${Date.now()}`,
        role: 'system',
        text: messageOf(error),
        httpStatus: error instanceof ApiError ? error.status : undefined,
        inspectorRecordId: latestRecord?.id,
      })
    } finally {
      setAsking(false)
    }
  }

  const handleOpenXRay = (recordId?: string) => {
    markDemo('xray')
    if (recordId) selectRecord(recordId)
    navigate('/raio-x')
  }

  const handleOpenPrompt = (message: ChatMessage) => {
    markDemo('prompt')
    setPromptModalMessage(message)
  }

  const lastRecord = records[records.length - 1] ?? null
  const lastFlow = lastRecord?.flowId ? getFlow(lastRecord.flowId) ?? chatAsk : chatAsk
  const lastVariant = getVariant(lastFlow, lastRecord?.variantId)

  return (
    <div className="flex flex-1 flex-col">
      {/* Seletor de abas no mobile */}
      <div className="border-b border-slate-800/80 bg-slate-900/70 px-4 py-2 lg:hidden">
        <Tabs
          ariaLabel="Colunas do Workspace"
          items={MOBILE_TABS}
          value={mobilePane}
          onChange={setMobilePane}
        />
      </div>

      <div className="grid flex-1 lg:grid-cols-12">
        {/* Coluna 1: Documentos */}
        <section
          aria-label="Documentos"
          className={`flex flex-col gap-4 border-r border-slate-800/80 bg-slate-900/40 p-4 lg:col-span-3 ${
            mobilePane === 'documentos' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-white">Documentos</h2>
            <span className="rounded-full bg-slate-800/80 px-2.5 py-0.5 text-[11px] font-medium text-slate-400">
              {documents.length} no total
            </span>
          </div>

          <UploadZone onUpload={handleUpload} />

          <DocumentList
            documents={documents}
            selectedId={effectiveDocId}
            loading={documentsQuery.isLoading}
            error={documentsQuery.error ? messageOf(documentsQuery.error) : null}
            onSelect={handleSelectDocument}
            onRetry={() => void documentsQuery.refetch()}
          />
        </section>

        {/* Coluna 2: Conversa */}
        <section
          aria-label="Conversa"
          className={`flex flex-col bg-slate-950 ${
            xrayCollapsed ? 'lg:col-span-9' : 'lg:col-span-5'
          } ${mobilePane === 'conversa' ? 'flex' : 'hidden lg:flex'}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 bg-slate-900/50 px-4 py-3">
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-semibold text-white">
                {selectedDocument
                  ? `Conversa sobre: ${selectedDocument.fileName}`
                  : 'Conversa sobre o documento'}
              </h2>
            </div>

            <div className="hidden lg:block shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setXrayCollapsed((c) => !c)}
                aria-label={xrayCollapsed ? 'Expandir painel Raio-X' : 'Recolher painel Raio-X'}
              >
                {xrayCollapsed ? (
                  <>
                    <PanelRightOpen className="h-3.5 w-3.5" />
                    <span>Mostrar Raio-X</span>
                  </>
                ) : (
                  <>
                    <PanelRightClose className="h-3.5 w-3.5" />
                    <span>Recolher Raio-X</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          <ChatThread
            document={selectedDocument}
            messages={currentMessages}
            busy={asking}
            onSuggestion={(q) => void handleAsk(q)}
            onOpenXRay={handleOpenXRay}
            onOpenPrompt={handleOpenPrompt}
          />

          <AskBox
            document={selectedDocument}
            busy={asking}
            fieldError={questionFieldError}
            onAsk={handleAsk}
          />
        </section>

        {/* Coluna 3: Raio-X recolhível */}
        {!xrayCollapsed && (
          <aside
            aria-label="Raio-X da última requisição"
            className={`flex flex-col gap-3.5 border-l border-slate-800/80 bg-slate-900/40 p-4 lg:col-span-4 ${
              mobilePane === 'raiox' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-white">Raio-X</h2>
              <Button variant="secondary" size="sm" onClick={() => handleOpenXRay(lastRecord?.id)}>
                <Compass className="h-3.5 w-3.5 text-cyan-400" />
                <span>Abrir no Raio-X</span>
              </Button>
            </div>

            {lastRecord ? (
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                  <div className="min-w-0">
                    <span className="block truncate font-mono text-xs font-semibold text-slate-100">
                      {lastRecord.method} {lastRecord.path}
                    </span>
                    {countLabel(lastRecord) && (
                      <span className="text-[11px] text-slate-400">{countLabel(lastRecord)}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge
                      label={lastRecord.status === 0 ? 'REDE' : String(lastRecord.status)}
                      tone={toneForHttpStatus(lastRecord.status)}
                    />
                    <span className="text-xs font-medium text-slate-400">{lastRecord.durationMs} ms</span>
                  </div>
                </div>

                {lastRecord.warning && (
                  <p className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-300">
                    {lastRecord.warning}
                  </p>
                )}

                <MetroMap flow={lastFlow} variant={lastVariant} compact showControls={false} />
              </div>
            ) : (
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4 text-xs text-slate-400 leading-relaxed">
                Nenhuma requisição registrada ainda. Assim que você enviar um PDF ou fizer uma pergunta, o caminho
                aparece aqui.
              </div>
            )}
          </aside>
        )}
      </div>

      <PromptAnatomy
        open={Boolean(promptModalMessage)}
        onClose={() => setPromptModalMessage(null)}
        question={promptModalMessage?.question ?? ''}
        sources={promptModalMessage?.sources ?? []}
      />
    </div>
  )
}
