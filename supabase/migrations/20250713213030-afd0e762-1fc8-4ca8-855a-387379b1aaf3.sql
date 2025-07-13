-- Get Romeo's profile details
-- Update Romeo's dentist record to match Virginie Pauwels' dentist data
UPDATE dentists 
SET 
  license_number = 'LIC-VP2024',
  specialization = 'Pédodontiste',
  is_active = true
WHERE profile_id = (
  SELECT id FROM profiles WHERE email = 'romeojackson199@gmail.com'
);

-- Alternative approach: Delete Romeo's separate dentist entry and link him to Virginie's dentist ID
-- This way Romeo will see Virginie's appointments and data
DELETE FROM dentists 
WHERE profile_id = (
  SELECT id FROM profiles WHERE email = 'romeojackson199@gmail.com'
);

-- Now insert a new dentist entry that uses Virginie's dentist ID
-- Actually, let's take a different approach - let's update Romeo's profile to reference Virginie's dentist practice