import { MAX_UPLOAD_BYTES } from '../../api/documents'

export function validatePdfFile(file: File): string | null {
  const isPdfType = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  if (!isPdfType) {
    return 'Envie apenas arquivos em PDF (.pdf).'
  }
  if (file.size === 0) {
    return 'O arquivo está vazio. Escolha um PDF válido.'
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return 'O arquivo passa de 20MB. Envie um PDF de até 20MB.'
  }
  return null
}
