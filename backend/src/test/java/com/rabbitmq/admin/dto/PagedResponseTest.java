package com.rabbitmq.admin.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class PagedResponseTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void testDefaultConstructor() {
        PagedResponse<String> response = new PagedResponse<>();

        assertNull(response.getItems());
        assertEquals(0, response.getPage());
        assertEquals(0, response.getPageSize());
        assertEquals(0, response.getTotalItems());
        assertEquals(0, response.getTotalPages());
        assertFalse(response.isHasNext());
        assertFalse(response.isHasPrevious());
    }

    @Test
    void testConstructorWithData() {
        List<String> items = Arrays.asList("item1", "item2", "item3");
        PagedResponse<String> response = new PagedResponse<>(items, 1, 10, 25);

        assertEquals(items, response.getItems());
        assertEquals(1, response.getPage());
        assertEquals(10, response.getPageSize());
        assertEquals(25, response.getTotalItems());
        assertEquals(3, response.getTotalPages()); // Math.ceil(25/10) = 3
        assertTrue(response.isHasNext());
        assertFalse(response.isHasPrevious());
    }

    @Test
    void testPaginationCalculations() {
        List<String> items = Arrays.asList("item1", "item2");

        // Test first page
        PagedResponse<String> firstPage = new PagedResponse<>(items, 1, 5, 12);
        assertEquals(3, firstPage.getTotalPages()); // Math.ceil(12/5) = 3
        assertTrue(firstPage.isHasNext());
        assertFalse(firstPage.isHasPrevious());

        // Test middle page
        PagedResponse<String> middlePage = new PagedResponse<>(items, 2, 5, 12);
        assertEquals(3, middlePage.getTotalPages());
        assertTrue(middlePage.isHasNext());
        assertTrue(middlePage.isHasPrevious());

        // Test last page
        PagedResponse<String> lastPage = new PagedResponse<>(items, 3, 5, 12);
        assertEquals(3, lastPage.getTotalPages());
        assertFalse(lastPage.isHasNext());
        assertTrue(lastPage.isHasPrevious());
    }

    @Test
    void testExactPageDivision() {
        List<String> items = Arrays.asList("item1", "item2");
        PagedResponse<String> response = new PagedResponse<>(items, 2, 5, 10);

        assertEquals(2, response.getTotalPages()); // 10/5 = 2 exactly
        assertFalse(response.isHasNext());
        assertTrue(response.isHasPrevious());
    }

    @Test
    void testSinglePage() {
        List<String> items = Arrays.asList("item1", "item2");
        PagedResponse<String> response = new PagedResponse<>(items, 1, 10, 2);

        assertEquals(1, response.getTotalPages());
        assertFalse(response.isHasNext());
        assertFalse(response.isHasPrevious());
    }

    @Test
    void testEmptyPage() {
        List<String> items = Arrays.asList();
        PagedResponse<String> response = new PagedResponse<>(items, 1, 10, 0);

        assertEquals(0, response.getTotalPages());
        assertFalse(response.isHasNext());
        assertFalse(response.isHasPrevious());
    }

    @Test
    void testJsonSerialization() throws Exception {
        List<String> items = Arrays.asList("item1", "item2");
        PagedResponse<String> response = new PagedResponse<>(items, 1, 10, 25);

        String json = objectMapper.writeValueAsString(response);

        assertTrue(json.contains("\"items\":[\"item1\",\"item2\"]"));
        assertTrue(json.contains("\"page\":1"));
        assertTrue(json.contains("\"pageSize\":10"));
        assertTrue(json.contains("\"totalItems\":25"));
        assertTrue(json.contains("\"totalPages\":3"));
        assertTrue(json.contains("\"hasNext\":true"));
        assertTrue(json.contains("\"hasPrevious\":false"));
    }

    @Test
    void testJsonDeserialization() throws Exception {
        String json = "{\"items\":[\"item1\",\"item2\"],\"page\":2,\"pageSize\":5," +
                "\"totalItems\":12,\"totalPages\":3,\"hasNext\":true,\"hasPrevious\":true}";

        PagedResponse<String> response = objectMapper.readValue(json,
                objectMapper.getTypeFactory().constructParametricType(PagedResponse.class, String.class));

        assertEquals(Arrays.asList("item1", "item2"), response.getItems());
        assertEquals(2, response.getPage());
        assertEquals(5, response.getPageSize());
        assertEquals(12, response.getTotalItems());
        assertEquals(3, response.getTotalPages());
        assertTrue(response.isHasNext());
        assertTrue(response.isHasPrevious());
    }

    @Test
    void testSettersAndGetters() {
        PagedResponse<String> response = new PagedResponse<>();
        List<String> items = Arrays.asList("test");

        response.setItems(items);
        response.setPage(2);
        response.setPageSize(10);
        response.setTotalItems(50);
        response.setTotalPages(5);
        response.setHasNext(true);
        response.setHasPrevious(true);

        assertEquals(items, response.getItems());
        assertEquals(2, response.getPage());
        assertEquals(10, response.getPageSize());
        assertEquals(50, response.getTotalItems());
        assertEquals(5, response.getTotalPages());
        assertTrue(response.isHasNext());
        assertTrue(response.isHasPrevious());
    }
}