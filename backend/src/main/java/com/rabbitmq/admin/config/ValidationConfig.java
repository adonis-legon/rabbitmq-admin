package com.rabbitmq.admin.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;
import org.springframework.validation.beanvalidation.MethodValidationPostProcessor;

/**
 * Configuration for enabling method-level validation.
 */
@Configuration
public class ValidationConfig {

    /**
     * Provides the validator factory for method validation.
     */
    @Bean
    public LocalValidatorFactoryBean localValidatorFactoryBean() {
        return new LocalValidatorFactoryBean();
    }

    /**
     * Enables method-level validation for @Validated annotated classes.
     * This allows validation of method parameters with constraints like @Min, @Max.
     * Note: Configuration properties classes should not use @Validated to avoid
     * CGLIB proxy issues.
     */
    @Bean
    public MethodValidationPostProcessor methodValidationPostProcessor(LocalValidatorFactoryBean validator) {
        MethodValidationPostProcessor processor = new MethodValidationPostProcessor();
        processor.setValidator(validator);
        // Method validation only applies to @Validated classes, so removing @Validated
        // from
        // AuditConfigurationProperties should prevent validation issues
        return processor;
    }
}