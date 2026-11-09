import { describe, expect, it } from 'vitest'
import { ApiError, documentStatusOf, fieldErrorsOf, messageOf, networkErrorMessage, parseProblem } from './problem'

describe('problem', () => {
  it('faz o parse de um ProblemDetail', () => {
    const problem = parseProblem('{"type":"about:blank","title":"Conflict","status":409,"detail":"E-mail já cadastrado","instance":"/api/v1/users"}')
    expect(problem).toMatchObject({ status: 409, detail: 'E-mail já cadastrado' })
  })

  it('devolve null para corpo vazio, inválido ou que não é objeto', () => {
    expect(parseProblem('')).toBeNull()
    expect(parseProblem('<html>')).toBeNull()
    expect(parseProblem('[1,2]')).toBeNull()
  })

  it('mapeia errors para os campos', () => {
    const problem = parseProblem('{"status":400,"detail":"Dados inválidos","errors":{"email":"O e-mail deve ser válido","password":"A senha é obrigatória"}}')
    expect(fieldErrorsOf(problem)).toEqual({ email: 'O e-mail deve ser válido', password: 'A senha é obrigatória' })
    const error = new ApiError('x', 400, problem)
    expect(error.fieldErrors.email).toBe('O e-mail deve ser válido')
  })

  it('lê documentStatus do 409 e ignora valores desconhecidos', () => {
    const problem = parseProblem('{"status":409,"detail":"não está pronto","documentStatus":"PROCESSING"}')
    expect(documentStatusOf(problem)).toBe('PROCESSING')
    expect(new ApiError('x', 409, problem).documentStatus).toBe('PROCESSING')
    expect(documentStatusOf(parseProblem('{"documentStatus":"OUTRO"}'))).toBeUndefined()
  })

  it('usa o detail como mensagem para o usuário', () => {
    const error = new ApiError('genérica', 404, { detail: 'Documento não encontrado' })
    expect(messageOf(error)).toBe('Documento não encontrado')
    expect(messageOf(new Error('falhou'))).toBe('falhou')
    expect(messageOf(null, 'padrão')).toBe('padrão')
  })

  it('monta a mensagem de falha de rede', () => {
    expect(networkErrorMessage('http://localhost:8080')).toBe(
      'Não foi possível falar com a API em http://localhost:8080. Confira se o backend está rodando.',
    )
  })
})
