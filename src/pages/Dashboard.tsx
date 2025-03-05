
import React, { useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { FileConverter } from '../components/FileConverter';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const Dashboard = () => {
  const { user, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // If we're not loading and there's no user, redirect to home
    if (!isLoading && !user) {
      toast.error('Please log in to access the dashboard');
      navigate('/');
    }
  }, [isLoading, user, navigate]);
  
  // If still loading, show a loading spinner
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-sky-50 to-white">
        <Loader2 className="h-10 w-10 text-sky-500 animate-spin mb-4" />
        <p className="text-lg text-sky-700">Loading your profile...</p>
      </div>
    );
  }
  
  // If not authenticated, don't render anything while redirecting
  if (!user) {
    return null;
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-sky-50 to-white">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl border border-sky-100 p-6 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-sky-800">Welcome, {user.name}!</h1>
              <p className="text-sky-600 mt-1">
                Subscription: <span className="font-medium capitalize">{user.subscription}</span>
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={logout}
              className="border-sky-200 text-sky-700 hover:bg-sky-50"
            >
              Sign Out
            </Button>
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-sky-800">
            Convert Files
          </h2>
          <FileConverter />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
