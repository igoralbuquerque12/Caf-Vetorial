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
  /** Modo compacto: usado no login/cadastro e na coluna lateral do Workspace. */
  compact?: boolean
  /** Anima o traçado do trilho uma vez ao montar (exclusivo do login/cadastro). */
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
  const laneSpacing = compact ? 38 : 48
  const colSpacing = compact ? 132 : 162
  const leftPad = compact ? 130 : 175
  const topPad = 28
  const rightPad = isErrorVariant ? 115 : 65

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

  const svgWidth = Math.max(520, leftPad + Math.max(0, steps.length - 1) * colSpacing + rightPad)
  const svgHeight = topPad * 2 + (LANE_ORDER.length - 1) * laneSpacing + (compact ? 24 : 36)
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
      className="flex flex-col gap-3 rounded-panel border border-track bg-navy p-4"
      onKeyDown={handleKeyDown}
    >
      {showControls && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-track pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIndex(activeIndex - 1, false)}
              disabled={activeIndex <= 0}
              aria-label="Estação anterior"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Anterior</span>
            </Button>
            {/* O botão de reproduzir NÃO é laranja (regra da seção 6.4). */}
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
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
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
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2 text-sm text-cream-muted">
            <label htmlFor={`speed-${flow.id}`} className="font-semibold">
              Velocidade
            </label>
            <select
              id={`speed-${flow.id}`}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value) as 0.75 | 1 | 1.75)}
              className="rounded-control border border-track bg-abyss px-2.5 py-1 text-sm text-cream"
            >
              <option value={0.75}>0,75x</option>
              <option value={1}>1x</option>
              <option value={1.75}>1,75x</option>
            </select>
          </div>
        </div>
      )}

      {/* Mapa horizontal para desktop */}
      <div className="hidden md:block overflow-x-auto">
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
                  x1={leftPad - 18}
                  y1={y}
                  x2={svgWidth - 20}
                  y2={y}
                  stroke={meta.color}
                  strokeOpacity={0.35}
                  strokeWidth={1.5}
                />
                <rect
                  x={8}
                  y={y - 11}
                  width={leftPad - 32}
                  height={22}
                  rx={6}
                  fill={meta.color}
                  fillOpacity={0.18}
                  stroke={meta.color}
                  strokeOpacity={0.55}
                />
                <text
                  x={16}
                  y={y + 4}
                  fill="#F3EDE2"
                  fontSize={compact ? 10.5 : 11.5}
                  fontWeight={600}
                >
                  {meta.label}
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
                  r={selected ? 10 : 7.5}
                  fill="#0D1833"
                  stroke={pt.isErrorNode ? '#E07A68' : selected ? '#F3EDE2' : layerColor}
                  strokeWidth={selected ? 2.6 : 2}
                />
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={3}
                  fill={pt.isErrorNode ? '#E07A68' : selected ? '#F3EDE2' : '#B8B1A3'}
                />
                <text
                  x={pt.x}
                  y={labelAbove ? pt.y - 14 : pt.y + 22}
                  textAnchor="middle"
                  fill="#F3EDE2"
                  fontSize={compact ? 10.5 : 11.5}
                  fontWeight={selected ? 800 : 600}
                >
                  {pt.step.className}
                </text>
                {!compact && pt.step.member && (
                  <text
                    x={pt.x}
                    y={labelAbove ? pt.y - 3 : pt.y + 34}
                    textAnchor="middle"
                    fill="#B8B1A3"
                    fontSize={10.5}
                  >
                    .{pt.step.member}
                  </text>
                )}
              </g>
            )
          })}

          {/* Marcador terminal de status HTTP nas variantes de erro */}
          {isErrorVariant && currentPoint && points.length > 0 && (
            <g transform={`translate(${points[points.length - 1].x + 54}, ${points[points.length - 1].y})`}>
              <line x1={-44} y1={0} x2={-16} y2={0} stroke="#E07A68" strokeWidth={2.2} />
              <rect x={-16} y={-12} width={48} height={24} rx={12} fill="#152449" stroke="#E07A68" strokeWidth={1.6} />
              <text x={8} y={4} textAnchor="middle" fill="#E07A68" fontSize={12} fontWeight={800}>
                {variant.status}
              </text>
            </g>
          )}

          {/* Ponto laranja da requisição */}
          {currentPoint && (
            <RequestToken x={currentPoint.x} y={currentPoint.y} reducedMotion={reducedMotion} />
          )}
        </svg>
      </div>

      {/* Lista de estações navegável por teclado */}
      <div
        role="toolbar"
        aria-label="Estações do fluxo"
        className="flex flex-col gap-2 md:flex-row md:flex-wrap"
      >
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
          <span className="inline-flex items-center self-start rounded-full border border-fail bg-fail/10 px-3 py-1 text-sm font-extrabold text-fail">
            HTTP {variant.status}
          </span>
        )}
      </div>

      {/* Legenda fixa obrigatória (seção 6.4) */}
      <div
        ref={sheetAnchorRef}
        className="flex flex-wrap items-center justify-between gap-3 border-t border-track pt-2.5 text-xs text-cream-muted"
      >
        <p>Observado: status HTTP e tempo de resposta. Ilustrado: o caminho interno, conforme o código do backend.</p>
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-block h-0.5 w-5 bg-cream" />
            <span>Trecho síncrono</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-block h-0.5 w-5 border-b-2 border-dashed border-busy" />
            <span>Continuação assíncrona</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-full bg-orange" />
            <span>Requisição</span>
          </span>
          {!compact && (
            <span className="inline-flex items-center gap-2">
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
