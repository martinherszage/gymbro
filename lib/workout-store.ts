import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Exercise } from './types'

export interface ActiveSet {
  id: string
  exercise: Exercise
  setNumber: number
  reps: number | null
  weight: number | null
  isWarmup: boolean
  completed: boolean
}

export interface ActiveWorkout {
  id: string | null
  startedAt: Date
  sets: ActiveSet[]
}

interface WorkoutStore {
  activeWorkout: ActiveWorkout | null
  startWorkout: () => void
  addSet: (exercise: Exercise) => void
  updateSet: (setId: string, updates: Partial<ActiveSet>) => void
  removeSet: (setId: string) => void
  completeSet: (setId: string) => void
  clearWorkout: () => void
  setWorkoutId: (id: string) => void
}

function generateId() {
  return Math.random().toString(36).substring(2, 15)
}

export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set, get) => ({
      activeWorkout: null,

      startWorkout: () => {
        set({
          activeWorkout: {
            id: null,
            startedAt: new Date(),
            sets: [],
          },
        })
      },

      addSet: (exercise: Exercise) => {
        const { activeWorkout } = get()
        if (!activeWorkout) return

        // Find existing sets for this exercise to get next set number and previous values
        const existingSets = activeWorkout.sets.filter(
          (s) => s.exercise.id === exercise.id && !s.isWarmup
        )
        const setNumber = existingSets.length + 1
        
        // Copy previous set values if available
        const lastSet = existingSets[existingSets.length - 1]

        const newSet: ActiveSet = {
          id: generateId(),
          exercise,
          setNumber,
          reps: lastSet?.reps ?? null,
          weight: lastSet?.weight ?? null,
          isWarmup: false,
          completed: false,
        }

        set({
          activeWorkout: {
            ...activeWorkout,
            sets: [...activeWorkout.sets, newSet],
          },
        })
      },

      updateSet: (setId: string, updates: Partial<ActiveSet>) => {
        const { activeWorkout } = get()
        if (!activeWorkout) return

        set({
          activeWorkout: {
            ...activeWorkout,
            sets: activeWorkout.sets.map((s) =>
              s.id === setId ? { ...s, ...updates } : s
            ),
          },
        })
      },

      removeSet: (setId: string) => {
        const { activeWorkout } = get()
        if (!activeWorkout) return

        const setToRemove = activeWorkout.sets.find((s) => s.id === setId)
        if (!setToRemove) return

        // Remove the set and renumber remaining sets for the same exercise
        const newSets = activeWorkout.sets
          .filter((s) => s.id !== setId)
          .map((s) => {
            if (s.exercise.id === setToRemove.exercise.id && !s.isWarmup && s.setNumber > setToRemove.setNumber) {
              return { ...s, setNumber: s.setNumber - 1 }
            }
            return s
          })

        set({
          activeWorkout: {
            ...activeWorkout,
            sets: newSets,
          },
        })
      },

      completeSet: (setId: string) => {
        const { activeWorkout, updateSet } = get()
        if (!activeWorkout) return

        const setToComplete = activeWorkout.sets.find((s) => s.id === setId)
        if (setToComplete) {
          updateSet(setId, { completed: !setToComplete.completed })
        }
      },

      clearWorkout: () => {
        set({ activeWorkout: null })
      },

      setWorkoutId: (id: string) => {
        const { activeWorkout } = get()
        if (!activeWorkout) return
        set({
          activeWorkout: {
            ...activeWorkout,
            id,
          },
        })
      },
    }),
    {
      name: 'gymbro-workout',
      partialize: (state) => ({
        activeWorkout: state.activeWorkout
          ? {
              ...state.activeWorkout,
              startedAt: state.activeWorkout.startedAt.toISOString(),
            }
          : null,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.activeWorkout?.startedAt) {
          state.activeWorkout.startedAt = new Date(state.activeWorkout.startedAt as unknown as string)
        }
      },
    }
  )
)
