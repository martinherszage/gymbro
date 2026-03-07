import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Clock, Dumbbell, TrendingUp, Trophy } from 'lucide-react'
import Link from 'next/link'

async function getWorkout(workoutId: string, userId: string) {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('workouts')
    .select(`
      *,
      workout_sets (
        *,
        exercises (*)
      )
    `)
    .eq('id', workoutId)
    .eq('user_id', userId)
    .single()

  return data
}

export default async function WorkoutDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const workout = await getWorkout(id, user.id)
  
  if (!workout) {
    notFound()
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    })
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getDuration = (started: string, completed: string) => {
    const start = new Date(started)
    const end = new Date(completed)
    const diff = Math.floor((end.getTime() - start.getTime()) / 1000 / 60)
    if (diff < 60) return `${diff} minutos`
    const hours = Math.floor(diff / 60)
    const mins = diff % 60
    return `${hours}h ${mins}m`
  }

  // Group sets by exercise
  const exerciseGroups = workout.workout_sets?.reduce((groups: Record<string, typeof workout.workout_sets>, set: { exercises: { id: string; name: string; muscle_group: string } | null }) => {
    if (!set.exercises) return groups
    const key = set.exercises.id
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(set)
    return groups
  }, {} as Record<string, typeof workout.workout_sets>) || {}

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <Button asChild variant="ghost" size="icon">
          <Link href="/historial">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold capitalize">{formatDate(workout.completed_at!)}</h1>
          <p className="text-sm text-muted-foreground">{formatTime(workout.completed_at!)}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold">
                {getDuration(workout.started_at, workout.completed_at!)}
              </p>
              <p className="text-xs text-muted-foreground">Duración</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Dumbbell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold">{workout.workout_sets?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Series</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold">{workout.total_volume.toLocaleString()} kg</p>
              <p className="text-xs text-muted-foreground">Volumen total</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold">+{workout.points_earned}</p>
              <p className="text-xs text-muted-foreground">Puntos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exercises */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Ejercicios</h2>
        <div className="space-y-3">
          {Object.entries(exerciseGroups).map(([exerciseId, sets]) => {
            const exercise = (sets as Array<{ exercises: { name: string; muscle_group: string } }>)[0]?.exercises
            if (!exercise) return null
            
            return (
              <Card key={exerciseId} className="bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{exercise.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{exercise.muscle_group}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 text-xs text-muted-foreground px-1">
                      <span>Serie</span>
                      <span className="text-center">Peso</span>
                      <span className="text-right">Reps</span>
                    </div>
                    {(sets as Array<{ set_number: number; weight: number; reps: number; is_warmup: boolean }>).map((set, index) => (
                      <div 
                        key={index} 
                        className="grid grid-cols-3 py-2 px-1 rounded bg-secondary/50"
                      >
                        <span className="text-sm font-medium">
                          {set.is_warmup ? 'C' : set.set_number}
                        </span>
                        <span className="text-sm text-center">{set.weight} kg</span>
                        <span className="text-sm text-right">{set.reps}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Notes */}
      {workout.notes && (
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{workout.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
