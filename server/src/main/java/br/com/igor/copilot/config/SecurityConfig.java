package br.com.igor.copilot.config;

import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Configuração da cadeia de filtros de segurança HTTP e dos beans de autenticação.
 * <ul>
 *   <li><b>CSRF desabilitado:</b> a API é stateless e o token de acesso trafega no cabeçalho
 *       {@code Authorization: Bearer}, e não em cookies enviados automaticamente pelo navegador.</li>
 *   <li><b>CORS na cadeia de filtros:</b> antes de uma requisição "não simples" (por exemplo, com o header
 *       {@code Authorization}), o navegador envia um <i>preflight</i>: um {@code OPTIONS} sem token. Se o CORS
 *       fosse tratado apenas no nível do MVC, esse {@code OPTIONS} seria barrado pelo Spring Security com 401
 *       antes de qualquer outra regra ser aplicada. Com {@code .cors(...)} o {@code CorsFilter} roda no início
 *       da cadeia e responde ao preflight sem exigir autenticação.</li>
 *   <li><b>Rota {@code /error} liberada:</b> o Spring Boot redireciona internamente exceções não tratadas
 *       para {@code /error}; sem liberá-la, falhas internas (500) seriam barradas e expostas como 401.</li>
 *   <li><b>OAuth2 Resource Server JWT:</b> {@code oauth2ResourceServer().jwt()} registra o
 *       {@code BearerTokenAuthenticationFilter}, que extrai o Bearer token e delega a validação ao bean {@code JwtDecoder}.</li>
 *   <li><b>{@code AuthenticationManager}:</b> é construído pela autoconfiguração do Spring Security a partir
 *       dos beans {@code UserDetailsService} e {@code PasswordEncoder} registrados no contexto, utilizando
 *       internamente um {@code DaoAuthenticationProvider}.</li>
 * </ul>
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private static final String[] PUBLIC_POST_ENDPOINTS = {
            "/api/v1/users",
            "/api/v1/auth/login",
            "/api/v1/auth/refresh",
            "/api/v1/auth/logout"
    };

    @Bean
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
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .build();
    }

    /**
     * Fonte de configuração CORS consultada pelo {@code CorsFilter} da cadeia de segurança.
     * Sem credenciais ({@code allowCredentials(false)}): o token vai no header, não em cookie.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource(CorsProperties properties) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(properties.allowedOrigins());
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        configuration.setExposedHeaders(List.of("Location"));
        configuration.setAllowCredentials(false);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }
}
