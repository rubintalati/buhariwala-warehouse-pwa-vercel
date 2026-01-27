'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { signInWithUsername } from '@/lib/custom-auth'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      const { user, error } = await signInWithUsername(data.username, data.password)
      if (error) {
        form.setError('root', {
          type: 'manual',
          message: error,
        })
      } else if (user) {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Login error:', error)
      form.setError('root', {
        type: 'manual',
        message: 'An error occurred during login',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 flex flex-col">
      {/* Mobile-first layout with proper spacing */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-sm space-y-8">

          {/* Logo and branding */}
          <div className="text-center space-y-6">
            <div className="mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="Buhariwala Logistics Logo"
                width={64}
                height={64}
                className="object-contain"
              />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">Welcome Back</h1>
              <p className="text-muted-foreground">
                Sign in to <span className="font-semibold text-primary">Buhariwala Logistics</span>
              </p>
            </div>
          </div>

          {/* Login form */}
          <Card className="mobile-card border-0 shadow-lg">
            <CardContent className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Enter your username"
                            className="mobile-input touch-target"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Enter your password"
                            className="mobile-input touch-target"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.formState.errors.root && (
                    <div className="status-error rounded-lg p-3 text-sm font-medium border">
                      {form.formState.errors.root.message}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full touch-target bg-[#800E13] text-white hover:bg-[#800E13]/90 font-medium"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Signing in...
                      </span>
                    ) : (
                      'Sign In'
                    )}
                  </Button>

                  <div className="text-center pt-2">
                    <Button variant="ghost" size="sm" className="text-sm text-muted-foreground">
                      Forgot password?
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Footer space for mobile */}
          <div className="text-center text-xs text-muted-foreground">
            Buhariwala Logistics © 2026
          </div>
        </div>
      </div>
    </div>
  )
}