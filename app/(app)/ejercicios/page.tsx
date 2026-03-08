'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { Search, Plus, Dumbbell } from 'lucide-react'
import type { Exercise } from '@/lib/types'

const muscleGroups = [
  'Pecho',
  'Espalda',
  'Hombros',
  'Bíceps',
  'Tríceps',
  'Piernas',
  'Core',
]

export default function EjerciciosPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('Todos')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newExercise, setNewExercise] = useState({ name: '', muscle_group: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadExercises()
  }, [])

  async function loadExercises() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .or(`is_custom.eq.false,user_id.eq.${user?.id}`)
      .order('muscle_group')
      .order('name')

    if (!error && data) {
      setExercises(data)
    }
    setLoading(false)
  }

  async function handleAddExercise() {
    if (!newExercise.name || !newExercise.muscle_group) return
    
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    const { data, error } = await supabase
      .from('exercises')
      .insert({
        name: newExercise.name,
        muscle_group: newExercise.muscle_group,
        is_custom: true,
        user_id: user.id,
      })
      .select()
      .single()

    if (!error && data) {
      setExercises([...exercises, data])
      setNewExercise({ name: '', muscle_group: '' })
      setShowAddDialog(false)
    }
    setSaving(false)
  }

  const filteredExercises = exercises.filter((exercise) => {
    const matchesSearch = exercise.name.toLowerCase().includes(search.toLowerCase())
    const matchesGroup = selectedGroup === 'Todos' || exercise.muscle_group === selectedGroup
    return matchesSearch && matchesGroup
  })

  const groupedExercises = filteredExercises.reduce((groups, exercise) => {
    const group = exercise.muscle_group
    if (!groups[group]) {
      groups[group] = []
    }
    groups[group].push(exercise)
    return groups
  }, {} as Record<string, Exercise[]>)

  const customExercises = exercises.filter(e => e.is_custom)
  const libraryExercises = exercises.filter(e => !e.is_custom)

  return (
    <div className="p-4 space-y-6">
      <div className="pt-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ejercicios</h1>
          <p className="text-muted-foreground">Biblioteca de ejercicios</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Nuevo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Ejercicio</DialogTitle>
              <DialogDescription>
                Crea un ejercicio personalizado para tu biblioteca.
              </DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Nombre</FieldLabel>
                <Input
                  id="name"
                  placeholder="Ej: Press Inclinado con Mancuernas"
                  value={newExercise.name}
                  onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="muscle_group">Grupo Muscular</FieldLabel>
                <Select
                  value={newExercise.muscle_group}
                  onValueChange={(value) => setNewExercise({ ...newExercise, muscle_group: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    {muscleGroups.map((group) => (
                      <SelectItem key={group} value={group}>
                        {group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleAddExercise} 
                disabled={saving || !newExercise.name || !newExercise.muscle_group}
              >
                {saving ? <Spinner className="mr-2" /> : null}
                Agregar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar ejercicio..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="biblioteca" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="biblioteca">
            Biblioteca ({libraryExercises.length})
          </TabsTrigger>
          <TabsTrigger value="personalizados">
            Personalizados ({customExercises.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="biblioteca" className="mt-4">
          {/* Muscle Group Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
            <Button
              variant={selectedGroup === 'Todos' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedGroup('Todos')}
            >
              Todos
            </Button>
            {muscleGroups.map((group) => (
              <Button
                key={group}
                variant={selectedGroup === group ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedGroup(group)}
              >
                {group}
              </Button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando ejercicios...
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedExercises)
                .filter(([_, exercises]) => exercises.some(e => !e.is_custom))
                .map(([group, groupExercises]) => (
                  <div key={group}>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                      {group}
                    </h3>
                    <div className="space-y-2">
                      {groupExercises
                        .filter(e => !e.is_custom)
                        .map((exercise) => (
                          <Card key={exercise.id} className="bg-card">
                            <CardContent className="p-4 flex items-center gap-3">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <Dumbbell className="h-5 w-5 text-primary" />
                              </div>
                              <span className="font-medium">{exercise.name}</span>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="personalizados" className="mt-4">
          {customExercises.length === 0 ? (
            <div className="text-center py-12">
              <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                Aún no tienes ejercicios personalizados
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Crear Ejercicio
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {customExercises
                .filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
                .map((exercise) => (
                  <Card key={exercise.id} className="bg-card">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Dumbbell className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{exercise.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {exercise.muscle_group}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
