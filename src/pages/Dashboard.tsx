
import React from 'react';
import { Navbar } from '../components/Navbar';
import { FileConverter } from '../components/FileConverter';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const Dashboard = () => {
  const { user, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  
  // If still loading, show a loading spinner
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-lg text-gray-600 dark:text-gray-300">Loading your profile...</p>
      </div>
    );
  }
  
  // If not authenticated, redirect to home
  if (!user) {
    navigate('/');
    return null;
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome, {user.name}!</h1>
              <p className="text-gray-600 mt-1 dark:text-gray-300">
                Subscription: <span className="font-medium capitalize">{user.subscription}</span>
              </p>
            </div>
            <Button variant="outline" onClick={logout}>Sign Out</Button>
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            Convert Files
          </h2>
          <FileConverter />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
