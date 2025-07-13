-- First, let's update the existing user to be a dentist
UPDATE profiles 
SET role = 'dentist'
WHERE email = 'romeojackson199@gmail.com';

-- If the profile doesn't exist, let's check what profiles we have and create one if needed
-- We'll need to find the user_id from auth.users first