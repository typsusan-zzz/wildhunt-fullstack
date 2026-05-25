package com.wildhunt.service.dto;

public record LobbySummary(int onlinePlayers, int waitingRooms, int playingRooms, int queueWolf, int queueDeer) {
}
