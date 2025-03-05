
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff } from 'lucide-react';

type AuthMode = 'login' | 'signup';

interface AuthFormProps {
  mode: AuthMode;
}

export const AuthForm = ({ mode }: AuthFormProps) => {
  const { login, signup, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({
    email: '',
    password: ''
  });
  
  const validateForm = () => {
    let valid = true;
    const newErrors = {
      email: '',
      password: ''
    };
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
      valid = false;
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
      valid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      valid = false;
    }
    
    setErrors(newErrors);
    return valid;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      if (mode === 'login') {
        await login(email, password);
        toast.success("Welcome back!", {
          description: "You have successfully logged in"
        });
      } else {
        await signup(email, password);
        toast.success("Account created", {
          description: "Your account has been successfully created"
        });
      }
      
      // Check if there's a redirect path stored in location state
      const state = location.state as { redirectTo?: string; plan?: string } | null;
      if (state?.redirectTo) {
        navigate(state.redirectTo, { state: { plan: state.plan } });
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      toast.error("Authentication failed", {
        description: error instanceof Error ? error.message : "An error occurred. Please try again."
      });
    }
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            {mode === 'login' ? 'Welcome to LocalX' : 'Create a LocalX account'}
          </CardTitle>
          <CardDescription>
            {mode === 'login' 
              ? 'Enter your credentials to login to your account' 
              : 'Enter your email and password to create your account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@example.com"
                disabled={isLoading}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className={`pr-10 ${errors.password ? 'border-red-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password}</p>
              )}
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
            onClick={handleSubmit}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === 'login' ? 'Logging in...' : 'Creating account...'}
              </>
            ) : (
              mode === 'login' ? 'Login' : 'Create account'
            )}
          </Button>
          
          <div className="text-center text-sm">
            {mode === 'login' ? (
              <p>
                Don't have an account?{' '}
                <Button 
                  variant="link" 
                  className="p-0 h-auto" 
                  onClick={() => navigate('/signup')}
                >
                  Sign up
                </Button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <Button 
                  variant="link" 
                  className="p-0 h-auto" 
                  onClick={() => navigate('/login')}
                >
                  Login
                </Button>
              </p>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};
