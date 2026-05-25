package com.wildhunt.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import org.junit.jupiter.api.Test;

class AuthServiceTest {
    @Test
    void registerLoginMeAndBindKeepSessionUsable() {
        UserService userService = new UserService();
        AuthService authService = new AuthService(userService, new JwtService());

        var registered = authService.register("hunter", "secret1", "猎手");
        var loggedIn = authService.login("hunter", "secret1");
        var me = authService.me("Bearer " + loggedIn.token());

        assertNotNull(registered.token());
        assertEquals(registered.user().userId(), loggedIn.user().userId());
        assertEquals("猎手", me.nickname());

        var guest = authService.guestLogin();
        var bound = authService.bindAccount("Bearer " + guest.token(), "guest_bound", "secret2", "绑定游客");

        assertEquals(guest.user().userId(), bound.user().userId());
        assertEquals("guest_bound", bound.user().username());
    }
}
