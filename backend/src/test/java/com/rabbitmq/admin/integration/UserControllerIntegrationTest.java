package com.rabbitmq.admin.integration;

import com.rabbitmq.admin.dto.CreateUserRequest;
import com.rabbitmq.admin.model.UserRole;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class UserControllerIntegrationTest extends IntegrationTestBase {

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private ObjectMapper objectMapper;

        @Test
        void getAllUsers_ShouldReturnUsers_WhenAdminAuthenticated() throws Exception {
                mockMvc.perform(get("/api/users")
                                .header("Authorization", "Bearer " + adminToken))
                                .andExpect(status().isOk())
                                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                                .andExpect(jsonPath("$").isArray());
        }

        @Test
        void createUser_ShouldCreateUser_WhenAdminAuthenticated() throws Exception {
                CreateUserRequest createRequest = createUserRequest("newuser", "NewUserPass123!", UserRole.USER);

                mockMvc.perform(post("/api/users")
                                .header("Authorization", "Bearer " + adminToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(createRequest)))
                                .andExpect(status().isCreated());
        }
}
