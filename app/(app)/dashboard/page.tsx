import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dumbbell, Flame, Trophy, TrendingUp, Plus } from 'lucide-react'
import Link from 'next/link'

async function getStats(userId: string) {
  const supabase = await createClient()
  
  // Get total workouts
  const { count: totalWorkouts } = await supabase
    .from('workouts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .not('completed_at', 'is', null)

  // Get total volume
  const { data: volumeData } = await supabase
    .from('workouts')
    .select('total_volume')
    .eq('user_id', userId)
    .not('completed_at', 'is', null)
  
  const totalVolume = volumeData?.reduce((sum, w) => sum + (w.total_volume || 0), 0) || 0

  // Get this week's workouts
  const startOfWeek = new Date()
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  const { count: weekWorkouts } = await supabase
    .from('workouts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .not('completed_at', 'is', null)
    .gte('completed_at', startOfWeek.toISOString())

  // Get profile for points
  const { data: profile } = await supabase
    .from('profiles')
    .select('total_points, display_name')
    .eq('id', userId)
    .single()

  return {
    totalWorkouts: totalWorkouts || 0,
    totalVolume: Math.round(totalVolume),
    weekWorkouts: weekWorkouts || 0,
    totalPoints: profile?.total_points || 0,
    displayName: profile?.display_name || 'Atleta',
  }
}

async function getRecentWorkouts(userId: string) {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('workouts')
    .select(`
      id,
      started_at,
      completed_at,
      total_volume,
      points_earned,
      workout_sets (
        id,
        exercises (name)
      )
    `)
    .eq('user_id', userId)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(3)

  return data || []
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const [stats, recentWorkouts] = await Promise.all([
    getStats(user.id),
    getRecentWorkouts(user.id),
  ])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    })
  }

  const formatVolume = (volume: number) => {
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}k`
    }
    return volume.toString()
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="pt-2">
        <p className="text-muted-foreground text-sm">Hola,</p>
        <h1 className="text-2xl font-bold text-foreground">{stats.displayName}</h1>
      </div>

      {/* Quick Start Button */}
      <Button asChild size="lg" className="w-full h-14 text-lg gap-3">
        <Link href="/entrenar">
          <Plus className="h-6 w-6" />
          Iniciar Entrenamiento
        </Link>
      </Button>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Dumbbell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalWorkouts}</p>
                <p className="text-xs text-muted-foreground">Entrenamientos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Flame className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.weekWorkouts}</p>
                <p className="text-xs text-muted-foreground">Esta semana</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatVolume(stats.totalVolume)}</p>
                <p className="text-xs text-muted-foreground">Kg totales</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalPoints}</p>
                <p className="text-xs text-muted-foreground">Puntos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Workouts */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Entrenamientos Recientes</h2>
          <Link href="/historial" className="text-sm text-primary hover:underline">
            Ver todo
          </Link>
        </div>

        {recentWorkouts.length === 0 ? (
          <Card className="bg-card">
            <CardContent className="p-6 text-center">
              <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                Aún no tienes entrenamientos registrados
              </p>
              <Button asChild variant="link" className="mt-2">
                <Link href="/entrenar">Comienza ahora</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentWorkouts.map((workout) => {
              const exercises = [...new Set(
                workout.workout_sets?.map((s: { exercises: { name: string } | null }) => s.exercises?.name).filter(Boolean)
              )]
              return (
                <Link key={workout.id} href={`/historial/${workout.id}`}>
                  <Card className="bg-card hover:bg-secondary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">
                            {formatDate(workout.completed_at!)}
                          </p>
                          <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {exercises.slice(0, 2).join(', ')}
                            {exercises.length > 2 && ` +${exercises.length - 2}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-primary">
                            {formatVolume(workout.total_volume)} kg
                          </p>
                          <p className="text-xs text-muted-foreground">
                            +{workout.points_earned} pts
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
