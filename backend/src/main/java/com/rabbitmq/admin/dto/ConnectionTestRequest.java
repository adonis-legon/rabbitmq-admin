package com.rabbitmq.admin.dto;

import jakarta.validation.constraints.*;

/**
 * Request DTO for testing cluster connection.
 */
public class ConnectionTestRequest {

    @NotBlank(message = "API URL is required")
    @Pattern(regexp = "^https?://[\\w\\-._~:/?#\\[\\]@!$&'()*+,;=%]+$", message = "API URL must be a valid HTTP or HTTPS URL")
    private String apiUrl;

    @NotBlank(message = "Username is required")
    private String username;

    @NotBlank(message = "Password is required")
    private String password;

    public ConnectionTestRequest() {
    }

    public ConnectionTestRequest(String apiUrl, String username, String password) {
        this.apiUrl = apiUrl;
        this.username = username;
        this.password = password;
    }

    public String getApiUrl() {
        return apiUrl;
    }

    public void setApiUrl(String apiUrl) {
        this.apiUrl = apiUrl;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}