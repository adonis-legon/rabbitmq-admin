package com.rabbitmq.admin.controller;

import com.rabbitmq.admin.model.VersionInfo;
import com.rabbitmq.admin.service.VersionService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/version")
public class VersionController {

    private final VersionService versionService;

    public VersionController(VersionService versionService) {
        this.versionService = versionService;
    }

    @GetMapping
    public VersionInfo getVersion() {
        return versionService.getVersionInfo();
    }
}