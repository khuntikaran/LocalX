
import React from 'react';
import { FileConverter } from '../components/FileConverter';
import { Navbar } from '../components/Navbar';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, Cpu, Lock } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      
      <main className="flex-grow">
        <section className="py-12 sm:py-20">
          <div className="container px-4 mx-auto">
            <div className="max-w-3xl mx-auto text-center">
              <span className="inline-block px-3 py-1 text-sm font-medium bg-blue-50 text-blue-600 rounded-full mb-4 dark:bg-blue-900/30 dark:text-blue-400">
                Privacy-First File Conversion
              </span>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white animate-fade-up [animation-delay:200ms]">
                Convert Files Locally Without Privacy Concerns
              </h1>
              <p className="text-xl text-gray-600 mb-8 dark:text-gray-300 animate-fade-up [animation-delay:400ms]">
                Your files never leave your device. Fast, secure, and completely private.
              </p>
              <div className="flex flex-wrap justify-center gap-4 animate-fade-up [animation-delay:600ms]">
                <Button 
                  size="lg" 
                  className="rounded-full px-6"
                  onClick={() => {
                    document.getElementById('converter')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Start Converting
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="rounded-full px-6"
                  onClick={() => navigate('/pricing')}
                >
                  See Pricing
                </Button>
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-16 bg-white border-t border-b border-gray-100 dark:bg-gray-800 dark:border-gray-700">
          <div className="container px-4 mx-auto">
            <div className="grid md:grid-cols-3 gap-12">
              <FeatureCard 
                icon={<Shield className="h-8 w-8 text-primary" />}
                title="Privacy Focused"
                description="Your files never leave your device. All conversions happen locally in your browser."
              />
              <FeatureCard 
                icon={<Cpu className="h-8 w-8 text-primary" />}
                title="Fast Conversion"
                description="Convert your files within seconds using your device's processing power."
              />
              <FeatureCard 
                icon={<Lock className="h-8 w-8 text-primary" />}
                title="Secure & Free"
                description="No account required for basic conversions. Free to use with premium options available."
              />
            </div>
          </div>
        </section>
        
        <section id="converter" className="py-16">
          <div className="container px-4 mx-auto">
            <div className="max-w-lg mx-auto text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                Get Started With Your Conversion
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Drag and drop your file below to start the conversion process.
              </p>
            </div>
            
            <FileConverter />
          </div>
        </section>
      </main>
      
      <footer className="bg-gray-50 border-t border-gray-200 py-8 dark:bg-gray-900 dark:border-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center text-gray-500 text-sm dark:text-gray-400">
            <p>© {new Date().getFullYear()} ConvertX. All rights reserved.</p>
            <p className="mt-2">Your files never leave your device. Privacy-first, always.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => {
  return (
    <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl border border-gray-100 shadow-sm transition-all hover:shadow-md animate-fade-up dark:bg-gray-800/50 dark:border-gray-700">
      <div className="rounded-full p-3 bg-primary/10 mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  );
};

export default Index;
