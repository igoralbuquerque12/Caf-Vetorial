import type { ThemeRegistration } from 'shiki'

/**
 * Tema do shiki: fundo navy, texto cream, comentários em cream-muted itálico,
 * palavras-chave em azul, strings em verde, anotações em areia, tipos em azul claro.
 * Nenhum laranja na sintaxe.
 */
export const copilotTheme: ThemeRegistration = {
  name: 'copilot-metro',
  type: 'dark',
  colors: {
    'editor.background': '#0D1833',
    'editor.foreground': '#F3EDE2',
  },
  settings: [
    { settings: { foreground: '#F3EDE2', background: '#0D1833' } },
    {
      scope: ['comment', 'punctuation.definition.comment'],
      settings: { foreground: '#B8B1A3', fontStyle: 'italic' },
    },
    {
      scope: [
        'keyword',
        'keyword.control',
        'keyword.operator.new',
        'keyword.other',
        'storage.modifier',
        'storage.type.function',
        'storage.type.class',
        'storage.type.java',
        'storage.type.primitive',
        'storage.type.ts',
        'storage.type',
        'constant.language',
        'variable.language',
        'entity.name.tag.yaml',
        'support.type.property-name.json',
        'support.type.property-name.yaml',
      ],
      settings: { foreground: '#9DB4E8' },
    },
    {
      scope: ['string', 'string.quoted', 'string.template', 'punctuation.definition.string'],
      settings: { foreground: '#8FBFA0' },
    },
    {
      scope: [
        'storage.type.annotation',
        'meta.declaration.annotation',
        'punctuation.definition.annotation',
        'entity.name.type.annotation',
        'meta.annotation',
        'entity.name.function.decorator',
        'meta.decorator',
      ],
      settings: { foreground: '#E3C27A' },
    },
    {
      scope: [
        'entity.name.type',
        'entity.name.class',
        'support.class',
        'support.type',
        'entity.other.inherited-class',
        'storage.type.generic',
        'meta.type',
      ],
      settings: { foreground: '#C9D6F5' },
    },
    {
      scope: ['constant.numeric', 'constant.other', 'support.constant'],
      settings: { foreground: '#C9D6F5' },
    },
    {
      scope: ['punctuation', 'meta.brace', 'keyword.operator'],
      settings: { foreground: '#B8B1A3' },
    },
  ],
}
