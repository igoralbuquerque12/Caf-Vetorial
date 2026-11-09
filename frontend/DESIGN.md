# DESIGN — Copilot de Previdência

Documento de direção visual. Escrito antes das telas e revisado contra o brief (seção "Revisão" no fim).

## 1. Ideia central

Uma requisição HTTP é um **trem** que atravessa as camadas do backend. O `MetroMap` é a assinatura visual: faixas por camada, estações por classe/método, um ponto laranja que viaja. O resto da interface é sóbria: superfícies azul-marinho, texto creme, bordas finas.

Toda tela que mostra o caminho de uma requisição separa:

- **Observado:** status HTTP e tempo de resposta (medidos no navegador).
- **Ilustrado:** o caminho interno (conforme o código do backend, escrito à mão no catálogo).

## 2. Tokens (`@theme` em `src/styles/index.css`)

| Token | Hex | Uso |
|---|---|---|
| `abyss` | `#070D1F` | fundo da aplicação |
| `navy` | `#0D1833` | painéis, colunas |
| `navy-raised` | `#152449` | mensagens, folha de estação, menus |
| `track` | `#25365F` | bordas, divisores, trilhos |
| `cream` | `#F3EDE2` | texto principal, ícones, anel de foco |
| `cream-muted` | `#B8B1A3` | texto secundário |
| `orange` | `#FF7A1A` | botão principal de cada região e ponto da requisição |
| `ok` | `#8FBFA0` | sucesso |
| `fail` | `#E07A68` | falha |
| `busy` | `#9DB4E8` | em andamento |

Faixas do mapa (tons de azul/creme, sem arco-íris): segurança `#3A4F86`, web `#2F5F8F`, serviço `#4A6FA5`, domínio e persistência `#6C84B8`, infraestrutura `#8A93A8`, externo `#B8B1A3`.

**Contraste (AA):** `cream` sobre `abyss`/`navy`/`navy-raised` > 11:1; `cream-muted` sobre `navy` ≈ 8:1; `abyss` sobre `orange` ≈ 8:1; `fail`, `ok` e `busy` sobre `navy` > 6:1.

### Laranja
Um botão por região (Entrar / Criar conta / Enviar PDF / Perguntar) e o ponto da requisição. Nunca em borda, decoração ou fundo grande. Texto sobre laranja: `abyss`. Foco: anel `cream` de 2px.

## 3. Tipografia

- **Overpass** (400, 600, 800) em toda a interface. Origem em sinalização rodoviária, combina com o metrô.
- **JetBrains Mono** só em código, HTTP bruto e JSON.
- Escala ~1,25 a partir de 16px: 12,8 / 16 / 20 / 25 / 31 / 39. Altura de linha 1,55. Texto corrido limitado a `72ch`.

## 4. Raios e movimento

- Moldura da app: 0. Painéis: 12px. Controles: 8px. Chips: totalmente arredondados.
- Uma animação orquestrada: o traçado do fluxo na tela de login/cadastro (uma vez).
- Ponto da requisição no mapa. Animações em resposta a ação do usuário (barra de progresso, expandir fonte, abrir folha).
- `prefers-reduced-motion`: sem traçado, e o ponto salta de estação em estação.

## 5. Layout (wireframes)

### Entrar / Cadastro
```
┌──────────────────────────────┬──────────────────────────┐
│ Copilot de Previdência       │  Entrar                  │
│ frase do produto             │  [e-mail]                │
│ ●━━━●━━━●━━━●  (se desenha)  │  [senha]                 │
│ fluxo de login               │  [Entrar]*               │
└──────────────────────────────┴──────────────────────────┘
mobile: coluna única, mapa em cima compacto
```

### Workspace
```
┌ barra fina: Workspace  Raio-X  Por dentro  Java para quem vem do Nest   roteiro  email  Sair ┐
├──────────────┬───────────────────────────────┬─────────────────────┤
│ Documentos   │ Conversa sobre: x.pdf         │ Raio-X (recolhível) │
│ [Enviar PDF]*│ mensagens + fontes            │ mapa compacto       │
│ trilho ●●●○  │ [pergunta........][Perguntar]*│ [Abrir no Raio-X]   │
└──────────────┴───────────────────────────────┴─────────────────────┘
mobile: abas Documentos | Conversa | Raio-X
```

### Raio-X
```
┌ Requisições ┬ POST /api/v1/chat  200  1,8 s ───────────────────┐
│ linha do    │ ●───●───●───●───◉   (faixas por camada)          │
│ tempo       │ [◀] [Reproduzir] [▶] velocidade                  │
│ Catálogo    │ Folha da estação: classe, Nest, anotações, código│
│ de fluxos   │ [Requisição] [Resposta] HTTP bruto mascarado     │
└─────────────┴──────────────────────────────────────────────────┘
```

### Por dentro / Java
Navegação lateral (seções / aulas) e conteúdo central; no mobile a lateral vira um seletor no topo.

## 6. Princípios

1. O mapa é a única peça "ilustrada com personalidade". O resto é tipografia e espaço.
2. Hierarquia por peso e tamanho (Overpass 800 para títulos), não por cor.
3. Cor só significa algo: status, camada ou ação principal.
4. Todo trecho de Java é rotulado "Trecho ilustrativo do backend".
5. Estados de carregamento, vazio e erro em toda lista e painel.

## 7. Revisão contra o brief (o que troquei de padrão genérico)

| Padrão genérico que eu usaria | Troca | Motivo |
|---|---|---|
| Cards iguais em grade para documentos e aulas | Lista em linhas separadas por divisores `track`, com trilho de estações por documento | Brief proíbe grade de cards idênticos; o trilho reforça a metáfora |
| Rótulos pequenos em caixa alta acima de títulos | Títulos diretos em sentença, em peso 800 | Proibição explícita |
| Botões com seta `→` | Verbo claro ("Ver o caminho desta resposta") com ícone Lucide à esquerda quando necessário | Proibição explícita |
| Metadados `A · B · C` | Itens separados por espaço e peso/cor diferentes, ou em linhas distintas | Proibição explícita |
| Hero com gradiente no login | Mapa de metrô que se desenha | Única animação orquestrada; sem gradiente |
| Destacar uma palavra do título em outra cor | Título em uma cor só | Proibição explícita |
| Abas com sublinhado laranja | Aba ativa em `navy-raised` com texto creme e borda `track` | Laranja é reservado |
| Foco em azul padrão | Anel `cream` de 2px com offset | Regra do laranja e identidade |
| Toasts coloridos em bloco cheio | Folha `navy-raised` com um marcador de status fino à esquerda | Cor só como sinal |
| Mono em chips e badges | Overpass em toda a interface | Mono só para código |
