package com.example.MotvirsWeb.Controladores;

import com.example.MotvirsWeb.Service.ChatBotService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/public")
public class ChatBotController {

    private final ChatBotService chatBotService;

    public ChatBotController(ChatBotService chatBotService) {
        this.chatBotService = chatBotService;
    }

    /**
     * POST /public/chat
     * Recibe un mensaje y el contexto (pasajero/conductor) y retorna la respuesta del chatbot.
     *
     * Request body: { "message": "...", "context": "pasajero" | "conductor" }
     * Response: { "response": "..." }
     */
    @PostMapping("/chat")
    public ResponseEntity<Map<String, String>> chat(@RequestBody Map<String, String> request) {
        String message = request.getOrDefault("message", "");
        String context = request.getOrDefault("context", "pasajero");

        if (message.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("response", "Por favor, escribe un mensaje."));
        }

        try {
            String response = chatBotService.processMessage(message, context);
            return ResponseEntity.ok(Map.of("response", response));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("response", "Lo siento, hubo un error procesando tu mensaje. Intenta de nuevo. 😅"));
        }
    }
}
