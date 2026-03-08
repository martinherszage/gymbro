'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Check, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ActiveSet } from '@/lib/workout-store'

interface SetInputProps {
  set: ActiveSet
  onUpdate: (updates: Partial<ActiveSet>) => void
  onComplete: () => void
  onRemove: () => void
}

export function SetInput({ set, onUpdate, onComplete, onRemove }: SetInputProps) {
  const canComplete = set.reps !== null && set.weight !== null && set.reps > 0 && set.weight >= 0

  return (
    <div 
      className={cn(
        'grid grid-cols-12 gap-2 items-center p-2 rounded-lg transition-colors',
        set.completed ? 'bg-primary/10' : 'bg-secondary/50'
      )}
    >
      {/* Set number */}
      <div className="col-span-2">
        <span className={cn(
          'text-sm font-medium',
          set.completed ? 'text-primary' : 'text-muted-foreground'
        )}>
          {set.isWarmup ? 'C' : set.setNumber}
        </span>
      </div>

      {/* Weight input */}
      <div className="col-span-4">
        <Input
          type="number"
          inputMode="decimal"
          placeholder="0"
          value={set.weight ?? ''}
          onChange={(e) => onUpdate({ weight: e.target.value ? parseFloat(e.target.value) : null })}
          className={cn(
            'h-10 text-center text-base font-medium',
            set.completed && 'border-primary/50'
          )}
          disabled={set.completed}
        />
      </div>

      {/* Reps input */}
      <div className="col-span-4">
        <Input
          type="number"
          inputMode="numeric"
          placeholder="0"
          value={set.reps ?? ''}
          onChange={(e) => onUpdate({ reps: e.target.value ? parseInt(e.target.value) : null })}
          className={cn(
            'h-10 text-center text-base font-medium',
            set.completed && 'border-primary/50'
          )}
          disabled={set.completed}
        />
      </div>

      {/* Actions */}
      <div className="col-span-2 flex justify-end gap-1">
        {set.completed ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant={canComplete ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={onComplete}
            disabled={!canComplete}
          >
            <Check className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
