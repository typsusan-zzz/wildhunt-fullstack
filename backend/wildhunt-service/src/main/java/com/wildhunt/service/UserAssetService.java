package com.wildhunt.service;

import com.wildhunt.service.dto.UserAssetDto;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class UserAssetService {
    private final Map<Long, List<MutableAsset>> assets = new ConcurrentHashMap<>();

    public List<UserAssetDto> list(Long userId) {
        ensureDefaultAssets(userId);
        return assets.getOrDefault(userId, List.of()).stream().map(MutableAsset::toDto).toList();
    }

    public UserAssetDto grant(Long userId, String assetType, String assetCode, String source) {
        ensureDefaultAssets(userId);
        List<MutableAsset> owned = assets.computeIfAbsent(userId, ignored -> new ArrayList<>());
        return owned.stream()
                .filter(item -> item.assetType.equals(assetType) && item.assetCode.equals(assetCode))
                .findFirst()
                .map(MutableAsset::toDto)
                .orElseGet(() -> {
                    MutableAsset item = new MutableAsset(assetType, assetCode, false, source);
                    owned.add(item);
                    return item.toDto();
                });
    }

    public UserAssetDto equip(Long userId, String assetType, String assetCode) {
        ensureDefaultAssets(userId);
        List<MutableAsset> owned = assets.getOrDefault(userId, List.of());
        MutableAsset target = owned.stream()
                .filter(item -> item.assetType.equals(assetType) && item.assetCode.equals(assetCode))
                .findFirst()
                .orElseThrow();
        for (MutableAsset item : owned) {
            if (item.assetType.equals(assetType)) item.equipped = false;
        }
        target.equipped = true;
        return target.toDto();
    }

    private void ensureDefaultAssets(Long userId) {
        List<MutableAsset> owned = assets.computeIfAbsent(userId, ignored -> new ArrayList<>());
        if (owned.stream().noneMatch(item -> item.assetType.equals("AVATAR") && item.assetCode.equals("DEFAULT_DEER"))) {
            owned.add(new MutableAsset("AVATAR", "DEFAULT_DEER", true, "DEFAULT"));
        }
        if (owned.stream().noneMatch(item -> item.assetType.equals("TITLE") && item.assetCode.equals("ROOKIE_HUNTER"))) {
            owned.add(new MutableAsset("TITLE", "ROOKIE_HUNTER", true, "DEFAULT"));
        }
    }

    private static final class MutableAsset {
        final String assetType;
        final String assetCode;
        final String source;
        boolean equipped;

        MutableAsset(String assetType, String assetCode, boolean equipped, String source) {
            this.assetType = assetType;
            this.assetCode = assetCode;
            this.equipped = equipped;
            this.source = source;
        }

        UserAssetDto toDto() {
            return new UserAssetDto(assetType, assetCode, equipped, source);
        }
    }
}
