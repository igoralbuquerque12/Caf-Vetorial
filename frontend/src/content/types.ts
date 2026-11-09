import type { Snippet } from '../flows/types'

/** Trecho em outra linguagem (ex.: o lado "No Nest/TypeScript" das aulas). */
export interface CodeExample {
  language: 'typescript' | 'java' | 'yaml' | 'sql' | 'http' | 'json'
  code: string
  highlight?: [number, number]
}

export interface LessonFlowLink {
  flowId: string
  stepId: string
  /** Frase curta: por que esta estação ilustra o conceito. */
  note: string
}

export interface JavaLesson {
  id: string
  title: string
  /** Uma frase para a lista lateral. */
  summary: string
  /** 2 ou 3 parágrafos curtos, tom de professor. */
  paragraphs: string[]
  nest: CodeExample
  java: Snippet
  appearsIn: LessonFlowLink[]
}

export interface GlossaryEntry {
  /** Nome exibido, ex.: "@Service" ou "Dirty checking". */
  term: string
  /** Explicação curta para tooltip (até ~220 caracteres), pt-BR. */
  short: string
  /** Equivalente no Nest/Node, quando existir. */
  nest?: string
}
