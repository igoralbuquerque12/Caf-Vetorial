package br.com.igor.copilot.auth;

import br.com.igor.copilot.user.EmailNormalizer;
import br.com.igor.copilot.user.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Carrega os dados do usuário a partir do banco de dados durante a autenticação por credenciais.
 */
@Service
public class AppUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public AppUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        String normalizedEmail = EmailNormalizer.normalize(username);
        return userRepository.findByEmail(normalizedEmail)
                .map(user -> new SecurityUser(user.getId(), user.getEmail(), user.getPassword()))
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado"));
    }
}
