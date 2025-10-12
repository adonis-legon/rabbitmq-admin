package com.rabbitmq.admin.dto;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class PaginationRequestTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void testDefaultConstructor() {
        PaginationRequest request = new PaginationRequest();

        assertEquals(1, request.getPage());
        assertEquals(50, request.getPageSize());
        assertNull(request.getName());
        assertNull(request.getVhost());
        assertFalse(request.isUseRegex());
    }

    @Test
    void testConstructorWithPageAndSize() {
        PaginationRequest request = new PaginationRequest(2, 25);

        assertEquals(2, request.getPage());
        assertEquals(25, request.getPageSize());
        assertNull(request.getName());
        assertNull(request.getVhost());
        assertFalse(request.isUseRegex());
    }

    @Test
    void testConstructorWithAllParameters() {
        PaginationRequest request = new PaginationRequest(3, 100, "test-filter", true);

        assertEquals(3, request.getPage());
        assertEquals(100, request.getPageSize());
        assertEquals("test-filter", request.getName());
        assertNull(request.getVhost());
        assertTrue(request.isUseRegex());
    }

    @Test
    void testConstructorWithAllParametersIncludingVhost() {
        PaginationRequest request = new PaginationRequest(3, 100, "test-filter", "/test-vhost", true);

        assertEquals(3, request.getPage());
        assertEquals(100, request.getPageSize());
        assertEquals("test-filter", request.getName());
        assertEquals("/test-vhost", request.getVhost());
        assertTrue(request.isUseRegex());
    }

    @Test
    void testValidPaginationRequest() {
        PaginationRequest request = new PaginationRequest(1, 50, "test", false);

        Set<ConstraintViolation<PaginationRequest>> violations = validator.validate(request);

        assertTrue(violations.isEmpty(), "Valid pagination request should have no validation errors");
    }

    @Test
    void testPageValidation() {
        // Test page less than 1
        PaginationRequest request = new PaginationRequest(0, 50);

        Set<ConstraintViolation<PaginationRequest>> violations = validator.validate(request);

        assertFalse(violations.isEmpty());
        assertTrue(violations.stream()
                .anyMatch(v -> v.getMessage().equals("Page must be at least 1")));
    }

    @Test
    void testPageSizeValidation() {
        // Test page size less than 1
        PaginationRequest request1 = new PaginationRequest(1, 0);

        Set<ConstraintViolation<PaginationRequest>> violations1 = validator.validate(request1);

        assertFalse(violations1.isEmpty());
        assertTrue(violations1.stream()
                .anyMatch(v -> v.getMessage().equals("Page size must be at least 1")));

        // Test page size greater than 500
        PaginationRequest request2 = new PaginationRequest(1, 501);

        Set<ConstraintViolation<PaginationRequest>> violations2 = validator.validate(request2);

        assertFalse(violations2.isEmpty());
        assertTrue(violations2.stream()
                .anyMatch(v -> v.getMessage().equals("Page size cannot exceed 500")));
    }

    @Test
    void testBoundaryValues() {
        // Test minimum valid values
        PaginationRequest minRequest = new PaginationRequest(1, 1);
        Set<ConstraintViolation<PaginationRequest>> minViolations = validator.validate(minRequest);
        assertTrue(minViolations.isEmpty(), "Minimum valid values should pass validation");

        // Test maximum valid values
        PaginationRequest maxRequest = new PaginationRequest(Integer.MAX_VALUE, 500);
        Set<ConstraintViolation<PaginationRequest>> maxViolations = validator.validate(maxRequest);
        assertTrue(maxViolations.isEmpty(), "Maximum valid values should pass validation");
    }

    @Test
    void testSettersAndGetters() {
        PaginationRequest request = new PaginationRequest();

        request.setPage(5);
        request.setPageSize(75);
        request.setName("filter-name");
        request.setVhost("/test-vhost");
        request.setUseRegex(true);

        assertEquals(5, request.getPage());
        assertEquals(75, request.getPageSize());
        assertEquals("filter-name", request.getName());
        assertEquals("/test-vhost", request.getVhost());
        assertTrue(request.isUseRegex());
    }

    @Test
    void testNameFilter() {
        PaginationRequest request = new PaginationRequest();

        // Test null name
        request.setName(null);
        assertNull(request.getName());

        // Test empty name
        request.setName("");
        assertEquals("", request.getName());

        // Test name with spaces
        request.setName("test name with spaces");
        assertEquals("test name with spaces", request.getName());

        // Test name with special characters
        request.setName("test-name_123");
        assertEquals("test-name_123", request.getName());
    }

    @Test
    void testRegexFlag() {
        PaginationRequest request = new PaginationRequest();

        // Test default value
        assertFalse(request.isUseRegex());

        // Test setting to true
        request.setUseRegex(true);
        assertTrue(request.isUseRegex());

        // Test setting back to false
        request.setUseRegex(false);
        assertFalse(request.isUseRegex());
    }

    @Test
    void testVhostFilter() {
        PaginationRequest request = new PaginationRequest();

        // Test default value
        assertNull(request.getVhost());

        // Test setting vhost
        request.setVhost("/production");
        assertEquals("/production", request.getVhost());

        // Test setting to null
        request.setVhost(null);
        assertNull(request.getVhost());

        // Test setting empty string
        request.setVhost("");
        assertEquals("", request.getVhost());
    }
}