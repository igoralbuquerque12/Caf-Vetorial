import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CodeBlock } from '../components/code/CodeBlock'
import { MetroMap } from '../components/metro/MetroMap'
import { StationSheet } from '../components/metro/StationSheet'
import { StatusBadge } from '../components/ui/StatusBadge'
import { toneForHttpStatus } from '../components/ui/statusHelpers'
import { Tabs } from '../components/ui/Tabs'
import { flowCatalog, flowRoute, getFlow, getVariant, stepsOfVariant } from '../flows/catalog'
import { countLabel, useInspector, type InspectorRecord } from '../stores/inspector'

function formatRawHttpRequest(record: InspectorRecord): string {
  const headerLines = Object.entries(record.requestHeaders)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')
  const body =
    record.requestBody !== undefined
      ? `\n\n${typeof record.requestBody === 'string' ? record.requestBody : JSON.stringify(record.requestBody, null, 2)}`
      : ''
  return `${record.method} ${record.path} HTTP/1.1\n${headerLines}${body}`
}

function formatRawHttpResponse(record: InspectorRecord): string {
  const headerLines = Object.entries(record.responseHeaders)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')
  const body =
    record.responseBody !== undefined && record.responseBody !== ''
      ? `\n\n${typeof record.responseBody === 'string' ? record.responseBody : JSON.stringify(record.responseBody, null, 2)}`
      : ''
  return `HTTP/1.1 ${record.status}${headerLines ? `\n${headerLines}` : ''}${body}`
}

const HTTP_TABS = [
  { id: 'req' as const, label: 'Requisição' },
  { id: 'res' as const, label: 'Resposta' },
]

export function XRay() {
  const [searchParams, setSearchParams] = useSearchParams()
  const records = useInspector((s) => s.records)
  const selectedRecordId = useInspector((s) => s.selectedId)
  const selectRecord = useInspector((s) => s.select)

  const paramFlowId = searchParams.get('flow')
  const paramStepId = searchParams.get('step')

  const [manualMode, setManualMode] = useState<'inspector' | 'catalog' | null>(null)
  const [catalogFlowId, setCatalogFlowId] = useState<string>('chat.ask')
  const [catalogVariantId, setCatalogVariantId] = useState<string | null>(null)
  const [stationState, setStationState] = useState<{ key: string; index: number } | null>(null)
  const [httpTab, setHttpTab] = useState<'req' | 'res'>('req')

  const mode: 'inspector' | 'catalog' = paramFlowId
    ? 'catalog'
    : manualMode ?? (records.length > 0 ? 'inspector' : 'catalog')

  const activeRecord: InspectorRecord | null = useMemo(() => {
    if (mode !== 'inspector' || records.length === 0) return null
    return records.find((r) => r.id === selectedRecordId) ?? records[records.length - 1] ?? null
  }, [mode, records, selectedRecordId])

  const flow = useMemo(() => {
    if (paramFlowId) return getFlow(paramFlowId) ?? flowCatalog[0]
    if (mode === 'inspector' && activeRecord?.flowId) {
      return getFlow(activeRecord.flowId) ?? flowCatalog[0]
    }
    return getFlow(catalogFlowId) ?? flowCatalog[0]
  }, [paramFlowId, mode, activeRecord, catalogFlowId])

  const variant = useMemo(() => {
    if (paramFlowId && paramStepId) {
      return flow.variants.find((v) => v.stepIds.includes(paramStepId)) ?? flow.variants[0]
    }
    if (mode === 'inspector' && activeRecord?.variantId) {
      return getVariant(flow, activeRecord.variantId)
    }
    return getVariant(flow, catalogVariantId)
  }, [paramFlowId, paramStepId, mode, activeRecord, flow, catalogVariantId])

  const steps = useMemo(() => stepsOfVariant(flow, variant), [flow, variant])
  const contextKey = `${mode}:${activeRecord?.id ?? ''}:${flow.id}:${variant.id}:${paramStepId ?? ''}`

  const defaultStationIndex = useMemo(() => {
    if (paramStepId) {
      const idx = variant.stepIds.indexOf(paramStepId)
      return idx >= 0 ? idx : 0
    }
    return 0
  }, [paramStepId, variant])

  const stationIndex = stationState?.key === contextKey ? stationState.index : defaultStationIndex
  const safeStationIndex = Math.min(stationIndex, Math.max(0, steps.length - 1))
  const currentStep = steps[safeStationIndex] ?? steps[0]

  const handleSelectStation = (index: number) => {
    setStationState({ key: contextKey, index })
  }

  return (
    <main className="grid flex-1 lg:grid-cols-12">
      {/* Coluna da esquerda: linha do tempo do inspetor + catálogo de fluxos */}
      <aside className="flex flex-col gap-5 border-r border-slate-800/80 bg-slate-900/40 p-4 lg:col-span-4 xl:col-span-3">
        <section aria-label="Requisições observadas" className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-white">Requisições</h2>
            <span className="rounded-full bg-slate-800/80 px-2.5 py-0.5 text-[11px] font-medium text-slate-400">
              {records.length} registradas
            </span>
          </div>

          {records.length === 0 ? (
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-3.5 text-xs text-slate-400 leading-relaxed">
              Nenhuma requisição capturada ainda. Você já pode explorar qualquer fluxo no catálogo abaixo sem precisar
              chamar a API.
            </div>
          ) : (
            <ul className="m-0 flex max-h-72 flex-col divide-y divide-slate-800/80 overflow-y-auto rounded-xl border border-slate-800/90 bg-slate-950/50 p-0 list-none">
              {[...records].reverse().map((rec) => {
                const selected = mode === 'inspector' && activeRecord?.id === rec.id
                const counter = countLabel(rec)
                return (
                  <li key={rec.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchParams({})
                        selectRecord(rec.id)
                        setManualMode('inspector')
                        setStationState(null)
                      }}
                      aria-pressed={selected}
                      className={`flex w-full flex-col gap-1 px-3.5 py-2.5 text-left cursor-pointer transition-all border-l-2 ${
                        selected
                          ? 'border-l-cyan-400 bg-slate-800/60'
                          : 'border-l-transparent hover:bg-slate-900/70'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-mono text-xs font-semibold text-slate-100">
                          {rec.method} {rec.path}
                        </span>
                        <StatusBadge
                          label={rec.status === 0 ? 'REDE' : String(rec.status)}
                          tone={toneForHttpStatus(rec.status)}
                          dot={false}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>{rec.durationMs} ms</span>
                        {counter && <span>({counter})</span>}
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section aria-label="Catálogo de fluxos" className="flex flex-col gap-2.5">
          <div>
            <h2 className="text-sm font-semibold text-white">Catálogo de fluxos</h2>
            <p className="text-xs text-slate-400">Explorar sem fazer requisição</p>
          </div>

          <ul className="m-0 flex flex-col divide-y divide-slate-800/80 overflow-hidden rounded-xl border border-slate-800/90 bg-slate-950/50 p-0 list-none">
            {flowCatalog.map((item) => {
              const selected = mode === 'catalog' && flow.id === item.id
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchParams({})
                      setManualMode('catalog')
                      setCatalogFlowId(item.id)
                      setCatalogVariantId(item.variants[0].id)
                      setStationState(null)
                    }}
                    aria-pressed={selected}
                    className={`flex w-full flex-col gap-0.5 px-3.5 py-2.5 text-left cursor-pointer transition-all border-l-2 ${
                      selected
                        ? 'border-l-cyan-400 bg-slate-800/60'
                        : 'border-l-transparent hover:bg-slate-900/70'
                    }`}
                  >
                    <span className="text-xs font-semibold text-slate-100">{item.title}</span>
                    <span className="font-mono text-[11px] text-slate-400">{flowRoute(item)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      </aside>

      {/* Coluna principal: cabeçalho, mapa de metrô, folha da estação e HTTP bruto mascarado */}
      <section className="flex flex-col gap-5 bg-slate-950 p-4 md:p-6 lg:col-span-8 xl:col-span-9 min-w-0">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800/90 bg-slate-900/70 p-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-lg font-semibold text-white">
                {mode === 'inspector' && activeRecord
                  ? `${activeRecord.method} ${activeRecord.path}`
                  : `${flow.title} (${flowRoute(flow)})`}
              </h1>
              <StatusBadge
                label={`HTTP ${mode === 'inspector' && activeRecord ? activeRecord.status : variant.status}`}
                tone={toneForHttpStatus(mode === 'inspector' && activeRecord ? activeRecord.status : variant.status)}
              />
              {mode === 'inspector' && activeRecord && (
                <span className="text-xs font-medium text-slate-400">{activeRecord.durationMs} ms</span>
              )}
              {mode === 'inspector' && activeRecord && countLabel(activeRecord) && (
                <span className="text-xs text-slate-400">({countLabel(activeRecord)})</span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Variante ativa: <strong className="font-medium text-cyan-400">{variant.label}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="variant-select" className="text-xs font-medium text-slate-400">
              Variante:
            </label>
            <select
              id="variant-select"
              value={variant.id}
              onChange={(e) => {
                setSearchParams({})
                setManualMode('catalog')
                setCatalogFlowId(flow.id)
                setCatalogVariantId(e.target.value)
                setStationState(null)
              }}
              className="rounded-lg border border-slate-700/80 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
            >
              {flow.variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
        </header>

        {mode === 'inspector' && activeRecord?.warning && (
          <div
            role="status"
            className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2.5 text-xs text-amber-300"
          >
            {activeRecord.warning}: exibindo o caminho da variante principal para referência.
          </div>
        )}

        <MetroMap
          flow={flow}
          variant={variant}
          selectedIndex={safeStationIndex}
          onSelectIndex={handleSelectStation}
        />

        {currentStep && (
          <StationSheet step={currentStep} stepNumber={safeStationIndex + 1} totalSteps={steps.length} />
        )}

        {mode === 'inspector' && activeRecord && (
          <section
            aria-label="HTTP bruto mascarado"
            className="flex flex-col gap-3 rounded-xl border border-slate-800/90 bg-slate-900/70 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-white">HTTP bruto mascarado</h2>
                <p className="text-xs text-slate-400">
                  Senhas viram &quot;••••••••&quot; e tokens mostram apenas os primeiros 12 caracteres seguidos de
                  reticências.
                </p>
              </div>
              <Tabs ariaLabel="Abas HTTP bruto" items={HTTP_TABS} value={httpTab} onChange={setHttpTab} />
            </div>

            {httpTab === 'req' ? (
              <CodeBlock
                code={formatRawHttpRequest(activeRecord)}
                language="http"
                title="Requisição enviada pelo navegador (mascarada)"
                caption="Observado no cliente"
              />
            ) : (
              <CodeBlock
                code={formatRawHttpResponse(activeRecord)}
                language="http"
                title="Resposta recebida pelo navegador (mascarada)"
                caption="Observado no cliente"
              />
            )}
          </section>
        )}
      </section>
    </main>
  )
}
