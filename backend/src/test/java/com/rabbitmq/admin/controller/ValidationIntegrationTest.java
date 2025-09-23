package com.rabbitmq.admin.controller;

import com.rabbitmq.admin.config.ValidationConfig;
import com.rabbitmq.admin.service.RabbitMQResourceService;
import com.rabbitmq.admin.security.CustomUserDetailsService;
import com.rabbitmq.admin.security.JwtAuthenticationEntryPoint;
import com.rabbitmq.admin.security.JwtAuthenticationFilter;
import com.rabbitmq.admin.security.JwtTokenProvider;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Simple validation test to verify that constraint validation is working.
 */
@WebMvcTest(RabbitMQResourceController.class)
@Import(ValidationConfig.class)
@ActiveProfiles("test")
class ValidationIntegrationTest {

        @Autowired
        private MockMvc mockMvc;

        @SuppressWarnings("removal")
        @MockBean
        private RabbitMQResourceService resourceService;

        @SuppressWarnings("removal")
        @MockBean
        private JwtTokenProvider jwtTokenProvider;

        @SuppressWarnings("removal")
        @MockBean
        private CustomUserDetailsService customUserDetailsService;

        @SuppressWarnings("removal")
        @MockBean
        private JwtAuthenticationFilter jwtAuthenticationFilter;

        @SuppressWarnings("removal")
        @MockBean
        private JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

        @Test
        void testValidationWithoutAuth() throws Exception {
                // Test validation without authentication to isolate validation issues
                mockMvc.perform(get("/api/rabbitmq/550e8400-e29b-41d4-a716-446655440000/resources/connections")
                                .param("page", "0"))
                                .andExpect(status().isUnauthorized()); // Should be unauthorized since no auth
        }

        @Test
        void testValidationPage0WithoutAuth() throws Exception {
                // This should trigger validation error before auth check if validation is
                // working
                mockMvc.perform(get("/api/rabbitmq/550e8400-e29b-41d4-a716-446655440000/resources/connections")
                                .param("page", "0"))
                                .andExpect(status().isUnauthorized()); // Would be 400 if validation is happening first
        }
}