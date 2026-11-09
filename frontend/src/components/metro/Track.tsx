export interface TrackSegment {
  x1: number
  y1: number
  x2: number
  y2: number
  async?: boolean
  error?: boolean
}

export function Track({
  segments,
  animateDraw = false,
  reducedMotion = false,
}: {
  segments: TrackSegment[]
  animateDraw?: boolean
  reducedMotion?: boolean
}) {
  return (
    <g aria-hidden="true">
      {segments.map((seg, i) => {
        const dx = seg.x2 - seg.x1
        const dy = seg.y2 - seg.y1
        const midX = seg.x1 + dx * 0.5
        const d =
          Math.abs(dy) < 2
            ? `M ${seg.x1} ${seg.y1} L ${seg.x2} ${seg.y2}`
            : `M ${seg.x1} ${seg.y1} C ${midX} ${seg.y1}, ${midX} ${seg.y2}, ${seg.x2} ${seg.y2}`
        const stroke = seg.error ? '#f87171' : seg.async ? '#22d3ee' : '#cbd5e1'
        const dash = seg.async ? '6 5' : undefined
        const shouldDraw = animateDraw && !reducedMotion && !seg.async
        return (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={stroke}
            strokeOpacity={0.75}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeDasharray={shouldDraw ? 320 : dash}
            strokeDashoffset={shouldDraw ? 0 : undefined}
            style={
              shouldDraw
                ? {
                    animation: `metro-draw 550ms ease-out ${i * 70}ms both`,
                  }
                : undefined
            }
          />
        )
      })}
    </g>
  )
}
