package br.com.igor.copilot.document;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repositório Spring Data JPA para operações de persistência de {@link DocumentRegistry}.
 */
public interface DocumentRegistryRepository extends JpaRepository<DocumentRegistry, UUID> {

    Optional<DocumentRegistry> findByIdAndOwnerId(UUID id, UUID ownerId);

    List<DocumentRegistry> findAllByOwnerIdOrderByCreatedAtDesc(UUID ownerId);
}
