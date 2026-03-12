-- Create a server-only secrets table (RLS enabled, no policies = no client access)
CREATE TABLE IF NOT EXISTS public.app_secrets (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_secrets ENABLE ROW LEVEL SECURITY;

-- Insert the encryption salt (generate a strong random one)
INSERT INTO public.app_secrets (key, value)
VALUES ('wp_encryption_salt', encode(gen_random_bytes(32), 'hex'))
ON CONFLICT (key) DO NOTHING;

-- Update encrypt function to read salt from app_secrets
CREATE OR REPLACE FUNCTION public.encrypt_wordpress_credentials()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  encryption_key TEXT;
  salt_value TEXT;
BEGIN
  SELECT value INTO salt_value FROM public.app_secrets WHERE key = 'wp_encryption_salt';
  IF salt_value IS NULL THEN
    RAISE EXCEPTION 'Encryption salt not configured';
  END IF;
  
  encryption_key := encode(digest(NEW.user_id::text || salt_value, 'sha256'), 'hex');
  
  NEW.app_password := encode(
    pgp_sym_encrypt(NEW.app_password, encryption_key),
    'base64'
  );
  
  RETURN NEW;
END;
$$;

-- Update decrypt function to read salt from app_secrets
CREATE OR REPLACE FUNCTION public.decrypt_wordpress_password(p_user_id uuid, p_encrypted_password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  encryption_key TEXT;
  salt_value TEXT;
BEGIN
  SELECT value INTO salt_value FROM public.app_secrets WHERE key = 'wp_encryption_salt';
  IF salt_value IS NULL THEN
    RAISE EXCEPTION 'Encryption salt not configured';
  END IF;
  
  encryption_key := encode(digest(p_user_id::text || salt_value, 'sha256'), 'hex');
  
  RETURN pgp_sym_decrypt(
    decode(p_encrypted_password, 'base64'),
    encryption_key
  );
END;
$$;

-- Re-encrypt existing passwords: decrypt with old salt, encrypt with new salt
DO $$
DECLARE
  r RECORD;
  old_key TEXT;
  new_key TEXT;
  new_salt TEXT;
  decrypted_pw TEXT;
BEGIN
  SELECT value INTO new_salt FROM public.app_secrets WHERE key = 'wp_encryption_salt';
  
  FOR r IN SELECT id, user_id, app_password, is_encrypted FROM public.wordpress_connections WHERE is_encrypted = true
  LOOP
    old_key := encode(digest(r.user_id::text || 'clover_wp_salt_2024', 'sha256'), 'hex');
    BEGIN
      decrypted_pw := pgp_sym_decrypt(decode(r.app_password, 'base64'), old_key);
    EXCEPTION WHEN OTHERS THEN
      CONTINUE;
    END;
    
    new_key := encode(digest(r.user_id::text || new_salt, 'sha256'), 'hex');
    UPDATE public.wordpress_connections 
    SET app_password = encode(pgp_sym_encrypt(decrypted_pw, new_key), 'base64')
    WHERE id = r.id;
  END LOOP;
END;
$$;