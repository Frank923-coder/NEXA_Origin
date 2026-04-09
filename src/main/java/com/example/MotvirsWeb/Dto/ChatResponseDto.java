package com.example.MotvirsWeb.Dto;

/**
 * DTO para transferir la respuesta del LLM desde el backend al frontend.
 * Encapsula la respuesta generada por el modelo Gemini.
 *
 * @param response La respuesta generada por el chatbot (Gemini AI)
 */
public record ChatResponseDto(
        String response
) {
}
