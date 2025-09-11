package com.rabbitmq.admin.exception;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(excludeAutoConfiguration = {
        org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration.class,
        org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration.class
}, excludeFilters = {
        @ComponentScan.Filter(type = FilterType.REGEX, pattern = "com\\.rabbitmq\\.admin\\.security\\..*"),
        @ComponentScan.Filter(type = FilterType.REGEX, pattern = "com\\.rabbitmq\\.admin\\.controller\\..*")
})
@Import({ GlobalExceptionHandler.class, GlobalExceptionHandlerTest.TestController.class })
class GlobalExceptionHandlerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @WithMockUser
    void shouldHandleUserNotFoundException() throws Exception {
        mockMvc.perform(get("/test/user-not-found"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.error", is("User Not Found")))
                .andExpect(jsonPath("$.message", is("User not found with ID: test-id")))
                .andExpect(jsonPath("$.timestamp").exists())
                .andExpect(jsonPath("$.path", is("/test/user-not-found")));
    }

    @Test
    @WithMockUser
    void shouldHandleClusterConnectionNotFoundException() throws Exception {
        mockMvc.perform(get("/test/cluster-not-found"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.error", is("Cluster Connection Not Found")))
                .andExpect(jsonPath("$.message", is("Cluster connection not found with ID: test-cluster-id")))
                .andExpect(jsonPath("$.timestamp").exists())
                .andExpect(jsonPath("$.path", is("/test/cluster-not-found")));
    }

    @Test
    @WithMockUser
    void shouldHandleDuplicateResourceException() throws Exception {
        mockMvc.perform(get("/test/duplicate-resource"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status", is(409)))
                .andExpect(jsonPath("$.error", is("Resource Already Exists")))
                .andExpect(jsonPath("$.message", is("Username already exists: testuser")))
                .andExpect(jsonPath("$.details.resourceType", is("Username")))
                .andExpect(jsonPath("$.details.resourceIdentifier", is("testuser")))
                .andExpect(jsonPath("$.timestamp").exists())
                .andExpect(jsonPath("$.path", is("/test/duplicate-resource")));
    }

    @Test
    @WithMockUser
    void shouldHandleValidationException() throws Exception {
        mockMvc.perform(get("/test/validation-error"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.error", is("Validation Failed")))
                .andExpect(jsonPath("$.message", is("Validation failed")))
                .andExpect(jsonPath("$.details.password").exists())
                .andExpect(jsonPath("$.timestamp").exists())
                .andExpect(jsonPath("$.path", is("/test/validation-error")));
    }

    @Test
    @WithMockUser
    void shouldHandleClusterConnectionException() throws Exception {
        mockMvc.perform(get("/test/cluster-connection-error"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.error", is("Cluster Connection Error")))
                .andExpect(jsonPath("$.message", is("Cluster connection is not active")))
                .andExpect(jsonPath("$.details.clusterId", is("test-cluster")))
                .andExpect(jsonPath("$.timestamp").exists())
                .andExpect(jsonPath("$.path", is("/test/cluster-connection-error")));
    }

    @Test
    @WithMockUser
    void shouldHandleRabbitMQApiException() throws Exception {
        mockMvc.perform(get("/test/rabbitmq-api-error"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)))
                .andExpect(jsonPath("$.error", is("RabbitMQ API Error")))
                .andExpect(jsonPath("$.message", is("Unauthorized access to RabbitMQ API")))
                .andExpect(jsonPath("$.details.clusterId", is("test-cluster")))
                .andExpect(jsonPath("$.details.rabbitMQStatusCode", is(401)))
                .andExpect(jsonPath("$.timestamp").exists())
                .andExpect(jsonPath("$.path", is("/test/rabbitmq-api-error")));
    }

    @Test
    @WithMockUser
    void shouldHandleAccessDeniedException() throws Exception {
        mockMvc.perform(get("/test/access-denied"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)))
                .andExpect(jsonPath("$.error", is("Access Denied")))
                .andExpect(jsonPath("$.message", is("Access denied to resource")))
                .andExpect(jsonPath("$.timestamp").exists())
                .andExpect(jsonPath("$.path", is("/test/access-denied")));
    }

    @Test
    @WithMockUser
    void shouldHandleBadCredentialsException() throws Exception {
        mockMvc.perform(get("/test/bad-credentials"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)))
                .andExpect(jsonPath("$.error", is("Unauthorized")))
                .andExpect(jsonPath("$.message", is("Invalid credentials")))
                .andExpect(jsonPath("$.timestamp").exists())
                .andExpect(jsonPath("$.path", is("/test/bad-credentials")));
    }

    @Test
    @WithMockUser
    void shouldHandleMethodArgumentNotValidException() throws Exception {
        TestRequest request = new TestRequest();
        request.setName(""); // Invalid - should not be blank
        request.setDescription("a"); // Invalid - too short

        mockMvc.perform(post("/test/validation")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.error", is("Validation Failed")))
                .andExpect(jsonPath("$.message", is("Input validation failed")))
                .andExpect(jsonPath("$.details.name").exists())
                .andExpect(jsonPath("$.details.description").exists())
                .andExpect(jsonPath("$.timestamp").exists())
                .andExpect(jsonPath("$.path", is("/test/validation")));
    }

    @Test
    @WithMockUser
    void shouldHandleMethodArgumentTypeMismatchException() throws Exception {
        mockMvc.perform(get("/test/type-mismatch/invalid-uuid"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.error", is("Invalid Parameter")))
                .andExpect(jsonPath("$.message", containsString("Invalid value 'invalid-uuid' for parameter 'id'")))
                .andExpect(jsonPath("$.details.parameter", is("id")))
                .andExpect(jsonPath("$.details.rejectedValue", is("invalid-uuid")))
                .andExpect(jsonPath("$.timestamp").exists())
                .andExpect(jsonPath("$.path", is("/test/type-mismatch/invalid-uuid")));
    }

    @Test
    @WithMockUser
    void shouldHandleIllegalArgumentException() throws Exception {
        mockMvc.perform(get("/test/illegal-argument"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.error", is("Bad Request")))
                .andExpect(jsonPath("$.message", is("Invalid argument provided")))
                .andExpect(jsonPath("$.timestamp").exists())
                .andExpect(jsonPath("$.path", is("/test/illegal-argument")));
    }

    @Test
    @WithMockUser
    void shouldHandleRuntimeException() throws Exception {
        mockMvc.perform(get("/test/runtime-exception"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.status", is(500)))
                .andExpect(jsonPath("$.error", is("Internal Server Error")))
                .andExpect(jsonPath("$.message", is("An unexpected error occurred")))
                .andExpect(jsonPath("$.timestamp").exists())
                .andExpect(jsonPath("$.path", is("/test/runtime-exception")));
    }

    @Test
    @WithMockUser
    void shouldHandleGenericException() throws Exception {
        mockMvc.perform(get("/test/generic-exception"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.status", is(500)))
                .andExpect(jsonPath("$.error", is("Internal Server Error")))
                .andExpect(jsonPath("$.message", is("An unexpected error occurred")))
                .andExpect(jsonPath("$.timestamp").exists())
                .andExpect(jsonPath("$.path", is("/test/generic-exception")));
    }

    // Test controller to trigger various exceptions
    @RestController
    static class TestController {

        @GetMapping("/test/user-not-found")
        public void userNotFound() {
            throw UserNotFoundException.byId("test-id");
        }

        @GetMapping("/test/cluster-not-found")
        public void clusterNotFound() {
            throw ClusterConnectionNotFoundException.byId("test-cluster-id");
        }

        @GetMapping("/test/duplicate-resource")
        public void duplicateResource() {
            throw DuplicateResourceException.username("testuser");
        }

        @GetMapping("/test/validation-error")
        public void validationError() {
            throw ValidationException.passwordStrength();
        }

        @GetMapping("/test/cluster-connection-error")
        public void clusterConnectionError() {
            throw ClusterConnectionException.inactive("test-cluster");
        }

        @GetMapping("/test/rabbitmq-api-error")
        public void rabbitMQApiError() {
            throw RabbitMQApiException.unauthorized("test-cluster");
        }

        @GetMapping("/test/access-denied")
        public void accessDenied() {
            throw new AccessDeniedException("Access denied to resource");
        }

        @GetMapping("/test/bad-credentials")
        public void badCredentials() {
            throw new BadCredentialsException("Invalid credentials");
        }

        @PostMapping("/test/validation")
        public void validation(@Valid @RequestBody TestRequest request) {
            // This will trigger validation errors
        }

        @GetMapping("/test/type-mismatch/{id}")
        public void typeMismatch(@PathVariable java.util.UUID id) {
            // This will trigger type mismatch when invalid UUID is provided
        }

        @GetMapping("/test/illegal-argument")
        public void illegalArgument() {
            throw new IllegalArgumentException("Invalid argument provided");
        }

        @GetMapping("/test/runtime-exception")
        public void runtimeException() {
            throw new RuntimeException("Test runtime exception");
        }

        @GetMapping("/test/generic-exception")
        public void genericException() throws Exception {
            throw new Exception("Test generic exception");
        }
    }

    // Test request class for validation testing
    static class TestRequest {
        @NotBlank(message = "Name cannot be blank")
        private String name;

        @Size(min = 5, max = 100, message = "Description must be between 5 and 100 characters")
        private String description;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }
    }
}