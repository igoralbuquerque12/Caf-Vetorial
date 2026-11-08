package br.com.igor.copilot.config;

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

/**
 * Configuração da cadeia de filtros de segurança HTTP e dos beans de autenticação.
 * <ul>
 *   <li><b>CSRF desabilitado:</b> a API é stateless e o token de acesso trafega no cabeçalho
 *       {@code Authorization: Bearer}, e não em cookies enviados automaticamente pelo navegador.</li>
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

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }
}
