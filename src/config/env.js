/**
 * Environment Configuration & Build-Time Schema Validator
 * Validates critical environment variables across Development, Staging, and Production.
 */

// Schema definition for client-facing environment variables
const ENV_SCHEMA = {
  VITE_API_BASE_URL: {
    required: false,
    default: 'http://localhost:5000',
    description: 'Backend REST & WebSocket API Base URL',
    validate: (val, isProd) => {
      if (!val) return true;
      if (isProd && (val.includes('localhost') || val.includes('127.0.0.1'))) {
        return 'Production VITE_API_BASE_URL should not point to localhost.';
      }
      return true;
    }
  },
  VITE_FIREBASE_API_KEY: {
    required: true,
    default: '',
    description: 'Firebase Web API Key',
    validate: (val) => {
      if (!val || typeof val !== 'string' || val.trim().length < 10) {
        return 'Firebase API Key is missing or too short.';
      }
      return true;
    }
  },
  VITE_FIREBASE_AUTH_DOMAIN: {
    required: true,
    default: '',
    description: 'Firebase Auth Domain'
  },
  VITE_FIREBASE_PROJECT_ID: {
    required: true,
    default: '',
    description: 'Firebase Project Identifier'
  },
  VITE_FIREBASE_STORAGE_BUCKET: {
    required: false,
    default: '',
    description: 'Firebase Storage Bucket URL'
  },
  VITE_FIREBASE_MESSAGING_SENDER_ID: {
    required: false,
    default: '',
    description: 'Firebase Cloud Messaging Sender ID'
  },
  VITE_FIREBASE_APP_ID: {
    required: true,
    default: '',
    description: 'Firebase Application ID'
  },
  VITE_STRIPE_PUBLISHABLE_KEY: {
    required: true,
    default: '',
    description: 'Stripe Publishable Key (pk_test_... or pk_live_...)',
    validate: (val) => {
      if (!val || (!val.startsWith('pk_test_') && !val.startsWith('pk_live_'))) {
        return 'Stripe publishable key must start with pk_test_ or pk_live_.';
      }
      return true;
    }
  },
  VITE_UPI_MERCHANT_VPA: {
    required: false,
    default: '',
    description: 'NPCI Bharat UPI Merchant Identifier (VPA)',
    validate: (val) => {
      if (val && !val.includes('@')) {
        return 'UPI VPA must be a valid virtual payment address (e.g. username@bank).';
      }
      return true;
    }
  },
  VITE_UPI_MERCHANT_NAME: {
    required: false,
    default: 'VendorSaathi Store',
    description: 'UPI Business Display Name'
  }
};

/**
 * Validate active environment variables against schema
 * @param {Object} rawEnv - import.meta.env or process.env
 * @param {boolean} isProduction - true if in production build
 * @returns {{ isValid: boolean, errors: string[], warnings: string[], env: Object }}
 */
export function validateEnvironment(rawEnv = import.meta.env, isProduction = (rawEnv?.MODE === 'production')) {
  const errors = [];
  const warnings = [];
  const sanitizedEnv = {};

  for (const [key, config] of Object.entries(ENV_SCHEMA)) {
    const rawVal = rawEnv?.[key];
    const val = (rawVal !== undefined && rawVal !== '') ? rawVal : config.default;
    sanitizedEnv[key] = val;

    if (config.required && (!val || val === 'your_api_key_here' || val === 'your_project_id')) {
      errors.push(`Missing required environment variable: ${key} (${config.description})`);
      continue;
    }

    if (config.validate && val) {
      const validationResult = config.validate(val, isProduction);
      if (typeof validationResult === 'string') {
        if (isProduction && config.required) {
          errors.push(`[${key}] ${validationResult}`);
        } else {
          warnings.push(`[${key}] ${validationResult}`);
        }
      }
    }
  }

  const isValid = errors.length === 0;

  if (warnings.length > 0 && typeof console !== 'undefined') {
    console.warn('⚠️ [VendorSaathi Env Warnings]:\n' + warnings.join('\n'));
  }

  if (!isValid && typeof console !== 'undefined') {
    console.error('❌ [VendorSaathi Env Errors]:\n' + errors.join('\n'));
  }

  return {
    isValid,
    errors,
    warnings,
    env: sanitizedEnv
  };
}

// Evaluate on module load in client
export const envValidation = validateEnvironment();
export const env = envValidation.env;

export default env;
