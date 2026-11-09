import * as docs from '../../content/snippets/documents'
import * as storage from '../../content/snippets/storage'
import { CodeTabs, type CodeTab } from '../code/CodeTabs'

const S3_TABS: CodeTab[] = [
  {
    id: 'client',
    label: 'Criação do S3Client',
    snippet: storage.s3ClientConfig,
    note: 'Usa o DefaultCredentialsProvider do AWS SDK v2 e aceita endpointOverride opcional para ambientes compatíveis.',
  },
  {
    id: 'upload-download',
    label: 'Upload e download no S3',
    snippet: storage.s3Upload,
    note: 'Converte qualquer SdkException em StorageException (503 no GlobalExceptionHandler).',
  },
  {
    id: 'compensation',
    label: 'DocumentService.upload com compensação',
    snippet: docs.documentServiceUpload,
    note: 'Upload fora da transação + TransactionTemplate curto + deleteQuietly(s3Key) se o banco falhar.',
  },
]

export function S3Flow() {
  return (
    <section aria-label="Armazenamento S3" className="flex flex-col gap-6 rounded-panel border border-track bg-navy p-5">
      <div>
        <h2 className="text-xl">Armazenamento de PDFs (AWS S3 e compensação)</h2>
        <p className="prose-copilot mt-1 text-sm text-cream-muted">
          Enviar arquivos para o S3 é I/O de rede externo. Se o upload acontecesse dentro de um método{' '}
          <code>@Transactional</code>, a thread seguraria uma conexão do HikariCP durante todo o envio do PDF.
        </p>
      </div>

      {/* Diagrama de sequência */}
      <div className="rounded-panel border border-track bg-abyss p-4 overflow-x-auto">
        <h3 className="mb-3 text-base">Sequência do upload e compensação</h3>
        <svg
          width={760}
          height={230}
          viewBox="0 0 760 230"
          role="img"
          aria-label="Diagrama de sequência: validação dos bytes mágicos, upload ao S3 fora da transação, transação no Postgres salvando PENDING e publicando o evento, ou compensação apagando do S3 se falhar"
          className="block select-none"
        >
          {/* Colunas dos participantes */}
          {[
            { x: 90, label: 'DocumentService' },
            { x: 270, label: 'PdfUploadValidator' },
            { x: 460, label: 'AWS S3' },
            { x: 650, label: 'Postgres (TX)' },
          ].map((col) => (
            <g key={col.label}>
              <rect x={col.x - 75} y={10} width={150} height={28} rx={6} fill="#152449" stroke="#25365F" />
              <text x={col.x} y={28} textAnchor="middle" fill="#F3EDE2" fontSize={11.5} fontWeight={800}>
                {col.label}
              </text>
              <line x1={col.x} y1={38} x2={col.x} y2={215} stroke="#25365F" strokeDasharray="4 4" />
            </g>
          ))}

          {/* 1. Validação dos bytes mágicos */}
          <line x1={90} y1={64} x2={270} y2={64} stroke="#F3EDE2" strokeWidth={1.8} />
          <text x={180} y={57} textAnchor="middle" fill="#F3EDE2" fontSize={10.5}>
            1. valida Content-Type e &quot;%PDF-&quot;
          </text>

          {/* 2. Upload ao S3 fora de transação */}
          <line x1={90} y1={102} x2={460} y2={102} stroke="#8FBFA0" strokeWidth={2} />
          <text x={275} y={94} textAnchor="middle" fill="#8FBFA0" fontSize={10.5} fontWeight={600}>
            2. PutObject (FORA da transação do banco)
          </text>

          {/* 3. Transação curta no Postgres */}
          <line x1={90} y1={144} x2={650} y2={144} stroke="#9DB4E8" strokeWidth={2} />
          <text x={370} y={136} textAnchor="middle" fill="#9DB4E8" fontSize={10.5} fontWeight={600}>
            3. TransactionTemplate: save(PENDING) + publishEvent (AFTER_COMMIT)
          </text>

          {/* 4. Compensação em caso de falha */}
          <line x1={90} y1={188} x2={460} y2={188} stroke="#E07A68" strokeWidth={2} strokeDasharray="5 4" />
          <text x={275} y={180} textAnchor="middle" fill="#E07A68" fontSize={10.5} fontWeight={600}>
            4. Se a transação falhar: DeleteObject(s3Key) — compensação
          </text>
        </svg>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-panel border border-track bg-abyss p-4">
          <h3 className="text-base">Padrão da chave: documents/&#123;ownerId&#125;/&#123;uuid&#125;.pdf</h3>
          <p className="prose-copilot mt-1.5 text-sm text-cream-muted">
            O nome enviado pelo usuário (<code>fileName</code>) é higienizado e salvo apenas para exibição. Ele{' '}
            <strong>nunca entra na chave do S3</strong>, evitando colisão entre arquivos de mesmo nome, problemas de
            encoding e <em>path traversal</em>. Além disso, o <code>DocumentResponse</code> não expõe a{' '}
            <code>s3Key</code> na API: o cliente refere-se ao documento somente pelo seu UUID.
          </p>
        </div>

        <div className="rounded-panel border border-track bg-abyss p-4">
          <h3 className="text-base">De onde vêm as credenciais da AWS</h3>
          <p className="prose-copilot mt-1.5 text-sm text-cream-muted">
            O <code>S3Config</code> não recebe chave nem segredo via <code>application.yml</code> ou <code>.env</code>.
            O SDK v2 usa a cadeia padrão da AWS (variáveis de ambiente do processo, perfil em{' '}
            <code>~/.aws/credentials</code> ou IAM Role quando hospedado na nuvem), mantendo segredos fora do código.
          </p>
        </div>
      </div>

      <CodeTabs tabs={S3_TABS} ariaLabel="Trechos de armazenamento S3" />
    </section>
  )
}
