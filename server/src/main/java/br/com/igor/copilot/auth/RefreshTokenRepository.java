package br.com.igor.copilot.auth;

import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Repositório Spring Data JPA para gerenciamento de {@link RefreshToken}.
 */
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    /**
     * Busca o token aplicando lock pessimista de escrita ({@code SELECT ... FOR UPDATE}).
     * Isso impede que duas requisições simultâneas rotacionem o mesmo token ao mesmo tempo:
     * a segunda transação aguarda a primeira concluir o commit e, em seguida, enxerga o token já revogado.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<RefreshToken> findByTokenHash(String tokenHash);

    @Modifying
    @Query("update RefreshToken r set r.revokedAt = :now where r.user.id = :userId and r.revokedAt is null")
    int revokeAllActiveByUserId(@Param("userId") UUID userId, @Param("now") Instant now);
}
