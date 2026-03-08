'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Menu, BookOpen, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const menuItems = [
  { href: '/ejercicios', icon: BookOpen, label: 'Ejercicios' },
  { href: '/perfil', icon: User, label: 'Perfil' },
]

export function MenuSheet() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isActive = pathname === '/ejercicios' || pathname === '/perfil'

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className={cn(
            'flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[64px] rounded-lg transition-colors',
            isActive
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Menu className={cn('h-6 w-6', isActive && 'stroke-[2.5]')} />
          <span className="text-xs font-medium">Menú</span>
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-auto rounded-t-2xl">
        <SheetHeader className="pb-4">
          <SheetTitle>Menú</SheetTitle>
        </SheetHeader>
        <div className="space-y-2 pb-4">
          {menuItems.map((item) => {
            const isItemActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 p-4 rounded-lg transition-colors',
                  isItemActive
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-secondary'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </SheetContent>
    </Sheet>
  )
}
