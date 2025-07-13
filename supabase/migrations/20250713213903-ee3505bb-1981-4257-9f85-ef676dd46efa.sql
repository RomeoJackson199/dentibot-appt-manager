-- Delete Romeo's separate dentist record
DELETE FROM dentists 
WHERE profile_id = (
  SELECT id FROM profiles WHERE email = 'romeojackson199@gmail.com'
);

-- Now Romeo will be linked through the existing dentist record when we update the dashboard