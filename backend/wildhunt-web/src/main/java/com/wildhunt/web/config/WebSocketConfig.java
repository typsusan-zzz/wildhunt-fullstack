package com.wildhunt.web.config;

import com.wildhunt.web.ws.GameWebSocketHandler;
import com.wildhunt.web.ws.LobbyWebSocketHandler;
import com.wildhunt.web.ws.RoomWebSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {
    private final RoomWebSocketHandler roomHandler;
    private final GameWebSocketHandler gameHandler;
    private final LobbyWebSocketHandler lobbyHandler;

    public WebSocketConfig(RoomWebSocketHandler roomHandler, GameWebSocketHandler gameHandler, LobbyWebSocketHandler lobbyHandler) {
        this.roomHandler = roomHandler;
        this.gameHandler = gameHandler;
        this.lobbyHandler = lobbyHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(roomHandler, "/ws/room").setAllowedOriginPatterns("*");
        registry.addHandler(gameHandler, "/ws/game").setAllowedOriginPatterns("*");
        registry.addHandler(lobbyHandler, "/ws/lobby").setAllowedOriginPatterns("*");
    }
}
