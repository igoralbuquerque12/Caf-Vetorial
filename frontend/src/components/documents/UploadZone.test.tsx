import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MAX_UPLOAD_BYTES } from '../../api/documents'
import { UploadZone } from './UploadZone'

describe('UploadZone', () => {
  it('rejeita um arquivo que não é PDF antes de enviar', () => {
    const onUpload = vi.fn()
    render(<UploadZone onUpload={onUpload} />)

    const input = screen.getByLabelText('Selecionar arquivo PDF')
    const txtFile = new File(['conteudo'], 'notas.txt', { type: 'text/plain' })
    fireEvent.change(input, { target: { files: [txtFile] } })

    expect(onUpload).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('Envie apenas arquivos em PDF (.pdf).')
  })

  it('rejeita um arquivo maior que 20MB antes de enviar', () => {
    const onUpload = vi.fn()
    render(<UploadZone onUpload={onUpload} />)

    const input = screen.getByLabelText('Selecionar arquivo PDF')
    const bigPdf = new File(['%PDF-1.4'], 'grande.pdf', { type: 'application/pdf' })
    Object.defineProperty(bigPdf, 'size', { value: MAX_UPLOAD_BYTES + 1024 })
    fireEvent.change(input, { target: { files: [bigPdf] } })

    expect(onUpload).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('O arquivo passa de 20MB. Envie um PDF de até 20MB.')
  })

  it('envia um PDF válido de até 20MB', async () => {
    const onUpload = vi.fn().mockResolvedValue(undefined)
    render(<UploadZone onUpload={onUpload} />)

    const input = screen.getByLabelText('Selecionar arquivo PDF')
    const validPdf = new File(['%PDF-1.4 conteudo'], 'regulamento.pdf', { type: 'application/pdf' })
    fireEvent.change(input, { target: { files: [validPdf] } })

    await waitFor(() => {
      expect(onUpload).toHaveBeenCalledTimes(1)
    })
  })
})
