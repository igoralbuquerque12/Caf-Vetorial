import type { Snippet } from '../../flows/types'

export const userController: Snippet = {
  language: 'java',
  code: `@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse create(@RequestBody @Valid CreateUserRequest request) {
        return userService.create(request);
    }

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal Jwt jwt) {
        return userService.findById(CurrentUser.id(jwt));
    }
}`,
  highlight: [11, 15],
}

export const createUserRequest: Snippet = {
  language: 'java',
  code: `public record CreateUserRequest(
        @NotBlank(message = "O e-mail é obrigatório")
        @Email(message = "O e-mail deve ser válido")
        String email,

        @NotBlank(message = "A senha é obrigatória")
        @Size(min = 8, max = 72, message = "A senha deve ter entre 8 e 72 caracteres")
        String password
) {
}`,
  highlight: [1, 3],
}

export const userService: Snippet = {
  language: 'java',
  code: `@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public UserResponse create(CreateUserRequest request) {
        String email = EmailNormalizer.normalize(request.email());
        if (userRepository.existsByEmail(email)) {
            throw new EmailAlreadyInUseException(email);
        }
        User user = new User(email, passwordEncoder.encode(request.password()));
        User saved = userRepository.save(user);
        return UserResponse.from(saved);
    }
}`,
  highlight: [12, 20],
}

export const userServiceFind: Snippet = {
  language: 'java',
  code: `@Transactional(readOnly = true)
public UserResponse findById(UUID id) {
    User user = userRepository.findById(id)
            .orElseThrow(() -> new UserNotFoundException(id));
    return UserResponse.from(user);
}`,
  highlight: [3, 4],
}

export const emailNormalizer: Snippet = {
  language: 'java',
  code: `public final class EmailNormalizer {

    private EmailNormalizer() {
    }

    public static String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}`,
  highlight: [6, 8],
}

export const userRepository: Snippet = {
  language: 'java',
  code: `public interface UserRepository extends JpaRepository<User, UUID> {

    boolean existsByEmail(String email);

    Optional<User> findByEmail(String email);
}

// O Spring Data gera a implementação em tempo de execução:
//   existsByEmail -> SELECT ... FROM users WHERE email = ? (LIMIT 1)
//   findByEmail   -> SELECT ... FROM users WHERE email = ?`,
  highlight: [3, 5],
}

export const userEntity: Snippet = {
  language: 'java',
  code: `@Entity
@Table(name = "users")
public class User {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password; // sempre o hash BCrypt, nunca a senha

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
    }
}`,
  highlight: [16, 19],
}

export const bcryptEncode: Snippet = {
  language: 'java',
  code: `@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
}

// No serviço:
String hash = passwordEncoder.encode("minha-senha-123");
// -> "$2a$10$N9qo8uLOickgx2ZMRZoMye..." (sal aleatório embutido no hash)

boolean ok = passwordEncoder.matches("minha-senha-123", hash);`,
  highlight: [7, 7],
}

export const userResponse: Snippet = {
  language: 'java',
  code: `public record UserResponse(
        UUID id,
        String email,
        Instant createdAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getCreatedAt());
    }
}

// Sem campo password: o record deixa explícito o que sai pela API.`,
  highlight: [6, 8],
}
