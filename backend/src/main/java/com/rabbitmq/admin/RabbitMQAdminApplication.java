package com.rabbitmq.admin;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class RabbitMQAdminApplication {

    public static void main(String[] args) {
        // Allow encoded slashes in URLs for Tomcat
        System.setProperty("org.apache.tomcat.util.buf.UDecoder.ALLOW_ENCODED_SLASH", "true");
        System.setProperty("org.apache.catalina.connector.CoyoteAdapter.ALLOW_BACKSLASH", "true");

        SpringApplication.run(RabbitMQAdminApplication.class, args);
    }
}