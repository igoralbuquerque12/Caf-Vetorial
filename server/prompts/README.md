# Personalização de Prompts (`prompts/`)

Esta pasta contém exemplos de prompts customizados externos ao JAR da aplicação.

## Como ativar o `system-prompt.custom.st` sem recompilar

Por padrão, a aplicação carrega o prompt de sistema embutido em `classpath:prompts/system-prompt.st`. Para substituí-lo pelo arquivo [`system-prompt.custom.st`](./system-prompt.custom.st) (com tom mais técnico voltado a corretores):

### Opção 1: Variável de ambiente (ou no `.env`)
```properties
APP_CHAT_SYSTEM_PROMPT=file:./prompts/system-prompt.custom.st
```

### Opção 2: Argumento de linha de comando
```powershell
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.arguments=--app.chat.system-prompt=file:./prompts/system-prompt.custom.st"
```

## Regras importantes de validação no boot (*Fail Fast*)
- **Não coloque comentários com `#` dentro dos arquivos `.st`**, pois todo o conteúdo do arquivo é enviado ao modelo como instrução.
- O **System Prompt** não pode estar em branco e **não pode conter chaves `{` ou `}`** (que seriam interpretadas como variáveis pelo motor StringTemplate).
- O **RAG Prompt** (`app.chat.rag-prompt`) deve obrigatoriamente conter os marcadores `{query}` e `{question_answer_context}`.
- Como os arquivos são lidos e validados na inicialização (`ChatPromptsLoader`), **é necessário reiniciar a aplicação** após alterar qualquer arquivo de prompt.
