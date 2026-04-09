package com.example.MotvirsWeb.Dto;

/**
 * DTO para transferir la pregunta del usuario desde el frontend al backend.
 * Contiene el mensaje del usuario y el contexto (pasajero/conductor)
 * para determinar qué system prompt utilizar en la comunicación con el LLM.
 *
 * @param message El mensaje o pregunta del usuario
 * @param context El contexto de la conversación: "pasajero" o "conductor"
 */
public record ChatRequestDto(
        String message,
        String context
) {
    /**
     * Constructor que asigna valores por defecto si son nulos.
     */
    public ChatRequestDto {
        if (message == null) message = "";
        if (context == null) context = "pasajero";
    }
}
