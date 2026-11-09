package br.com.igor.copilot.document;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import org.springframework.http.InvalidMediaTypeException;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

/**
 * Valida arquivos enviados por multipart e sanitiza seus nomes.
 * <p>
 * Validar apenas o cabeçalho {@code Content-Type} não é suficiente para segurança, pois esse valor
 * é controlado arbitrariamente pelo cliente HTTP. Por isso, inspecionamos também os 5 primeiros bytes
 * do arquivo (<i>magic bytes</i> {@code %PDF-}) para confirmar a assinatura binária do formato PDF.
 */
@Component
public class PdfUploadValidator {

    private static final byte[] PDF_MAGIC_BYTES = "%PDF-".getBytes(StandardCharsets.US_ASCII);
    private static final int MAX_FILE_NAME_LENGTH = 255;
    private static final String DEFAULT_FILE_NAME = "documento.pdf";

    public String validateAndSanitizeFileName(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidDocumentException("O arquivo não pode ser vazio");
        }

        validateContentType(file.getContentType());
        validateMagicBytes(file);
        return sanitizeFileName(file.getOriginalFilename());
    }

    private void validateContentType(String contentType) {
        if (!StringUtils.hasText(contentType)) {
            throw new InvalidDocumentException("O tipo de conteúdo do arquivo deve ser application/pdf");
        }
        try {
            MediaType parsed = MediaType.parseMediaType(contentType);
            if (!MediaType.APPLICATION_PDF.equalsTypeAndSubtype(parsed)) {
                throw new InvalidDocumentException("O tipo de conteúdo do arquivo deve ser application/pdf");
            }
        } catch (InvalidMediaTypeException e) {
            throw new InvalidDocumentException("O tipo de conteúdo do arquivo deve ser application/pdf", e);
        }
    }

    private void validateMagicBytes(MultipartFile file) {
        try (InputStream in = file.getInputStream()) {
            byte[] header = in.readNBytes(PDF_MAGIC_BYTES.length);
            if (!Arrays.equals(header, PDF_MAGIC_BYTES)) {
                throw new InvalidDocumentException("O arquivo enviado não possui assinatura binária de PDF (%PDF-)");
            }
        } catch (IOException e) {
            throw new InvalidDocumentException("Não foi possível ler o arquivo enviado", e);
        }
    }

    private String sanitizeFileName(String original) {
        if (!StringUtils.hasText(original)) {
            return DEFAULT_FILE_NAME;
        }
        String cleaned = StringUtils.cleanPath(original);
        int lastSeparator = Math.max(cleaned.lastIndexOf('/'), cleaned.lastIndexOf('\\'));
        if (lastSeparator >= 0) {
            cleaned = cleaned.substring(lastSeparator + 1);
        }
        cleaned = cleaned.trim();
        if (cleaned.isEmpty() || ".".equals(cleaned) || "..".equals(cleaned)) {
            return DEFAULT_FILE_NAME;
        }
        if (cleaned.length() > MAX_FILE_NAME_LENGTH) {
            return cleaned.substring(0, MAX_FILE_NAME_LENGTH);
        }
        return cleaned;
    }
}
