'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      id: 1,
      question: 'Who can enroll in Dexar courses?',
      answer: 'Anyone interested in building practical skills can enroll. Our courses are beginner-friendly and suitable for students and professionals.',
      icon: '/images/UxMRgEgwAUcz4FL1YsyWjhm5nCQ.svg',
    },
    {
      id: 2,
      question: 'Do I get a certificate after completion?',
      answer: 'Yes! Upon completing all modules and projects, you receive a shareable certificate of completion to highlight on LinkedIn and your resume.',
      icon: '/images/ScyFl6ngDxRQwuviVNxO2GDwsm0.svg',
    },
    {
      id: 3,
      question: 'Do I get lifetime access to the courses?',
      answer: 'Yes! Once enrolled, you receive lifetime access to all course materials, video lessons, resources, and all future curriculum updates.',
      icon: '/images/sN9zehLBeftWpbObgJXGaNS98w.svg',
    },
    {
      id: 4,
      question: 'Are the courses beginner friendly?',
      answer: 'Absolutely! All our courses start with core foundational principles before progressing into practical hands-on applications.',
      icon: '/images/UxMRgEgwAUcz4FL1YsyWjhm5nCQ.svg',
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq-section" className="py-20 lg:py-28 bg-[#f8fafc] relative overflow-hidden select-none">
      <div className="max-w-[1380px] mx-auto px-6 lg:px-12 relative z-10">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-stretch">

          {/* LEFT COLUMN: Section Title, Subtitle, & Contact Button */}
          <div className="lg:col-span-5 flex flex-col justify-between h-full min-h-[380px] lg:min-h-[460px] py-2">
            <div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-4xl sm:text-5xl lg:text-[56px] font-medium text-[#0a2540] tracking-[-0.04em] leading-[1.08] mb-6"
              >
                Frequently<br />
                Asked Questions
              </motion.h2>
            </div>

            {/* Bottom Subtitle & Contact Us CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="pt-8"
            >
              <p className="text-base text-[#475569] font-normal leading-relaxed max-w-xs tracking-[-0.01em] mb-5">
                Helpful information to<br />
                guide your learning journey.
              </p>

              <Link
                href="#contact"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[15px] font-semibold shadow-sm transition-all duration-200 group"
              >
                <span>Contact Us</span>
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </motion.div>
          </div>

          {/* RIGHT COLUMN: 2x2 FAQ Cards Grid */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
              {faqs.map((faq, idx) => {
                const isOpen = openIndex === idx;
                return (
                  <motion.div
                    key={faq.id}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    onClick={() => toggleFaq(idx)}
                    className={`rounded-[26px] p-7 sm:p-8 flex flex-col justify-between min-h-[260px] sm:min-h-[285px] cursor-pointer transition-all duration-300 ${isOpen
                        ? 'bg-[#eff6ff] border border-[#2563eb]/40 shadow-sm'
                        : 'bg-[#eff6ff]/60 hover:bg-[#eff6ff] border border-transparent'
                      }`}
                  >
                    {/* Top: Blue Outline Icon */}
                    <div className="w-9 h-9 relative mb-8 flex-shrink-0">
                      <Image
                        src={faq.icon}
                        alt="FAQ Icon"
                        fill
                        sizes="36px"
                        className="object-contain"
                      />
                    </div>

                    {/* Bottom: Question Title & Answer Paragraph */}
                    <div>
                      <h3 className="text-xl sm:text-2xl lg:text-[25px] font-medium text-[#0a2540] tracking-[-0.03em] leading-snug mb-3">
                        {faq.question}
                      </h3>

                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                          >
                            <p className="text-[14px] sm:text-[15px] text-[#475569] font-normal leading-relaxed pt-2 tracking-[-0.01em]">
                              {faq.answer}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                  </motion.div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
