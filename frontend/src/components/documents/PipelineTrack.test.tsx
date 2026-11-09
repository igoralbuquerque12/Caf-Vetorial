import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PipelineTrack } from './PipelineTrack'
import { pipelineStationsFor } from './pipelineStations'

describe('PipelineTrack', () => {
  it('mapeia PENDING para "Enviado ao S3" concluído e "Na fila" atual', () => {
    const stations = pipelineStationsFor('PENDING')
    expect(stations).toEqual([
      { id: 's3', label: 'Enviado ao S3', state: 'done' },
      { id: 'queue', label: 'Na fila', state: 'current' },
      { id: 'worker', label: 'Worker processando', state: 'upcoming' },
      { id: 'vectorized', label: 'Vetorizado', state: 'upcoming' },
    ])
  })

  it('mapeia PROCESSING para "Worker processando" atual', () => {
    const stations = pipelineStationsFor('PROCESSING')
    expect(stations).toEqual([
      { id: 's3', label: 'Enviado ao S3', state: 'done' },
      { id: 'queue', label: 'Na fila', state: 'done' },
      { id: 'worker', label: 'Worker processando', state: 'current' },
      { id: 'vectorized', label: 'Vetorizado', state: 'upcoming' },
    ])
  })

  it('mapeia COMPLETED para todas as estações concluídas e exibe o chunkCount', () => {
    render(<PipelineTrack status="COMPLETED" chunkCount={18} />)
    expect(screen.getByTestId('station-s3')).toHaveAttribute('data-state', 'done')
    expect(screen.getByTestId('station-queue')).toHaveAttribute('data-state', 'done')
    expect(screen.getByTestId('station-worker')).toHaveAttribute('data-state', 'done')
    expect(screen.getByTestId('station-vectorized')).toHaveAttribute('data-state', 'done')
    expect(screen.getByText('Vetorizado (18)')).toBeInTheDocument()
  })

  it('mapeia FAILED para um marcador de falha com o errorMessage', () => {
    render(
      <PipelineTrack
        status="FAILED"
        errorMessage="Não foi possível extrair texto do PDF."
      />,
    )
    expect(screen.getByTestId('station-worker')).toHaveAttribute('data-state', 'failed')
    expect(screen.getByTestId('pipeline-failed-marker')).toHaveTextContent(
      'Não foi possível extrair texto do PDF.',
    )
  })
})
