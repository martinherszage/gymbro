import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { History, ChevronRight, Calendar } from 'lucide-react'
import Link from 'next/link'

async function getWorkouts(userId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('workouts')
    .select(`
      id,
      started_at,
      ended_at,
      notes,
      workout_sets (
        id,
        reps,
        weight_kg,
        exercises (name, muscle_group)
      )
    `)
    .eq('user_id', userId)
    .not('ended_at', 'is', null)
    .order('ended_at', { ascending: false })

  return data || []
}

export default async function HistorialPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const workouts = await getWorkouts(user.id)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    })
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getDuration = (started: string, ended: string) => {
    const start = new Date(started)
    const end = new Date(ended)
    const diff = Math.floor((end.getTime() - start.getTime()) / 1000 / 60)
    return `${diff} min`
  }

  const calculateTotalVolume = (sets: any[]) => {
    return sets?.reduce((sum, set) => {
      return sum + ((set.reps || 0) * (set.weight_kg || 0))
    }, 0) || 0
  }

  // Group workouts by date
  const groupedWorkouts = workouts.reduce((groups, workout) => {
    const date = new Date(workout.ended_at!).toDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(workout)
    return groups
  }, {} as Record<string, typeof workouts>)

  return (
    <div className="p-4 space-y-6">
      <div className="pt-2">
        <h1 className="text-2xl font-bold">Historial</h1>
        <p className="text-muted-foreground">Tus entrenamientos anteriores</p>
      </div>

      {workouts.length === 0 ? (
        <Empty>
          <EmptyMedia variant="icon">
            <History className="h-10 w-10" />
          </EmptyMedia>
          <EmptyTitle>Sin entrenamientos</EmptyTitle>
          <EmptyDescription>
            Cuando completes tu primer entrenamiento, aparecerá aquí.
          </EmptyDescription>
        </Empty>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedWorkouts).map(([date, dateWorkouts]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-medium text-muted-foreground capitalize">
                  {formatDate(dateWorkouts[0].ended_at!)}
                </h2>
              </div>
              <div className="space-y-2">
                {dateWorkouts.map((workout) => {
                  const exercises = [...new Set(
                    workout.workout_sets?.map((s: { exercises: { name: string } | null }) =>
                      s.exercises?.name
                    ).filter(Boolean)
                  )]
                  const muscleGroups = [...new Set(
                    workout.workout_sets?.map((s: { exercises: { muscle_group: string } | null }) =>
                      s.exercises?.muscle_group
                    ).filter(Boolean)
                  )]
                  const totalVolume = calculateTotalVolume(workout.workout_sets || [])

                  return (
                    <Link key={workout.id} href={`/historial/${workout.id}`}>
                      <Card className="bg-card hover:bg-secondary/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-foreground">
                                  {formatTime(workout.ended_at!)}
                                </p>
                                <span className="text-xs text-muted-foreground">
                                  {getDuration(workout.started_at, workout.ended_at!)}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {muscleGroups.slice(0, 3).join(', ')}
                              </p>
                              <p className="text-xs text-muted-foreground truncate mt-1">
                                {exercises.slice(0, 3).join(', ')}
                                {exercises.length > 3 && ` +${exercises.length - 3}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="font-semibold text-primary">
                                  {totalVolume.toLocaleString()} kg
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {workout.workout_sets?.length} series
                                </p>
                              </div>
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
