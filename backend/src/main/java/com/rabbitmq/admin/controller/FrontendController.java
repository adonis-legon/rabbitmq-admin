package com.rabbitmq.admin.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Controller to serve the React frontend application.
 * Handles routing for the SPA by forwarding all non-API requests to index.html.
 */
@Controller
public class FrontendController {

    /**
     * Serves the React app for all routes that don't start with /api
     * This allows React Router to handle client-side routing
     */
    @GetMapping(value = {
            "/",
            "/dashboard",
            "/dashboard/**",
            "/users",
            "/users/**",
            "/clusters",
            "/clusters/**",
            "/profile",
            "/profile/**",
            "/login",
            "/login/**",
            "/resources",
            "/resources/**"
    })
    public String forward() {
        return "forward:/index.html";
    }
}