package br.com.igor.copilot.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.com.igor.copilot.user.dto.CreateUserRequest;
import br.com.igor.copilot.user.dto.UserResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private UserService userService;

    @BeforeEach
    void setUp() {
        userService = new UserService(userRepository, passwordEncoder);
    }

    @Test
    void shouldNormalizeEmailAndSavePasswordHash() {
        CreateUserRequest request = new CreateUserRequest("  IGOR@Exemplo.COM  ", "plainPassword123");
        when(userRepository.existsByEmail("igor@exemplo.com")).thenReturn(false);
        when(passwordEncoder.encode("plainPassword123")).thenReturn("$2a$10$hashedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserResponse response = userService.create(request);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();

        assertThat(savedUser.getEmail()).isEqualTo("igor@exemplo.com");
        assertThat(savedUser.getPassword())
                .isEqualTo("$2a$10$hashedPassword")
                .isNotEqualTo("plainPassword123");
        assertThat(response.email()).isEqualTo("igor@exemplo.com");
    }

    @Test
    void shouldThrowEmailAlreadyInUseExceptionWhenEmailAlreadyExists() {
        CreateUserRequest request = new CreateUserRequest("  IGOR@Exemplo.com ", "plainPassword123");
        when(userRepository.existsByEmail("igor@exemplo.com")).thenReturn(true);

        assertThatThrownBy(() -> userService.create(request))
                .isInstanceOf(EmailAlreadyInUseException.class)
                .hasMessage("E-mail já cadastrado");

        verify(userRepository, never()).save(any());
    }
}
