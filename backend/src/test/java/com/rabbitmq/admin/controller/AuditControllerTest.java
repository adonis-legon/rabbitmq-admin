package com.rabbitmq.admin.controller;

import com.rabbitmq.admin.dto.AuditConfigurationDto;
import com.rabbitmq.admin.dto.AuditDto;
import com.rabbitmq.admin.model.AuditOperationStatus;
import com.rabbitmq.admin.model.AuditOperationType;
import com.rabbitmq.admin.security.CustomUserDetailsService;
import com.rabbitmq.admin.security.JwtTokenProvider;
import com.rabbitmq.admin.service.WriteAuditService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.mockito.Mockito;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit tests for AuditController.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = {
                "app.audit.write-operations.enabled=true"
})
class AuditControllerTest {

        @Autowired
        private MockMvc mockMvc;

        @MockitoBean
        private WriteAuditService writeAuditService;

        @MockitoBean
        private JwtTokenProvider jwtTokenProvider;

        @MockitoBean
        private CustomUserDetailsService customUserDetailsService;

        private AuditDto auditDto1;
        private AuditDto auditDto2;
        private AuditConfigurationDto auditConfig;

        @BeforeEach
        void setUp() {
                Instant now = Instant.now();

                // Create test audit DTOs
                auditDto1 = new AuditDto(
                                UUID.randomUUID(),
                                "testuser",
                                "test-cluster",
                                AuditOperationType.CREATE_EXCHANGE,
                                "exchange",
                                "test.exchange",
                                Map.of("type", "direct", "durable", true),
                                AuditOperationStatus.SUCCESS,
                                null,
                                now.minusSeconds(3600),
                                "192.168.1.100",
                                "Mozilla/5.0",
                                now.minusSeconds(3600));

                auditDto2 = new AuditDto(
                                UUID.randomUUID(),
                                "admin",
                                "prod-cluster",
                                AuditOperationType.DELETE_QUEUE,
                                "queue",
                                "test.queue",
                                Map.of("messages", 0, "consumers", 0),
                                AuditOperationStatus.SUCCESS,
                                null,
                                now.minusSeconds(1800),
                                "192.168.1.101",
                                "curl/7.68.0",
                                now.minusSeconds(1800));

                // Create test audit configuration
                auditConfig = new AuditConfigurationDto();
                auditConfig.setEnabled(true);
                auditConfig.setRetentionDays(90);
                auditConfig.setBatchSize(100);
                auditConfig.setAsyncProcessing(true);
        }

        @Test
        @WithMockUser(roles = "ADMINISTRATOR")
        void getAuditRecords_WithDefaultParameters_ShouldReturnPagedResults() throws Exception {
                // Given
                Page<AuditDto> auditPage = new PageImpl<>(List.of(auditDto1, auditDto2),
                                PageRequest.of(0, 50, Sort.by(Sort.Direction.DESC, "timestamp")), 2);
                when(writeAuditService.getAuditRecords(any(), any(Pageable.class))).thenReturn(auditPage);

                // When & Then
                mockMvc.perform(get("/api/audits"))
                                .andExpect(status().isOk())
                                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                                .andExpect(jsonPath("$.items", hasSize(2)))
                                .andExpect(jsonPath("$.page", is(1))) // 1-based page numbering
                                .andExpect(jsonPath("$.pageSize", is(50)))
                                .andExpect(jsonPath("$.totalItems", is(2)))
                                .andExpect(jsonPath("$.totalPages", is(1)))
                                .andExpect(jsonPath("$.hasNext", is(false)))
                                .andExpect(jsonPath("$.hasPrevious", is(false)))
                                .andExpect(jsonPath("$.items[0].username", is("testuser")))
                                .andExpect(jsonPath("$.items[0].operationType", is("CREATE_EXCHANGE")))
                                .andExpect(jsonPath("$.items[1].username", is("admin")))
                                .andExpect(jsonPath("$.items[1].operationType", is("DELETE_QUEUE")));
        }

        @Test
        @WithMockUser(roles = "ADMINISTRATOR")
        void getAuditConfiguration_ShouldReturnConfiguration() throws Exception {
                // Given
                when(writeAuditService.getAuditConfigurationDto()).thenReturn(auditConfig);

                // When & Then
                mockMvc.perform(get("/api/audits/config"))
                                .andExpect(status().isOk())
                                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                                .andExpect(jsonPath("$.enabled", is(true)))
                                .andExpect(jsonPath("$.retentionDays", is(90)))
                                .andExpect(jsonPath("$.batchSize", is(100)))
                                .andExpect(jsonPath("$.asyncProcessing", is(true)));
        }

        @TestConfiguration
        static class TestConfig {
                @Bean
                WriteAuditService writeAuditService() {
                        return Mockito.mock(WriteAuditService.class);
                }
        }
}
