'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const navLinks = [
    { name: 'Home', href: '/#hero-section' },
    { name: 'Course', href: '/#course-section' },
    { name: 'Pricing', href: '/#pricing-section' },
    { name: 'About Us', href: '/#about' },
    { name: 'Contact', href: '/contact' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[100] border-none transition-all duration-300 ${scrolled || mobileMenuOpen
        ? 'bg-white py-3.5'
        : 'bg-transparent py-5 sm:py-6'
        }`}
    >
      <div className="max-w-[1380px] mx-auto px-6 lg:px-12 flex items-center justify-between">

        {/* Brand Logo - Far Left */}
        <Link href="/#hero-section" className="flex items-center gap-2 group">
          <Image
            src="/images/dexar-logo-clean.png"
            alt="Dexar Technologies Logo"
            width={150}
            height={38}
            priority
            className={`w-auto object-contain transition-all duration-300 group-hover:scale-[1.02] ${scrolled ? 'h-8 sm:h-9' : 'h-9 sm:h-9'}`}
          />
        </Link>

        {/* Right Group: Nav Links + Get Started Button Grouped Together */}
        <div className="hidden md:flex items-center gap-10 lg:gap-20">
          <nav className="flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-[18px] font-medium text-[#0f172a] hover:text-[#2563eb] transition-colors tracking-tight"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[15px] font-semibold shadow-sm hover:shadow-md transition-all duration-200 group"
            >
              <span>Get Started</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-xl hover:bg-gray-100 text-[#0f172a] transition-colors"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white/95 backdrop-blur-xl border border-gray-200 px-6 py-6 flex flex-col gap-4 shadow-xl overflow-hidden mt-4 rounded-2xl"
          >
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-semibold text-[#0f172a] hover:text-[#2563eb] py-2"
              >
                {link.name}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-center font-semibold flex items-center justify-center gap-2 shadow-md mt-2"
            >
              <span>Get Started</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

    </header>
  );
};
