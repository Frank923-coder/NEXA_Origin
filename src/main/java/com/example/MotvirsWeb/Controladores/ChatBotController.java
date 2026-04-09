package com.example.MotvirsWeb.Controladores;

import com.example.MotvirsWeb.Dto.ChatRequestDto;
import com.example.MotvirsWeb.Dto.ChatResponseDto;
import com.example.MotvirsWeb.Service.ChatBotService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
     * @param request ChatRequestDto con message y context
     * @return ChatResponseDto con la respuesta generada por Gemini AI
     */
    @PostMapping("/chat")
    public ResponseEntity<ChatResponseDto> chat(@RequestBody ChatRequestDto request) {
        if (request.message().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(new ChatResponseDto("Por favor, escribe un mensaje."));
        }

        try {
            String response = chatBotService.processMessage(request.message(), request.context());
            return ResponseEntity.ok(new ChatResponseDto(response));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new ChatResponseDto("Lo siento, hubo un error procesando tu mensaje. Intenta de nuevo. 😅"));
        }
    }
}
