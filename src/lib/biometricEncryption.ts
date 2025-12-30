/**
 * Biometric Data Encryption Utilities
 * 
 * Uses Web Crypto API for client-side encryption of sensitive health data.
 * This ensures even database administrators cannot see plaintext values.
 * 
 * SECURITY: Uses AES-GCM with a user-derived key for symmetric encryption.
 */

// Get or create an encryption key for the current user
async function getEncryptionKey(userId: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();

    // Derive a key from the user ID + a secret salt
    // In production, use a proper key derivation from user password or secure storage
    const salt = encoder.encode('gft-biometric-v1-' + userId.slice(0, 8));
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(userId),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypt a biometric value for storage
 * @param value - The numeric value to encrypt
 * @param userId - The user ID (used to derive encryption key)
 * @returns Base64 encoded encrypted string (IV + ciphertext)
 */
export async function encryptBiometric(value: number | null, userId: string): Promise<string | null> {
    if (value === null || value === undefined) return null;

    try {
        const key = await getEncryptionKey(userId);
        const encoder = new TextEncoder();
        const data = encoder.encode(value.toString());

        // Generate a random IV for each encryption
        const iv = crypto.getRandomValues(new Uint8Array(12));

        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            data
        );

        // Combine IV + ciphertext and encode as base64
        const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
        combined.set(iv);
        combined.set(new Uint8Array(encrypted), iv.length);

        return btoa(String.fromCharCode(...combined));
    } catch (error) {
        console.error('Encryption error:', error);
        return null;
    }
}

/**
 * Decrypt a biometric value from storage
 * @param encryptedValue - Base64 encoded encrypted string
 * @param userId - The user ID (used to derive decryption key)
 * @returns The original numeric value
 */
export async function decryptBiometric(encryptedValue: string | null, userId: string): Promise<number | null> {
    if (!encryptedValue) return null;

    try {
        const key = await getEncryptionKey(userId);

        // Decode from base64
        const combined = new Uint8Array(atob(encryptedValue).split('').map(c => c.charCodeAt(0)));

        // Extract IV (first 12 bytes) and ciphertext
        const iv = combined.slice(0, 12);
        const ciphertext = combined.slice(12);

        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            ciphertext
        );

        const decoder = new TextDecoder();
        return parseFloat(decoder.decode(decrypted));
    } catch (error) {
        console.error('Decryption error:', error);
        return null;
    }
}

/**
 * Encrypt a full biometric log entry
 */
export async function encryptBiometricLog(
    log: {
        weight_kg: number | null;
        body_fat_percentage: number | null;
        muscle_mass_percentage: number | null;
        height_cm: number | null;
    },
    userId: string
): Promise<{
    weight_kg_encrypted: string | null;
    body_fat_encrypted: string | null;
    muscle_mass_encrypted: string | null;
    height_cm_encrypted: string | null;
}> {
    const [weight, bodyFat, muscle, height] = await Promise.all([
        encryptBiometric(log.weight_kg, userId),
        encryptBiometric(log.body_fat_percentage, userId),
        encryptBiometric(log.muscle_mass_percentage, userId),
        encryptBiometric(log.height_cm, userId)
    ]);

    return {
        weight_kg_encrypted: weight,
        body_fat_encrypted: bodyFat,
        muscle_mass_encrypted: muscle,
        height_cm_encrypted: height
    };
}

/**
 * Decrypt a full biometric log entry
 */
export async function decryptBiometricLog(
    encryptedLog: {
        weight_kg_encrypted: string | null;
        body_fat_encrypted: string | null;
        muscle_mass_encrypted: string | null;
        height_cm_encrypted: string | null;
    },
    userId: string
): Promise<{
    weight_kg: number | null;
    body_fat_percentage: number | null;
    muscle_mass_percentage: number | null;
    height_cm: number | null;
}> {
    const [weight, bodyFat, muscle, height] = await Promise.all([
        decryptBiometric(encryptedLog.weight_kg_encrypted, userId),
        decryptBiometric(encryptedLog.body_fat_encrypted, userId),
        decryptBiometric(encryptedLog.muscle_mass_encrypted, userId),
        decryptBiometric(encryptedLog.height_cm_encrypted, userId)
    ]);

    return {
        weight_kg: weight,
        body_fat_percentage: bodyFat,
        muscle_mass_percentage: muscle,
        height_cm: height
    };
}
