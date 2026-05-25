package com.wildhunt.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import org.junit.jupiter.api.Test;

class UserServiceTest {
    @Test
    void guestUserGetsDefaultProfileValues() {
        UserService userService = new UserService();

        var user = userService.createGuestUser();

        assertNotNull(user.userId());
        assertEquals(1000, user.rating());
        assertNotNull(user.username());
    }
}
