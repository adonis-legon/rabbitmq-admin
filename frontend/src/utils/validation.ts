// Validation utilities for form handling

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationSchema {
  [fieldName: string]: ValidationRule;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validate a single field value against a rule
 */
export const validateField = (value: any, rule: ValidationRule, fieldName: string): string | null => {
  // Check required
  if (rule.required && (value === null || value === undefined || value === '')) {
    return `${fieldName} is required`;
  }

  // Skip other validations if value is empty and not required
  if (!rule.required && (value === null || value === undefined || value === '')) {
    return null;
  }

  const stringValue = String(value);

  // Check minimum length
  if (rule.minLength && stringValue.length < rule.minLength) {
    return `${fieldName} must be at least ${rule.minLength} characters long`;
  }

  // Check maximum length
  if (rule.maxLength && stringValue.length > rule.maxLength) {
    return `${fieldName} must be no more than ${rule.maxLength} characters long`;
  }

  // Check pattern
  if (rule.pattern && !rule.pattern.test(stringValue)) {
    return `${fieldName} format is invalid`;
  }

  // Check custom validation
  if (rule.custom) {
    const customError = rule.custom(value);
    if (customError) {
      return customError;
    }
  }

  return null;
};

/**
 * Validate an object against a schema
 */
export const validateObject = (data: Record<string, any>, schema: ValidationSchema): ValidationResult => {
  const errors: Record<string, string> = {};

  Object.entries(schema).forEach(([fieldName, rule]) => {
    const value = data[fieldName];
    const error = validateField(value, rule, fieldName);
    if (error) {
      errors[fieldName] = error;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Common validation rules
 */
export const ValidationRules = {
  required: { required: true },

  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    custom: (value: string) => {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Please enter a valid email address';
      }
      return null;
    }
  },

  password: {
    required: true,
    minLength: 8,
    custom: (value: string) => {
      if (!value) return null;

      const hasUpperCase = /[A-Z]/.test(value);
      const hasLowerCase = /[a-z]/.test(value);
      const hasNumbers = /\d/.test(value);
      const hasSpecialChar = /[@$!%*?&]/.test(value);

      if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
        return 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)';
      }

      return null;
    }
  },

  username: {
    required: true,
    minLength: 3,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9_-]+$/,
    custom: (value: string) => {
      if (value && !/^[a-zA-Z0-9_-]+$/.test(value)) {
        return 'Username can only contain letters, numbers, hyphens, and underscores';
      }
      return null;
    }
  },

  url: {
    required: true,
    custom: (value: string) => {
      if (!value) return null;

      try {
        new URL(value);
        return null;
      } catch {
        return 'Please enter a valid URL';
      }
    }
  },

  apiUrl: {
    required: true,
    custom: (value: string) => {
      if (!value) return null;

      try {
        const url = new URL(value);
        if (!['http:', 'https:'].includes(url.protocol)) {
          return 'URL must use HTTP or HTTPS protocol';
        }
        return null;
      } catch {
        return 'Please enter a valid API URL';
      }
    }
  },

  nonEmpty: {
    required: true,
    custom: (value: string) => {
      if (typeof value === 'string' && value.trim() === '') {
        return 'This field cannot be empty';
      }
      return null;
    }
  },

  positiveNumber: {
    required: true,
    custom: (value: any) => {
      const num = Number(value);
      if (isNaN(num) || num <= 0) {
        return 'Must be a positive number';
      }
      return null;
    }
  }
};

/**
 * Create a validation schema for user forms
 */
export const createUserValidationSchema = (isEdit: boolean = false): ValidationSchema => ({
  username: ValidationRules.username,
  password: isEdit ? { ...ValidationRules.password, required: false } : ValidationRules.password,
  role: ValidationRules.required
});

/**
 * Create a validation schema for cluster connection forms
 */
export const createClusterValidationSchema = (): ValidationSchema => ({
  name: { ...ValidationRules.nonEmpty, maxLength: 100 },
  apiUrl: ValidationRules.apiUrl,
  username: ValidationRules.nonEmpty,
  password: ValidationRules.nonEmpty,
  description: { required: false, maxLength: 500 }
});

/**
 * Create a validation schema for login forms
 */
export const createLoginValidationSchema = (): ValidationSchema => ({
  username: ValidationRules.nonEmpty,
  password: ValidationRules.nonEmpty
});

/**
 * Convert validation errors to Material UI field errors format
 */
export const formatFieldErrors = (errors: Record<string, string>) => {
  const fieldErrors: Record<string, { error: boolean; helperText: string }> = {};

  Object.entries(errors).forEach(([field, message]) => {
    fieldErrors[field] = {
      error: true,
      helperText: message
    };
  });

  return fieldErrors;
};

/**
 * Hook for form validation with Material UI
 */
export const useFormValidation = (schema: ValidationSchema) => {
  const validate = (data: Record<string, any>) => {
    const result = validateObject(data, schema);
    return {
      ...result,
      fieldErrors: formatFieldErrors(result.errors)
    };
  };

  const validateSingleField = (fieldName: string, value: any) => {
    const rule = schema[fieldName];
    if (!rule) return null;

    const error = validateField(value, rule, fieldName);
    return error ? { error: true, helperText: error } : { error: false, helperText: '' };
  };

  return { validate, validateField: validateSingleField };
};