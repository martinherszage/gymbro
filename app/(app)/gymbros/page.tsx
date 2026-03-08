import { Card, CardContent } from '@/components/ui/card'
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { Users } from 'lucide-react'

export default function GymbrosPage() {
  return (
    <div className="p-4 space-y-6">
      <div className="pt-2">
        <h1 className="text-2xl font-bold">Gymbros</h1>
        <p className="text-muted-foreground">Tu comunidad fitness</p>
      </div>

      <Empty>
        <EmptyMedia variant="icon">
          <Users className="h-10 w-10" />
        </EmptyMedia>
        <EmptyTitle>Próximamente</EmptyTitle>
        <EmptyDescription>
          Conecta con amigos, comparte tus entrenamientos y compite por puntos.
        </EmptyDescription>
      </Empty>
    </div>
  )
}
