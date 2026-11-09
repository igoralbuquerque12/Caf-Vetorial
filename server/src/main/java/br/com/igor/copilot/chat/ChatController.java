package br.com.igor.copilot.chat;

import br.com.igor.copilot.chat.dto.AskQuestionRequest;
import br.com.igor.copilot.chat.dto.ChatAnswerResponse;
import br.com.igor.copilot.shared.security.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller REST para realização de perguntas sobre documentos indexados do usuário autenticado.
 */
@RestController
@RequestMapping("/api/v1/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping
    public ChatAnswerResponse ask(
            @RequestBody @Valid AskQuestionRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        return chatService.ask(CurrentUser.id(jwt), request);
    }
}
