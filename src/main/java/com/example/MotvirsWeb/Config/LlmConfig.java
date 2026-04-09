package com.example.MotvirsWeb.Config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuración del cliente LLM (Large Language Model).
 * 
 * Configura el ChatClient de Spring AI utilizando el proveedor Google GenAI (Gemini).
 * La API key y el modelo se configuran en application.properties:
 * 
 * - spring.ai.google.genai.api-key: Clave de API de Gemini
 * - spring.ai.google.genai.chat.options.model: Modelo a utilizar (gemini-2.5-flash)
 * 
 * El ChatClient.Builder es auto-configurado por Spring AI y se inyecta aquí
 * para crear el bean de ChatClient disponible globalmente.
 */
@Configuration
public class LlmConfig {

    /**
     * Bean principal del ChatClient para comunicación con Gemini AI.
     * Este bean es utilizado por ChatBotService para construir clientes
     * con system prompts específicos por contexto (pasajero/conductor).
     *
     * @param builder Builder auto-configurado por Spring AI con las credenciales de Gemini
     * @return ChatClient configurado con el modelo Gemini 2.5 Flash
     */
    @Bean
    public ChatClient chatClient(ChatClient.Builder builder) {
        return builder.build();
    }
}
