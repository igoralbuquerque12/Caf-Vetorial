package br.com.igor.copilot;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/**
 * Ponto de entrada da aplicação AI Copilot.
 */
@SpringBootApplication
@ConfigurationPropertiesScan
public class AiCopilotApplication {

	public static void main(String[] args) {
		SpringApplication.run(AiCopilotApplication.class, args);
	}

}
