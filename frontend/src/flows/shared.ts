import type { FlowStep } from './types'

/** Estação do handler global, usada pelas variantes de erro. */
export function handlerStep(
  id: string,
  member: string,
  explanation: string,
  snippet: FlowStep['snippet'],
  lessonId = 'exceptions',
): FlowStep {
  return {
    id,
    className: 'GlobalExceptionHandler',
    member,
    layer: 'web',
    explanation,
    nestEquivalent: 'Um ExceptionFilter do Nest (@Catch) que transforma a exceção numa resposta HTTP padronizada.',
    annotations: ['@RestControllerAdvice', '@ExceptionHandler'],
    snippet,
    javaLessonId: lessonId,
  }
}

/** Filtro Bearer das rotas protegidas. */
export function bearerStep(id: string, snippet: FlowStep['snippet']): FlowStep {
  return {
    id,
    className: 'BearerTokenAuthenticationFilter',
    member: 'doFilter',
    layer: 'seguranca',
    explanation:
      'Primeiro item da cadeia de segurança. Lê o header Authorization, valida o JWT e coloca o usuário no contexto. Sem token válido, responde 401 aqui mesmo.',
    nestEquivalent: 'Um AuthGuard("jwt") do Nest, só que executado como filtro antes de chegar ao controller.',
    dependencies: ['JwtDecoder'],
    snippet,
    javaLessonId: 'security-cors',
  }
}
