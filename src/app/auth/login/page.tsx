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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-slate-100 bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,black_50%,transparent_100%)]" />

      <Card className="w-full max-w-md relative shadow-card-elevated backdrop-blur-sm bg-white/95 border-0">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto mb-2">
            <div className="w-32 h-32 flex items-center justify-center mx-auto">
              <Image
                src="/logo.png"
                alt="Buhariwala Logistics Logo"
                width={128}
                height={128}
                className="object-contain"
              />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Welcome Back</CardTitle>
          <CardDescription className="text-muted-foreground">
            Sign in to <span className="font-semibold text-primary">Buhariwala Logistics</span> platform
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground font-medium">Username</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Enter your username"
                        className="h-12 bg-white border-2 border-border focus:border-primary transition-colors"
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
                    <FormLabel className="text-foreground font-medium">Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        className="h-12 bg-white border-2 border-border focus:border-primary transition-colors"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.formState.errors.root && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm font-medium text-destructive">
                  {form.formState.errors.root.message}
                </div>
              )}
              <Button
                type="submit"
                className="w-full h-12 button-shine bg-gradient-primary hover:shadow-card-hover transition-all duration-300 font-semibold text-base"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Signing in<span className="loading-dots"></span>
                  </span>
                ) : (
                  'Sign In'
                )}
              </Button>

              {/* Additional links */}
              <div className="text-center pt-4">
                <p className="text-sm text-muted-foreground">
                  <a href="#" className="font-medium text-primary hover:text-primary/80 transition-colors">Forgot password?</a>
                </p>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}