'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Plus, ChevronRight } from 'lucide-react'
import type { Exercise } from '@/lib/types'

interface ExerciseSelectorProps {
  open: boolean
  onClose: () => void
  onSelect: (exercise: Exercise) => void
}

const muscleGroups = [
  'Todos',
  'Pecho',
  'Espalda',
  'Hombros',
  'Bíceps',
  'Tríceps',
  'Piernas',
  'Core',
]

export function ExerciseSelector({ open, onClose, onSelect }: ExerciseSelectorProps) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('Todos')

  useEffect(() => {
    if (open) {
      loadExercises()
    }
  }, [open])

  async function loadExercises() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .or(`is_custom.eq.false,created_by.eq.${user?.id}`)
      .order('muscle_group')
      .order('name')

    if (!error && data) {
      setExercises(data)
    }
    setLoading(false)
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

  const handleSelect = (exercise: Exercise) => {
    onSelect(exercise)
  }

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
        <SheetHeader className="pb-4">
          <SheetTitle>Seleccionar Ejercicio</SheetTitle>
        </SheetHeader>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar ejercicio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Muscle Group Tabs */}
        <Tabs value={selectedGroup} onValueChange={setSelectedGroup} className="mb-4">
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
            {muscleGroups.map((group) => (
              <TabsTrigger key={group} value={group} className="flex-shrink-0">
                {group}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Exercise List */}
        <ScrollArea className="h-[calc(85vh-200px)]">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando ejercicios...
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron ejercicios
            </div>
          ) : selectedGroup === 'Todos' ? (
            // Grouped view
            Object.entries(groupedExercises).map(([group, groupExercises]) => (
              <div key={group} className="mb-6">
                <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-1">
                  {group}
                </h3>
                <div className="space-y-1">
                  {groupExercises.map((exercise) => (
                    <ExerciseItem
                      key={exercise.id}
                      exercise={exercise}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            // Flat view for single group
            <div className="space-y-1">
              {filteredExercises.map((exercise) => (
                <ExerciseItem
                  key={exercise.id}
                  exercise={exercise}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

function ExerciseItem({ 
  exercise, 
  onSelect 
}: { 
  exercise: Exercise
  onSelect: (exercise: Exercise) => void 
}) {
  return (
    <button
      onClick={() => onSelect(exercise)}
      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors text-left"
    >
      <div>
        <p className="font-medium text-foreground">{exercise.name}</p>
        {exercise.is_custom && (
          <span className="text-xs text-primary">Personalizado</span>
        )}
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </button>
  )
}
