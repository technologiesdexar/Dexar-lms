'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

export const HeroSection: React.FC = () => {
  return (
    <section
      id="hero-section"
      className="relative pt-[76px] sm:pt-[84px] pb-16 lg:pb-24 bg-gradient-to-b from-[#ffffff] via-[#f6f9fc] to-[#f0f4f3] overflow-hidden"
    >
      {/* Header Message / Announcement Bar below Navbar */}
      <div className="w-full bg-[#2563eb] text-white py-3 px-4 sm:px-6 relative z-20">
        <div className="max-w-[1380px] mx-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center text-sm sm:text-[15px]">
          <span className="font-medium text-white">
            Interested in enrolling in our courses? Contact us today for more information and to get started!
          </span>
          <Link
            href="/contact?subject=Course%20Enrollment"
            className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white text-[#2563eb] hover:bg-blue-50 font-semibold text-xs sm:text-sm shadow-sm transition-all duration-200 hover:scale-[1.02]"
          >
            <span>Contact Us</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Luminous Soft Periwinkle/Blue Ambient Glow Highlights (matching original image) */}
      <div className="absolute top-[8%] left-[32%] w-[680px] h-[520px] bg-[#dbe8fd]/55 rounded-full blur-[110px] pointer-events-none -translate-x-1/4" />
      <div className="absolute top-[30%] right-[8%] w-[500px] h-[480px] bg-[#e2ecfc]/40 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[0%] left-[5%] w-[420px] h-[400px] bg-[#eef4fd]/50 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-[1380px] mx-auto px-6 lg:px-12 pt-8 sm:pt-12 lg:pt-14 relative z-10">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">

          {/* LEFT COLUMN: Title, Subtitle, CTA & Bottom Badge - Aligned 100% straight to Dexar Logo */}
          <div className="lg:col-span-6 flex flex-col justify-between pt-2 pb-2">

            <div className="space-y-6 max-w-xl">
              {/* Main Title - Exact Geist Medium Weight (500), -0.04em Letter Spacing with Apple Gradient Accent */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-4xl sm:text-6xl lg:text-[70px] font-medium tracking-[-0.04em] leading-[1.06]"
              >
                <span className="text-[#0a2540]">Dexar Builds Skills</span>
                <br />
                <span className="bg-gradient-to-r from-[#0b2642] via-[#082DFFFF] to-[#0362F3FF] bg-clip-text text-transparent">
                  You Build Futures
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-[18px] text-[#475569] leading-[1.6em] max-w-md font-normal tracking-[-0.02em]"
              >
                Practical online courses designed to help you gain real-world experience and grow with confidence.
              </motion.p>

              {/* Primary CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="pt-2"
              >
                <Link
                  href="/contact?subject=Course%20Inquiry"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[16px] font-semibold shadow-sm transition-all duration-200 group"
                >
                  <span>Explore Course</span>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              </motion.div>
            </div>

            {/* Bottom Left Feature Card - Hidden on Mobile, Visible on Desktop (Animation Removed) */}
            <div className="mt-6 lg:mt-10 hidden md:block">
              <div className="w-[380px] max-w-[420px] rounded-[28px] sm:rounded-[20px] bg-white p-6 sm:p-7 shadow-sm transition-shadow hover:shadow-md">
                {/* Outlined Pill Badge */}
                <div className="inline-flex items-center gap-3.5 p-1.5 pr-6 rounded-full border border-black bg-white">
                  <div className="w-10 h-10 rounded-full bg-[#2563eb] text-white flex items-center justify-center flex-shrink-0">
                    <Image
                      src="/images/KJck1JDuzs97QGPmCQI6RvVMH4.svg"
                      alt="Icon"
                      width={20}
                      height={20}
                      className="w-5 h-5 object-contain"
                    />
                  </div>
                  <span className="text-[15px] sm:text-[16px] font-normal text-[#0f172a]">
                    Built for real growth.
                  </span>
                </div>

                {/* Descriptive Text */}
                <p className="mt-7 sm:mt-8 text-[17px] sm:text-[18px] text-[#2d3748] font-normal leading-[1.4] tracking-[-0.01em]">
                  Follow guided learning paths<br />
                  from beginner to job-ready level.
                </p>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Bento Grid Layout - Expanded Width, Right Aligned straight to Contact Us Button */}
          <div className="lg:col-span-6 w-full grid grid-cols-1 sm:grid-cols-2 gap-4.5 items-start">

            {/* SUB-COLUMN 1 (Left Side of Bento) */}
            <div className="flex flex-col gap-4.5 w-full">

              {/* Card 1: Woman Portrait - Slightly Larger */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -4, transition: { duration: 0.25 } }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative h-[290px] sm:h-[350px] w-full rounded-[26px] overflow-hidden shadow-sm group cursor-pointer"
              >
                <Image
                  src="/images/hero.jpeg"
                  alt="Student portrait"
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  priority
                />
              </motion.div>

              {/* Card 2: Royal Blue Rating & Quote Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -4, transition: { duration: 0.25 } }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="bg-[#2563eb] text-white rounded-[20px] p-5 shadow-sm min-h-[160px] flex flex-col justify-between cursor-pointer"
              >
                <div className="flex items-center justify-between mb-10">
                  {/* Stacked Avatars Image */}
                  <div className="relative h-8 w-24">
                    <Image
                      src="/images/euVY22Pz2v7hL1ZV826nLEP9Erk.png"
                      alt="Student Avatars"
                      fill
                      sizes="96px"
                      className="object-contain object-left"
                    />
                  </div>

                  {/* Best Tag */}
                  <span className="px-4 py-2 rounded-full bg-white text-[#0f172a] font-semibold text-xs shadow-sm">
                    Best
                  </span>
                </div>

                <p className="text-[17px] text-white w-auto">
                  &quot;Hands-on lessons that helped me apply skills right away.&quot;
                </p>
              </motion.div>

              {/* Card 3: 62+ Courses Stat Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -4, transition: { duration: 0.25 } }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-[#0a2540] text-white rounded-[26px] p-6 shadow-sm flex flex-col justify-between cursor-pointer"
              >
                <div className="text-2xl sm:text-5xl tracking-tight mb-1 text-white">
                  10+
                </div>
                <p className="text-xs font-normal text-blue-100/80 leading-relaxed">
                  Courses built around real-world projects.
                </p>
              </motion.div>

            </div>

            {/* SUB-COLUMN 2 (Right Side of Bento) */}
            <div className="flex flex-col gap-4.5 w-full">

              {/* Card 4: Interactive Classrooms Card - Slightly Larger */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -4, transition: { duration: 0.25 } }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="relative h-[210px] w-full rounded-[26px] overflow-hidden shadow-sm group cursor-pointer"
              >
                <Image
                  src="/images/h3S6KrfozRShGj2T9x78eaX44nM.png"
                  alt="Interactive Classrooms"
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <h3 className="absolute bottom-5 left-5 right-5 text-white text-lg leading-tight">
                  Interactive Live Classes
                </h3>
              </motion.div>

              {/* Card 5: Hero Portrait - Larger Height to Align Bottom */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -4, transition: { duration: 0.25 } }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="relative h-[435px] sm:h-[450px] w-full rounded-[26px] overflow-hidden shadow-sm group bg-slate-900 cursor-pointer"
              >
                <Image
                  src="/images/hero-portrait.png"
                  alt="Dexar Student"
                  fill
                  priority
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
                  className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                />
              </motion.div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
