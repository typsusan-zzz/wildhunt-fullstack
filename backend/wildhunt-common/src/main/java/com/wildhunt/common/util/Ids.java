package com.wildhunt.common.util;

import java.security.SecureRandom;
import java.util.concurrent.atomic.AtomicLong;

public final class Ids {
    private static final AtomicLong SEQ = new AtomicLong(System.currentTimeMillis());
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final char[] CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".toCharArray();

    private Ids() {
    }

    public static long nextId() {
        return SEQ.incrementAndGet();
    }

    public static String roomCode(int length) {
        StringBuilder builder = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            builder.append(CODE_ALPHABET[RANDOM.nextInt(CODE_ALPHABET.length)]);
        }
        return builder.toString();
    }
}
