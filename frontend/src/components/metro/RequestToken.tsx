import { motion } from 'motion/react'

/**
 * O ponto laranja que representa a requisição viajando pelas estações do mapa.
 * Com prefers-reduced-motion ativo, pula direto de estação em estação.
 */
export function RequestToken({
  x,
  y,
  reducedMotion,
}: {
  x: number
  y: number
  reducedMotion: boolean
}) {
  if (reducedMotion) {
    return (
      <g aria-hidden="true" transform={`translate(${x}, ${y})`}>
        <circle r={9} fill="#FF7A1A" fillOpacity={0.22} />
        <circle r={5.5} fill="#FF7A1A" stroke="#070D1F" strokeWidth={2} />
      </g>
    )
  }

  return (
    <motion.g
      aria-hidden="true"
      initial={false}
      animate={{ x, y }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
    >
      <circle r={9.5} fill="#FF7A1A" fillOpacity={0.24} />
      <circle r={5.5} fill="#FF7A1A" stroke="#070D1F" strokeWidth={2} />
    </motion.g>
  )
}
