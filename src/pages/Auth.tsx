import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, MapPin, ArrowLeft, Sparkles } from 'lucide-react';

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signUpSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

type SignInFormData = z.infer<typeof signInSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;
type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp, loading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  });

  const forgotPasswordForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  useEffect(() => {
    const checkUserAndRedirect = async () => {
      if (user && !authLoading) {
        const { data: roles } = await supabase.rpc('get_user_roles', { _user_id: user.id });
        if (roles && roles.includes('admin')) {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }
    };
    checkUserAndRedirect();
  }, [user, authLoading, navigate]);

  const handleSignIn = async (data: SignInFormData) => {
    setIsSubmitting(true);
    const { error } = await signIn(data.email, data.password);
    setIsSubmitting(false);
    if (error) {
      toast.error(error.message.includes('Invalid login credentials') ? 'Invalid email or password' : error.message);
      return;
    }
    toast.success('Welcome back!');
  };

  const handleSignUp = async (data: SignUpFormData) => {
    setIsSubmitting(true);
    const { error } = await signUp(data.email, data.password, data.fullName);
    setIsSubmitting(false);
    if (error) {
      toast.error(error.message.includes('already registered') ? 'This email is already registered. Please sign in.' : error.message);
      return;
    }
    toast.success('Account created successfully!');
  };

  const handleForgotPassword = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setIsSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setResetEmailSent(true);
    toast.success('Password reset email sent!');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const AuthFormCard = ({ children, title, description }: { children: React.ReactNode; title: string; description: string }) => (
    <Card className="w-full max-w-md rounded-2xl shadow-premium border-0 bg-card">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl font-bold">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="gradient-hero px-6 pt-12 pb-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary-foreground/20 flex items-center justify-center mx-auto mb-3 animate-float">
            <MapPin className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-primary-foreground">Discover Ukhrul</h1>
        </div>
        <div className="flex-1 flex items-start justify-center px-4 -mt-8">
          <AuthFormCard title="Reset Password" description={resetEmailSent ? "Check your email for a reset link" : "Enter your email to receive a password reset link"}>
            {resetEmailSent ? (
              <div className="text-center space-y-4">
                <p className="text-muted-foreground text-sm">We've sent a password reset link to your email.</p>
                <Button variant="outline" className="w-full rounded-xl" onClick={() => { setShowForgotPassword(false); setResetEmailSent(false); }}>
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <Form {...forgotPasswordForm}>
                <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)} className="space-y-4">
                  <FormField control={forgotPasswordForm.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input placeholder="you@example.com" type="email" className="rounded-xl h-11" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full rounded-xl h-11 font-semibold" disabled={isSubmitting}>
                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : 'Send Reset Link'}
                  </Button>
                  <Button type="button" variant="ghost" className="w-full rounded-xl" onClick={() => setShowForgotPassword(false)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />Back to Sign In
                  </Button>
                </form>
              </Form>
            )}
          </AuthFormCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Gradient Header */}
      <div className="gradient-hero px-6 pt-12 pb-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary-foreground/20 flex items-center justify-center mx-auto mb-3 animate-float">
          <Sparkles className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-primary-foreground">Discover Ukhrul</h1>
        <p className="text-primary-foreground/70 text-sm mt-1">Shop, Explore & Travel Locally</p>
      </div>

      {/* Form Card */}
      <div className="flex-1 flex items-start justify-center px-4 -mt-8">
        <Card className="w-full max-w-md rounded-2xl shadow-premium border-0 bg-card">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold">Welcome</CardTitle>
            <CardDescription>Sign in to explore businesses, places, and events</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 rounded-xl h-11">
                <TabsTrigger value="signin" className="rounded-lg font-semibold">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="rounded-lg font-semibold">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="mt-6">
                <Form {...signInForm}>
                  <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                    <FormField control={signInForm.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl><Input placeholder="you@example.com" type="email" className="rounded-xl h-11" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={signInForm.control} name="password" render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Password</FormLabel>
                          <Button type="button" variant="link" className="px-0 h-auto font-normal text-xs" onClick={() => setShowForgotPassword(true)}>
                            Forgot password?
                          </Button>
                        </div>
                        <FormControl><Input placeholder="••••••••" type="password" className="rounded-xl h-11" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" className="w-full rounded-xl h-11 font-semibold shadow-premium" disabled={isSubmitting}>
                      {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</> : 'Sign In'}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="signup" className="mt-6">
                <Form {...signUpForm}>
                  <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                    <FormField control={signUpForm.control} name="fullName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl><Input placeholder="John Doe" className="rounded-xl h-11" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={signUpForm.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl><Input placeholder="you@example.com" type="email" className="rounded-xl h-11" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={signUpForm.control} name="password" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl><Input placeholder="••••••••" type="password" className="rounded-xl h-11" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={signUpForm.control} name="confirmPassword" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl><Input placeholder="••••••••" type="password" className="rounded-xl h-11" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" className="w-full rounded-xl h-11 font-semibold shadow-premium" disabled={isSubmitting}>
                      {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account...</> : 'Create Account'}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
