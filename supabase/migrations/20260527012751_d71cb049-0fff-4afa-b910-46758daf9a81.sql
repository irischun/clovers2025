-- 1. Add missing UPDATE policy on media_files (users can update their own rows).
CREATE POLICY "Users can update their own media"
  ON public.media_files
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Lock down SECURITY DEFINER functions: revoke EXECUTE from public/anon/authenticated.
--    These are only intended to be invoked from triggers or trusted edge functions.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.encrypt_wordpress_credentials() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.decrypt_wordpress_password(uuid, text) FROM PUBLIC, anon, authenticated;

-- 3. app_secrets: belt-and-braces — ensure no privileges to anon/authenticated.
REVOKE ALL ON TABLE public.app_secrets FROM PUBLIC, anon, authenticated;