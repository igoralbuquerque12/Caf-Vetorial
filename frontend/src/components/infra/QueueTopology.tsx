export function QueueTopology() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-white">Topologia declarada no RabbitMQ</h3>
        <span className="text-xs text-slate-400">Declarada no boot pelo bean Declarables</span>
      </div>

      <div className="overflow-x-auto">
        <svg
          width={780}
          height={195}
          viewBox="0 0 780 195"
          role="img"
          aria-label="Topologia RabbitMQ: document.exchange liga por document.process à fila document.process.queue, que entrega ao consumidor ou desvia para document.dlx e document.process.dlq"
          className="block select-none"
        >
          {/* Caminho principal */}
          <rect x={16} y={28} width={155} height={48} rx={8} fill="#0f172a" stroke="#38bdf8" strokeWidth={1.5} />
          <text x={93.5} y={48} textAnchor="middle" fill="#f8fafc" fontSize={11.5} fontWeight={700}>
            document.exchange
          </text>
          <text x={93.5} y={64} textAnchor="middle" fill="#94a3b8" fontSize={10}>
            DirectExchange (durable)
          </text>

          <line x1={171} y1={52} x2={292} y2={52} stroke="#cbd5e1" strokeWidth={1.8} />
          <rect x={183} y={26} width={96} height={19} rx={9.5} fill="#020617" stroke="#1e293b" />
          <text x={231} y={39} textAnchor="middle" fill="#22d3ee" fontSize={9.5} fontWeight={600}>
            document.process
          </text>

          <rect x={292} y={28} width={190} height={48} rx={8} fill="#0f172a" stroke="#818cf8" strokeWidth={1.5} />
          <text x={387} y={48} textAnchor="middle" fill="#f8fafc" fontSize={11.5} fontWeight={700}>
            document.process.queue
          </text>
          <text x={387} y={64} textAnchor="middle" fill="#94a3b8" fontSize={10}>
            Queue durável (x-dead-letter)
          </text>

          <line x1={482} y1={52} x2={566} y2={52} stroke="#cbd5e1" strokeWidth={1.8} />
          <rect x={494} y={26} width={60} height={19} rx={9.5} fill="#020617" stroke="#1e293b" />
          <text x={524} y={39} textAnchor="middle" fill="#94a3b8" fontSize={9.5} fontWeight={600}>
            prefetch=1
          </text>

          <rect x={566} y={28} width={196} height={48} rx={8} fill="#0f172a" stroke="#34d399" strokeWidth={1.5} />
          <text x={664} y={48} textAnchor="middle" fill="#f8fafc" fontSize={11.5} fontWeight={700}>
            @RabbitListener
          </text>
          <text x={664} y={64} textAnchor="middle" fill="#34d399" fontSize={10}>
            DocumentProcessingListener
          </text>

          {/* Desvio para Dead Letter (texto alinhado à esquerda da linha vertical para não cruzar) */}
          <path
            d="M 387 76 L 387 142 L 436 142"
            fill="none"
            stroke="#f87171"
            strokeWidth={1.8}
            strokeDasharray="5 4"
          />
          <text
            x={376}
            y={114}
            textAnchor="end"
            fill="#f87171"
            fontSize={10}
            fontWeight={600}
            paintOrder="stroke"
            stroke="#020617"
            strokeWidth={3}
          >
            rejeitada (requeue=false)
          </text>

          <rect x={436} y={120} width={132} height={44} rx={8} fill="#0f172a" stroke="#f87171" strokeWidth={1.5} />
          <text x={502} y={139} textAnchor="middle" fill="#f8fafc" fontSize={11.5} fontWeight={700}>
            document.dlx
          </text>
          <text x={502} y={154} textAnchor="middle" fill="#94a3b8" fontSize={9.5}>
            Dead Letter Exchange
          </text>

          <line x1={568} y1={142} x2={600} y2={142} stroke="#f87171" strokeWidth={1.8} />

          <rect x={600} y={120} width={162} height={44} rx={8} fill="#0f172a" stroke="#f87171" strokeWidth={1.5} />
          <text x={681} y={139} textAnchor="middle" fill="#f8fafc" fontSize={11.5} fontWeight={700}>
            document.process.dlq
          </text>
          <text x={681} y={154} textAnchor="middle" fill="#f87171" fontSize={9.5}>
            Dead Letter Queue
          </text>
        </svg>
      </div>
    </div>
  )
}
