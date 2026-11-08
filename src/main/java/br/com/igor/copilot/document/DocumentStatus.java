package br.com.igor.copilot.document;

/**
 * Estados possíveis do ciclo de vida de processamento de um documento.
 */
public enum DocumentStatus {
    PENDING,
    PROCESSING,
    COMPLETED,
    FAILED
}
