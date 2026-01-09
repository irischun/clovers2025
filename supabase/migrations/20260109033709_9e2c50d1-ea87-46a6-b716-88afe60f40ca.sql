-- Enable pgcrypto extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a secure function to encrypt credentials using service role only
-- This uses a combination of user_id and a fixed salt as the encryption key
CREATE OR REPLACE FUNCTION encrypt_wordpress_credentials()
RETURNS TRIGGER AS $$
DECLARE
  encryption_key TEXT;
BEGIN
  -- Generate encryption key from user_id + fixed salt
  -- This ensures each user has unique encryption but doesn't require external key management
  encryption_key := encode(digest(NEW.user_id::text || 'clover_wp_salt_2024', 'sha256'), 'hex');
  
  -- Encrypt the app_password using AES
  NEW.app_password := encode(
    pgp_sym_encrypt(NEW.app_password, encryption_key),
    'base64'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create a function to decrypt credentials (only callable by service role)
CREATE OR REPLACE FUNCTION decrypt_wordpress_password(
  p_user_id UUID,
  p_encrypted_password TEXT
)
RETURNS TEXT AS $$
DECLARE
  encryption_key TEXT;
BEGIN
  encryption_key := encode(digest(p_user_id::text || 'clover_wp_salt_2024', 'sha256'), 'hex');
  
  RETURN pgp_sym_decrypt(
    decode(p_encrypted_password, 'base64'),
    encryption_key
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Revoke execute from public, only service role can call decrypt
REVOKE EXECUTE ON FUNCTION decrypt_wordpress_password(UUID, TEXT) FROM PUBLIC;

-- Add a flag to track if credentials are encrypted
ALTER TABLE public.wordpress_connections 
ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT false;

-- Create trigger to auto-encrypt on insert/update
DROP TRIGGER IF EXISTS encrypt_wp_credentials_trigger ON public.wordpress_connections;
CREATE TRIGGER encrypt_wp_credentials_trigger
  BEFORE INSERT OR UPDATE OF app_password ON public.wordpress_connections
  FOR EACH ROW
  WHEN (NEW.is_encrypted IS DISTINCT FROM true)
  EXECUTE FUNCTION encrypt_wordpress_credentials();

-- Update existing records to mark them for re-encryption on next update
-- (They will be re-encrypted when user saves new credentials)