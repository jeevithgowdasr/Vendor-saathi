/**
 * Comprehensive Validation & Schema Engine for VendorSaathi
 * Handles input sanitization, whitespace trimming, numeric/currency enforcement,
 * email/phone verification, and hardened file upload checks.
 */

// Strict RFC 5322 Compliant Email Regex
export const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// Standard Indian 10-Digit Mobile Number (starting 6, 7, 8, 9)
export const PHONE_REGEX = /^(?:(?:\+|0{0,2})91[\s.-]?)?[6-9]\d{9}$/;

// Indian 6-Digit Postal Pincode
export const PINCODE_REGEX = /^[1-9][0-9]{5}$/;

// Standard UPI Virtual Payment Address (VPA)
export const UPI_VPA_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;

// Allowed Image MIME types and extensions for file hardening
export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/jpg',
  'image/gif'
];

export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Validates text string: trims whitespace, checks min/max length, rejects whitespace-only.
 */
export const validateRequiredText = (value, fieldName = 'This field', minLength = 1, maxLength = 500) => {
  if (value === null || value === undefined) {
    return `${fieldName} is required`;
  }
  const trimmed = String(value).trim();
  if (trimmed.length === 0) {
    return `${fieldName} cannot be empty or contain only spaces`;
  }
  if (trimmed.length < minLength) {
    return `${fieldName} must be at least ${minLength} characters long`;
  }
  if (trimmed.length > maxLength) {
    return `${fieldName} cannot exceed ${maxLength} characters`;
  }
  return null;
};

/**
 * Validates email address format.
 */
export const validateEmail = (value, isRequired = true) => {
  if (!value || String(value).trim().length === 0) {
    return isRequired ? 'Email address is required' : null;
  }
  const clean = String(value).trim().toLowerCase();
  if (!EMAIL_REGEX.test(clean)) {
    return 'Please enter a valid email address (e.g. name@domain.com)';
  }
  return null;
};

/**
 * Validates phone number (normalized to 10 digits).
 */
export const validatePhone = (value, isRequired = true) => {
  if (!value || String(value).trim().length === 0) {
    return isRequired ? 'Mobile number is required' : null;
  }
  const digits = String(value).replace(/\D/g, '');
  // Handles +91 prefix (12 digits) or local 10 digits
  const localDigits = digits.startsWith('91') && digits.length === 12 ? digits.slice(2) : digits;

  if (localDigits.length !== 10) {
    return 'Please enter a valid 10-digit mobile number';
  }
  if (!/^[6-9]/.test(localDigits)) {
    return 'Mobile number must start with 6, 7, 8, or 9';
  }
  return null;
};

/**
 * Validates 6-digit postal PIN code.
 */
export const validatePincode = (value, isRequired = true) => {
  if (!value || String(value).trim().length === 0) {
    return isRequired ? 'Pincode is required' : null;
  }
  const clean = String(value).trim();
  if (!PINCODE_REGEX.test(clean)) {
    return 'Please enter a valid 6-digit postal pincode';
  }
  return null;
};

/**
 * Validates Currency / Monetary amount:
 * - Non-negative
 * - No exponents ('e', 'E') or signs ('+', '-')
 * - Maximum 2 decimal places
 */
export const validateCurrency = (value, fieldName = 'Price', min = 0, max = 1000000) => {
  if (value === null || value === undefined || String(value).trim() === '') {
    return `${fieldName} is required`;
  }
  const str = String(value).trim();

  // Reject exponential notations or negative signs
  if (/[eE+-]/.test(str)) {
    return `${fieldName} cannot contain exponents or signs ('e', '+', '-')`;
  }

  const num = Number(str);
  if (isNaN(num)) {
    return `${fieldName} must be a valid number`;
  }
  if (num < min) {
    return `${fieldName} cannot be less than ₹${min}`;
  }
  if (num > max) {
    return `${fieldName} cannot exceed ₹${max}`;
  }

  // Check decimal places
  const parts = str.split('.');
  if (parts.length > 1 && parts[1].length > 2) {
    return `${fieldName} cannot have more than 2 decimal places`;
  }

  return null;
};

/**
 * Validates Quantity / Units (integer or positive decimal up to 3 decimals e.g. 0.250 kg).
 */
export const validateQuantity = (value, fieldName = 'Quantity', min = 0.01, max = 10000, allowDecimal = true) => {
  if (value === null || value === undefined || String(value).trim() === '') {
    return `${fieldName} is required`;
  }
  const str = String(value).trim();
  if (/[eE+-]/.test(str)) {
    return `${fieldName} cannot contain exponents or signs ('e', '+', '-')`;
  }
  const num = Number(str);
  if (isNaN(num) || num <= 0) {
    return `${fieldName} must be a positive number`;
  }
  if (num < min) {
    return `${fieldName} cannot be less than ${min}`;
  }
  if (num > max) {
    return `${fieldName} cannot exceed ${max}`;
  }
  if (!allowDecimal && !Number.isInteger(num)) {
    return `${fieldName} must be a whole number`;
  }
  return null;
};

/**
 * Validates UPI VPA (e.g. merchant@icici, user@okhdfcbank).
 */
export const validateUpiId = (value, isRequired = true) => {
  if (!value || String(value).trim().length === 0) {
    return isRequired ? 'UPI ID is required' : null;
  }
  const clean = String(value).trim();
  if (!UPI_VPA_REGEX.test(clean)) {
    return 'Please enter a valid UPI ID (e.g. yourname@upi or store@bank)';
  }
  return null;
};

/**
 * Validates Password strength & length.
 */
export const validatePassword = (value, minLength = 6) => {
  if (!value || String(value).length === 0) {
    return 'Password is required';
  }
  if (String(value).length < minLength) {
    return `Password must be at least ${minLength} characters`;
  }
  return null;
};

/**
 * File upload validation for image files:
 * - Checks file size <= 5MB
 * - Checks MIME type whitelist
 * - Validates file extension
 */
export const validateImageFile = (file, options = {}) => {
  const maxSize = options.maxSizeBytes || MAX_FILE_SIZE_BYTES;
  const allowedMime = options.allowedTypes || ALLOWED_IMAGE_MIME_TYPES;
  const allowedExts = options.allowedExtensions || ALLOWED_IMAGE_EXTENSIONS;

  if (!file) {
    return options.required ? 'Please select an image file' : null;
  }

  // 1. File Size Check
  if (file.size > maxSize) {
    const maxMB = (maxSize / (1024 * 1024)).toFixed(0);
    const actualMB = (file.size / (1024 * 1024)).toFixed(2);
    return `File size (${actualMB} MB) exceeds maximum allowed limit of ${maxMB} MB`;
  }

  // 2. MIME Type Validation
  if (!allowedMime.includes(file.type.toLowerCase())) {
    return `Unsupported file format (${file.type || 'unknown'}). Allowed: JPG, PNG, WEBP, GIF`;
  }

  // 3. Extension Validation (detect disguised executable extensions)
  const fileName = file.name.toLowerCase();
  const hasValidExt = allowedExts.some(ext => fileName.endsWith(ext));
  if (!hasValidExt) {
    return 'File extension does not match allowed image formats (.jpg, .png, .webp, .gif)';
  }

  // Disallow suspicious double extensions like 'photo.exe.png' or 'image.php.jpg'
  const parts = fileName.split('.');
  if (parts.length > 2) {
    const dangerousExtensions = ['exe', 'bat', 'sh', 'js', 'vbs', 'php', 'py', 'jar', 'apk', 'cmd', 'ps1'];
    const innerExts = parts.slice(1, -1);
    if (innerExts.some(ext => dangerousExtensions.includes(ext))) {
      return 'Rejected file with suspicious nested extension for security';
    }
  }

  return null;
};

/**
 * Keydown handler for Numeric & Currency input elements.
 * Prevents typing invalid mathematical symbols like 'e', 'E', '+', '-' and multiple decimals.
 */
export const handleNumericKeyDown = (e, allowDecimal = true) => {
  // Disallow scientific notation exponents and signs
  if (['e', 'E', '+', '-'].includes(e.key)) {
    e.preventDefault();
    return;
  }

  // If decimal is not allowed, prevent '.'
  if (!allowDecimal && e.key === '.') {
    e.preventDefault();
    return;
  }

  // Prevent multiple decimal points in the same input
  if (e.key === '.' && e.target.value.includes('.')) {
    e.preventDefault();
    return;
  }
};

/**
 * Generic Schema Validation Runner
 * Takes a data object and a schema definition { fieldName: validatorFunction }
 * Returns { isValid, errors, sanitizedData }
 */
export const validateForm = (data, schema) => {
  const errors = {};
  const sanitizedData = {};
  let isValid = true;

  for (const [field, validator] of Object.entries(schema)) {
    const rawVal = data[field];
    // Auto-trim string fields for sanitation
    const val = typeof rawVal === 'string' ? rawVal.trim() : rawVal;
    sanitizedData[field] = val;

    if (typeof validator === 'function') {
      const error = validator(val, data);
      if (error) {
        errors[field] = error;
        isValid = false;
      }
    }
  }

  return { isValid, errors, sanitizedData };
};
