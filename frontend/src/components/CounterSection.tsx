'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight, Plus } from 'lucide-react';

export const CounterSection: React.FC = () => {
  return (
    <section className="pt-8 pb-20 lg:pt-12 lg:pb-28 bg-[#f8fafc] relative overflow-hidden">
      <div className="max-w-[1380px] mx-auto px-6 lg:px-12 relative z-10">

        {/* Grid Container - items-start aligns Title top edge 100% straight to Photo top edge */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">

          {/* LEFT COLUMN: Title, Subtitle & Button */}
          <div className="lg:col-span-6 space-y-6 pt-1">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-4xl sm:text-5xl lg:text-[60px] font-medium text-[#0a2540] tracking-[-0.04em] leading-[1.08]"
            >
              Learning Built <br />
              for Real Careers
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-base sm:text-lg text-[#475569] leading-relaxed max-w-md font-normal tracking-[-0.01em]"
            >
              Dexar is a modern online learning platform focused on practical, skill-based education.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="pt-2"
            >
              <Link
                href="#program-section"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[15px] font-semibold shadow-sm transition-all duration-200 group"
              >
                <span>Explore Programs</span>
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </motion.div>
          </div>

          {/* RIGHT COLUMN: Dark Blue Frame Card with Student Photo & Overlays */}
          <div className="lg:col-span-6 relative flex justify-center lg:justify-end">

            {/* Outer Wrapper Container - overflow-visible allows floating card to sit smoothly on the left without getting cropped */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative w-full max-w-[530px] aspect-[1062/1052] rounded-[32px] bg-[#0a2540] shadow-lg"
            >
              {/* Inner Photo Frame with rounded border & overflow-hidden */}
              <div className="absolute inset-0 rounded-[32px] overflow-hidden">
                <Image
                  src="/images/feature1.jpeg"
                  alt="Student in plaid shirt"
                  fill
                  loading="lazy"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 530px"
                  className="object-cover object-center"
                />
              </div>

              {/* LEFT FLOATING OVERLAY: 5 Star Rating Card - Blue Theme (Hidden on Mobile) */}
              <div className="hidden sm:flex absolute -left-[70px] sm:-left-[90px] lg:-left-[105px] top-1/2 -translate-y-1/2 bg-[#f0f6ff] rounded-[22px] p-4 shadow-xl border border-white/80 z-30 flex-col items-center gap-[15px] select-none">

                {/* Top Section: Stars + Avatars Image Wrapper */}
                <div className="flex flex-col items-center gap-6">

                  {/* 5 Blue Star Squares (4 full blue + 1 half blue) */}
                  <div className="flex items-center gap-[4px]">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="relative w-[30px] h-[30px] flex-shrink-0">
                        <svg width="30" height="30" viewBox="0 0 30 30" fill="none" className="w-full h-full">
                          <path fill="#2563eb" d="M0 0h30v30H0z" />
                          <path fill="#fff" d="M14.334 6.049c.21-.645 1.122-.645 1.332 0l1.646 5.068a.7.7 0 0 0 .666.484h5.33c.677 0 .96.867.41 1.266L19.409 16a.7.7 0 0 0-.255.783L20.8 21.85c.21.645-.529 1.181-1.077.783L15.41 19.5a.7.7 0 0 0-.822 0l-4.312 3.132c-.548.399-1.286-.138-1.077-.783l1.647-5.068a.7.7 0 0 0-.254-.783L6.28 12.867c-.548-.399-.266-1.266.412-1.266h5.329a.7.7 0 0 0 .665-.484z" />
                        </svg>
                      </div>
                    ))}
                    <div className="relative w-[30px] h-[30px] flex-shrink-0">
                      <svg width="30" height="30" viewBox="0 0 30 30" fill="none" className="w-full h-full">
                        <path fill="#2563eb" d="M0 0h30v30H0z" />
                        <path fill="#DFDFDF" d="M15 0h15v30H15z" />
                        <path fill="#fff" d="M14.334 6.049c.21-.645 1.122-.645 1.332 0l1.646 5.068a.7.7 0 0 0 .666.484h5.33c.677 0 .96.867.41 1.266L19.409 16a.7.7 0 0 0-.255.783L20.8 21.85c.21.645-.529 1.181-1.077.783L15.41 19.5a.7.7 0 0 0-.822 0l-4.312 3.132c-.548.399-1.286-.138-1.077-.783l1.647-5.068a.7.7 0 0 0-.254-.783L6.28 12.867c-.548-.399-.266-1.266.412-1.266h5.329a.7.7 0 0 0 .665-.484z" />
                      </svg>
                    </div>
                  </div>

                  {/* Avatars Stacked Image (130px x 46px exact Framer asset) */}
                  <div className="relative w-[130px] h-[46px]">
                    <Image
                      src="/images/4LGPNk5h5gj6hUlwmjZrIIunQc.png"
                      alt="User Avatars"
                      fill
                      sizes="130px"
                      className="object-cover"
                      priority
                    />
                  </div>

                </div>

                {/* Bottom Section: Blue Star + 4.9 Average Rating */}
                <div className="flex items-center gap-[6px]">
                  <div className="w-[22px] h-[22px] flex-shrink-0 text-[#2563eb]">
                    <svg viewBox="0 0 22 22" className="w-full h-full fill-current">
                      <path d="M11 1.833l2.87 5.815 6.418.933-4.644 4.527 1.096 6.392L11 16.483l-5.74 3.017 1.096-6.392L1.712 8.581l6.418-.933L11 1.833z" />
                    </svg>
                  </div>
                  <span className="font-bold text-[17px] text-[#0f172a] tracking-tight leading-none">4.9</span>
                  <span className="font-medium text-[15px] text-[#0f172a] tracking-tight leading-none">Average Rating</span>
                </div>

              </div>

              {/* BOTTOM RIGHT FLOATING OVERLAY: 3 White Skill Pills */}
              <div className="absolute right-5 bottom-6 flex flex-col items-end gap-2.5 z-20">
                <span className="bg-white/95 backdrop-blur-md text-[#0a2540] font-semibold text-xs px-4.5 py-2.5 rounded-full shadow-md border border-gray-100/80">
                  Ai Full Stack
                </span>
                <span className="bg-white/95 backdrop-blur-md text-[#0a2540] font-semibold text-xs px-4.5 py-2.5 rounded-full shadow-md border border-gray-100/80">
                  Web Development
                </span>
                <span className="bg-white/95 backdrop-blur-md text-[#0a2540] font-semibold text-xs px-4.5 py-2.5 rounded-full shadow-md border border-gray-100/80">
                  All DSA
                </span>
              </div>

            </motion.div>

          </div>

        </div>

      </div>
    </section>
  );
};
