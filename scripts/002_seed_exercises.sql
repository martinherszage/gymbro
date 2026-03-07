-- Seed pre-defined exercises
-- Chest exercises
insert into public.exercises (name, muscle_group, equipment, is_custom, user_id) values
('Bench Press', 'Chest', 'Barbell', false, null),
('Incline Bench Press', 'Chest', 'Barbell', false, null),
('Decline Bench Press', 'Chest', 'Barbell', false, null),
('Dumbbell Bench Press', 'Chest', 'Dumbbell', false, null),
('Incline Dumbbell Press', 'Chest', 'Dumbbell', false, null),
('Dumbbell Fly', 'Chest', 'Dumbbell', false, null),
('Cable Fly', 'Chest', 'Cable', false, null),
('Push-Up', 'Chest', 'Bodyweight', false, null),
('Chest Dip', 'Chest', 'Bodyweight', false, null);

-- Back exercises
insert into public.exercises (name, muscle_group, equipment, is_custom, user_id) values
('Deadlift', 'Back', 'Barbell', false, null),
('Barbell Row', 'Back', 'Barbell', false, null),
('Dumbbell Row', 'Back', 'Dumbbell', false, null),
('Pull-Up', 'Back', 'Bodyweight', false, null),
('Chin-Up', 'Back', 'Bodyweight', false, null),
('Lat Pulldown', 'Back', 'Cable', false, null),
('Seated Cable Row', 'Back', 'Cable', false, null),
('T-Bar Row', 'Back', 'Barbell', false, null),
('Face Pull', 'Back', 'Cable', false, null);

-- Shoulders exercises
insert into public.exercises (name, muscle_group, equipment, is_custom, user_id) values
('Overhead Press', 'Shoulders', 'Barbell', false, null),
('Dumbbell Shoulder Press', 'Shoulders', 'Dumbbell', false, null),
('Arnold Press', 'Shoulders', 'Dumbbell', false, null),
('Lateral Raise', 'Shoulders', 'Dumbbell', false, null),
('Front Raise', 'Shoulders', 'Dumbbell', false, null),
('Rear Delt Fly', 'Shoulders', 'Dumbbell', false, null),
('Upright Row', 'Shoulders', 'Barbell', false, null),
('Shrugs', 'Shoulders', 'Dumbbell', false, null);

-- Legs exercises
insert into public.exercises (name, muscle_group, equipment, is_custom, user_id) values
('Squat', 'Legs', 'Barbell', false, null),
('Front Squat', 'Legs', 'Barbell', false, null),
('Leg Press', 'Legs', 'Machine', false, null),
('Lunges', 'Legs', 'Dumbbell', false, null),
('Romanian Deadlift', 'Legs', 'Barbell', false, null),
('Leg Curl', 'Legs', 'Machine', false, null),
('Leg Extension', 'Legs', 'Machine', false, null),
('Calf Raise', 'Legs', 'Machine', false, null),
('Bulgarian Split Squat', 'Legs', 'Dumbbell', false, null),
('Hip Thrust', 'Legs', 'Barbell', false, null);

-- Arms exercises
insert into public.exercises (name, muscle_group, equipment, is_custom, user_id) values
('Barbell Curl', 'Arms', 'Barbell', false, null),
('Dumbbell Curl', 'Arms', 'Dumbbell', false, null),
('Hammer Curl', 'Arms', 'Dumbbell', false, null),
('Preacher Curl', 'Arms', 'Barbell', false, null),
('Tricep Pushdown', 'Arms', 'Cable', false, null),
('Skull Crusher', 'Arms', 'Barbell', false, null),
('Tricep Dip', 'Arms', 'Bodyweight', false, null),
('Overhead Tricep Extension', 'Arms', 'Dumbbell', false, null),
('Close-Grip Bench Press', 'Arms', 'Barbell', false, null);

-- Core exercises
insert into public.exercises (name, muscle_group, equipment, is_custom, user_id) values
('Plank', 'Core', 'Bodyweight', false, null),
('Crunch', 'Core', 'Bodyweight', false, null),
('Russian Twist', 'Core', 'Bodyweight', false, null),
('Leg Raise', 'Core', 'Bodyweight', false, null),
('Cable Crunch', 'Core', 'Cable', false, null),
('Ab Wheel Rollout', 'Core', 'Other', false, null),
('Hanging Knee Raise', 'Core', 'Bodyweight', false, null);
