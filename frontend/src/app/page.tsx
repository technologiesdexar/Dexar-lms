import React from 'react';
import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/HeroSection';
import { CounterSection } from '@/components/CounterSection';
import { ProgramSection } from '@/components/ProgramSection';
import { FeatureSection } from '@/components/FeatureSection';
import { TestimonialSection } from '@/components/TestimonialSection';
import { PricingSection } from '@/components/PricingSection';
import { FaqSection } from '@/components/FaqSection';
import { Footer } from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#0f172a] antialiased selection:bg-[#2563eb] selection:text-white">
      <Navbar />
      <HeroSection />
      <CounterSection />
      <ProgramSection />
      <FeatureSection />
      <TestimonialSection />
      <PricingSection />
      <FaqSection />
      <Footer />
    </main>
  );
}
