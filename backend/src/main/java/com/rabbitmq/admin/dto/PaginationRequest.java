package com.rabbitmq.admin.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

/**
 * DTO for handling pagination parameters in resource requests.
 */
public class PaginationRequest {

    @Min(value = 1, message = "Page must be at least 1")
    private int page = 1;

    @Min(value = 1, message = "Page size must be at least 1")
    @Max(value = 500, message = "Page size cannot exceed 500")
    private int pageSize = 50;

    private String name;

    private boolean useRegex = false;

    public PaginationRequest() {
    }

    public PaginationRequest(int page, int pageSize) {
        this.page = page;
        this.pageSize = pageSize;
    }

    public PaginationRequest(int page, int pageSize, String name, boolean useRegex) {
        this.page = page;
        this.pageSize = pageSize;
        this.name = name;
        this.useRegex = useRegex;
    }

    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = page;
    }

    public int getPageSize() {
        return pageSize;
    }

    public void setPageSize(int pageSize) {
        this.pageSize = pageSize;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public boolean isUseRegex() {
        return useRegex;
    }

    public void setUseRegex(boolean useRegex) {
        this.useRegex = useRegex;
    }
}