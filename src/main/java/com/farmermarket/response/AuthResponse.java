package com.farmermarket.response;

import com.farmermarket.model.User;

public class AuthResponse {
    private String jwt;
    private String message;
    private User user;

    public AuthResponse() {}

    public AuthResponse(String jwt, String message, User user) {
        this.jwt = jwt;
        this.message = message;
        this.user = user;
    }

    public String getJwt() { return jwt; }
    public void setJwt(String jwt) { this.jwt = jwt; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
}
