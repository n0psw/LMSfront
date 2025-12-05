import React from 'react'; // eslint-disable-line @typescript-eslint/no-unused-vars
import Header from '../components/landing/Header';
import HeroSection from '../components/landing/HeroSection';
import TestimonialsSection from '../components/landing/TestimonialsSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import AboutSection from '../components/landing/AboutSection';
import AudienceSection from '../components/landing/AudienceSection';
import BenefitsSection from '../components/landing/BenefitsSection';
import HowToStartSection from '../components/landing/HowToStartSection';
import Footer from '../components/landing/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <HeroSection />
        <TestimonialsSection />
        <AboutSection />
        <FeaturesSection />
        <BenefitsSection />
        <HowToStartSection />
      </main>
      <Footer />
    </div>
  );
}


