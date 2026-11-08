package br.com.igor.copilot.user;

import java.util.Locale;

/**
 * Utilitário para padronização de endereços de e-mail antes de persistência ou busca.
 */
public final class EmailNormalizer {

    private EmailNormalizer() {
    }

    /**
     * Remove espaços nas extremidades e converte o e-mail para minúsculas usando {@link Locale#ROOT}
     * para evitar variações dependentes do idioma do sistema operacional.
     */
    public static String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
