-- Update the handle_new_user function to also create dentist entries
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Insert profile first
  INSERT INTO public.profiles (
    user_id,
    email,
    first_name,
    last_name,
    role
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient')::user_role
  );

  -- If the user is a dentist, create a dentist entry
  IF COALESCE(NEW.raw_user_meta_data->>'role', 'patient') = 'dentist' THEN
    INSERT INTO public.dentists (profile_id, is_active)
    SELECT id, true 
    FROM public.profiles 
    WHERE user_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$function$;