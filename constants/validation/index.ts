/**
 * Validation Constants
 * 
 * This file defines constants related to form validation,
 * input constraints, and validation error messages.
 */

/**
 * Form field length constraints
 */
export const FieldLength = {
  USERNAME: {
    MIN: 3,
    MAX: 30,
  },
  PASSWORD: {
    MIN: 8,
    MAX: 128,
  },
  NAME: {
    MIN: 2,
    MAX: 50,
  },
  EMAIL: {
    MAX: 255,
  },
  TITLE: {
    MIN: 3,
    MAX: 100,
  },
  DESCRIPTION: {
    MIN: 10,
    MAX: 5000,
  },
  BIO: {
    MAX: 1000,
  },
  URL: {
    MAX: 2048,
  },
};

/**
 * Regular expressions for validation
 */
export const ValidationRegex = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  URL: /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[a-zA-Z0-9-_.~:/?#[\]@!$&'()*+,;=]*)?$/,
  PASSWORD_STRENGTH: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  USERNAME: /^[a-zA-Z0-9_-]{3,30}$/,
  PHONE: /^\+?[0-9]{10,15}$/,
  ZIPCODE: /^[0-9]{5}(-[0-9]{4})?$/,
};

/**
 * Validation error messages
 */
export const ValidationMessages = {
  REQUIRED: 'This field is required',
  EMAIL: 'Please enter a valid email address',
  PASSWORD: {
    TOO_SHORT: `Password must be at least ${FieldLength.PASSWORD.MIN} characters`,
    TOO_LONG: `Password must be at most ${FieldLength.PASSWORD.MAX} characters`,
    STRENGTH: 'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character',
    MATCH: 'Passwords do not match',
  },
  USERNAME: {
    TOO_SHORT: `Username must be at least ${FieldLength.USERNAME.MIN} characters`,
    TOO_LONG: `Username must be at most ${FieldLength.USERNAME.MAX} characters`,
    INVALID: 'Username can only contain letters, numbers, underscores, and hyphens',
  },
  URL: 'Please enter a valid URL',
  PHONE: 'Please enter a valid phone number',
  ZIPCODE: 'Please enter a valid zip code',
  NAME: {
    TOO_SHORT: `Name must be at least ${FieldLength.NAME.MIN} characters`,
    TOO_LONG: `Name must be at most ${FieldLength.NAME.MAX} characters`,
  },
  TITLE: {
    TOO_SHORT: `Title must be at least ${FieldLength.TITLE.MIN} characters`,
    TOO_LONG: `Title must be at most ${FieldLength.TITLE.MAX} characters`,
  },
  DESCRIPTION: {
    TOO_SHORT: `Description must be at least ${FieldLength.DESCRIPTION.MIN} characters`,
    TOO_LONG: `Description must be at most ${FieldLength.DESCRIPTION.MAX} characters`,
  },
};
