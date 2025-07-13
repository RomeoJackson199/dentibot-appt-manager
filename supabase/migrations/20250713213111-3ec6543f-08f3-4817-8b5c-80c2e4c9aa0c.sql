-- Create a new dentist entry for Romeo that will link him to Virginie's practice
-- First let's create a custom dentist entry that references Virginie's ID
INSERT INTO dentists (id, profile_id, specialization, license_number, is_active)
VALUES (
  '46067bae-18f6-4769-b8e4-be48cc18d273', -- Use Virginie's dentist ID
  (SELECT id FROM profiles WHERE email = 'romeojackson199@gmail.com'),
  'Pédodontiste',
  'LIC-VP2024',
  true
) ON CONFLICT (id) DO UPDATE SET
  profile_id = (SELECT id FROM profiles WHERE email = 'romeojackson199@gmail.com'),
  specialization = 'Pédodontiste',
  license_number = 'LIC-VP2024',
  is_active = true;