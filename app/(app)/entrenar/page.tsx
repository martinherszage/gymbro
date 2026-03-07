'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useWorkoutStore } from '@/lib/workout-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Plus, Clock, Check, X, Trash2, Dumbbell } from 'lucide-react'
import { ExerciseSelector } from '@/components/exercise-selector'
import { SetInput } from '@/components/set-input'
import type { Exercise } from '@/lib/types'

export default function EntrenarPage() {
  const router = useRouter()
  const { 
    activeWorkout, 
    startWorkout, 
    addSet, 
    updateSet, 
    removeSet, 
    completeSet,
    clearWorkout, 
    setWorkoutId 
  } = useWorkoutStore()
  
  const [showExerciseSelector, setShowExerciseSelector] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showFinishDialog, setShowFinishDialog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [elapsedTime, setElapsedTime] = useState('00:00')

  // Timer effect
  useEffect(() => {
    if (!activeWorkout) return

    const updateTimer = () => {
      const now = new Date()
      const started = new Date(activeWorkout.startedAt)
      const diff = Math.floor((now.getTime() - started.getTime()) / 1000)
      const mins = Math.floor(diff / 60)
      const secs = diff % 60
      setElapsedTime(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [activeWorkout])

  const handleStartWorkout = () => {
    startWorkout()
  }

  const handleAddExercise = (exercise: Exercise) => {
    addSet(exercise)
    setShowExerciseSelector(false)
  }

  const handleFinishWorkout = async () => {
    if (!activeWorkout) return
    
    const completedSets = activeWorkout.sets.filter(s => s.completed && s.reps && s.weight)
    if (completedSets.length === 0) {
      alert('Completa al menos una serie antes de finalizar')
      return
    }

    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/auth/login')
      return
    }

    try {
      // Calculate total volume
      const totalVolume = completedSets.reduce((sum, s) => {
        return sum + (s.reps || 0) * (s.weight || 0)
      }, 0)

      // Points: 10 per completed set + bonus for volume
      const pointsEarned = completedSets.length * 10 + Math.floor(totalVolume / 100)

      // Create workout
      const { data: workout, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          user_id: user.id,
          started_at: activeWorkout.startedAt.toISOString(),
          completed_at: new Date().toISOString(),
          total_volume: totalVolume,
          points_earned: pointsEarned,
        })
        .select()
        .single()

      if (workoutError) throw workoutError

      // Create sets
      const setsToInsert = completedSets.map((s) => ({
        workout_id: workout.id,
        exercise_id: s.exercise.id,
        set_number: s.setNumber,
        reps: s.reps!,
        weight: s.weight!,
        is_warmup: s.isWarmup,
      }))

      const { error: setsError } = await supabase
        .from('workout_sets')
        .insert(setsToInsert)

      if (setsError) throw setsError

      // Update user points
      await supabase.rpc('increment_points', { 
        user_id: user.id, 
        points: pointsEarned 
      }).catch(() => {
        // RPC might not exist, try direct update
        supabase
          .from('profiles')
          .update({ total_points: supabase.rpc('add', { a: 'total_points', b: pointsEarned }) })
          .eq('id', user.id)
      })

      clearWorkout()
      router.push('/dashboard')
    } catch (error) {
      console.error('Error saving workout:', error)
      alert('Error al guardar el entrenamiento')
    } finally {
      setSaving(false)
      setShowFinishDialog(false)
    }
  }

  const handleCancelWorkout = () => {
    clearWorkout()
    setShowCancelDialog(false)
  }

  // Group sets by exercise
  const exerciseGroups = activeWorkout?.sets.reduce((groups, set) => {
    const key = set.exercise.id
    if (!groups[key]) {
      groups[key] = {
        exercise: set.exercise,
        sets: [],
      }
    }
    groups[key].sets.push(set)
    return groups
  }, {} as Record<string, { exercise: Exercise; sets: typeof activeWorkout.sets }>) || {}

  if (!activeWorkout) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-6">
          <div className="p-6 bg-primary/10 rounded-full w-fit mx-auto">
            <Dumbbell className="h-16 w-16 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-2">¿Listo para entrenar?</h1>
            <p className="text-muted-foreground">
              Inicia un nuevo entrenamiento y registra tus ejercicios
            </p>
          </div>
          <Button size="lg" className="h-14 px-8 text-lg" onClick={handleStartWorkout}>
            <Plus className="mr-2 h-6 w-6" />
            Iniciar Entrenamiento
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Entrenamiento</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="font-mono">{elapsedTime}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowCancelDialog(true)}
          >
            <X className="h-4 w-4 mr-1" />
            Cancelar
          </Button>
          <Button 
            size="sm"
            onClick={() => setShowFinishDialog(true)}
            disabled={activeWorkout.sets.filter(s => s.completed).length === 0}
          >
            <Check className="h-4 w-4 mr-1" />
            Finalizar
          </Button>
        </div>
      </div>

      {/* Exercise Groups */}
      {Object.values(exerciseGroups).map(({ exercise, sets }) => (
        <Card key={exercise.id} className="bg-card">
          <CardContent className="p-4">
            <div className="mb-3">
              <h3 className="font-semibold text-foreground">{exercise.name}</h3>
              <p className="text-sm text-muted-foreground">{exercise.muscle_group}</p>
            </div>
            
            {/* Sets header */}
            <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground mb-2 px-1">
              <div className="col-span-2">Serie</div>
              <div className="col-span-4 text-center">Kg</div>
              <div className="col-span-4 text-center">Reps</div>
              <div className="col-span-2"></div>
            </div>

            {/* Sets */}
            <div className="space-y-2">
              {sets.map((set) => (
                <SetInput
                  key={set.id}
                  set={set}
                  onUpdate={(updates) => updateSet(set.id, updates)}
                  onComplete={() => completeSet(set.id)}
                  onRemove={() => removeSet(set.id)}
                />
              ))}
            </div>

            {/* Add set button */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full mt-3 text-primary"
              onClick={() => addSet(exercise)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar Serie
            </Button>
          </CardContent>
        </Card>
      ))}

      {/* Add Exercise Button */}
      <Button 
        variant="outline" 
        className="w-full h-14"
        onClick={() => setShowExerciseSelector(true)}
      >
        <Plus className="h-5 w-5 mr-2" />
        Agregar Ejercicio
      </Button>

      {/* Exercise Selector Sheet */}
      <ExerciseSelector
        open={showExerciseSelector}
        onClose={() => setShowExerciseSelector(false)}
        onSelect={handleAddExercise}
      />

      {/* Cancel Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar entrenamiento?</AlertDialogTitle>
            <AlertDialogDescription>
              Se perderán todos los datos de este entrenamiento. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelWorkout} className="bg-destructive text-destructive-foreground">
              Cancelar Entrenamiento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Finish Dialog */}
      <AlertDialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Finalizar entrenamiento?</AlertDialogTitle>
            <AlertDialogDescription>
              Se guardarán {activeWorkout.sets.filter(s => s.completed).length} series completadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Continuar</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinishWorkout} disabled={saving}>
              {saving ? 'Guardando...' : 'Finalizar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
