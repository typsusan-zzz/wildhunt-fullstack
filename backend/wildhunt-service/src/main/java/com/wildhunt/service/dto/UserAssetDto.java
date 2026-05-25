package com.wildhunt.service.dto;

public record UserAssetDto(
        String assetType,
        String assetCode,
        boolean equipped,
        String source
) {
}
