import { describe, expect, it } from 'vitest'
import { flowCatalog, getFlow } from './catalog'
import { NO_VARIANT_WARNING, resolveFlow } from './resolveFlow'
import { lookupGlossary } from '../content/glossary'
import { javaLessons } from '../content/javaLessons'

describe('resolveFlow', () => {
  const cases: Array<[string, string, number, string, string]> = [
    ['POST', '/api/v1/users', 201, 'user.register', 'created'],
    ['POST', '/api/v1/users', 400, 'user.register', 'validation'],
    ['POST', '/api/v1/users', 409, 'user.register', 'conflict'],
    ['POST', '/api/v1/auth/login', 200, 'auth.login', 'ok'],
    ['POST', '/api/v1/auth/login', 401, 'auth.login', 'bad-credentials'],
    ['POST', '/api/v1/auth/refresh', 200, 'auth.refresh', 'ok'],
    ['POST', '/api/v1/auth/refresh', 401, 'auth.refresh', 'invalid'],
    ['POST', '/api/v1/auth/logout', 204, 'auth.logout', 'ok'],
    ['GET', '/api/v1/users/me', 200, 'user.me', 'ok'],
    ['GET', '/api/v1/users/me', 401, 'user.me', 'unauthorized'],
    ['POST', '/api/v1/documents', 202, 'document.upload', 'accepted'],
    ['POST', '/api/v1/documents', 400, 'document.upload', 'invalid'],
    ['POST', '/api/v1/documents', 413, 'document.upload', 'too-large'],
    ['POST', '/api/v1/documents', 503, 'document.upload', 'storage'],
    ['GET', '/api/v1/documents', 200, 'document.list', 'ok'],
    ['GET', '/api/v1/documents/3f2a1b00-0000-4000-8000-000000000000', 200, 'document.get', 'ok'],
    ['GET', '/api/v1/documents/3f2a1b00-0000-4000-8000-000000000000', 404, 'document.get', 'not-found'],
    ['POST', '/api/v1/chat', 200, 'chat.ask', 'ok'],
    ['POST', '/api/v1/chat', 404, 'chat.ask', 'not-found'],
    ['POST', '/api/v1/chat', 409, 'chat.ask', 'not-ready'],
    ['POST', '/api/v1/chat', 502, 'chat.ask', 'ai-failure'],
  ]

  it.each(cases)('%s %s com status %i', (method, path, status, flowId, variantId) => {
    expect(resolveFlow(method, path, status)).toEqual({ flowId, variantId })
  })

  it('ignora query string e origem', () => {
    expect(resolveFlow('GET', 'http://localhost:8080/api/v1/documents?x=1', 200)?.flowId).toBe('document.list')
  })

  it('usa a variante de sucesso e avisa quando o status não tem variante', () => {
    expect(resolveFlow('POST', '/api/v1/chat', 418)).toEqual({ flowId: 'chat.ask', variantId: 'ok', warning: NO_VARIANT_WARNING })
    expect(resolveFlow('POST', '/api/v1/chat', 0)?.warning).toBe('Status sem variante catalogada')
  })

  it('devolve null para rotas fora do catálogo', () => {
    expect(resolveFlow('GET', '/actuator/health', 200)).toBeNull()
    expect(resolveFlow('DELETE', '/api/v1/documents', 200)).toBeNull()
  })
})

describe('integridade do catálogo', () => {
  const lessonIds = new Set(javaLessons.map((l) => l.id))

  it('todo stepId das variantes existe nos steps do fluxo', () => {
    for (const flow of flowCatalog) {
      const ids = new Set(flow.steps.map((s) => s.id))
      for (const variant of flow.variants) {
        for (const stepId of variant.stepIds) {
          expect(ids.has(stepId), `${flow.id}/${variant.id} referencia "${stepId}"`).toBe(true)
        }
      }
    }
  })

  it('os ids dos steps são únicos dentro de cada fluxo', () => {
    for (const flow of flowCatalog) {
      const ids = flow.steps.map((s) => s.id)
      expect(new Set(ids).size, flow.id).toBe(ids.length)
    }
  })

  it('todo passo tem explanation e nestEquivalent', () => {
    for (const flow of flowCatalog) {
      for (const step of flow.steps) {
        expect(step.explanation.trim(), `${flow.id}/${step.id}`).not.toBe('')
        expect(step.nestEquivalent.trim(), `${flow.id}/${step.id}`).not.toBe('')
      }
    }
  })

  it('todo javaLessonId existe', () => {
    for (const flow of flowCatalog) {
      for (const step of flow.steps) {
        if (step.javaLessonId) expect(lessonIds.has(step.javaLessonId), `${flow.id}/${step.id}: ${step.javaLessonId}`).toBe(true)
      }
    }
  })

  it('toda anotação citada tem entrada no glossário', () => {
    for (const flow of flowCatalog) {
      for (const step of flow.steps) {
        for (const annotation of step.annotations ?? []) {
          expect(lookupGlossary(annotation), `${flow.id}/${step.id}: ${annotation}`).toBeDefined()
        }
      }
    }
  })

  it('os links das aulas apontam para estações existentes', () => {
    for (const lesson of javaLessons) {
      for (const link of lesson.appearsIn) {
        const flow = getFlow(link.flowId)
        expect(flow, `${lesson.id}: fluxo ${link.flowId}`).toBeDefined()
        expect(flow?.steps.some((s) => s.id === link.stepId), `${lesson.id}: ${link.flowId}/${link.stepId}`).toBe(true)
      }
    }
  })

  it('cada fluxo começa pela variante de sucesso', () => {
    for (const flow of flowCatalog) {
      expect(flow.variants[0].status, flow.id).toBeLessThan(400)
    }
  })

  it('os trechos têm no máximo ~25 linhas', () => {
    for (const flow of flowCatalog) {
      for (const step of flow.steps) {
        if (step.snippet) expect(step.snippet.code.split('\n').length, `${flow.id}/${step.id}`).toBeLessThanOrEqual(26)
      }
    }
  })
})
