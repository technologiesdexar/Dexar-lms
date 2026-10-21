'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

export const ProgramSection: React.FC = () => {
  const courses = [
    {
      id: 1,
      title: 'Ai Full Stack',
      description: 'Learn SEO, social media, paid ads, and content strategy.',
      icon: '/images/C0spVFqeSxshKpsy8nvuyGyMVlQ.svg',
    },
    {
      id: 2,
      title: 'Web Development',
      description: 'Build modern websites and scalable web applications.',
      icon: '/images/RknSH3mNlLcISFEudUQBEdriuvQ.svg',
    },
    {
      id: 3,
      title: 'All DSA',
      description: 'Analyze data and make smart data-driven decisions.',
      icon: '/images/QPdYKEZELgurryHoZGdn31OCec.svg',
    },
  ];

  return (
    <section id="program-section" className="py-20 lg:py-28 bg-[#f8fafc] relative overflow-hidden">
      <div id="course-section" className="absolute -top-20" />
      <div className="max-w-[1380px] mx-auto px-6 lg:px-12 relative z-10">

        {/* Section Header: Title Left, Subtitle Right */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-12 lg:mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl lg:text-[56px] font-medium text-[#0a2540] tracking-[-0.04em] leading-[1.08]"
          >
            Explore Our Career-<br />
            Focused Courses
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-base sm:text-lg text-[#475569] font-normal leading-relaxed max-w-sm lg:pt-3 tracking-[-0.01em]"
          >
            Choose from expertly designed programs built around practical, real-world skills.
          </motion.p>
        </div>

        {/* 3 Course Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {courses.map((course, idx) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.12 }}
              className="bg-[#eff6ff] hover:bg-[#dbeafe] transition-colors duration-300 rounded-[28px] p-8 lg:p-9 flex flex-col justify-between min-h-[380px] sm:min-h-[420px] border border-[#bfdbfe]/60 shadow-none group"
            >
              {/* Top: Blue Circle Icon */}
              <div className="w-[60px] h-[60px] sm:w-[64px] sm:h-[64px] rounded-full bg-[#2563eb] flex items-center justify-center flex-shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-105">
                <div className="relative w-8 h-8 flex items-center justify-center">
                  <Image
                    src={course.icon}
                    alt={course.title}
                    width={32}
                    height={32}
                    className="w-full h-full object-contain filter brightness-0 invert"
                  />
                </div>
              </div>

              {/* Bottom: Title & Description */}
              <div className="pt-12">
                <h3 className="text-2xl sm:text-[28px] font-medium text-[#0a2540] tracking-[-0.03em] leading-snug mb-3">
                  {course.title}
                </h3>
                <p className="text-[15px] sm:text-base text-[#475569] font-normal leading-relaxed tracking-[-0.01em]">
                  {course.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
