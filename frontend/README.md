# Copilot de Previdência — Frontend (React + Vite + TypeScript)

Interface web independente para o backend Spring Boot do **Copilot de Previdência** — um RAG orientado a eventos que ingere regulamentos e apólices em PDF, vetoriza os trechos no PostgreSQL (`pgvector`) e responde perguntas citando as páginas de origem.

---

## 1. O que é o frontend e os seus três trabalhos

Este projeto foi desenhado para um desenvolvedor Node/NestJS estudando Java e Spring Boot. Ele cumpre **três trabalhos**, nesta ordem de prioridade:

1. **Cliente completo para testar o produto (`/entrar`, `/cadastro` e `/`):** criar conta, autenticar, enviar PDFs com barra de progresso, acompanhar o trilho de processamento assíncrono (`PENDING` -> `PROCESSING` -> `COMPLETED` / `FAILED`) via polling e conversar com a IA inspecionando os trechos e scores de similaridade.
2. **Ensinar o backend (`/raio-x` e `/java`):** mostrar o caminho de cada requisição pelas camadas e classes Java num mapa de metrô interativo (`MetroMap`), com folha de estação (`StationSheet`), trechos ilustrativos do código do servidor, equivalentes diretos no NestJS e 16 aulas comparativas.
3. **Explicar a infraestrutura (`/por-dentro`):** ilustrar visualmente a topologia e a jornada das mensagens no RabbitMQ (incluindo `AFTER_COMMIT`, `ack`, `prefetch` e `DLQ`), o upload fora de transação e a compensação no AWS S3, os índices `HNSW` e `GIN` do `pgvector` e a validação dos templates de prompt no boot.

O projeto é **totalmente desacoplado**: mora na pasta `frontend/` com seu próprio `package.json`, não importa nem lê arquivos do backend em build nem em runtime e conversa com a API **apenas por HTTP** através de `VITE_API_URL`.

---

## 2. Como rodar

### Pré-requisitos
- **Node.js 20+** (testado em Node 22)
- **Backend Spring Boot** rodando em `http://localhost:8080` com o CORS liberado para `http://localhost:5173` (`app.cors.allowed-origins: http://localhost:5173` em `server/src/main/resources/application.yml`) e a infraestrutura do `server/compose.yml` ativa (PostgreSQL + pgvector e RabbitMQ).

### Passo a passo

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Abra `http://localhost:5173`.

### Variáveis de ambiente (`frontend/.env`)
- `VITE_API_URL=http://localhost:8080` (**obrigatória**): validada no boot; se estiver ausente, o app exibe uma tela de erro de configuração.
- `VITE_RABBITMQ_UI_URL=http://localhost:15672` (*opcional*): quando preenchida, exibe o link `"Abrir painel do RabbitMQ"` na página `/por-dentro`. É apenas um link — o frontend nunca faz requisições para esse endereço.

### Scripts de verificação

```bash
npm run typecheck   # tsc --noEmit -p tsconfig.app.json
npm run lint        # oxlint
npm run test        # vitest run
npm run build       # tsc -b && vite build
```

---

## 3. Arquitetura do frontend

```
frontend/
├── src/
│   ├── api/            # client HTTP, single-flight refresh, upload XHR, máscaras e ProblemDetail
│   ├── stores/         # Zustand: sessão, inspetor (150 chamadas), roteiro demo e toasts
│   ├── flows/          # Catálogo estático de fluxos, variantes por status e resolveFlow
│   ├── content/        # Snippets ilustrativos (Java/YAML/SQL), 16 aulas Java vs Nest, glossário e prompts
│   ├── components/
│   │   ├── ui/         # Button, Field, StatusBadge, Tabs, Drawer, Toast, TopBar
│   │   ├── code/       # CodeBlock e CodeTabs (Shiki com tema copilot-metro)
│   │   ├── metro/      # MetroMap, Station, Track, RequestToken e StationSheet
│   │   ├── documents/  # UploadZone, DocumentList e PipelineTrack
│   │   ├── chat/       # ChatThread, MessageBubble, SourceList, PromptAnatomy e AskBox
│   │   └── infra/      # SystemMap, QueueTopology, QueueJourney, S3Flow, VectorFlow e PromptsSection
│   ├── pages/          # SignIn, SignUp, Workspace, XRay, Inside e JavaForNest
│   └── styles/         # index.css (@theme Tailwind v4) e shikiTheme.ts
├── DESIGN.md
└── README.md
```

### Camada de API (`src/api/client.ts` e `src/api/documents.ts`)
- Wrapper sobre `fetch` usando `import.meta.env.VITE_API_URL`.
- Injeta `Authorization: Bearer <accessToken>` nas rotas protegidas.
- Converte respostas de erro no padrão RFC 7807 (`ProblemDetail`) em `ApiError`, expondo `status`, `problem`, `fieldErrors` (vindo de `errors`) e `documentStatus` (no 409 de documento não pronto).
- O envio de PDF (`uploadDocument`) usa `XMLHttpRequest` para reportar o progresso real do upload, lê o header `Location` exposto pelo CORS e registra a chamada no inspetor.

### Refresh automático com *single-flight* (e por que ele é crítico)
No backend, `RefreshTokenService.rotate` **rotaciona** o refresh token a cada chamada a `/api/v1/auth/refresh` (com lock pessimista `SELECT ... FOR UPDATE`) e **detecta reuso**: se um token já revogado for enviado novamente, o backend assume que houve vazamento e **revoga todas as sessões ativas do usuário** (`noRollbackFor = InvalidRefreshTokenException.class`).

Se três requisições protegidas recebessem `401` simultaneamente e cada uma disparasse seu próprio `/auth/refresh` com o mesmo refresh token, a segunda e a terceira chegariam com um token acabado de revogar e derrubariam a sessão inteira do usuário. Por isso o `client.ts` mantém uma única `Promise` compartilhada (`refreshInFlight`): a primeira resposta `401` inicia a renovação e todas as demais aguardam essa mesma `Promise`, repetindo cada requisição original **uma única vez** com o novo access token.

### Inspetor (`src/stores/inspector.ts`) e catálogo de fluxos (`src/flows/`)
- Toda requisição passa por `recordCall`, que aplica as máscaras de segurança, resolve o fluxo e a variante (`resolveFlow(method, path, status)`) e guarda até os últimos **150 registros**.
- Chamadas `GET` idênticas e consecutivas (como o polling de `GET /api/v1/documents/{id}`) são colapsadas num único item com contador (`"12 consultas de status"`).

---

## 4. Decisões de design

Documentadas em [`DESIGN.md`](./DESIGN.md):

- **Paleta:** superfícies escuras (`abyss #070D1F`, `navy #0D1833`, `navy-raised #152449`, `track #25365F`), texto creme (`cream #F3EDE2`, `cream-muted #B8B1A3`) e cores de status dessaturadas (`#8FBFA0`, `#E07A68`, `#9DB4E8`).
- **Regras do laranja (`#FF7A1A`):** reservado exclusivamente para o botão principal de cada região (`Entrar`, `Criar conta`, `Enviar PDF`, `Perguntar`) e para o ponto que representa a requisição no `MetroMap`. Nunca aparece em bordas, decoração ou destaque de sintaxe.
- **Metáfora do metrô (`MetroMap`):** cada camada da arquitetura (`Segurança`, `Web`, `Serviço`, `Domínio e persistência`, `Infraestrutura`, `Sistemas externos`) é uma linha horizontal; cada passo (`Classe.metodo`) é uma estação; sistemas externos usam glifos geométricos próprios.
- **Observado vs. Ilustrado:** toda visualização traz a legenda fixa deixando explícito o que foi medido no navegador (status HTTP, cabeçalhos e duração em ms) e o que é ilustrado a partir do código conhecido do backend.

---

## 5. Segurança

- **Máscaras (`src/api/mask.ts`):** antes de qualquer registro entrar no inspetor, campos `password` são substituídos por `"••••••••"`, e `accessToken`, `refreshToken` e o header `Authorization` preservam apenas os primeiros 12 caracteres seguidos de `"…"`.
- **Access token em memória:** o JWT de curta duração (15 min) fica apenas no estado em memória do Zustand (`useSession`), nunca em `localStorage` ou `sessionStorage`.
- **Trade-off do refresh token no `sessionStorage` vs. cookie `HttpOnly`:** como o contrato atual da API recebe e devolve o `refreshToken` no corpo JSON (`POST /api/v1/auth/login` e `/refresh`), o frontend guarda-o no `sessionStorage` para sobreviver a recarregamentos da aba (F5) sem persistir no disco entre sessões do navegador como faria o `localStorage`. O trade-off é que qualquer armazenamento acessível via JavaScript (`sessionStorage` ou `localStorage`) permanece exposto caso exista uma vulnerabilidade de XSS na página. Uma evolução natural no backend seria emitir o refresh token num cookie `HttpOnly; Secure; SameSite=Strict` restrito ao path `/api/v1/auth`, tornando-o invisível ao JavaScript.
- **CORS na filter chain:** o backend registra `.cors(Customizer.withDefaults())` no `SecurityFilterChain` porque requisições com `Authorization: Bearer` disparam um *preflight* `OPTIONS` sem token; sem o `CorsFilter` antes da autorização, o navegador receberia `401` no preflight.

---

## 6. Como adicionar um fluxo novo ao catálogo

1. **Adicione os trechos ilustrativos** em `src/content/snippets/<assunto>.ts` (até ~25 linhas por snippet, com `highlight: [inicio, fim]` base 1).
2. **Defina o `FlowDefinition`** em `src/flows/` com `id`, `title`, `method`, `pathPattern` (`RegExp`), a lista de `steps` (`FlowStep[]`) e as `variants` (`FlowVariant[]`, começando sempre pela variante de sucesso).
3. **Confira anotações e aulas:** toda anotação listada em `step.annotations` deve existir em `src/content/glossary.ts`, e todo `step.javaLessonId` deve apontar para um id válido em `src/content/javaLessons.ts`.
4. **Registre o fluxo** no array `flowCatalog` e no mapa de rotas de `src/flows/catalog.ts`.
5. **Rode `npm run test`:** a suíte `src/flows/flows.test.ts` valida automaticamente a integridade de todos os fluxos, variantes, anotações, links de aulas e tamanho dos trechos.

---

## 7. Roteiro de demonstração para a entrevista

No topo da aplicação há o botão **Roteiro (0/8)**, que abre uma lista de verificação salva no `localStorage` e marcada automaticamente conforme você executa os 8 passos:

1. **Criar conta** em `/cadastro` (observe o mapa do fluxo `POST /api/v1/users` se desenhando e o login automático em seguida).
2. **Entrar** (ou testar um erro `401` / `409` e vê-lo aparecer no inspetor).
3. **Enviar um PDF** na coluna Documentos do Workspace (acompanhe a barra de progresso via `XMLHttpRequest` e o aviso `"PDF enviado"`).
4. **Acompanhar o trilho até "Vetorizado"** (`Enviado ao S3` -> `Na fila` -> `Worker processando` -> `Vetorizado (N)` com polling a cada 2 segundos).
5. **Ver a jornada da mensagem em "Por dentro"** (`/por-dentro`), guiada pelo status real do último documento enviado, além dos diagramas de S3, pgvector e prompts.
6. **Fazer uma pergunta** no chat sobre o PDF vetorizado e inspecionar os chips de página e barra de score.
7. **Abrir o caminho da resposta no Raio-X** clicando em `"Ver o caminho desta resposta"` (navegue pelas estações com as setas do teclado ou o botão `Reproduzir`, passe o mouse nas anotações e veja o HTTP bruto mascarado).
8. **Ver o prompt montado** clicando em `"Ver o prompt montado"` para inspecionar o system prompt e o template de RAG preenchido com `{query}` e `{question_answer_context}`.
