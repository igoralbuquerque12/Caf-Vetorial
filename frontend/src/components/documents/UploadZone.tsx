import { Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { messageOf } from '../../api/problem'
import { Button } from '../ui/Button'
import { validatePdfFile } from './validatePdfFile'

export interface UploadZoneProps {
  onUpload: (file: File, onProgress: (fraction: number) => void) => Promise<void>
}

export function UploadZone({ onUpload }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (file: File | undefined) => {
    if (!file || uploading) return
    const clientError = validatePdfFile(file)
    if (clientError) {
      setError(clientError)
      return
    }
    setError(null)
    setUploading(true)
    setProgress(0)
    try {
      await onUpload(file, (fraction) => setProgress(Math.round(fraction * 100)))
    } catch (err) {
      setError(messageOf(err, 'Não foi possível enviar o PDF. Tente novamente.'))
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          void handleFile(e.dataTransfer.files?.[0])
        }}
        className={`flex flex-col gap-3 rounded-panel border border-dashed p-3.5 transition-colors ${
          dragging ? 'border-cream bg-navy-raised' : 'border-track bg-abyss/60'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          aria-label="Selecionar arquivo PDF"
          onChange={(e) => void handleFile(e.target.files?.[0])}
          className="sr-only"
        />
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-cream">Regulamento ou apólice em PDF</p>
            <p className="text-xs text-cream-muted">Arraste aqui ou clique no botão (até 20MB)</p>
          </div>
          {/* Único botão laranja da coluna de documentos (seção 6.2). */}
          <Button
            variant="primary"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            <span>{uploading ? 'Enviando…' : 'Enviar PDF'}</span>
          </Button>
        </div>

        {uploading && (
          <div aria-live="polite" className="flex flex-col gap-1">
            <div className="flex justify-between text-xs text-cream-muted">
              <span>Enviando para a API…</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-navy">
              <div
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                style={{ width: `${Math.max(6, progress)}%` }}
                className="h-full bg-busy transition-all"
              />
            </div>
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="rounded-control border border-fail/50 bg-fail/10 px-3 py-2 text-xs text-fail">
          {error}
        </p>
      )}
    </div>
  )
}
