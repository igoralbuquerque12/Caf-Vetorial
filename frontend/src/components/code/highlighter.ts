import { createHighlighterCore, type HighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import http from 'shiki/langs/http.mjs'
import java from 'shiki/langs/java.mjs'
import json from 'shiki/langs/json.mjs'
import sql from 'shiki/langs/sql.mjs'
import typescript from 'shiki/langs/typescript.mjs'
import yaml from 'shiki/langs/yaml.mjs'
import { copilotTheme } from '../../styles/shikiTheme'

export type CodeLanguage = 'java' | 'yaml' | 'sql' | 'http' | 'json' | 'typescript'

let highlighterPromise: Promise<HighlighterCore> | null = null

export function getHighlighter(): Promise<HighlighterCore> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      themes: [copilotTheme],
      langs: [java, yaml, sql, http, json, typescript],
      engine: createJavaScriptRegexEngine(),
    })
  }
  return highlighterPromise
}
