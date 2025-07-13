-- Update Romeo's dentist record to use Virginie's exact dentist ID
UPDATE dentists 
SET id = '46067bae-18f6-4769-b8e4-be48cc18d273'
WHERE profile_id = (
  SELECT id FROM profiles WHERE email = 'romeojackson199@gmail.com'
);