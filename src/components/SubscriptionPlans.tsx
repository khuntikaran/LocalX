
import React from 'react';
import { CheckIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

export const SubscriptionPlans = () => {
  const { user, isAuthenticated, updateSubscription } = useAuth();
  const navigate = useNavigate();
  
  const handleFreePlan = async () => {
    if (!isAuthenticated) {
      navigate('/signup');
      return;
    }
    
    try {
      await updateSubscription('free');
      toast({
        title: "Subscription updated",
        description: "You are now on the Free plan",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update subscription",
        variant: "destructive",
      });
    }
  };
  
  const handlePremiumPlan = async () => {
    if (!isAuthenticated) {
      navigate('/signup', { state: { redirectTo: '/pricing', plan: 'premium' } });
      return;
    }
    
    try {
      await updateSubscription('premium');
      toast({
        title: "Subscription updated",
        description: "You are now on the Premium plan",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update subscription",
        variant: "destructive",
      });
    }
  };
  
  const isFreePlan = !user || user.subscription === 'free';
  const isPremiumPlan = user?.subscription === 'premium';
  
  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">
          Simple, Transparent Pricing
        </h2>
        <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-400">
          Choose the plan that's right for you
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8 animate-fade-up">
        {/* Free Plan */}
        <Card className={`relative overflow-hidden transition-all duration-200 ${
          isFreePlan ? 'ring-2 ring-primary shadow-lg' : ''
        }`}>
          {isFreePlan && (
            <div className="absolute top-0 right-0 -mt-1 -mr-1 px-3 py-1 bg-primary text-white text-xs font-medium rounded-bl-lg">
              Current Plan
            </div>
          )}
          <CardHeader>
            <CardTitle className="text-2xl">Free</CardTitle>
            <CardDescription>For occasional users</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-gray-500 ml-2">/month</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <PlanFeature included text="Local file conversion" />
              <PlanFeature included text="Privacy-focused" />
              <PlanFeature included text="Basic file formats" />
              <PlanFeature included={false} text="File size up to 5MB" />
              <PlanFeature included={false} text="Batch processing" />
              <PlanFeature included={false} text="Priority conversion" />
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleFreePlan} 
              variant={isFreePlan ? "outline" : "default"} 
              className="w-full"
              disabled={isFreePlan}
            >
              {isFreePlan ? 'Current Plan' : 'Get Started'}
            </Button>
          </CardFooter>
        </Card>
        
        {/* Premium Plan */}
        <Card className={`relative overflow-hidden transition-all duration-200 ${
          isPremiumPlan ? 'ring-2 ring-primary shadow-lg' : ''
        }`}>
          {isPremiumPlan && (
            <div className="absolute top-0 right-0 -mt-1 -mr-1 px-3 py-1 bg-primary text-white text-xs font-medium rounded-bl-lg">
              Current Plan
            </div>
          )}
          <CardHeader>
            <CardTitle className="text-2xl">Premium</CardTitle>
            <CardDescription>For power users</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">$5</span>
              <span className="text-gray-500 ml-2">/month</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <PlanFeature included text="Local file conversion" />
              <PlanFeature included text="Privacy-focused" />
              <PlanFeature included text="All file formats" />
              <PlanFeature included text="File size up to 100MB" />
              <PlanFeature included text="Batch processing" />
              <PlanFeature included text="Priority conversion" />
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handlePremiumPlan} 
              variant={isPremiumPlan ? "outline" : "default"} 
              className="w-full"
              disabled={isPremiumPlan}
            >
              {isPremiumPlan ? 'Current Plan' : 'Upgrade'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

type PlanFeatureProps = {
  included: boolean;
  text: string;
};

const PlanFeature = ({ included, text }: PlanFeatureProps) => {
  return (
    <li className="flex items-start">
      <div className="flex-shrink-0">
        {included ? (
          <CheckIcon className="h-5 w-5 text-green-500" />
        ) : (
          <XIcon className="h-5 w-5 text-gray-400" />
        )}
      </div>
      <p className={`ml-3 text-base ${included ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-500'}`}>
        {text}
      </p>
    </li>
  );
};
