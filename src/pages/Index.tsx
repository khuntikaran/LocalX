
import React from 'react';
import { FileConverter } from '../components/FileConverter';
import { Navbar } from '../components/Navbar';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, Cpu, Lock } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-sky-50 to-white">
      <Navbar />
      
      <main className="flex-grow">
        <section className="py-12 sm:py-20">
          <div className="container px-4 mx-auto">
            <div className="max-w-3xl mx-auto text-center">
              <span className="inline-block px-3 py-1 text-sm font-medium bg-sky-100 text-sky-700 rounded-full mb-4">
                Privacy-First File Conversion
              </span>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-sky-800 animate-fade-up [animation-delay:200ms]">
                Convert Files Locally Without Privacy Concerns
              </h1>
              <p className="text-xl text-sky-600 mb-8 animate-fade-up [animation-delay:400ms]">
                Your files never leave your device. Fast, secure, and completely private.
              </p>
              <div className="flex flex-wrap justify-center gap-4 animate-fade-up [animation-delay:600ms]">
                <Button 
                  size="lg" 
                  className="rounded-full px-6 bg-sky-500 hover:bg-sky-600 text-white"
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
                  className="rounded-full px-6 border-sky-200 text-sky-700 hover:bg-sky-50"
                  onClick={() => navigate('/pricing')}
                >
                  See Pricing
                </Button>
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-16 bg-white border-t border-b border-sky-100">
          <div className="container px-4 mx-auto">
            <div className="grid md:grid-cols-3 gap-12">
              <FeatureCard 
                icon={<Shield className="h-8 w-8 text-sky-500" />}
                title="Privacy Focused"
                description="Your files never leave your device. All conversions happen locally in your browser."
              />
              <FeatureCard 
                icon={<Cpu className="h-8 w-8 text-sky-500" />}
                title="Fast Conversion"
                description="Convert your files within seconds using your device's processing power."
              />
              <FeatureCard 
                icon={<Lock className="h-8 w-8 text-sky-500" />}
                title="Secure & Free"
                description="No account required for basic conversions. Free to use with premium options available."
              />
            </div>
          </div>
        </section>
        
        <section id="converter" className="py-16">
          <div className="container px-4 mx-auto">
            <div className="max-w-lg mx-auto text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-sky-800">
                Get Started With Your Conversion
              </h2>
              <p className="text-sky-600">
                Drag and drop your file below to start the conversion process.
              </p>
            </div>
            
            <FileConverter />
          </div>
        </section>
      </main>
      
      <footer className="bg-sky-50 border-t border-sky-100 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center text-sky-600 text-sm">
            <p>© {new Date().getFullYear()} LocalX. All rights reserved.</p>
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
    <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl border border-sky-100 shadow-sm transition-all hover:shadow-md animate-fade-up dark:bg-sky-50/50">
      <div className="rounded-full p-3 bg-sky-100 mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2 text-sky-800">{title}</h3>
      <p className="text-sky-600">{description}</p>
    </div>
  );
};

export default Index;
