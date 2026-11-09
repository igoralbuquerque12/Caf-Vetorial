import type { GlossaryEntry } from './types'

export const glossary: Record<string, GlossaryEntry> = {
  // ---------- Anotações ----------
  '@Service': {
    term: '@Service',
    short: 'Marca a classe como um bean de serviço (regras de negócio). O Spring cria uma instância e a injeta onde for pedida.',
    nest: '@Injectable() em um provider de serviço',
  },
  '@Transactional': {
    term: '@Transactional',
    short: 'O método roda dentro de uma transação de banco, via proxy: commit ao terminar, rollback em RuntimeException.',
    nest: 'queryRunner.startTransaction() / @Transactional do typeorm-transactional',
  },
  '@RestController': {
    term: '@RestController',
    short: 'Classe que atende requisições HTTP e devolve o retorno direto como JSON no corpo da resposta.',
    nest: '@Controller()',
  },
  '@RequestMapping': {
    term: '@RequestMapping',
    short: 'Define o caminho base (e opcionalmente o método HTTP) de um controller ou handler.',
    nest: '@Controller("prefixo")',
  },
  '@PostMapping': {
    term: '@PostMapping',
    short: 'Liga um método a requisições POST em um caminho. Atalho de @RequestMapping(method = POST).',
    nest: '@Post()',
  },
  '@GetMapping': {
    term: '@GetMapping',
    short: 'Liga um método a requisições GET em um caminho.',
    nest: '@Get()',
  },
  '@Valid': {
    term: '@Valid',
    short: 'Dispara a Bean Validation no objeto do parâmetro. Se houver erro, lança MethodArgumentNotValidException (400).',
    nest: 'ValidationPipe aplicado ao @Body()',
  },
  '@RequestBody': {
    term: '@RequestBody',
    short: 'Converte o JSON do corpo da requisição no objeto do parâmetro (por exemplo, um record).',
    nest: '@Body()',
  },
  '@RequestParam': {
    term: '@RequestParam',
    short: 'Lê um parâmetro de query string (?nome=valor) ou de formulário e injeta no argumento do método.',
    nest: '@Query("nome")',
  },
  '@RequestPart': {
    term: '@RequestPart',
    short: 'Lê uma parte de uma requisição multipart/form-data, como um arquivo enviado (MultipartFile).',
    nest: '@UploadedFile() com FileInterceptor',
  },
  '@ResponseStatus': {
    term: '@ResponseStatus',
    short: 'Fixa o status HTTP da resposta de um método, por exemplo 204 No Content ou 201 Created.',
    nest: '@HttpCode(204)',
  },
  '@PrePersist': {
    term: '@PrePersist',
    short: 'Callback JPA executado logo antes de a entidade ser inserida no banco, útil para preencher datas e defaults.',
    nest: '@BeforeInsert() do TypeORM',
  },
  '@PreUpdate': {
    term: '@PreUpdate',
    short: 'Callback JPA executado logo antes de um UPDATE da entidade, útil para atualizar updatedAt.',
    nest: '@BeforeUpdate() do TypeORM',
  },
  '@Entity': {
    term: '@Entity',
    short: 'Marca a classe como entidade JPA, mapeada para uma tabela do banco.',
    nest: '@Entity() do TypeORM',
  },
  '@Table': {
    term: '@Table',
    short: 'Define o nome da tabela (e índices/constraints) da entidade, quando difere do padrão.',
    nest: '@Entity("nome_tabela")',
  },
  '@Id': {
    term: '@Id',
    short: 'Indica o campo que é a chave primária da entidade.',
    nest: '@PrimaryColumn() / @PrimaryGeneratedColumn()',
  },
  '@Column': {
    term: '@Column',
    short: 'Configura a coluna do campo: nome, nullable, tamanho, updatable e tipo SQL.',
    nest: '@Column({ name, nullable, length })',
  },
  '@Enumerated': {
    term: '@Enumerated',
    short: 'Define como um enum é gravado. Com EnumType.STRING salva o nome (COMPLETED), mais seguro que o ordinal.',
    nest: '@Column({ type: "enum", enum: Status })',
  },
  '@GeneratedValue': {
    term: '@GeneratedValue',
    short: 'Pede que o id seja gerado automaticamente (UUID, sequence ou identity) em vez de atribuído à mão.',
    nest: '@PrimaryGeneratedColumn("uuid")',
  },
  '@Component': {
    term: '@Component',
    short: 'Marca a classe como bean genérico do Spring. @Service e @Repository são especializações dela.',
    nest: '@Injectable()',
  },
  '@Configuration': {
    term: '@Configuration',
    short: 'Classe que declara beans via métodos @Bean. É onde se monta e personaliza a infraestrutura.',
    nest: '@Module({ providers: [...] }) com useFactory',
  },
  '@Bean': {
    term: '@Bean',
    short: 'O retorno do método vira um bean gerenciado. Usado para objetos que não podemos anotar, como libs de terceiros.',
    nest: 'Provider com useFactory',
  },
  '@Repository': {
    term: '@Repository',
    short: 'Marca um bean de acesso a dados e traduz exceções de persistência. Em Spring Data, interfaces já são detectadas.',
    nest: 'Repository<T> injetado via @InjectRepository',
  },
  '@TransactionalEventListener': {
    term: '@TransactionalEventListener',
    short: 'Ouve um evento só em certa fase da transação (por padrão, depois do commit). Garante agir apenas com dados já gravados.',
    nest: 'EventEmitter2 com emit após o commit',
  },
  '@RabbitListener': {
    term: '@RabbitListener',
    short: 'Faz o método consumir mensagens de uma fila do RabbitMQ. O Spring AMQP cuida da conexão, desserialização e ack.',
    nest: '@MessagePattern / @EventPattern (microservices RMQ)',
  },
  '@RestControllerAdvice': {
    term: '@RestControllerAdvice',
    short: 'Classe global que centraliza o tratamento de exceções de todos os controllers e responde em JSON.',
    nest: '@Catch() ExceptionFilter global',
  },
  '@ExceptionHandler': {
    term: '@ExceptionHandler',
    short: 'Método que trata um tipo de exceção específico e devolve a resposta HTTP correspondente.',
    nest: 'catch() de um ExceptionFilter',
  },
  '@ConfigurationProperties': {
    term: '@ConfigurationProperties',
    short: 'Liga um prefixo do application.yml (ex.: app.jwt) a um objeto tipado, convertendo tipos automaticamente.',
    nest: 'registerAs() + ConfigService.get()',
  },
  '@ConfigurationPropertiesScan': {
    term: '@ConfigurationPropertiesScan',
    short: 'Varre o pacote e registra como beans todas as classes anotadas com @ConfigurationProperties.',
    nest: 'ConfigModule.forRoot({ load: [...] })',
  },
  '@Validated': {
    term: '@Validated',
    short: 'Ativa a validação das anotações (@NotBlank, @Size) no bean, como nos records de configuração, na inicialização.',
    nest: 'validationSchema (Joi) do ConfigModule',
  },
  '@EnableWebSecurity': {
    term: '@EnableWebSecurity',
    short: 'Ativa o Spring Security e permite definir a cadeia de filtros (SecurityFilterChain) da aplicação.',
    nest: 'AuthModule + guards globais',
  },
  '@NotBlank': {
    term: '@NotBlank',
    short: 'O texto não pode ser nulo, vazio nem só espaços.',
    nest: '@IsNotEmpty() do class-validator',
  },
  '@NotNull': {
    term: '@NotNull',
    short: 'O valor não pode ser nulo. Texto vazio passa; para isso use @NotBlank.',
    nest: '@IsDefined()',
  },
  '@NotEmpty': {
    term: '@NotEmpty',
    short: 'Texto, lista ou mapa não pode ser nulo nem vazio (tamanho maior que zero).',
    nest: '@ArrayNotEmpty()',
  },
  '@Size': {
    term: '@Size',
    short: 'Limita o tamanho mínimo e/ou máximo de texto, lista ou mapa.',
    nest: '@Length(min, max)',
  },
  '@Email': {
    term: '@Email',
    short: 'Exige um formato de e-mail válido (aceita nulo; combine com @NotBlank).',
    nest: '@IsEmail()',
  },
  '@Query': {
    term: '@Query',
    short: 'Define uma consulta JPQL ou SQL explícita para um método de repositório quando o nome derivado não basta.',
    nest: 'QueryBuilder / repository.query()',
  },
  '@Override': {
    term: '@Override',
    short: 'Indica que o método sobrescreve um da superclasse ou interface; o compilador avisa se a assinatura não bater.',
    nest: 'Palavra-chave override do TypeScript',
  },
  '@ConditionalOnMissingBean': {
    term: '@ConditionalOnMissingBean',
    short: 'Cria o bean padrão só se você ainda não definiu um do mesmo tipo. É a base da autoconfiguração.',
    nest: 'Valor default em DynamicModule.forRoot()',
  },
  '@Autowired': {
    term: '@Autowired',
    short: 'Pede ao Spring que injete uma dependência. Com um único construtor é opcional; prefira injeção pelo construtor.',
    nest: '@Inject() ou parâmetro do construtor',
  },
  '@Test': {
    term: '@Test',
    short: 'Marca um método como teste (JUnit 5), executado pelo runner de testes.',
    nest: 'it() / test() do Jest',
  },
  '@SpringBootApplication': {
    term: '@SpringBootApplication',
    short: 'Ponto de entrada: junta @Configuration, autoconfiguração e varredura de componentes do pacote.',
    nest: 'AppModule + NestFactory.create()',
  },

  // ---------- Conceitos ----------
  bean: {
    term: 'Bean',
    short: 'Objeto criado e gerenciado pelo container do Spring, normalmente um singleton, injetado onde necessário.',
    nest: 'Provider',
  },
  'container-ioc': {
    term: 'Container IoC',
    short: 'O Spring cria os objetos, resolve as dependências entre eles e controla o ciclo de vida. Você só declara o que precisa.',
    nest: 'Injector do Nest (módulos e providers)',
  },
  autoconfiguracao: {
    term: 'Autoconfiguração',
    short: 'Beans padrão registrados conforme as libs no classpath, que recuam quando você define os seus.',
    nest: 'DynamicModule.forRoot() com opções default',
  },
  'filter-chain': {
    term: 'Filter chain',
    short: 'Sequência de filtros do Spring Security pela qual cada requisição passa antes do controller (CORS, JWT, autorização).',
    nest: 'Middlewares + guards em ordem',
  },
  principal: {
    term: 'Principal',
    short: 'O usuário autenticado da requisição atual. Com JWT, é o token validado, de onde se lê o subject (id do usuário).',
    nest: 'request.user preenchido pelo AuthGuard',
  },
  proxy: {
    term: 'Proxy',
    short: 'Objeto que embrulha seu bean e intercepta as chamadas para adicionar comportamento, como a transação do @Transactional.',
    nest: 'Interceptor envolvendo o handler',
  },
  'self-invocation': {
    term: 'Self-invocation',
    short: 'Chamar um método @Transactional da mesma classe via this contorna o proxy, e a anotação é ignorada.',
  },
  'dirty-checking': {
    term: 'Dirty checking',
    short: 'Dentro de uma transação, o JPA detecta mudanças nas entidades carregadas e faz o UPDATE sozinho no commit, sem chamar save().',
    nest: 'Sem equivalente direto; no TypeORM é preciso chamar save()',
  },
  'problem-detail': {
    term: 'ProblemDetail',
    short: 'Formato padrão RFC 7807 para erros HTTP em JSON: type, title, status, detail e instance.',
    nest: 'Corpo de HttpException / ExceptionFilter padronizado',
  },
  exchange: {
    term: 'Exchange',
    short: 'Ponto de entrada do RabbitMQ: o produtor publica nele e ele roteia as mensagens para filas conforme as regras (bindings).',
  },
  binding: {
    term: 'Binding',
    short: 'Regra que liga uma exchange a uma fila, geralmente com uma routing key que filtra quais mensagens passam.',
  },
  'routing-key': {
    term: 'Routing key',
    short: 'Texto enviado com a mensagem que a exchange compara com os bindings para decidir a fila de destino.',
  },
  dlx: {
    term: 'DLX (Dead Letter Exchange)',
    short: 'Exchange que recebe as mensagens rejeitadas, expiradas ou que esgotaram as tentativas, para tratamento separado.',
  },
  dlq: {
    term: 'DLQ (Dead Letter Queue)',
    short: 'Fila que guarda as mensagens que falharam definitivamente, para inspeção ou reprocessamento manual.',
    nest: 'Fila de failed jobs do BullMQ',
  },
  ack: {
    term: 'Ack',
    short: 'Confirmação do consumidor ao broker de que processou a mensagem. Sem ack, ela volta para a fila.',
  },
  prefetch: {
    term: 'Prefetch',
    short: 'Quantas mensagens sem ack o broker entrega a um consumidor ao mesmo tempo. Controla a concorrência.',
    nest: 'concurrency do worker no BullMQ',
  },
  idempotencia: {
    term: 'Idempotência',
    short: 'Executar a mesma operação várias vezes produz o mesmo resultado que uma. Essencial quando a mensagem pode chegar repetida.',
  },
  'at-least-once': {
    term: 'At-least-once',
    short: 'Garantia de entrega: a mensagem chega uma ou mais vezes, nunca zero. Por isso o consumidor precisa ser idempotente.',
  },
  compensacao: {
    term: 'Compensação',
    short: 'Ação que desfaz um passo anterior quando um posterior falha, como apagar do S3 o arquivo cujo registro não foi gravado.',
    nest: 'Padrão saga: passos compensatórios',
  },
  chunk: {
    term: 'Chunk',
    short: 'Pedaço de texto de tamanho controlado em que o documento é dividido antes de gerar embeddings e indexar.',
  },
  embedding: {
    term: 'Embedding',
    short: 'Vetor de números que representa o significado de um texto. Textos parecidos geram vetores próximos.',
  },
  hnsw: {
    term: 'HNSW',
    short: 'Índice em grafo para busca aproximada de vizinhos mais próximos; torna a busca vetorial rápida em grandes volumes.',
  },
  topk: {
    term: 'topK',
    short: 'Número máximo de chunks mais parecidos retornados na busca vetorial e enviados ao modelo como contexto.',
  },
  'similarity-threshold': {
    term: 'Similarity threshold',
    short: 'Nota mínima de similaridade (0 a 1) para um chunk entrar no contexto. Abaixo dela, o trecho é descartado.',
  },
  'prompt-injection': {
    term: 'Prompt injection',
    short: 'Texto do documento ou da pergunta que tenta mandar o modelo ignorar as instruções originais. Exige prompts defensivos.',
  },
  preflight: {
    term: 'Preflight',
    short: 'Requisição OPTIONS que o navegador envia antes de uma chamada cross-origin para saber se o CORS permite.',
  },
  bcrypt: {
    term: 'BCrypt',
    short: 'Algoritmo de hash de senha lento e com salt embutido. Limitado a 72 bytes de entrada, por isso a senha tem máximo de 72.',
    nest: 'bcrypt / bcryptjs',
  },
  jwt: {
    term: 'JWT',
    short: 'Token assinado com claims (subject, expiração). O servidor valida a assinatura sem consultar o banco.',
    nest: '@nestjs/jwt',
  },
  'refresh-token-rotation': {
    term: 'Refresh token rotation',
    short: 'Cada refresh gera um novo token e revoga o antigo. Se um token revogado reaparecer, há reuso e as sessões são encerradas.',
  },
}

function normalizeKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

const normalizedIndex: Record<string, GlossaryEntry> = Object.fromEntries(
  Object.entries(glossary).map(([key, entry]) => [normalizeKey(key), entry]),
)

export function lookupGlossary(annotationOrKey: string): GlossaryEntry | undefined {
  const raw = annotationOrKey.trim()

  if (raw.startsWith('@')) {
    const parenIndex = raw.indexOf('(')
    const name = (parenIndex >= 0 ? raw.slice(0, parenIndex) : raw).replace(/\s+/g, '')
    return glossary[name] ?? normalizedIndex[normalizeKey(name)]
  }

  const exact = glossary[raw]
  if (exact) {
    return exact
  }

  const normalized = normalizeKey(raw)
  return normalizedIndex[normalized] ?? normalizedIndex[normalized.replace(/\s+/g, '-')]
}
