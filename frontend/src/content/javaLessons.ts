import type { JavaLesson } from './types'

export const javaLessons: JavaLesson[] = [
  {
    id: 'annotations',
    title: 'Anotações e reflexão (vs decorators e reflect-metadata)',
    summary: 'Anotações são metadados lidos em tempo de execução pelo Spring, como decorators no Nest.',
    paragraphs: [
      `Uma anotação em Java (@Service, @Entity, @PostMapping) é um rótulo colado em uma classe, método ou campo. Ela sozinha não faz nada: é só metadado. Quem dá vida a ela é o Spring, que varre as classes ao subir e lê os rótulos.`,
      `No Nest você usa decorators (@Injectable, @Get) e o reflect-metadata guarda as informações. Em Java a ideia é a mesma, mas o suporte é nativo da linguagem: a API de reflexão (java.lang.reflect) permite inspecionar classes, campos e anotações em runtime, sem pacote extra.`,
      `Diferença prática: um decorator do TypeScript é uma função que executa código quando a classe é definida. Uma anotação Java é dado puro; o comportamento mora no framework que a interpreta.`,
    ],
    nest: {
      language: 'typescript',
      code: `import 'reflect-metadata'

function Service(): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata('service', true, target)
  }
}

@Service()
class UserService {}

// o framework lê o metadado depois
const isService = Reflect.getMetadata('service', UserService)
console.log(isService) // true`,
    },
    java: {
      language: 'java',
      code: `@Entity
@Table(name = "document_registry")
public class DocumentRegistry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DocumentStatus status;

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
    }
}`,
      highlight: [5, 11],
    },
    appearsIn: [
      { flowId: 'user.register', stepId: 'controller', note: '@RestController e @PostMapping dizem ao Spring que a classe atende HTTP.' },
      { flowId: 'document.upload', stepId: 'controller', note: '@RequestPart e @PostMapping são metadados lidos para montar a rota.' },
      { flowId: 'user.me', stepId: 'controller', note: 'Anotações de rota e de parâmetro substituem @Get e @Req do Nest.' },
    ],
  },
  {
    id: 'beans-ioc',
    title: 'Beans, container IoC e injeção pelo construtor (vs providers do Nest)',
    summary: 'O Spring cria os objetos (beans) e entrega as dependências pelo construtor.',
    paragraphs: [
      `Bean é só um objeto gerenciado pelo Spring. Ao subir, o container IoC (Inversão de Controle) encontra classes com @Service, @Component, @Repository e métodos @Bean, instancia cada uma uma única vez (singleton) e guarda tudo num mapa.`,
      `É o equivalente dos providers do Nest: onde você escreve providers: [UserService] no módulo, aqui basta anotar a classe. Não existe module a declarar; o Spring varre o pacote da aplicação.`,
      `A injeção é pelo construtor: o Spring olha os tipos dos parâmetros e entrega os beans correspondentes. Com um único construtor, nem precisa de @Autowired. É o mesmo mecanismo do constructor(private readonly repo: UserRepository) no Nest.`,
    ],
    nest: {
      language: 'typescript',
      code: `@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordEncoder: PasswordEncoder,
  ) {}
}

@Module({
  providers: [UserService, UserRepository, PasswordEncoder],
})
export class UserModule {}`,
    },
    java: {
      language: 'java',
      code: `@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }
}`,
      highlight: [7, 11],
    },
    appearsIn: [
      { flowId: 'user.register', stepId: 'service', note: 'UserService recebe repositório e encoder pelo construtor.' },
      { flowId: 'auth.login', stepId: 'service', note: 'AuthService depende de outros beans injetados.' },
      { flowId: 'chat.ask', stepId: 'service', note: 'ChatService recebe ChatClient e advisor como beans.' },
      { flowId: 'document.upload', stepId: 'service', note: 'DocumentService junta cinco dependências no construtor.' },
    ],
  },
  {
    id: 'autoconfig',
    title: 'Autoconfiguração e starters (@ConditionalOnMissingBean)',
    summary: 'Starters registram beans padrão automaticamente; você sobrescreve só o que quiser.',
    paragraphs: [
      `Ao adicionar um starter (spring-boot-starter-web, spring-ai-...) ao pom.xml, ele traz classes de autoconfiguração que registram beans prontos: servidor HTTP, ObjectMapper, DataSource, ChatClient.Builder. Você não escreve nada.`,
      `A mágica é o @ConditionalOnMissingBean: "crie este bean padrão, a menos que o desenvolvedor já tenha definido um". Se você declarar o seu com @Bean, o do starter recua. No Nest seria como um DynamicModule com forRoot() e valores default que você pode substituir.`,
      `Por isso um projeto Spring tem tão pouca configuração: convenção primeiro, customização só onde precisa. No projeto, o SecurityConfig define o próprio PasswordEncoder e o ChatConfig monta o ChatClient em cima do builder autoconfigurado.`,
    ],
    nest: {
      language: 'typescript',
      code: `@Module({})
export class ChatModule {
  static forRoot(options: Partial<ChatOptions> = {}): DynamicModule {
    const merged = { model: 'gpt-4o-mini', ...options }
    return {
      module: ChatModule,
      providers: [{ provide: 'CHAT_OPTIONS', useValue: merged }],
      exports: ['CHAT_OPTIONS'],
    }
  }
}

// uso: ChatModule.forRoot({ model: 'gpt-4o' })`,
    },
    java: {
      language: 'java',
      code: `// Ilustrativo: o que um starter faz internamente
@Configuration
public class ChatAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    public ChatClient.Builder chatClientBuilder(ChatModel model) {
        return ChatClient.builder(model);
    }
}

// No projeto: usamos o builder autoconfigurado
@Bean
public ChatClient chatClient(ChatClient.Builder builder) {
    return builder.build();
}`,
      highlight: [5, 7],
    },
    appearsIn: [
      { flowId: 'chat.ask', stepId: 'client', note: 'ChatClient nasce do builder que o starter do Spring AI já registrou.' },
      { flowId: 'chat.ask', stepId: 'advisor', note: 'O advisor de RAG usa o VectorStore autoconfigurado.' },
      { flowId: 'user.register', stepId: 'encoder', note: 'PasswordEncoder é um bean definido por nós no SecurityConfig.' },
      { flowId: 'auth.login', stepId: 'manager', note: 'AuthenticationManager vem da configuração padrão do Spring Security.' },
    ],
  },
  {
    id: 'final',
    title: '`final` e imutabilidade (vs readonly e const)',
    summary: '`final` impede reatribuição, como readonly em campos e const em variáveis.',
    paragraphs: [
      `Em Java, final num campo significa "só atribuo uma vez, no construtor". Funciona como o readonly do TypeScript, mas é garantido pela JVM, não só pelo compilador. Em variável local, final se parece com const.`,
      `Atenção: final protege a referência, não o conteúdo. Um final List<String> não pode apontar para outra lista, mas ainda dá para adicionar itens. O mesmo vale para const com objetos em JS.`,
      `Por isso quase todas as dependências dos beans são private final: o Spring injeta uma vez pelo construtor e ninguém troca depois. Em static final temos constantes de classe, como TOKEN_BYTE_LENGTH.`,
    ],
    nest: {
      language: 'typescript',
      code: `class RefreshTokenService {
  private static readonly TOKEN_BYTE_LENGTH = 32

  constructor(
    private readonly userRepository: UserRepository,
    private readonly clock: Clock,
  ) {}
}

const tokens = ['a']
tokens.push('b') // const não impede mutação
// tokens = [] // erro: reatribuição`,
    },
    java: {
      language: 'java',
      code: `public class RefreshTokenService {

    private static final int TOKEN_BYTE_LENGTH = 32;

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;
    private final JwtProperties props;
    private final Clock clock;

    public RefreshTokenService(
            RefreshTokenRepository refreshTokenRepository,
            UserRepository userRepository,
            JwtProperties props,
            Clock clock
    ) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.userRepository = userRepository;
        this.props = props;
        this.clock = clock;
    }
}`,
      highlight: [3, 8],
    },
    appearsIn: [
      { flowId: 'user.register', stepId: 'service', note: 'Dependências do UserService são private final.' },
      { flowId: 'auth.refresh', stepId: 'service', note: 'Campos final garantem que o serviço é imutável depois de criado.' },
      { flowId: 'chat.ask', stepId: 'service', note: 'ChatService mantém o Clock e o client como final.' },
    ],
  },
  {
    id: 'records',
    title: '`record` como DTO',
    summary: '`record` declara uma classe de dados imutável em uma linha, ideal para DTOs.',
    paragraphs: [
      `Um record gera sozinho construtor, getters (sem prefixo get: request.email()), equals, hashCode e toString. Todos os campos são final. É o DTO sem boilerplate.`,
      `No Nest você escreveria uma classe com class-validator e propriedades readonly. Aqui, o cabeçalho do record já é a lista de campos, e as anotações de validação ficam direto neles.`,
      `Records servem para entrada (CreateUserRequest), saída (UserResponse) e até configuração tipada (JwtProperties). Se precisa de mutação, use classe normal, como nas entidades JPA.`,
    ],
    nest: {
      language: 'typescript',
      code: `export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  readonly email: string

  @IsNotEmpty()
  @Length(8, 72)
  readonly password: string
}

// uso
const email = dto.email`,
    },
    java: {
      language: 'java',
      code: `public record CreateUserRequest(
        @NotBlank(message = "O e-mail é obrigatório")
        @Email(message = "O e-mail deve ser válido")
        String email,

        @NotBlank(message = "A senha é obrigatória")
        @Size(min = 8, max = 72, message = "A senha deve ter entre 8 e 72 caracteres")
        String password
) {
}

// uso: request.email()  (não existe getEmail())`,
      highlight: [1, 8],
    },
    appearsIn: [
      { flowId: 'user.register', stepId: 'controller', note: 'O corpo da requisição vira um CreateUserRequest.' },
      { flowId: 'auth.login', stepId: 'controller', note: 'LoginRequest e TokenResponse são records.' },
      { flowId: 'chat.ask', stepId: 'controller', note: 'AskQuestionRequest carrega documentId e question.' },
      { flowId: 'user.register', stepId: 'response', note: 'UserResponse é um record criado a partir da entidade.' },
    ],
  },
  {
    id: 'types-static',
    title: 'Tipo antes do nome, assinaturas de método, `static`',
    summary: 'Em Java o tipo vem antes do nome; `static` pertence à classe, não à instância.',
    paragraphs: [
      `Em TypeScript você escreve id: UUID. Em Java o tipo vem antes: UUID id. Em métodos, o tipo de retorno também vem antes do nome: public static UUID id(Jwt jwt). Leia como "público, estático, devolve UUID, chama-se id, recebe um Jwt".`,
      `static significa que o membro pertence à classe, não a um objeto: você chama CurrentUser.id(jwt) sem fazer new. É como um método static do TypeScript ou uma função exportada de um módulo.`,
      `Classes utilitárias como CurrentUser e EmailNormalizer têm construtor privado para ninguém instanciar. void é o retorno de métodos sem valor, e todo tipo é obrigatório e checado na compilação.`,
    ],
    nest: {
      language: 'typescript',
      code: `export class CurrentUser {
  private constructor() {}

  static id(jwt: Jwt): string {
    return jwt.sub
  }
}

const userId: string = CurrentUser.id(jwt)`,
    },
    java: {
      language: 'java',
      code: `public final class CurrentUser {

    private CurrentUser() {
    }

    public static UUID id(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}

// chamada, sem new:
// UUID userId = CurrentUser.id(jwt);`,
      highlight: [6, 8],
    },
    appearsIn: [
      { flowId: 'user.me', stepId: 'current-user', note: 'CurrentUser.id é um método estático utilitário.' },
      { flowId: 'user.register', stepId: 'normalizer', note: 'EmailNormalizer.normalize também é static.' },
      { flowId: 'document.upload', stepId: 'controller', note: 'O controller extrai o id do usuário com CurrentUser.id(jwt).' },
      { flowId: 'chat.ask', stepId: 'controller', note: 'Assinaturas com tipo antes do nome em toda a classe.' },
    ],
  },
  {
    id: 'optional',
    title: 'Optional (vs T | undefined)',
    summary: 'Optional<T> representa "pode não existir" de forma explícita, no lugar de null/undefined.',
    paragraphs: [
      `Em TypeScript, uma busca devolve User | undefined e o compilador obriga a checar. Em Java qualquer referência pode ser null, e esquecer a checagem gera o temido NullPointerException. Optional<User> existe para tornar a ausência explícita no tipo.`,
      `Você não faz if (x == null): usa a API fluente. orElseThrow lança uma exceção se vazio, map transforma o valor, ifPresent executa algo só se existir. É parecido com encadear ?. e ?? em JS.`,
      `Spring Data devolve Optional em findById e findByEmail. Regra de ouro: use Optional como retorno, não como campo nem parâmetro.`,
    ],
    nest: {
      language: 'typescript',
      code: `async findById(id: string): Promise<UserResponse> {
  const user = await this.userRepository.findOne({ where: { id } })
  if (!user) {
    throw new NotFoundException('Usuário não encontrado')
  }
  return UserResponse.from(user)
}

// ou: const name = user?.name ?? 'anônimo'`,
    },
    java: {
      language: 'java',
      code: `@Transactional(readOnly = true)
public UserResponse findById(UUID id) {
    User user = userRepository.findById(id)
            .orElseThrow(() -> new UserNotFoundException(id));
    return UserResponse.from(user);
}`,
      highlight: [3, 4],
    },
    appearsIn: [
      { flowId: 'user.me', stepId: 'service', note: 'findById devolve Optional e orElseThrow converte em exceção.' },
      { flowId: 'user.me', stepId: 'h-notfound', note: 'Optional vazio vira UserNotFoundException e, depois, 404.' },
      { flowId: 'auth.login', stepId: 'find', note: 'findByEmail devolve Optional<User>.' },
      { flowId: 'document.get', stepId: 'h-notfound', note: 'Busca por id e dono vazia resulta em 404.' },
    ],
  },
  {
    id: 'exceptions',
    title: 'Exceções checked vs unchecked, @RestControllerAdvice e ProblemDetail',
    summary: 'Exceções unchecked sobem até um handler global que devolve um ProblemDetail (RFC 7807).',
    paragraphs: [
      `Java tem dois tipos de exceção. Checked (como IOException) o compilador obriga a tratar ou declarar com throws. Unchecked (derivam de RuntimeException) podem subir livremente, como no TypeScript. O projeto usa unchecked para regras de negócio: EmailAlreadyInUseException, UserNotFoundException.`,
      `O @RestControllerAdvice é o equivalente ao ExceptionFilter do Nest. Cada método @ExceptionHandler declara qual exceção trata e devolve a resposta HTTP. Assim controllers e services só lançam; nunca montam resposta de erro.`,
      `A resposta é um ProblemDetail, o formato padrão RFC 7807 (type, title, status, detail). Uma só classe padroniza todos os erros da API, inclusive os de validação.`,
    ],
    nest: {
      language: 'typescript',
      code: `@Catch(EmailAlreadyInUseException)
export class EmailInUseFilter implements ExceptionFilter {
  catch(exception: EmailAlreadyInUseException, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse()
    res.status(409).json({
      status: 409,
      detail: exception.message,
    })
  }
}`,
    },
    java: {
      language: 'java',
      code: `@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    @ExceptionHandler(EmailAlreadyInUseException.class)
    public ProblemDetail handleEmailAlreadyInUse(EmailAlreadyInUseException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(AuthenticationException.class)
    public ProblemDetail handleAuthentication(AuthenticationException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, "Credenciais inválidas");
    }
}`,
      highlight: [4, 7],
    },
    appearsIn: [
      { flowId: 'user.register', stepId: 'h-conflict', note: 'E-mail duplicado vira 409 pelo handler global.' },
      { flowId: 'auth.login', stepId: 'h-auth', note: 'AuthenticationException vira 401 com mensagem genérica.' },
      { flowId: 'auth.refresh', stepId: 'h-invalid', note: 'InvalidRefreshTokenException resulta em 401.' },
      { flowId: 'chat.ask', stepId: 'h-not-ready', note: 'DocumentNotReadyException indica documento ainda sem processar.' },
    ],
  },
  {
    id: 'validation',
    title: 'Bean Validation e @Valid (vs class-validator e ValidationPipe)',
    summary: 'Anotações no DTO declaram as regras e @Valid no controller as dispara.',
    paragraphs: [
      `Bean Validation é o class-validator do Java. Você anota os campos do DTO (@NotBlank, @Email, @Size) com a mensagem de erro, e o Spring valida antes de chamar o seu método.`,
      `O gatilho é o @Valid no parâmetro do controller, o papel do ValidationPipe no Nest. Sem ele as anotações são ignoradas. Se a validação falha, o Spring lança MethodArgumentNotValidException antes do corpo do método executar.`,
      `Essa exceção é capturada no GlobalExceptionHandler e vira um ProblemDetail 400 com a lista de campos inválidos. O service nunca vê dados malformados.`,
    ],
    nest: {
      language: 'typescript',
      code: `// main.ts
app.useGlobalPipes(new ValidationPipe())

export class LoginDto {
  @IsEmail()
  email: string

  @IsNotEmpty()
  password: string
}

@Post('login')
login(@Body() dto: LoginDto) {
  return this.authService.login(dto)
}`,
    },
    java: {
      language: 'java',
      code: `@PostMapping("/login")
public TokenResponse login(@RequestBody @Valid LoginRequest request) {
    return authService.login(request);
}

public record CreateUserRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, max = 72) String password
) {
}`,
      highlight: [2, 2],
    },
    appearsIn: [
      { flowId: 'user.register', stepId: 'h-validation', note: 'Senha curta ou e-mail inválido resulta em 400.' },
      { flowId: 'auth.login', stepId: 'h-validation', note: 'LoginRequest inválido é barrado antes do service.' },
      { flowId: 'auth.refresh', stepId: 'h-validation', note: 'Refresh token em branco é rejeitado na borda.' },
      { flowId: 'chat.ask', stepId: 'h-validation', note: 'Pergunta vazia gera 400 pelo @Valid.' },
    ],
  },
  {
    id: 'spring-data',
    title: 'Spring Data e queries derivadas do nome do método',
    summary: 'Você declara uma interface e o Spring Data gera a implementação a partir dos nomes.',
    paragraphs: [
      `Com Spring Data você escreve só uma interface que estende JpaRepository. O Spring cria a implementação em runtime. Já vêm save, findById, findAll, delete e outros.`,
      `Para consultas, basta nomear o método: findByEmail vira select ... where email = ?, existsByEmail devolve boolean, findByIdAndOwnerId combina duas condições, OrderByCreatedAtDesc ordena. O nome é a query, parseada na inicialização.`,
      `No Nest/TypeORM você usaria repository.findOne({ where }) ou QueryBuilder. Aqui, para casos complexos, existe @Query com JPQL, como a revogação em massa de refresh tokens.`,
    ],
    nest: {
      language: 'typescript',
      code: `@Injectable()
export class UserRepository {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  findByEmail(email: string) {
    return this.repo.findOne({ where: { email } })
  }

  existsByEmail(email: string) {
    return this.repo.exist({ where: { email } })
  }
}`,
    },
    java: {
      language: 'java',
      code: `public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
}

public interface DocumentRegistryRepository
        extends JpaRepository<DocumentRegistry, UUID> {

    Optional<DocumentRegistry> findByIdAndOwnerId(UUID id, UUID ownerId);

    List<DocumentRegistry> findAllByOwnerIdOrderByCreatedAtDesc(UUID ownerId);
}`,
      highlight: [3, 5],
    },
    appearsIn: [
      { flowId: 'user.register', stepId: 'exists', note: 'existsByEmail é uma query derivada só do nome.' },
      { flowId: 'auth.login', stepId: 'find', note: 'findByEmail busca o usuário para autenticar.' },
      { flowId: 'document.get', stepId: 'repository', note: 'findByIdAndOwnerId garante que só o dono acessa.' },
      { flowId: 'document.list', stepId: 'repository', note: 'findAllByOwnerIdOrderByCreatedAtDesc lista e ordena.' },
    ],
  },
  {
    id: 'transactional',
    title: '@Transactional: o proxy, self-invocation, noRollbackFor, REQUIRES_NEW e TransactionTemplate',
    summary: '@Transactional funciona via proxy: abre transação, comita ou desfaz, e tem pegadinhas.',
    paragraphs: [
      `O Spring não altera sua classe: ele injeta um proxy que embrulha o bean. Ao chamar um método com @Transactional, o proxy abre a transação, executa o método e faz commit; se uma RuntimeException escapar, faz rollback. Entidades alteradas dentro dela são salvas sozinhas (dirty checking). É o que o TypeORM faz com queryRunner.startTransaction, só que declarativo.`,
      `Pegadinha 1, self-invocation: se um método da classe chama outro método @Transactional da mesma classe via this, o proxy é contornado e a anotação é ignorada. Por isso o DocumentService usa TransactionTemplate: transação programática só em volta do save e da publicação do evento, sem segurar conexão durante o upload ao S3.`,
      `Pegadinha 2, rollback: o padrão desfaz tudo em RuntimeException. No rotate, ao detectar reuso, revogamos todas as sessões e lançamos InvalidRefreshTokenException; sem noRollbackFor a revogação seria desfeita. REQUIRES_NEW (em DocumentStatusService) abre sempre uma transação nova e independente, então o status FAILED persiste mesmo se a externa der rollback.`,
      `Por fim: o ChatService não tem @Transactional de propósito. Uma transação segura uma conexão do pool do banco; segurá-la durante a chamada lenta à OpenAI poderia esgotar o pool.`,
    ],
    nest: {
      language: 'typescript',
      code: `async rotate(rawToken: string) {
  const qr = this.dataSource.createQueryRunner()
  await qr.connect()
  await qr.startTransaction()
  try {
    const current = await this.findValid(qr, rawToken)
    current.revokedAt = new Date()
    await qr.manager.save(current)
    await qr.commitTransaction()
  } catch (e) {
    await qr.rollbackTransaction()
    throw e
  } finally {
    await qr.release()
  }
}`,
    },
    java: {
      language: 'java',
      code: `// Reuso detectado: revoga tudo e lança; sem noRollbackFor, o rollback desfaria a revogação
@Transactional(noRollbackFor = InvalidRefreshTokenException.class)
public RefreshRotation rotate(String rawToken) {
    // ...
    throw new InvalidRefreshTokenException();
}

// DocumentService: sem @Transactional no método, transação só em volta do save
DocumentRegistry saved = transactionTemplate.execute(status -> {
    DocumentRegistry registry = repository.save(new DocumentRegistry(ownerId, fileName, s3Key));
    eventPublisher.publishEvent(new DocumentUploadedEvent(registry.getId()));
    return registry;
});

// DocumentStatusService: transação nova e independente
@Transactional(propagation = Propagation.REQUIRES_NEW)
public void markCompleted(UUID id, int chunkCount) {
    // ...
}`,
      highlight: [2, 5],
    },
    appearsIn: [
      { flowId: 'document.upload', stepId: 'tx', note: 'TransactionTemplate envolve só o save e o evento.' },
      { flowId: 'auth.refresh', stepId: 'rotate', note: 'noRollbackFor mantém a revogação em massa após detectar reuso.' },
      { flowId: 'auth.logout', stepId: 'revoke', note: 'Alterar a entidade dentro da transação basta: dirty checking faz o update.' },
      { flowId: 'document.get', stepId: 'service', note: 'readOnly = true em consultas, sem escrever no banco.' },
    ],
  },
  {
    id: 'config-properties',
    title: '@ConfigurationProperties com validação (vs ConfigModule)',
    summary: 'Configurações do application.yml viram um record tipado e validado ao subir a app.',
    paragraphs: [
      `Em vez de ler process.env espalhado, você declara um record com o prefixo (app.jwt) e o Spring faz o binding das chaves do application.yml e das variáveis de ambiente para os campos, convertendo tipos (Duration, List, int).`,
      `Com @Validated e anotações como @NotBlank e @Size, a aplicação falha ao iniciar se a config estiver errada (segredo curto, origem ausente). É o que você faria com ConfigModule + Joi, mas integrado e tipado.`,
      `O @ConfigurationPropertiesScan na classe principal registra todos esses records como beans, prontos para injeção no construtor.`,
    ],
    nest: {
      language: 'typescript',
      code: `ConfigModule.forRoot({
  validationSchema: Joi.object({
    JWT_SECRET: Joi.string().min(32).required(),
    JWT_ISSUER: Joi.string().required(),
    JWT_ACCESS_TTL: Joi.number().required(),
  }),
})

constructor(private config: ConfigService) {}
const secret = this.config.get<string>('JWT_SECRET')`,
    },
    java: {
      language: 'java',
      code: `@Validated
@ConfigurationProperties(prefix = "app.jwt")
public record JwtProperties(
        @NotBlank @Size(min = 32) String secret,
        @NotBlank String issuer,
        @NotNull Duration accessTokenTtl,
        @NotNull Duration refreshTokenTtl
) {
}

// AiCopilotApplication
@SpringBootApplication
@ConfigurationPropertiesScan
public class AiCopilotApplication { }`,
      highlight: [1, 3],
    },
    appearsIn: [
      { flowId: 'auth.login', stepId: 'access', note: 'O emissor e o TTL do access token vêm de JwtProperties.' },
      { flowId: 'auth.login', stepId: 'refresh', note: 'O TTL do refresh token também é configurável.' },
      { flowId: 'auth.refresh', stepId: 'access', note: 'Novo access token usa as mesmas propriedades tipadas.' },
      { flowId: 'user.me', stepId: 'decoder', note: 'O decoder valida o JWT com o segredo configurado.' },
    ],
  },
  {
    id: 'lambdas',
    title: 'Lambdas, method references e APIs fluentes',
    summary: 'Lambdas e referências a métodos são as arrow functions do Java; streams encadeiam como arrays.',
    paragraphs: [
      `Uma lambda é uma função anônima: token -> token.revoke(now), equivalente a token => token.revoke(now). A seta é a mesma ideia, só muda a sintaxe. Ela pode ser passada onde o Java espera uma interface de um único método.`,
      `Method reference (DocumentResponse::from) é um atalho quando a lambda só repassa o argumento: equivale a (d) => DocumentResponse.from(d). O :: lembra passar a função pelo nome em JS.`,
      `Com isso a API fica fluente: stream().map(...).filter(...).toList() lê como array.map().filter(). A diferença é que o stream é preguiçoso e só executa no final (toList).`,
    ],
    nest: {
      language: 'typescript',
      code: `async findAllByOwner(ownerId: string) {
  const docs = await this.repository.findAllByOwner(ownerId)
  return docs.map(DocumentResponse.from)
}

const token = await repo.findByTokenHash(hash)
if (token && !token.revoked) {
  token.revoke(now)
}`,
    },
    java: {
      language: 'java',
      code: `refreshTokenRepository.findByTokenHash(hash(rawToken))
        .ifPresent(token -> {
            if (!token.isRevoked()) {
                token.revoke(now);
            }
        });

return repository.findAllByOwnerIdOrderByCreatedAtDesc(ownerId)
        .stream()
        .map(DocumentResponse::from)
        .toList();`,
      highlight: [8, 11],
    },
    appearsIn: [
      { flowId: 'document.list', stepId: 'service', note: 'stream().map(DocumentResponse::from).toList() converte a lista.' },
      { flowId: 'auth.logout', stepId: 'revoke', note: 'ifPresent recebe uma lambda executada só se o token existir.' },
      { flowId: 'chat.ask', stepId: 'sources', note: 'As fontes são montadas com map(this::toSourceReference).' },
      { flowId: 'document.upload', stepId: 'reader', note: 'filter com lambda descarta páginas sem texto.' },
    ],
  },
  {
    id: 'generics',
    title: 'Generics (JpaRepository<User, UUID>)',
    summary: 'Generics parametrizam tipos, como Array<T> e Promise<T> no TypeScript.',
    paragraphs: [
      `Generics em Java usam os mesmos <> do TypeScript. JpaRepository<User, UUID> diz: "um repositório da entidade User cujo id é UUID". Assim findById devolve Optional<User> e save aceita User, tudo checado na compilação.`,
      `Já List<DocumentResponse> e Optional<User> funcionam igual a Array<DocumentResponse> e Promise<User>. A diferença importante: em Java os tipos genéricos são apagados em runtime (type erasure), então só existem para o compilador.`,
      `Para tipos primitivos (int, boolean) você usa os wrappers (Integer, Boolean) dentro de generics. É por isso que aparece Integer page, que também pode ser null.`,
    ],
    nest: {
      language: 'typescript',
      code: `interface Repository<T, ID> {
  findById(id: ID): Promise<T | undefined>
  save(entity: T): Promise<T>
}

class UserRepository implements Repository<User, string> {
  async findById(id: string) { /* ... */ return undefined }
  async save(user: User) { return user }
}`,
    },
    java: {
      language: 'java',
      code: `public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);
}

// Resultado tipado em todo lugar:
User saved = userRepository.save(user);
List<DocumentResponse> all = documentService.findAllByOwner(ownerId);
Optional<User> maybe = userRepository.findById(id);`,
      highlight: [1, 1],
    },
    appearsIn: [
      { flowId: 'user.register', stepId: 'save', note: 'save(user) devolve o mesmo tipo T da entidade.' },
      { flowId: 'document.get', stepId: 'repository', note: 'DocumentRegistryRepository usa JpaRepository<DocumentRegistry, UUID>.' },
      { flowId: 'document.list', stepId: 'repository', note: 'O retorno List<DocumentRegistry> é genérico e tipado.' },
      { flowId: 'chat.ask', stepId: 'sources', note: 'List<Document> e List<SourceReference> mantêm o tipo dos itens.' },
    ],
  },
  {
    id: 'enums-misc',
    title: 'enum, classes anônimas, try-with-resources e pattern matching com instanceof',
    summary: 'Quatro recursos pequenos que aparecem no código: enum, classe anônima, try-with-resources e instanceof.',
    paragraphs: [
      `enum define um conjunto fechado de valores (DocumentStatus: PENDING, PROCESSING, COMPLETED, FAILED), parecido com enum ou union de strings no TypeScript, mas são objetos reais e comparam-se com ==. No banco, @Enumerated(EnumType.STRING) grava o nome.`,
      `Classe anônima é criar uma subclasse sem nome na hora: new ByteArrayResource(pdf) { ... } sobrescreve getFilename() só ali. É como passar um objeto literal com um método trocado. try-with-resources fecha automaticamente o recurso ao sair do bloco, como um using/finally.`,
      `Pattern matching com instanceof junta teste e cast: value instanceof Number n ? n.intValue() : null. Se for Number, já existe uma variável n do tipo certo, parecido com o narrowing de typeof no TypeScript.`,
    ],
    nest: {
      language: 'typescript',
      code: `type DocumentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

if (document.status !== 'COMPLETED') {
  throw new ConflictException('Documento não está pronto')
}

function toInteger(value: unknown): number | null {
  return typeof value === 'number' ? Math.trunc(value) : null
}

const file = await fs.open(path)
try {
  await upload(file)
} finally {
  await file.close()
}`,
    },
    java: {
      language: 'java',
      code: `public enum DocumentStatus { PENDING, PROCESSING, COMPLETED, FAILED }

// classe anônima
Resource resource = new ByteArrayResource(pdf) {
    @Override
    public String getFilename() {
        return fileName;
    }
};

// try-with-resources
try (InputStream in = file.getInputStream()) {
    storageService.upload(s3Key, in, file.getSize(), MediaType.APPLICATION_PDF_VALUE);
}

// pattern matching com instanceof
return value instanceof Number n ? n.intValue() : null;`,
      highlight: [4, 9],
    },
    appearsIn: [
      { flowId: 'chat.ask', stepId: 'status-check', note: 'Compara o status com DocumentStatus.COMPLETED.' },
      { flowId: 'document.upload', stepId: 'reader', note: 'ByteArrayResource anônima sobrescreve getFilename().' },
      { flowId: 'document.upload', stepId: 's3-upload', note: 'try-with-resources fecha o InputStream do arquivo.' },
      { flowId: 'chat.ask', stepId: 'sources', note: 'instanceof Number n converte os metadados com segurança.' },
    ],
  },
  {
    id: 'security-cors',
    title: 'A filter chain do Spring Security e o CORS (vs guards e middlewares)',
    summary: 'Uma cadeia de filtros roda antes dos controllers para autenticar, autorizar e liberar CORS.',
    paragraphs: [
      `O Spring Security é uma cadeia de filtros (filter chain) que cada requisição atravessa antes de chegar ao controller. Mistura o que no Nest seriam middlewares (CORS, leitura do token) e guards (quem pode acessar o quê).`,
      `Aqui, a cadeia desliga CSRF e sessão (a API é stateless com JWT), libera por permitAll os POSTs públicos (cadastro, login, refresh e logout) e exige autenticação em todo o resto. O oauth2ResourceServer lê o header Bearer, valida o JWT e popula o usuário autenticado.`,
      `O CORS vive no mesmo lugar e precisa rodar antes da autenticação, senão o preflight (OPTIONS) do navegador seria barrado com 401. A origem permitida vem do CorsProperties, como o enableCors do Nest, só que configurado por propriedades.`,
    ],
    nest: {
      language: 'typescript',
      code: `// main.ts
app.enableCors({
  origin: ['http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  maxAge: 3600,
})

@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UserController {
  @Get('me')
  me(@Req() req) { return this.service.findById(req.user.sub) }
}`,
    },
    java: {
      language: 'java',
      code: `@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    return http
            .cors(Customizer.withDefaults())
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                    .requestMatchers(HttpMethod.POST, PUBLIC_POST_ENDPOINTS).permitAll()
                    .requestMatchers("/error").permitAll()
                    .anyRequest().authenticated())
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()))
            .build();
}

@Bean
public CorsConfigurationSource corsConfigurationSource(CorsProperties properties) {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(properties.allowedOrigins());
    configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
    configuration.setMaxAge(3600L);
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", configuration);
    return source;
}`,
      highlight: [4, 11],
    },
    appearsIn: [
      { flowId: 'user.me', stepId: 'bearer', note: 'O filtro do resource server extrai o header Authorization: Bearer.' },
      { flowId: 'user.me', stepId: 'decoder', note: 'O JwtDecoder valida assinatura e expiração dentro da cadeia.' },
      { flowId: 'document.upload', stepId: 'bearer', note: 'Rotas fora da lista pública exigem autenticação.' },
    ],
  },
]
