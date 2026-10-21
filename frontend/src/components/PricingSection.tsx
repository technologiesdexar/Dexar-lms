'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight, Check, Crown, BookOpen } from 'lucide-react';

export const PricingSection: React.FC = () => {
  const plans = [
    {
      name: 'Monthly Pack',
      icon: Crown,
      price: 'Custom Price',
      tagline: 'Flexible subscription for learners spanning multiple courses or months.',
      description: 'If your learning journey is more than one month or requires multiple course selection, go for the Monthly Pack with complete access to career preparation.',
      isFeatured: true,
      href: '/contact?plan=Monthly%20Pack&subject=Monthly%20Pack%20Inquiry',
      features: [
        { text: 'Multiple course selection with flexible learning', included: true },
        { text: 'Best choice if you plan to learn for more than one month', included: true },
        { text: 'Hands-on projects and advanced projects', included: true },
        { text: 'Downloadable notes, resources and templates', included: true },
        { text: 'Certificates for eligible completed courses', included: true },
        { text: 'Resume creation and professional resume reviews', included: true },
        { text: 'LinkedIn profile building and optimization', included: true },
        { text: 'Interview preparation and mock interviews', included: true },
        { text: 'Career roadmaps and placement guidance', included: true },
        { text: 'Startup idea validation and business guidance', included: true },
        { text: 'Marketing strategies and branding guidance', included: true },
        { text: 'Guidance on building and launching your own startup', included: true },
        { text: 'Access to new learning resources during your subscription', included: true },
      ],
    },
    {
      name: 'Course Wise Pack',
      icon: BookOpen,
      price: 'Individual Pricing',
      tagline: 'Standard single course with permanent lifetime access.',
      description: 'If you want a standard single course with permanent access, go for the Course Wise Pack — dedicated strictly to one course with no expiration.',
      isFeatured: false,
      href: '/contact?plan=Course%20Wise%20Pack&subject=Course%20Wise%20Pack%20Inquiry',
      features: [
        { text: 'Dedicated strictly to only one course of your choice', included: true },
        { text: 'Permanent lifetime portal access to your enrolled course', included: true },
        { text: 'Ideal if you want a standard single course with zero renewals', included: true },
        { text: 'Access course-specific lessons, notes and study resources', included: true },
        { text: 'Complete practical challenges and projects for your course', included: true },
        { text: 'Official course completion certificate for your single course', included: true },
        { text: 'No expiration date or monthly renewal required', included: true },
      ],
    },
  ];

  return (
    <section id="pricing-section" className="py-20 lg:py-28 bg-[#f8fafc] relative overflow-hidden select-none">
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
            Flexible Plans<br />
            for Every Learner
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-base sm:text-lg text-[#475569] font-normal leading-relaxed max-w-sm lg:pt-3 tracking-[-0.01em]"
          >
            Choose a plan that fits your learning goals<br className="hidden sm:inline" />
            and grow at your own pace with confidence.
          </motion.p>
        </div>

        {/* Pricing Cards Grid (Centered 2 Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-stretch max-w-[1020px] mx-auto">
          {plans.map((plan, idx) => {
            const Icon = plan.icon;
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.12 }}
                className={`flex flex-col gap-3 rounded-[28px] ${plan.isFeatured ? 'p-1.5 bg-[#2563eb] shadow-xl' : ''
                  }`}
              >
                {/* Top Box: Title, Price, Arrow CTA, Description */}
                <div
                  className={`p-7 sm:p-8 rounded-[24px] flex flex-col justify-between ${plan.isFeatured
                    ? 'bg-[#2563eb] text-white'
                    : 'bg-[#eff6ff] text-[#0a2540]'
                    }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3
                        className={`text-2xl sm:text-[26px] font-medium tracking-[-0.03em] ${plan.isFeatured ? 'text-white' : 'text-[#0a2540]'
                          }`}
                      >
                        {plan.name}
                      </h3>
                      <Icon className={`w-6 h-6 ${plan.isFeatured ? 'text-blue-200' : 'text-[#2563eb]'}`} />
                    </div>

                    {/* Price & Circular Arrow Button Row */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-baseline gap-1">
                        <span
                          className={`text-3xl sm:text-[40px] font-medium tracking-tight leading-none ${plan.isFeatured ? 'text-white' : 'text-[#0a2540]'
                            }`}
                        >
                          {plan.price}
                        </span>
                      </div>

                      <Link
                        href={plan.href}
                        className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 group ${plan.isFeatured
                          ? 'bg-white text-[#2563eb] hover:scale-105'
                          : 'bg-[#dbeafe] hover:bg-[#2563eb] text-[#0a2540] hover:text-white'
                          }`}
                        aria-label={`Inquire about ${plan.name}`}
                      >
                        <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <p
                      className={`text-[15px] font-medium leading-snug ${plan.isFeatured ? 'text-white' : 'text-[#0a2540]'
                        }`}
                    >
                      {plan.tagline}
                    </p>
                    <p
                      className={`text-[13px] sm:text-[14px] leading-relaxed font-normal ${plan.isFeatured ? 'text-blue-100' : 'text-[#475569]'
                        }`}
                    >
                      {plan.description}
                    </p>
                  </div>
                </div>

                {/* Bottom Box: Features List */}
                <div className="bg-[#eff6ff] rounded-[24px] p-7 sm:p-8 flex-1 flex flex-col justify-start border border-[#bfdbfe]/40">
                  <ul className="space-y-3.5">
                    {plan.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-3 text-[14px] sm:text-[15px] font-normal leading-snug">
                        <Check className="w-4.5 h-4.5 text-[#2563eb] flex-shrink-0 mt-0.5" />
                        <span className="text-[#0a2540]">
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
