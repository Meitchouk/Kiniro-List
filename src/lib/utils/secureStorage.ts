/**
 * Secure Storage Service
 *
 * Provides encrypted localStorage operations using the Web Crypto API.
 * All sensitive data is encrypted before being stored and decrypted when retrieved.
 *
 * The encryption key is derived from an environment secret combined with browser-specific data,
 * making the encrypted data harder to use if copied to another environment.
 *
 * IMPORTANT: Set NEXT_PUBLIC_STORAGE_ENCRYPTION_KEY in your environment variables.
 */

/**
 * Get the encryption secret from environment
 * Falls back to a warning if not configured
 */
function getEncryptionSecret(): string {
  const envKey = process.env.NEXT_PUBLIC_STORAGE_ENCRYPTION_KEY;

  if (!envKey) {
    console.warn(
      "[SecureStorage] ENCRYPTION_KEY not set. Using fallback - this is NOT secure for production!"
    );
    // Fallback for development only - should NEVER be used in production
    return "dev-only-insecure-key-replace-in-production";
  }

  return envKey;
}

// Cache for the derived key to avoid re-deriving on every operation
let cachedKey: CryptoKey | null = null;

/**
 * Generates a browser fingerprint for additional key entropy
 */
function getBrowserFingerprint(): string {
  if (typeof window === "undefined") return "server";

  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width.toString(),
    screen.height.toString(),
    new Date().getTimezoneOffset().toString(),
  ];

  return components.join("|");
}

/**
 * Derives an encryption key from the secret and browser fingerprint
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;

  const encoder = new TextEncoder();
  const secret = getEncryptionSecret();
  const keyMaterial = encoder.encode(secret + getBrowserFingerprint());

  // Import the raw key material
  const importedKey = await crypto.subtle.importKey("raw", keyMaterial, "PBKDF2", false, [
    "deriveKey",
  ]);

  // Derive a key using PBKDF2
  const salt = encoder.encode("kiniro-secure-salt");
  cachedKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    importedKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  return cachedKey;
}

/**
 * Encrypts data using AES-GCM
 */
async function encrypt(data: string): Promise<string> {
  try {
    const key = await getEncryptionKey();
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encryptedData = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encoder.encode(data)
    );

    // Combine IV and encrypted data, then base64 encode
    const combined = new Uint8Array(iv.length + new Uint8Array(encryptedData).length);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedData), iv.length);

    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error("[SecureStorage] Encryption failed:", error);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypts data using AES-GCM
 */
async function decrypt(encryptedString: string): Promise<string> {
  try {
    const key = await getEncryptionKey();
    const combined = new Uint8Array(
      atob(encryptedString)
        .split("")
        .map((c) => c.charCodeAt(0))
    );

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);

    const decryptedData = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, encryptedData);

    return new TextDecoder().decode(decryptedData);
  } catch (error) {
    console.error("[SecureStorage] Decryption failed:", error);
    throw new Error("Failed to decrypt data");
  }
}

/**
 * Check if we're in a browser environment with crypto support
 */
function isSecureContextAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof crypto !== "undefined" &&
    typeof crypto.subtle !== "undefined"
  );
}

/**
 * Secure Storage class providing encrypted localStorage operations
 */
class SecureStorageService {
  private prefix = "ks_"; // kiniro secure

  /**
   * Store an encrypted value
   */
  async setItem<T>(key: string, value: T): Promise<void> {
    if (!isSecureContextAvailable()) {
      console.warn("[SecureStorage] Crypto not available, using plain storage");
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
      return;
    }

    try {
      const serialized = JSON.stringify(value);
      const encrypted = await encrypt(serialized);
      localStorage.setItem(this.prefix + key, encrypted);
    } catch (error) {
      console.error("[SecureStorage] Failed to set item:", error);
      // Fallback to plain storage if encryption fails
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
    }
  }

  /**
   * Retrieve and decrypt a value
   */
  async getItem<T>(key: string): Promise<T | null> {
    const stored = localStorage.getItem(this.prefix + key);
    if (!stored) return null;

    if (!isSecureContextAvailable()) {
      try {
        return JSON.parse(stored) as T;
      } catch {
        return null;
      }
    }

    try {
      const decrypted = await decrypt(stored);
      return JSON.parse(decrypted) as T;
    } catch {
      // If decryption fails, try parsing as plain JSON (migration case)
      try {
        return JSON.parse(stored) as T;
      } catch {
        return null;
      }
    }
  }

  /**
   * Remove an item
   */
  removeItem(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }

  /**
   * Clear all secure storage items
   */
  clear(): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  }

  /**
   * Check if a key exists
   */
  hasItem(key: string): boolean {
    return localStorage.getItem(this.prefix + key) !== null;
  }

  /**
   * Get all keys (without prefix)
   */
  keys(): string[] {
    const result: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.prefix)) {
        result.push(key.slice(this.prefix.length));
      }
    }
    return result;
  }
}

// Singleton instance
export const secureStorage = new SecureStorageService();

// Named exports for specific use cases
export { encrypt, decrypt, isSecureContextAvailable };

// Type-safe helper for common data patterns
export interface SecureUserData {
  isAdmin?: boolean;
  email?: string;
  displayName?: string;
  preferences?: Record<string, unknown>;
}

export async function setSecureUserData(data: SecureUserData): Promise<void> {
  await secureStorage.setItem("userData", data);
}

export async function getSecureUserData(): Promise<SecureUserData | null> {
  return secureStorage.getItem<SecureUserData>("userData");
}

export async function clearSecureUserData(): Promise<void> {
  secureStorage.removeItem("userData");
}
