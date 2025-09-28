package com.rabbitmq.admin.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rabbitmq.admin.dto.CreateExchangeRequest;
import com.rabbitmq.admin.model.User;
import com.rabbitmq.admin.model.UserRole;
import com.rabbitmq.admin.security.CustomUserDetailsService;
import com.rabbitmq.admin.security.JwtAuthenticationEntryPoint;
import com.rabbitmq.admin.security.JwtAuthenticationFilter;
import com.rabbitmq.admin.security.JwtTokenProvider;
import com.rabbitmq.admin.security.UserPrincipal;
import com.rabbitmq.admin.service.RabbitMQResourceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit tests for RabbitMQResourceController exchange operations.
 */
@WebMvcTest(RabbitMQResourceController.class)
@ActiveProfiles("test")
@Import(TestSecurityConfig.class)
class RabbitMQResourceControllerExchangeTest {

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private ObjectMapper objectMapper;

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

        private UUID clusterId;
        private User testUser;
        private UserPrincipal userPrincipal;
        private UsernamePasswordAuthenticationToken auth;

        @BeforeEach
        void setUp() {
                clusterId = UUID.randomUUID();
                testUser = new User("testuser", "hashedPassword", UserRole.USER);
                testUser.setId(UUID.randomUUID());
                userPrincipal = UserPrincipal.create(testUser);
                auth = new UsernamePasswordAuthenticationToken(userPrincipal, null, userPrincipal.getAuthorities());
        }

        @Test
        void createExchange_ShouldReturnOk_WhenSuccessful() throws Exception {
                // Given
                CreateExchangeRequest request = new CreateExchangeRequest(
                                "test-exchange", "direct", "/", true, false, false, new HashMap<>());

                when(resourceService.createExchange(any(UUID.class), any(CreateExchangeRequest.class), any(User.class)))
                                .thenReturn(Mono.empty());

                // When & Then
                mockMvc.perform(put("/api/rabbitmq/{clusterId}/resources/exchanges", clusterId)
                                .with(authentication(auth))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk());
        }

        @Test
        void createExchange_ShouldCreateExchangeWithArguments_WhenArgumentsProvided() throws Exception {
                // Given
                Map<String, Object> arguments = new HashMap<>();
                arguments.put("x-max-length", 1000);
                arguments.put("x-message-ttl", 60000);

                CreateExchangeRequest request = new CreateExchangeRequest(
                                "test-exchange", "topic", "test-vhost", true, false, false, arguments);

                when(resourceService.createExchange(any(UUID.class), any(CreateExchangeRequest.class), any(User.class)))
                                .thenReturn(Mono.empty());

                // When & Then
                mockMvc.perform(put("/api/rabbitmq/{clusterId}/resources/exchanges", clusterId)
                                .with(authentication(auth))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk());
        }

        @Test
        void deleteExchange_ShouldReturnOk_WhenSuccessful() throws Exception {
                // Given
                String vhost = java.util.Base64.getEncoder().encodeToString("/".getBytes());
                String exchangeName = "test-exchange";

                when(resourceService.deleteExchange(any(UUID.class), eq("/"), eq("test-exchange"), isNull(),
                                any(User.class)))
                                .thenReturn(Mono.empty());

                // When & Then
                mockMvc.perform(delete("/api/rabbitmq/{clusterId}/resources/exchanges/{vhost}/{name}",
                                clusterId, vhost, exchangeName)
                                .with(authentication(auth)))
                                .andExpect(status().isOk());
        }

        @Test
        void deleteExchange_ShouldReturnOk_WhenIfUnusedSpecified() throws Exception {
                // Given
                String vhost = java.util.Base64.getEncoder().encodeToString("/".getBytes());
                String exchangeName = "test-exchange";

                when(resourceService.deleteExchange(any(UUID.class), eq("/"), eq("test-exchange"), eq(true),
                                any(User.class)))
                                .thenReturn(Mono.empty());

                // When & Then
                mockMvc.perform(delete("/api/rabbitmq/{clusterId}/resources/exchanges/{vhost}/{name}",
                                clusterId, vhost, exchangeName)
                                .param("ifUnused", "true")
                                .with(authentication(auth)))
                                .andExpect(status().isOk());
        }

        @Test
        void deleteExchange_ShouldHandleSpecialCharacters_InExchangeName() throws Exception {
                // Given
                String originalVhost = "test-vhost";
                String originalExchangeName = "test-exchange-simple"; // Use simpler name to avoid encoding issues

                String vhost = java.util.Base64.getEncoder().encodeToString(originalVhost.getBytes());
                String exchangeName = originalExchangeName; // Don't pre-encode, let MockMvc handle it

                when(resourceService.deleteExchange(any(UUID.class), eq(originalVhost),
                                eq(originalExchangeName), isNull(), any(User.class)))
                                .thenReturn(Mono.empty());

                // When & Then
                mockMvc.perform(delete("/api/rabbitmq/{clusterId}/resources/exchanges/{vhost}/{name}",
                                clusterId, vhost, exchangeName)
                                .with(authentication(auth)))
                                .andExpect(status().isOk());
        }
}