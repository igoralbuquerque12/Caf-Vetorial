package br.com.igor.copilot.document;

import br.com.igor.copilot.document.dto.DocumentResponse;
import br.com.igor.copilot.shared.security.CurrentUser;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

/**
 * Controller REST para upload assíncrono e consulta de documentos do usuário autenticado.
 * <p>
 * Quando um usuário tenta consultar um documento pertencente a outro usuário em {@link #findById},
 * retornamos {@code 404 Not Found} em vez de {@code 403 Forbidden} para não vazar a informação de
 * que aquele UUID existe no banco de dados.
 */
@RestController
@RequestMapping("/api/v1/documents")
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentResponse> upload(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal Jwt jwt
    ) {
        DocumentResponse response = documentService.upload(CurrentUser.id(jwt), file);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(response.id())
                .toUri();
        return ResponseEntity.accepted().location(location).body(response);
    }

    @GetMapping("/{id}")
    public DocumentResponse findById(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwt
    ) {
        return documentService.findById(id, CurrentUser.id(jwt));
    }

    @GetMapping
    public List<DocumentResponse> findAll(@AuthenticationPrincipal Jwt jwt) {
        return documentService.findAllByOwner(CurrentUser.id(jwt));
    }
}
