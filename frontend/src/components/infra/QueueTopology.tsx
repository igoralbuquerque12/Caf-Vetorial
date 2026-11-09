export function QueueTopology() {
  return (
    <div className="flex flex-col gap-3 rounded-panel border border-track bg-abyss p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base">Topologia declarada no RabbitMQ</h3>
        <span className="text-xs text-cream-muted">Declarada no boot pelo bean Declarables</span>
      </div>

      <div className="overflow-x-auto">
        <svg
          width={760}
          height={190}
          viewBox="0 0 760 190"
          role="img"
          aria-label="Topologia RabbitMQ: document.exchange liga por document.process à fila document.process.queue, que entrega ao consumidor ou desvia para document.dlx e document.process.dlq"
          className="block select-none"
        >
          {/* Caminho principal */}
          <rect x={16} y={28} width={150} height={48} rx={8} fill="#152449" stroke="#4A6FA5" strokeWidth={1.8} />
          <text x={91} y={49} textAnchor="middle" fill="#F3EDE2" fontSize={12} fontWeight={800}>
            document.exchange
          </text>
          <text x={91} y={65} textAnchor="middle" fill="#B8B1A3" fontSize={10.5}>
            DirectExchange (durable)
          </text>

          <line x1={166} y1={52} x2={290} y2={52} stroke="#F3EDE2" strokeWidth={2} />
          <rect x={182} y={32} width={96} height={18} rx={9} fill="#0D1833" stroke="#25365F" />
          <text x={230} y={44} textAnchor="middle" fill="#9DB4E8" fontSize={10} fontWeight={600}>
            document.process
          </text>

          <rect x={290} y={28} width={185} height={48} rx={8} fill="#152449" stroke="#6C84B8" strokeWidth={1.8} />
          <text x={382} y={49} textAnchor="middle" fill="#F3EDE2" fontSize={12} fontWeight={800}>
            document.process.queue
          </text>
          <text x={382} y={65} textAnchor="middle" fill="#B8B1A3" fontSize={10.5}>
            Queue durável (x-dead-letter)
          </text>

          <line x1={475} y1={52} x2={555} y2={52} stroke="#F3EDE2" strokeWidth={2} />
          <text x={515} y={44} textAnchor="middle" fill="#B8B1A3" fontSize={10}>
            prefetch=1
          </text>

          <rect x={555} y={28} width={188} height={48} rx={8} fill="#152449" stroke="#8FBFA0" strokeWidth={1.8} />
          <text x={649} y={49} textAnchor="middle" fill="#F3EDE2" fontSize={12} fontWeight={800}>
            @RabbitListener
          </text>
          <text x={649} y={65} textAnchor="middle" fill="#8FBFA0" fontSize={10.5}>
            DocumentProcessingListener
          </text>

          {/* Desvio para Dead Letter */}
          <path
            d="M 382 76 L 382 140 L 430 140"
            fill="none"
            stroke="#E07A68"
            strokeWidth={2}
            strokeDasharray="5 4"
          />
          <text x={298} y={115} fill="#E07A68" fontSize={10.5} fontWeight={600}>
            rejeitada (requeue=false)
          </text>

          <rect x={430} y={118} width={130} height={44} rx={8} fill="#152449" stroke="#E07A68" strokeWidth={1.6} />
          <text x={495} y={138} textAnchor="middle" fill="#F3EDE2" fontSize={12} fontWeight={800}>
            document.dlx
          </text>
          <text x={495} y={153} textAnchor="middle" fill="#B8B1A3" fontSize={10}>
            Dead Letter Exchange
          </text>

          <line x1={560} y1={140} x2={590} y2={140} stroke="#E07A68" strokeWidth={2} />

          <rect x={590} y={118} width={153} height={44} rx={8} fill="#152449" stroke="#E07A68" strokeWidth={1.6} />
          <text x={666} y={138} textAnchor="middle" fill="#F3EDE2" fontSize={12} fontWeight={800}>
            document.process.dlq
          </text>
          <text x={666} y={153} textAnchor="middle" fill="#E07A68" fontSize={10}>
            Dead Letter Queue
          </text>
        </svg>
      </div>
    </div>
  )
}
