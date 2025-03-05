
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const Signup = () => {
  const { signup, isLoading } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
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
    
    setLocalLoading(true);
    
    try {
      await signup(email, password);
      
      toast.success("Account created", {
        description: "Your account has been successfully created"
      });
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Signup error:', error);
    } finally {
      setLocalLoading(false);
    }
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-b from-sky-50 to-white">
      <Card className="w-full max-w-md shadow-xl border-sky-100">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-sky-700">
            Create a LocalX account
          </CardTitle>
          <CardDescription className="text-sky-600">
            Enter your email and password to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sky-700">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@example.com"
                disabled={localLoading || isLoading}
                className={`border-sky-200 focus-visible:ring-sky-400 ${errors.email ? 'border-red-500' : ''}`}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sky-700">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={localLoading || isLoading}
                className={`border-sky-200 focus-visible:ring-sky-400 ${errors.password ? 'border-red-500' : ''}`}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password}</p>
              )}
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            type="submit" 
            className="w-full bg-sky-500 hover:bg-sky-600 text-white" 
            disabled={localLoading || isLoading}
            onClick={handleSubmit}
          >
            {localLoading || isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </Button>
          
          <div className="text-center text-sm">
            <p className="text-sky-600">
              Already have an account?{' '}
              <Button 
                variant="link" 
                className="p-0 h-auto text-sky-700 hover:text-sky-800" 
                onClick={() => navigate('/login')}
              >
                Login
              </Button>
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Signup;
