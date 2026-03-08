'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { Dumbbell } from 'lucide-react'

export default function SignUpPage() {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
          `${window.location.origin}/dashboard`,
        data: {
          display_name: displayName,
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/auth/verificar')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-primary rounded-xl">
          <Dumbbell className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">GymBro</h1>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Crear Cuenta</CardTitle>
          <CardDescription>
            Únete a GymBro y comienza a registrar tus entrenamientos
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="displayName">Nombre de Usuario</FieldLabel>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Tu nombre o apodo"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  autoComplete="username"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Correo Electrónico</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </Field>
            </FieldGroup>
            {error && (
              <p className="text-sm text-destructive mt-4">{error}</p>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
              {loading ? <Spinner className="mr-2" /> : null}
              {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              ¿Ya tienes cuenta?{' '}
              <Link href="/auth/login" className="text-primary hover:underline font-medium">
                Inicia Sesión
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
