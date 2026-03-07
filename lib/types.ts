export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  total_points: number
  created_at: string
  updated_at: string
}

export interface Exercise {
  id: string
  name: string
  muscle_group: string
  is_custom: boolean
  created_by: string | null
  created_at: string
}

export interface Workout {
  id: string
  user_id: string
  started_at: string
  completed_at: string | null
  notes: string | null
  total_volume: number
  points_earned: number
}

export interface WorkoutSet {
  id: string
  workout_id: string
  exercise_id: string
  set_number: number
  reps: number
  weight: number
  is_warmup: boolean
  created_at: string
  exercise?: Exercise
}

export interface WorkoutWithSets extends Workout {
  workout_sets: (WorkoutSet & { exercises: Exercise })[]
}

export interface ExerciseGroup {
  muscle_group: string
  exercises: Exercise[]
}

export interface WorkoutStats {
  totalWorkouts: number
  totalVolume: number
  totalSets: number
  thisWeekWorkouts: number
  streak: number
}
