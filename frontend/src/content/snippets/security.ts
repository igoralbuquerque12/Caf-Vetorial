import type { Snippet } from '../../flows/types'

export const securityFilterChain: Snippet = {
  language: 'java',
  code: `@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    return http
        .cors(Customizer.withDefaults())
        .csrf(AbstractHttpConfigurer::disable)
        .sessionManagement(s -> s
            .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers(HttpMethod.POST,
                "/api/v1/users",
                "/api/v1/auth/login",
                "/api/v1/auth/refresh",
                "/api/v1/auth/logout").permitAll()
            .requestMatchers("/error").permitAll()
            .anyRequest().authenticated())
        .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()))
        .build();
}`,
  highlight: [8, 13],
}

export const corsConfiguration: Snippet = {
  language: 'java',
  code: `@Bean
public CorsConfigurationSource corsConfigurationSource(CorsProperties props) {
    CorsConfiguration cors = new CorsConfiguration();
    cors.setAllowedOrigins(props.allowedOrigins());
    cors.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    cors.setAllowedHeaders(List.of("Authorization", "Content-Type"));
    cors.setExposedHeaders(List.of("Location"));
    cors.setAllowCredentials(false); // o token vai no header, não em cookie
    cors.setMaxAge(3600L);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", cors);
    return source;
}`,
  highlight: [4, 8],
}

export const bearerFilterAndDecoder: Snippet = {
  language: 'java',
  code: `// Registrado por oauth2ResourceServer().jwt() na SecurityFilterChain.
// Para cada requisição, o BearerTokenAuthenticationFilter faz, em essência:
//   1. lê o header "Authorization: Bearer <token>"
//   2. chama jwtDecoder.decode(token)
//   3. se ok, coloca o Jwt no SecurityContext; se falha, responde 401
//      com "WWW-Authenticate: Bearer" e a requisição NÃO chega ao controller.

@Bean
public JwtDecoder jwtDecoder(SecretKey jwtSecretKey, JwtProperties props) {
    NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(jwtSecretKey)
        .macAlgorithm(MacAlgorithm.HS256)
        .build();
    decoder.setJwtValidator(JwtValidators.createDefaultWithIssuer(props.issuer()));
    return decoder;
}`,
  highlight: [9, 14],
}

export const currentUser: Snippet = {
  language: 'java',
  code: `public final class CurrentUser {

    private CurrentUser() {
    }

    // O "sub" do JWT guarda o id do usuário (UUID).
    public static UUID id(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}

// No controller:
// public UserResponse me(@AuthenticationPrincipal Jwt jwt) {
//     return userService.findById(CurrentUser.id(jwt));
// }`,
  highlight: [7, 9],
}

export const jwtDecoderConfig: Snippet = bearerFilterAndDecoder

export const globalExceptionHandler: Snippet = {
  language: 'java',
  code: `@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    @ExceptionHandler(EmailAlreadyInUseException.class)
    public ProblemDetail handleEmailAlreadyInUse(EmailAlreadyInUseException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(DocumentNotReadyException.class)
    public ProblemDetail handleDocumentNotReady(DocumentNotReadyException ex) {
        ProblemDetail problem =
            ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        problem.setProperty("documentStatus", ex.getStatus().name());
        return problem;
    }
}`,
  highlight: [9, 14],
}

export const validationHandler: Snippet = {
  language: 'java',
  code: `@Override
protected ResponseEntity<Object> handleMethodArgumentNotValid(
        MethodArgumentNotValidException ex, HttpHeaders headers,
        HttpStatusCode status, WebRequest request) {
    ProblemDetail problem =
        ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Dados inválidos");
    Map<String, String> errors = new LinkedHashMap<>();
    for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
        errors.putIfAbsent(fieldError.getField(), fieldError.getDefaultMessage());
    }
    problem.setProperty("errors", errors);
    return handleExceptionInternal(ex, problem, headers, HttpStatus.BAD_REQUEST, request);
}`,
  highlight: [6, 10],
}

export const authenticationHandler: Snippet = {
  language: 'java',
  code: `// Mesma mensagem para e-mail inexistente e senha errada:
// quem tenta adivinhar e-mails não descobre quais existem.
@ExceptionHandler(AuthenticationException.class)
public ProblemDetail handleAuthentication(AuthenticationException ex) {
    return ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, "Credenciais inválidas");
}

@ExceptionHandler(InvalidRefreshTokenException.class)
public ProblemDetail handleInvalidRefreshToken(InvalidRefreshTokenException ex) {
    return ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, ex.getMessage());
}`,
  highlight: [3, 6],
}

export const notFoundHandler: Snippet = {
  language: 'java',
  code: `// Documento de outro usuário também vira 404: a API não confirma que o id existe.
@ExceptionHandler(DocumentNotFoundException.class)
public ProblemDetail handleDocumentNotFound(DocumentNotFoundException ex) {
    return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
}

@ExceptionHandler(UserNotFoundException.class)
public ProblemDetail handleUserNotFound(UserNotFoundException ex) {
    return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
}`,
  highlight: [2, 5],
}

export const aiAndStorageHandler: Snippet = {
  language: 'java',
  code: `@ExceptionHandler({NonTransientAiException.class, TransientAiException.class})
public ProblemDetail handleAiFailure(RuntimeException ex) {
    log.error("Falha ao chamar o provedor de IA", ex);
    return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_GATEWAY,
        "O serviço de IA está indisponível. Tente novamente em instantes.");
}

@ExceptionHandler(StorageException.class)
public ProblemDetail handleStorage(StorageException ex) {
    log.error("Falha no armazenamento", ex);
    return ProblemDetail.forStatusAndDetail(HttpStatus.SERVICE_UNAVAILABLE,
        "O armazenamento de arquivos está indisponível. Tente novamente.");
}`,
  highlight: [1, 5],
}

export const maxUploadHandler: Snippet = {
  language: 'java',
  code: `@Override
protected ResponseEntity<Object> handleMaxUploadSizeExceededException(
        MaxUploadSizeExceededException ex, HttpHeaders headers,
        HttpStatusCode status, WebRequest request) {
    ProblemDetail problem = ProblemDetail.forStatusAndDetail(
        HttpStatus.PAYLOAD_TOO_LARGE,
        "Arquivo excede o tamanho máximo de 20MB");
    return handleExceptionInternal(ex, problem, headers,
        HttpStatus.PAYLOAD_TOO_LARGE, request);
}`,
  highlight: [5, 7],
}
