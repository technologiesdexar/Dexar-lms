'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, User } from 'lucide-react';

export const TestimonialSection: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const testimonials = [
    {
      id: 1,
      headline: '"The lessons are practical and easy to follow."',
      body: '"Dexar helped me build real skills and confidence to start my career successfully and grow with clear direction."',
      name: 'Naveen',
      role: 'Full Stack Development Student',
      tags: ['Full Stack', 'Practical'],
    },
    {
      id: 2,
      headline: '"I built my first real-world project."',
      body: '"Dexar made web development simple with step-by-step lessons, real projects, and clear explanations that helped me learn faster."',
      name: 'Srinivas',
      role: 'Web Development Student',
      tags: ['Development', 'Coding'],
    },
    {
      id: 3,
      headline: '"Learned real problem-solving strategies."',
      body: '"The curriculum and practical examples were extremely relevant. I was able to build scalable solutions with confidence."',
      name: 'Prasanna',
      role: 'Data Science & Analytics Student',
      tags: ['Analytics', 'Logic'],
    },
    {
      id: 4,
      headline: '"Design & engineering principles explained clearly."',
      body: '"Mastered core development and real-time methodologies in weeks. Highly structured and rewarding learning experience."',
      name: 'Sai',
      role: 'AI & Cloud Computing Student',
      tags: ['AI / ML', 'Cloud'],
    },
  ];

  const current = testimonials[activeIndex];

  return (
    <section id="about" className="py-20 lg:py-28 bg-[#f8fafc] relative overflow-hidden select-none">
      
      {/* Background Crosshair Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #0a2540 1px, transparent 1px),
            linear-gradient(to bottom, #0a2540 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />

      {/* Grid Intersections Cross Plus Icons (+ Pattern) */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="max-w-[1380px] mx-auto h-full flex justify-between px-6 lg:px-12 relative">
          <span className="absolute top-12 left-8 text-[#0a2540] text-xs font-light">+</span>
          <span className="absolute top-12 left-1/3 text-[#0a2540] text-xs font-light">+</span>
          <span className="absolute top-12 right-12 text-[#0a2540] text-xs font-light">+</span>
          <span className="absolute bottom-12 left-8 text-[#0a2540] text-xs font-light">+</span>
          <span className="absolute bottom-12 right-12 text-[#0a2540] text-xs font-light">+</span>
        </div>
      </div>

      <div className="max-w-[1380px] mx-auto px-6 lg:px-12 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

          {/* LEFT COLUMN: Title, Subtitle, & CTA Button */}
          <div className="lg:col-span-5 flex flex-col justify-between h-full min-h-[380px] lg:min-h-[460px] py-2">
            <div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-4xl sm:text-5xl lg:text-[56px] font-medium text-[#0a2540] tracking-[-0.04em] leading-[1.08] mb-6"
              >
                What Our<br />
                Learners Say
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-base sm:text-lg text-[#475569] font-normal leading-relaxed max-w-sm tracking-[-0.01em]"
              >
                Real feedback from students who completed courses on Dexar.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="pt-8"
            >
              <Link
                href="/contact?subject=Course%20Inquiry"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[15px] font-semibold shadow-sm transition-all duration-200 group"
              >
                <span>Explore Course</span>
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </motion.div>
          </div>

          {/* RIGHT COLUMN: Dark Royal Blue Carousel Card */}
          <div className="lg:col-span-7 flex justify-center lg:justify-end">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="w-full max-w-[650px] bg-[#0a2540] text-white rounded-[28px] sm:rounded-[32px] p-8 sm:p-10 lg:p-12 shadow-2xl flex flex-col justify-between min-h-[460px] sm:min-h-[480px] relative overflow-hidden border border-[#1d4ed8]/30"
            >

              {/* Animated Testimonial Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.35 }}
                  className="flex flex-col justify-between h-full flex-1"
                >
                  {/* Top Quote Block */}
                  <div>
                    <h3 className="text-2xl sm:text-3xl lg:text-[32px] font-medium text-white tracking-[-0.03em] leading-snug mb-5">
                      {current.headline}
                    </h3>
                    <p className="text-base sm:text-[17px] text-[#94a3b8] font-normal leading-relaxed max-w-lg tracking-[-0.01em]">
                      {current.body}
                    </p>
                  </div>

                  {/* Center Horizontal Divider Line */}
                  <div className="w-full h-[1px] bg-white/10 my-8 sm:my-10" />

                  {/* Bottom Profile Details + Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">

                    {/* Left: Avatar Photo + Quote Mark + Name/Role */}
                    <div className="flex items-center gap-4">
                      {/* Avatar Profile Icon */}
                      <div className="w-[84px] h-[84px] sm:w-[96px] sm:h-[96px] rounded-[20px] overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#2563eb] to-[#1e40af] flex items-center justify-center border border-white/15 shadow-md">
                        <User className="w-10 h-10 sm:w-12 sm:h-12 text-white/95 stroke-[1.8]" />
                      </div>

                      {/* Quote Mark & Details */}
                      <div className="space-y-1">
                        {/* White Double Quote Icon */}
                        <div className="text-2xl text-white font-serif leading-none opacity-90">
                          ““
                        </div>
                        <h4 className="text-xl sm:text-[22px] font-medium text-white tracking-[-0.02em] leading-tight">
                          {current.name}
                        </h4>
                        <p className="text-sm text-[#94a3b8] font-normal tracking-[-0.01em]">
                          {current.role}
                        </p>
                      </div>
                    </div>

                    {/* Right: Carousel Pagination Dots & Tag Badges */}
                    <div className="flex flex-col items-start sm:items-end gap-5">
                      
                      {/* 2 Outlined Tag Badges */}
                      <div className="flex items-center gap-2">
                        {current.tags.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="px-3.5 py-1 rounded-full border border-white/20 text-white font-normal text-xs tracking-wide bg-white/5"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* 4 Pagination Dots */}
                      <div className="flex items-center gap-2 pt-1">
                        {testimonials.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveIndex(idx)}
                            aria-label={`Go to slide ${idx + 1}`}
                            className={`rounded-full transition-all duration-300 ${
                              activeIndex === idx
                                ? 'w-2.5 h-2.5 bg-white'
                                : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                            }`}
                          />
                        ))}
                      </div>

                    </div>

                  </div>

                </motion.div>
              </AnimatePresence>

            </motion.div>
          </div>

        </div>

      </div>
    </section>
  );
};
