package br.com.igor.copilot.document;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;

class PdfUploadValidatorTest {

    private static final byte[] VALID_PDF_BYTES = "%PDF-1.7 sample content".getBytes(StandardCharsets.US_ASCII);

    private PdfUploadValidator validator;

    @BeforeEach
    void setUp() {
        validator = new PdfUploadValidator();
    }

    @Test
    void shouldRejectEmptyFile() {
        MockMultipartFile emptyFile = new MockMultipartFile(
                "file",
                "teste.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                new byte[0]
        );

        assertThatThrownBy(() -> validator.validateAndSanitizeFileName(emptyFile))
                .isInstanceOf(InvalidDocumentException.class);
    }

    @Test
    void shouldRejectNonPdfContentType() {
        MockMultipartFile textFile = new MockMultipartFile(
                "file",
                "teste.txt",
                MediaType.TEXT_PLAIN_VALUE,
                VALID_PDF_BYTES
        );

        assertThatThrownBy(() -> validator.validateAndSanitizeFileName(textFile))
                .isInstanceOf(InvalidDocumentException.class);
    }

    @Test
    void shouldRejectInvalidMagicBytes() {
        MockMultipartFile fakePdf = new MockMultipartFile(
                "file",
                "falso.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                "NOT-A-PDF-CONTENT".getBytes(StandardCharsets.US_ASCII)
        );

        assertThatThrownBy(() -> validator.validateAndSanitizeFileName(fakePdf))
                .isInstanceOf(InvalidDocumentException.class);
    }

    @Test
    void shouldSanitizeFileNameWithUnixAndWindowsPaths() {
        MockMultipartFile unixTraversal = new MockMultipartFile(
                "file",
                "../../etc/passwd.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                VALID_PDF_BYTES
        );
        MockMultipartFile windowsPath = new MockMultipartFile(
                "file",
                "C:\\x\\a.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                VALID_PDF_BYTES
        );

        assertThat(validator.validateAndSanitizeFileName(unixTraversal)).isEqualTo("passwd.pdf");
        assertThat(validator.validateAndSanitizeFileName(windowsPath)).isEqualTo("a.pdf");
    }

    @Test
    void shouldTruncateFileNameLongerThan255Characters() {
        String longName = "a".repeat(300) + ".pdf";
        MockMultipartFile longFile = new MockMultipartFile(
                "file",
                longName,
                MediaType.APPLICATION_PDF_VALUE,
                VALID_PDF_BYTES
        );

        String sanitized = validator.validateAndSanitizeFileName(longFile);

        assertThat(sanitized).hasSize(255);
    }
}
