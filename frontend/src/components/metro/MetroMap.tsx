import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { stepsOfVariant } from '../../flows/catalog'
import type { FlowDefinition, FlowStep, FlowVariant, Layer } from '../../flows/types'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { Button } from '../ui/Button'
import { EXTERNAL_LABELS, LAYER_META } from './metroMeta'
import { RequestToken } from './RequestToken'
import { ExternalGlyph, Station } from './Station'
import { Track, type TrackSegment } from './Track'

const LANE_ORDER: Layer[] = ['seguranca', 'web', 'servico', 'dominio-persistencia', 'infra', 'externo']

function effectiveLayer(step: FlowStep): Layer {
  return step.external ? 'externo' : step.layer
}

export interface MetroMapProps {
  flow: FlowDefinition
  variant: FlowVariant
  selectedIndex?: number
  onSelectIndex?: (index: number) => void
  onEnterStation?: (step: FlowStep, index: number) => void
  /** Modo compacto: usado na coluna lateral do Workspace. */
  compact?: boolean
  /** Anima o traçado do trilho uma vez ao montar. */
  animateDraw?: boolean
  showControls?: boolean
}

export function MetroMap({
  flow,
  variant,
  selectedIndex: controlledIndex,
  onSelectIndex,
  onEnterStation,
  compact = false,
  animateDraw = false,
  showControls = !compact,
}: MetroMapProps) {
  const reducedMotion = useReducedMotion()
  const steps = useMemo(() => stepsOfVariant(flow, variant), [flow, variant])
  const flowKey = `${flow.id}:${variant.id}`
  const [cursor, setCursor] = useState<{ key: string; index: number; playing: boolean }>({
    key: flowKey,
    index: 0,
    playing: false,
  })
  const [speed, setSpeed] = useState<0.75 | 1 | 1.75>(1)
  const sheetAnchorRef = useRef<HTMLDivElement | null>(null)

  const internalIndex = cursor.key === flowKey ? cursor.index : 0
  const playing = cursor.key === flowKey ? cursor.playing : false
  const activeIndex = Math.min(controlledIndex ?? internalIndex, Math.max(steps.length - 1, 0))

  const setIndex = useCallback(
    (next: number, keepPlaying = false) => {
      const clamped = Math.max(0, Math.min(steps.length - 1, next))
      setCursor({ key: flowKey, index: clamped, playing: keepPlaying })
      onSelectIndex?.(clamped)
    },
    [flowKey, onSelectIndex, steps.length],
  )

  const setPlaying = useCallback(
    (nextPlaying: boolean) => {
      setCursor((prev) => ({
        key: flowKey,
        index: prev.key === flowKey ? prev.index : 0,
        playing: nextPlaying,
      }))
    },
    [flowKey],
  )

  useEffect(() => {
    if (!playing || steps.length <= 1) return
    const intervalMs = Math.round(950 / speed)
    const timer = window.setInterval(() => {
      const next = activeIndex + 1
      if (next >= steps.length) {
        setPlaying(false)
      } else {
        setIndex(next, true)
      }
    }, intervalMs)
    return () => window.clearInterval(timer)
  }, [playing, activeIndex, steps.length, speed, setIndex, setPlaying])

  const isErrorVariant = variant.status >= 400
  const laneSpacing = compact ? 44 : 56
  const colSpacing = compact ? 152 : 186
  const laneBadgeWidth = compact ? 96 : 114
  const leftPad = compact ? 185 : 225
  const topPad = compact ? 38 : 44
  const rightPad = isErrorVariant ? 145 : 115

  const points = useMemo(() => {
    return steps.map((step, i) => {
      const laneIdx = LANE_ORDER.indexOf(effectiveLayer(step))
      return {
        x: leftPad + i * colSpacing,
        y: topPad + Math.max(0, laneIdx) * laneSpacing,
        step,
        isErrorNode: isErrorVariant && i === steps.length - 1,
      }
    })
  }, [steps, leftPad, colSpacing, topPad, laneSpacing, isErrorVariant])

  const segments: TrackSegment[] = useMemo(() => {
    const list: TrackSegment[] = []
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i]
      const b = points[i + 1]
      list.push({
        x1: a.x,
        y1: a.y,
        x2: b.x,
        y2: b.y,
        async: Boolean(b.step.async),
        error: isErrorVariant && i === points.length - 2,
      })
    }
    return list
  }, [points, isErrorVariant])

  const svgWidth = Math.max(560, leftPad + Math.max(0, steps.length - 1) * colSpacing + rightPad)
  const svgHeight = topPad * 2 + (LANE_ORDER.length - 1) * laneSpacing + (compact ? 24 : 38)
  const currentPoint = points[activeIndex] ?? points[0]

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      setIndex(activeIndex + 1, false)
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      setIndex(activeIndex - 1, false)
    } else if (event.key === 'Enter' && steps[activeIndex]) {
      event.preventDefault()
      onEnterStation?.(steps[activeIndex], activeIndex)
      sheetAnchorRef.current?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'nearest' })
    }
  }

  return (
    <div
      className="flex flex-col gap-3.5 rounded-xl border border-slate-800/90 bg-slate-900/70 p-4"
      onKeyDown={handleKeyDown}
    >
      {showControls && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIndex(activeIndex - 1, false)}
              disabled={activeIndex <= 0}
              aria-label="Estação anterior"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Anterior</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                if (!playing && activeIndex >= steps.length - 1) {
                  setIndex(0, true)
                } else {
                  setPlaying(!playing)
                }
              }}
            >
              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              <span>{playing ? 'Pausar' : 'Reproduzir'}</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIndex(activeIndex + 1, false)}
              disabled={activeIndex >= steps.length - 1}
              aria-label="Próxima estação"
            >
              <span>Próximo</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <label htmlFor={`speed-${flow.id}`} className="font-medium">
              Velocidade
            </label>
            <select
              id={`speed-${flow.id}`}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value) as 0.75 | 1 | 1.75)}
              className="rounded-lg border border-slate-700/80 bg-slate-950 px-2.5 py-1 text-xs text-slate-200"
            >
              <option value={0.75}>0,75x</option>
              <option value={1}>1x</option>
              <option value={1.75}>1,75x</option>
            </select>
          </div>
        </div>
      )}

      {/* Mapa horizontal para desktop */}
      <div className="hidden md:block overflow-x-auto rounded-lg bg-slate-950/50 border border-slate-800/60 p-2">
        <svg
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          role="group"
          aria-label={`Mapa de metrô do fluxo ${flow.title}, variante ${variant.label}`}
          className="block select-none"
        >
          {/* Faixas por camada */}
          {LANE_ORDER.map((layer, idx) => {
            const y = topPad + idx * laneSpacing
            const meta = LAYER_META[layer]
            return (
              <g key={layer}>
                <line
                  x1={laneBadgeWidth + 20}
                  y1={y}
                  x2={svgWidth - 20}
                  y2={y}
                  stroke={meta.color}
                  strokeOpacity={0.22}
                  strokeWidth={1.25}
                />
                <rect
                  x={8}
                  y={y - 11}
                  width={laneBadgeWidth}
                  height={22}
                  rx={6}
                  fill={meta.color}
                  fillOpacity={0.12}
                  stroke={meta.color}
                  strokeOpacity={0.45}
                />
                <text
                  x={8 + laneBadgeWidth / 2}
                  y={y + 3.5}
                  textAnchor="middle"
                  fill="#e2e8f0"
                  fontSize={compact ? 10 : 10.5}
                  fontWeight={600}
                >
                  {meta.shortLabel}
                </text>
              </g>
            )
          })}

          {/* Trilho ligando as estações */}
          <Track segments={segments} animateDraw={animateDraw} reducedMotion={reducedMotion} />

          {/* Estações clicáveis */}
          {points.map((pt, i) => {
            const selected = i === activeIndex
            const layerColor = LAYER_META[effectiveLayer(pt.step)].color
            const labelAbove = i % 2 === 0
            const hasMember = !compact && Boolean(pt.step.member)
            const classLabelY = labelAbove ? (hasMember ? pt.y - 25 : pt.y - 16) : pt.y + 22
            const memberLabelY = labelAbove ? pt.y - 13 : pt.y + 34

            return (
              <g
                key={pt.step.id}
                role="button"
                tabIndex={0}
                aria-label={`Estação ${i + 1}: ${pt.step.className}${pt.step.member ? `.${pt.step.member}` : ''}`}
                onClick={() => setIndex(i, false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setIndex(i, false)
                    onEnterStation?.(pt.step, i)
                  }
                }}
                className="cursor-pointer focus:outline-none"
              >
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={selected ? 9.5 : 7}
                  fill="#0f172a"
                  stroke={pt.isErrorNode ? '#f87171' : selected ? '#22d3ee' : layerColor}
                  strokeWidth={selected ? 2.5 : 2}
                />
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={2.8}
                  fill={pt.isErrorNode ? '#f87171' : selected ? '#22d3ee' : '#94a3b8'}
                />
                <text
                  x={pt.x}
                  y={classLabelY}
                  textAnchor="middle"
                  fill={selected ? '#22d3ee' : '#f1f5f9'}
                  fontSize={compact ? 10.5 : 11}
                  fontWeight={selected ? 700 : 600}
                  paintOrder="stroke"
                  stroke="#020617"
                  strokeWidth={4}
                  strokeLinejoin="round"
                >
                  {pt.step.className}
                </text>
                {hasMember && (
                  <text
                    x={pt.x}
                    y={memberLabelY}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize={10}
                    paintOrder="stroke"
                    stroke="#020617"
                    strokeWidth={3.5}
                    strokeLinejoin="round"
                  >
                    .{pt.step.member}
                  </text>
                )}
              </g>
            )
          })}

          {/* Marcador terminal de status HTTP nas variantes de erro */}
          {isErrorVariant && currentPoint && points.length > 0 && (
            <g transform={`translate(${points[points.length - 1].x + 58}, ${points[points.length - 1].y})`}>
              <line x1={-48} y1={0} x2={-16} y2={0} stroke="#f87171" strokeWidth={2} />
              <rect x={-16} y={-12} width={48} height={24} rx={12} fill="#1e293b" stroke="#f87171" strokeWidth={1.5} />
              <text x={8} y={4} textAnchor="middle" fill="#f87171" fontSize={11.5} fontWeight={700}>
                {variant.status}
              </text>
            </g>
          )}

          {/* Ponto laranja da requisição */}
          {currentPoint && <RequestToken x={currentPoint.x} y={currentPoint.y} reducedMotion={reducedMotion} />}
        </svg>
      </div>

      {/* Lista de estações navegável por teclado */}
      <div role="toolbar" aria-label="Estações do fluxo" className="flex flex-col gap-1.5 md:flex-row md:flex-wrap">
        {steps.map((step, i) => (
          <Station
            key={step.id}
            step={step}
            index={i}
            selected={i === activeIndex}
            active={i <= activeIndex}
            isErrorTerminal={isErrorVariant && i === steps.length - 1}
            onSelect={(idx) => setIndex(idx, false)}
            onOpenSheet={(idx) => {
              setIndex(idx, false)
              onEnterStation?.(step, idx)
            }}
          />
        ))}
        {isErrorVariant && (
          <span className="inline-flex items-center self-start rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300">
            HTTP {variant.status}
          </span>
        )}
      </div>

      {/* Legenda fixa */}
      <div
        ref={sheetAnchorRef}
        className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-2.5 text-xs text-slate-400"
      >
        <p>Observado: status HTTP e tempo de resposta. Ilustrado: o caminho interno, conforme o código do backend.</p>
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-block h-0.5 w-4 bg-slate-200" />
            <span>Trecho síncrono</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-block h-0.5 w-4 border-b-2 border-dashed border-cyan-400" />
            <span>Continuação assíncrona</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full bg-orange-500" />
            <span>Requisição</span>
          </span>
          {!compact && (
            <span className="inline-flex items-center gap-2.5">
              {(['postgres', 's3', 'rabbitmq', 'openai'] as const).map((sys) => (
                <span key={sys} className="inline-flex items-center gap-1">
                  <ExternalGlyph system={sys} size={11} />
                  <span>{EXTERNAL_LABELS[sys].split(' ')[0]}</span>
                </span>
              ))}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
