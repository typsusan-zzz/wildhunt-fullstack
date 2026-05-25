package com.wildhunt.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.wildhunt.common.util.Ids;
import com.wildhunt.dal.entity.SystemConfigEntity;
import com.wildhunt.dal.mapper.SystemConfigMapper;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service
public class SystemConfigService {
    private final SystemConfigMapper systemConfigMapper;
    private final Map<String, String> overrides = new ConcurrentHashMap<>();

    public SystemConfigService() {
        this((SystemConfigMapper) null);
    }

    @Autowired
    public SystemConfigService(ObjectProvider<SystemConfigMapper> systemConfigMapper) {
        this(systemConfigMapper.getIfAvailable());
    }

    private SystemConfigService(SystemConfigMapper systemConfigMapper) {
        this.systemConfigMapper = systemConfigMapper;
    }

    public Map<String, Object> gameRuntimeConfig(int realDeerCount, int aiDeerCount) {
        Map<String, String> raw = loadConfig();
        Map<String, Object> config = new HashMap<>();
        config.put("realDeerCount", Math.max(0, realDeerCount));
        config.put("aiDeerCount", number(raw, "match.ai_deer_count", Math.max(16, aiDeerCount)));
        config.put("durationSeconds", number(raw, "game.duration_seconds", 240));
        config.put("initialTime", number(raw, "game.duration_seconds", 240));
        config.put("maxTime", number(raw, "game.max_time_seconds", 360));
        config.put("correctBonus", number(raw, "game.correct_bonus_seconds", 35));
        config.put("wrongPenalty", number(raw, "game.wrong_penalty_seconds", 20));
        config.put("arenaRadius", number(raw, "game.arena_radius", 142));
        config.put("worldRadius", number(raw, "game.world_radius", 162));
        config.put("sceneryRadius", number(raw, "game.scenery_radius", 154));
        config.put("turnSpeed", number(raw, "game.turn_speed", 2.65));
        config.put("idleTurnSpeedRatio", number(raw, "game.idle_turn_speed_ratio", 0.72));
        config.put("backwardSpeedRatio", number(raw, "game.backward_speed_ratio", 0.56));
        config.put("maxWalkableSlope", number(raw, "game.max_walkable_slope", 0.65));
        config.put("wolfRadius", number(raw, "game.wolf_radius", 1));
        config.put("deerRadius", number(raw, "game.deer_radius", 0.65));
        config.put("wolfStepUp", number(raw, "game.wolf_step_up", 0.75));
        config.put("deerStepUp", number(raw, "game.deer_step_up", 0.55));
        config.put("wolfDropDown", number(raw, "game.wolf_drop_down", 1.25));
        config.put("deerDropDown", number(raw, "game.deer_drop_down", 0.95));
        config.put("wolfBaseSpeed", number(raw, "game.wolf_base_speed", 13));
        config.put("wolfSprintSpeed", number(raw, "game.wolf_sprint_speed", 22));
        config.put("deerBaseSpeed", number(raw, "game.deer_base_speed", 7));
        config.put("deerSprintSpeed", number(raw, "game.deer_sprint_speed", 11.2));
        config.put("wolfPounceImpulse", number(raw, "game.wolf_pounce_impulse", 17));
        config.put("wolfPounceDuration", number(raw, "game.wolf_pounce_duration", 0.42));
        config.put("biteCooldownSeconds", number(raw, "game.bite_cooldown_seconds", 0.72));
        config.put("biteLockSeconds", number(raw, "game.bite_lock_seconds", 0.48));
        config.put("biteImpactSeconds", number(raw, "game.bite_impact_seconds", 0.28));
        config.put("scentDurationSeconds", number(raw, "game.scent_duration_seconds", 9.2));
        config.put("deerCamouflageDurationSeconds", number(raw, "game.deer_camouflage_duration_seconds", 3));
        config.put("deerCamouflageCooldownSeconds", number(raw, "game.deer_camouflage_cooldown_seconds", 6));
        config.put("deerLookDurationSeconds", number(raw, "game.deer_look_duration_seconds", 3.5));
        config.put("deerLookCooldownSeconds", number(raw, "game.deer_look_cooldown_seconds", 4.5));
        config.put("deerEatDurationSeconds", number(raw, "game.deer_eat_duration_seconds", 2));
        config.put("foodPatchCount", number(raw, "game.food_patch_count", 42));
        config.put("foodSpawnRadius", number(raw, "game.food_spawn_radius", 124));
        config.put("deerSpawnRadius", number(raw, "game.deer_spawn_radius", 118));
        config.put("deerWanderArenaRadius", number(raw, "game.deer_wander_arena_radius", 80));
        config.put("natureDensityMultiplier", number(raw, "game.nature_density_multiplier", 1));
        return config;
    }

    public String get(String key, String fallback) {
        return loadConfig().getOrDefault(key, fallback);
    }

    public void set(String key, String value) {
        overrides.put(key, value);
        try {
            if (systemConfigMapper == null) return;
            LocalDateTime now = LocalDateTime.now();
            int updated = systemConfigMapper.update(null, new UpdateWrapper<SystemConfigEntity>()
                    .set("config_value", value)
                    .set("updated_at", now)
                    .eq("config_key", key)
                    .eq("deleted", 0));
            if (updated > 0) return;
            SystemConfigEntity entity = new SystemConfigEntity();
            entity.setId(Ids.nextId());
            entity.setConfigKey(key);
            entity.setConfigValue(value);
            entity.setCreatedAt(now);
            entity.setUpdatedAt(now);
            entity.setDeleted(0);
            systemConfigMapper.insert(entity);
        } catch (RuntimeException ignored) {
            // Keep local and unit-test mode writable when MySQL is not running.
        }
    }

    public Map<String, String> loadConfig() {
        Map<String, String> result = new HashMap<>(overrides);
        try {
            if (systemConfigMapper == null) return result;
            for (SystemConfigEntity row : systemConfigMapper.selectList(new QueryWrapper<SystemConfigEntity>().eq("deleted", 0))) {
                result.putIfAbsent(row.getConfigKey(), row.getConfigValue());
            }
        } catch (RuntimeException ignored) {
            return result;
        }
        return result;
    }

    private static Number number(Map<String, String> raw, String key, Number fallback) {
        String value = raw.get(key);
        if (value == null || value.isBlank()) return fallback;
        try {
            double parsed = Double.parseDouble(value.trim());
            return fallback instanceof Integer ? (int) Math.round(parsed) : parsed;
        } catch (NumberFormatException ignored) {
            return fallback;
        }
    }
}
