import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, Dumbbell } from 'lucide-react'

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-primary rounded-xl">
          <Dumbbell className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">GymBro</h1>
      </div>

      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto p-4 bg-primary/10 rounded-full w-fit mb-4">
            <Mail className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Revisa tu Correo</CardTitle>
          <CardDescription className="text-base">
            Te hemos enviado un enlace de verificación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Haz clic en el enlace que te enviamos para activar tu cuenta y comenzar a usar GymBro.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button asChild variant="outline" className="w-full">
            <Link href="/auth/login">
              Volver a Iniciar Sesión
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
