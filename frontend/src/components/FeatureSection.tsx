'use client';

import React from 'react';
import { motion } from 'framer-motion';

export const FeatureSection: React.FC = () => {
  const learningOutcomes = [
    {
      left: 'Structured, Ready-To-Use Curriculum',
      right: 'Practical, Skill-Based Training',
    },
    {
      left: 'Hands-On Project Experience',
      right: 'Industry-Relevant Skills Training',
    },
    {
      left: 'Real-World Case Studies',
      right: 'Clear Goals & Progress Milestones',
    },
    {
      left: 'Performance Tracking & Feedback',
      right: 'Industry-Relevant Knowledge',
    },
    {
      left: 'Flexible Learning Schedule',
      right: 'Learn at Your Own Pace',
    },
    {
      left: 'Career-Focused Assignments',
      right: 'Job-Ready Confidence',
    },
  ];

  return (
    <section id="feature-section" className="py-20 lg:py-28 bg-[#f8fafc] relative overflow-hidden">
      <div className="max-w-[1380px] mx-auto px-6 lg:px-12 relative z-10">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 lg:mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl lg:text-[56px] font-medium text-[#0a2540] tracking-[-0.04em] leading-[1.08] mb-5"
          >
            Skills That Prepare You<br />
            for Real Opportunities
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-base sm:text-lg text-[#475569] font-normal leading-relaxed max-w-xl mx-auto tracking-[-0.01em]"
          >
            Our programs are designed to help you build practical<br className="hidden sm:inline" />
            knowledge, apply real-world skills, and grow with confidence.
          </motion.p>
        </div>

        {/* Core Outcomes Container */}
        <div className="max-w-[1180px] mx-auto">

          {/* Column Headers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 mb-8 text-center">
            <motion.h3
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-2xl sm:text-[28px] font-medium text-[#0a2540] tracking-[-0.03em]"
            >
              Core Learning Outcomes
            </motion.h3>

            <motion.h3
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-2xl sm:text-[28px] font-medium text-[#0a2540] tracking-[-0.03em] hidden md:block"
            >
              Core Learning Outcomes
            </motion.h3>
          </div>

          {/* 6 Pairs Grid with Center Vertical Timeline Line & Dots */}
          <div className="relative">

            {/* Vertical Center Line (Desktop Only) */}
            <div className="hidden md:block absolute left-1/2 top-4 bottom-4 -translate-x-1/2 w-[2px] bg-[#0a2540]/25 z-0" />

            <div className="space-y-4 sm:space-y-5 relative z-10">
              {learningOutcomes.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.08 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-16 items-center relative"
                >
                  {/* Left Pill (Light Soft Blue / Off-White) */}
                  <div className="bg-[#eff6ff] hover:bg-[#dbeafe] transition-colors duration-200 rounded-[14px] sm:rounded-[16px] py-4.5 px-6 sm:px-8 text-center flex items-center justify-center min-h-[62px] sm:min-h-[68px] border border-[#bfdbfe]/60">
                    <span className="text-[#0a2540] font-medium text-base sm:text-[17px] tracking-[-0.01em]">
                      {item.left}
                    </span>
                  </div>

                  {/* Center Dot (Desktop Only) */}
                  <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#0a2540] border-[2px] border-[#f8fafc] z-20 items-center justify-center" />

                  {/* Right Pill (Vibrant Solid Royal Blue) */}
                  <div className="bg-[#2563eb] hover:bg-[#1d4ed8] transition-colors duration-200 rounded-[14px] sm:rounded-[16px] py-4.5 px-6 sm:px-8 text-center flex items-center justify-center min-h-[62px] sm:min-h-[68px] shadow-sm">
                    <span className="text-white font-semibold text-base sm:text-[17px] tracking-[-0.01em]">
                      {item.right}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
