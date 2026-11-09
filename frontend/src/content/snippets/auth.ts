import type { Snippet } from '../../flows/types'

export const authController: Snippet = {
  language: 'java',
  code: `@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public TokenResponse login(@RequestBody @Valid LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/refresh")
    public TokenResponse refresh(@RequestBody @Valid RefreshTokenRequest request) {
        return authService.refresh(request);
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@RequestBody @Valid RefreshTokenRequest request) {
        authService.logout(request);
    }
}`,
  highlight: [11, 14],
}

export const authServiceLogin: Snippet = {
  language: 'java',
  code: `public TokenResponse login(LoginRequest request) {
    Authentication authentication = authenticationManager.authenticate(
            UsernamePasswordAuthenticationToken.unauthenticated(
                    EmailNormalizer.normalize(request.email()),
                    request.password()
            )
    );
    SecurityUser user = (SecurityUser) authentication.getPrincipal();

    AccessToken access = accessTokenService.issue(user.id(), user.email());
    String refresh = refreshTokenService.issue(user.id());

    return TokenResponse.bearer(
            access.value(), refresh, props.accessTokenTtl().toSeconds());
}`,
  highlight: [2, 7],
}

export const authServiceRefreshLogout: Snippet = {
  language: 'java',
  code: `public TokenResponse refresh(RefreshTokenRequest request) {
    RefreshRotation rotation = refreshTokenService.rotate(request.refreshToken());
    AccessToken access = accessTokenService.issue(rotation.userId(), rotation.email());
    return TokenResponse.bearer(
            access.value(), rotation.refreshToken(), props.accessTokenTtl().toSeconds());
}

public void logout(RefreshTokenRequest request) {
    refreshTokenService.revoke(request.refreshToken());
}`,
  highlight: [2, 2],
}

export const authenticationManagerFlow: Snippet = {
  language: 'java',
  code: `// O AuthenticationManager vem da autoconfiguração do Spring Security:
@Bean
public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
        throws Exception {
    return config.getAuthenticationManager();
}

// Por baixo, um DaoAuthenticationProvider faz:
//   1. UserDetails u = userDetailsService.loadUserByUsername(email);
//   2. passwordEncoder.matches(senhaDigitada, u.getPassword());
//   3. se falhar: BadCredentialsException (-> 401 no handler)
//   4. se passar: Authentication com o SecurityUser como principal`,
  highlight: [8, 11],
}

export const userDetailsService: Snippet = {
  language: 'java',
  code: `@Service
public class AppUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public AppUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        String normalizedEmail = EmailNormalizer.normalize(username);
        return userRepository.findByEmail(normalizedEmail)
                .map(SecurityUser::from)
                .orElseThrow(() -> new UsernameNotFoundException("Credenciais inválidas"));
    }
}`,
  highlight: [10, 16],
}

export const bcryptCompare: Snippet = {
  language: 'java',
  code: `// Dentro do DaoAuthenticationProvider (código do Spring Security, resumido):
protected void additionalAuthenticationChecks(UserDetails userDetails,
        UsernamePasswordAuthenticationToken authentication) {
    String presented = authentication.getCredentials().toString();
    if (!passwordEncoder.matches(presented, userDetails.getPassword())) {
        throw new BadCredentialsException("Bad credentials");
    }
}

// Um e-mail inexistente também termina em BadCredentialsException:
// o Spring esconde o UsernameNotFoundException por padrão.`,
  highlight: [5, 7],
}

export const jwtIssue: Snippet = {
  language: 'java',
  code: `@Override
public AccessToken issue(UUID userId, String email) {
    Instant now = clock.instant();
    Instant expiresAt = now.plus(props.accessTokenTtl());

    JwtClaimsSet claims = JwtClaimsSet.builder()
            .issuer(props.issuer())
            .subject(userId.toString())
            .issuedAt(now)
            .expiresAt(expiresAt)
            .claim("email", email)
            .build();

    JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
    String value = jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    return new AccessToken(value, expiresAt);
}`,
  highlight: [6, 11],
}

export const refreshIssue: Snippet = {
  language: 'java',
  code: `@Transactional
public String issue(UUID userId) {
    User user = userRepository.getReferenceById(userId);
    return persistNew(user, clock.instant());
}

private String persistNew(User user, Instant now) {
    String rawToken = generateRawToken();            // 32 bytes aleatórios, base64url
    Instant expiresAt = now.plus(props.refreshTokenTtl());
    // No banco vai só o hash SHA-256; o token em si só o cliente conhece.
    refreshTokenRepository.save(new RefreshToken(user, hash(rawToken), expiresAt));
    return rawToken;
}`,
  highlight: [8, 11],
}

export const refreshRotate: Snippet = {
  language: 'java',
  code: `@Transactional(noRollbackFor = InvalidRefreshTokenException.class)
public RefreshRotation rotate(String rawToken) {
    Instant now = clock.instant();
    RefreshToken current = refreshTokenRepository.findByTokenHash(hash(rawToken))
            .orElseThrow(InvalidRefreshTokenException::new);
    User user = current.getUser();

    if (current.isRevoked()) { // reuso: alguém apresentou um token já trocado
        refreshTokenRepository.revokeAllActiveByUserId(user.getId(), now);
        throw new InvalidRefreshTokenException();
    }
    if (current.isExpired(now)) {
        throw new InvalidRefreshTokenException();
    }

    current.revoke(now);                       // dirty checking: UPDATE no commit
    String newToken = persistNew(user, now);   // um token novo a cada refresh
    return new RefreshRotation(user.getId(), user.getEmail(), newToken);
}`,
  highlight: [8, 11],
}

export const refreshRevoke: Snippet = {
  language: 'java',
  code: `@Transactional
public void revoke(String rawToken) {
    Instant now = clock.instant();
    refreshTokenRepository.findByTokenHash(hash(rawToken))
            .ifPresent(token -> {
                if (!token.isRevoked()) {
                    token.revoke(now); // sem save(): o dirty checking gera o UPDATE
                }
            });
}
// Token desconhecido ou já revogado: nada acontece. Por isso o logout é idempotente.`,
  highlight: [6, 8],
}

export const refreshRepository: Snippet = {
  language: 'java',
  code: `public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    // Lock pessimista: SELECT ... FOR UPDATE. Duas rotações do mesmo token
    // não rodam ao mesmo tempo; a segunda espera e vê o token já revogado.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<RefreshToken> findByTokenHash(String tokenHash);

    @Modifying
    @Query("update RefreshToken t set t.revokedAt = :now "
         + "where t.user.id = :userId and t.revokedAt is null")
    int revokeAllActiveByUserId(UUID userId, Instant now);
}`,
  highlight: [3, 6],
}
