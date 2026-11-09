import type { ThemeRegistration } from 'shiki'

/**
 * Tema escuro minimalista do Shiki alinhado à paleta Slate + Cyan.
 */
export const copilotTheme: ThemeRegistration = {
  name: 'copilot-metro',
  type: 'dark',
  colors: {
    'editor.background': '#090f1e',
    'editor.foreground': '#f1f5f9',
  },
  settings: [
    { settings: { foreground: '#f1f5f9', background: '#090f1e' } },
    {
      scope: ['comment', 'punctuation.definition.comment'],
      settings: { foreground: '#64748b', fontStyle: 'italic' },
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
      settings: { foreground: '#38bdf8' },
    },
    {
      scope: ['string', 'string.quoted', 'string.template', 'punctuation.definition.string'],
      settings: { foreground: '#34d399' },
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
      settings: { foreground: '#fbbf24' },
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
      settings: { foreground: '#e2e8f0' },
    },
    {
      scope: ['constant.numeric', 'constant.other', 'support.constant'],
      settings: { foreground: '#a5b4fc' },
    },
    {
      scope: ['punctuation', 'meta.brace', 'keyword.operator'],
      settings: { foreground: '#94a3b8' },
    },
  ],
}
