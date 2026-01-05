// Configuration validation and errors
class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";
  }
}

// Check if we're running in test mode
const isTestMode = () => {
  return import.meta.env.MODE === "test" || import.meta.env.VITE_TEST_MODE === "true";
};

// Get required environment variable or throw error
const getRequiredEnvVar = (key: string, description: string): string => {
  const value = import.meta.env[key];
  if (!value) {
    // In test mode, return dummy URLs
    if (isTestMode()) {
      return `http://test-${key.toLowerCase().replace(/_/g, "-")}`;
    }
    throw new ConfigurationError(
      `Missing required environment variable: ${key}\n` +
      `Description: ${description}\n\n` +
      `Please create a .env file with the required variables.\n` +
      `See .env.example for reference.`
    );
  }
  return value;
};

// Development configuration - requires explicit setup
const getDevelopmentConfig = () => {
  return {
    backend: getRequiredEnvVar("VITE_B3ND_BACKEND", "B3nd data node URL"),
    wallet: getRequiredEnvVar("VITE_B3ND_WALLET", "B3nd wallet node URL"),
    app: getRequiredEnvVar("VITE_B3ND_APP", "B3nd app URL"),
  };
};

// Production configuration - requires explicit setup
const getProductionConfig = () => {
  return {
    backend: getRequiredEnvVar("VITE_FIRECAT_BACKEND", "Firecat backend URL"),
    wallet: getRequiredEnvVar("VITE_FIRECAT_WALLET", "Firecat wallet URL"),
    app: getRequiredEnvVar("VITE_FIRECAT_APP", "Firecat app URL"),
  };
};

// Validate and load configuration
const loadConfig = () => {
  try {
    return import.meta.env.DEV
      ? getDevelopmentConfig()
      : getProductionConfig();
  } catch (error) {
    if (error instanceof ConfigurationError) {
      throw error;
    }
    throw new ConfigurationError(
      `Failed to load configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

// Export validated configuration
export const config = loadConfig();

// Application key for B3nd wallet authentication
// This identifies this app to the wallet server
export const APP_KEY = "firecat-notes-v1";

// Export configuration check for runtime validation
export const validateConfiguration = (): { valid: boolean; error?: string } => {
  try {
    loadConfig();
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Unknown configuration error",
    };
  }
};
