'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
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
import { 
  User, 
  Trophy, 
  Dumbbell, 
  TrendingUp, 
  Calendar,
  LogOut,
  Save
} from 'lucide-react'
import type { Profile } from '@/lib/types'

interface Stats {
  totalWorkouts: number
  totalVolume: number
  totalSets: number
  memberSince: string
}

export default function PerfilPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/auth/login')
      return
    }

    // Get profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileData) {
      setProfile(profileData)
      setDisplayName(profileData.display_name || '')
    }

    // Get stats
    const { data: workouts } = await supabase
      .from('workouts')
      .select('total_volume, workout_sets(id)')
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)

    const totalWorkouts = workouts?.length || 0
    const totalVolume = workouts?.reduce((sum, w) => sum + (w.total_volume || 0), 0) || 0
    const totalSets = workouts?.reduce((sum, w) => sum + (w.workout_sets?.length || 0), 0) || 0

    setStats({
      totalWorkouts,
      totalVolume: Math.round(totalVolume),
      totalSets,
      memberSince: new Date(user.created_at).toLocaleDateString('es-ES', {
        month: 'long',
        year: 'numeric'
      }),
    })

    setLoading(false)
  }

  async function handleSaveProfile() {
    if (!profile) return
    
    setSaving(true)
    const supabase = createClient()
    
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName })
      .eq('id', profile.id)

    if (!error) {
      setProfile({ ...profile, display_name: displayName })
    }
    setSaving(false)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const getInitials = (name: string | null) => {
    if (!name) return 'GB'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`
    }
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}k`
    }
    return volume.toString()
  }

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[60vh]">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="pt-2 flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
            {getInitials(profile?.display_name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">{profile?.display_name || 'Atleta'}</h1>
          <p className="text-muted-foreground">Miembro desde {stats?.memberSince}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{profile?.total_points || 0}</p>
              <p className="text-xs text-muted-foreground">Puntos</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Dumbbell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.totalWorkouts}</p>
              <p className="text-xs text-muted-foreground">Entrenamientos</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatVolume(stats?.totalVolume || 0)} kg</p>
              <p className="text-xs text-muted-foreground">Volumen total</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.totalSets}</p>
              <p className="text-xs text-muted-foreground">Series totales</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Profile */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Editar Perfil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="displayName">Nombre de Usuario</FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Tu nombre o apodo"
                />
                <Button 
                  onClick={handleSaveProfile} 
                  disabled={saving || displayName === profile?.display_name}
                >
                  {saving ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                </Button>
              </div>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Logout */}
      <Button 
        variant="outline" 
        className="w-full text-destructive hover:text-destructive"
        onClick={() => setShowLogoutDialog(true)}
      >
        <LogOut className="h-4 w-4 mr-2" />
        Cerrar Sesión
      </Button>

      {/* Logout Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar sesión?</AlertDialogTitle>
            <AlertDialogDescription>
              Tendrás que volver a iniciar sesión para acceder a tu cuenta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>
              Cerrar Sesión
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
