'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

function ContactFormInner() {
  const searchParams = useSearchParams();
  const planParam = searchParams.get('plan');
  const subjectParam = searchParams.get('subject');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: subjectParam || (planParam ? `${planParam} Inquiry` : ''),
    message: planParam ? `Hi, I am interested in the ${planParam}. Please provide me more details regarding the curriculum, schedule, and enrollment process.` : '',
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  useEffect(() => {
    if (subjectParam && !formData.subject) {
      setFormData((prev) => ({ ...prev, subject: subjectParam }));
    }
    if (planParam && !formData.subject) {
      setFormData((prev) => ({
        ...prev,
        subject: `${planParam} Inquiry`,
        message: prev.message || `Hi, I am interested in the ${planParam}. Please provide me more details.`,
      }));
    }
  }, [subjectParam, planParam]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus({
          type: 'success',
          message: 'Our team will contact you soon',
        });
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
        });
      } else {
        setStatus({
          type: 'error',
          message: data.message || 'Failed to send message. Please verify your information and try again.',
        });
      }
    } catch (err: any) {
      console.error('Contact submission error:', err);
      setStatus({
        type: 'error',
        message: 'A network error occurred while sending your message. Please check your connection and try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Notifications - Border & Shadow Removed, Dexar Blue/Emerald Theme */}
      <AnimatePresence>
        {status.type && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mb-6 p-4 rounded-[14px] flex items-start gap-3 text-[14px] leading-relaxed border-0 shadow-none ${
              status.type === 'success'
                ? 'bg-[#eff6ff] text-[#0a2540]'
                : 'bg-red-50 text-red-900'
            }`}
          >
            {status.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-[#2563eb] flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold text-[#0a2540]">
                {status.type === 'success' ? 'Message Sent!' : 'Submission Failed'}
              </p>
              <p className="text-[13.5px] font-medium text-[#2563eb]">
                {status.message}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Row 1: Name & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <div className="space-y-2">
            <label htmlFor="name" className="block text-[14px] font-medium text-[#0a2540]">
              Name
            </label>
            <input
              id="name"
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="Your full name"
              className="w-full px-4 py-3.5 rounded-[12px] sm:rounded-[14px] bg-[#f1f5f9] sm:bg-[#f8fafc] border-0 focus:ring-2 focus:ring-[#2563eb]/25 focus:bg-white text-[#0a2540] placeholder-[#64748b]/70 text-[14px] sm:text-[15px] outline-none shadow-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="block text-[14px] font-medium text-[#0a2540]">
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="Your email address"
              className="w-full px-4 py-3.5 rounded-[12px] sm:rounded-[14px] bg-[#f1f5f9] sm:bg-[#f8fafc] border-0 focus:ring-2 focus:ring-[#2563eb]/25 focus:bg-white text-[#0a2540] placeholder-[#64748b]/70 text-[14px] sm:text-[15px] outline-none shadow-none transition-all"
            />
          </div>
        </div>

        {/* Row 2: Phone & Subject */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <div className="space-y-2">
            <label htmlFor="phone" className="block text-[14px] font-medium text-[#0a2540]">
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Your phone number"
              className="w-full px-4 py-3.5 rounded-[12px] sm:rounded-[14px] bg-[#f1f5f9] sm:bg-[#f8fafc] border-0 focus:ring-2 focus:ring-[#2563eb]/25 focus:bg-white text-[#0a2540] placeholder-[#64748b]/70 text-[14px] sm:text-[15px] outline-none shadow-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="subject" className="block text-[14px] font-medium text-[#0a2540]">
              Subject
            </label>
            <input
              id="subject"
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="Course or support inquiry"
              className="w-full px-4 py-3.5 rounded-[12px] sm:rounded-[14px] bg-[#f1f5f9] sm:bg-[#f8fafc] border-0 focus:ring-2 focus:ring-[#2563eb]/25 focus:bg-white text-[#0a2540] placeholder-[#64748b]/70 text-[14px] sm:text-[15px] outline-none shadow-none transition-all"
            />
          </div>
        </div>

        {/* Row 3: Leave us a message */}
        <div className="space-y-2">
          <label htmlFor="message" className="block text-[14px] font-medium text-[#0a2540]">
            Leave us a message
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={5}
            value={formData.message}
            onChange={handleChange}
            placeholder="Write your message here..."
            className="w-full px-4 py-3.5 rounded-[12px] sm:rounded-[14px] bg-[#f1f5f9] sm:bg-[#f8fafc] border-0 focus:ring-2 focus:ring-[#2563eb]/25 focus:bg-white text-[#0a2540] placeholder-[#64748b]/70 text-[14px] sm:text-[15px] outline-none shadow-none transition-all resize-y"
          />
        </div>

        {/* Submit Button - Dexar Blue Theme */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 rounded-[14px] bg-[#2563eb] hover:bg-[#1d4ed8] active:bg-[#1e40af] text-white font-semibold text-[15px] sm:text-[16px] shadow-none hover:shadow-none border-0 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Sending Message...</span>
              </>
            ) : (
              <span>Send Message</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ContactPage() {
  return (
    <div className="contact-scope min-h-screen bg-[#f8fafc] text-[#0f172a] antialiased selection:bg-[#2563eb] selection:text-white flex flex-col justify-between">
      {/* Fixed/Sticky Navbar */}
      <Navbar />

      <main className="flex-1 pt-24 sm:pt-28 pb-16 lg:pb-24">
        {/* HERO SECTION WITHOUT GRID BACKGROUND */}
        <div className="w-full pt-8 sm:pt-12 pb-8 sm:pb-12 text-center relative z-10">
          <div className="max-w-[1240px] mx-auto px-6">
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl sm:text-5xl lg:text-[56px] font-medium text-[#0a2540] tracking-tight leading-tight"
            >
              Contact Us
            </motion.h1>
          </div>
        </div>

        {/* MAIN CONTACT CONTAINER */}
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">

            {/* LEFT COLUMN: Dexar Royal Navy Card + Student Image + Floating Badges */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-5 relative bg-[#0a2540] rounded-[28px] sm:rounded-[36px] overflow-hidden min-h-[560px] sm:min-h-[600px] lg:min-h-[640px] flex flex-col justify-end p-5 sm:p-7 border-0 shadow-none"
            >
              {/* Student Portrait Image - Fitted to Card Box */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <Image
                  src="/images/contact-student.png"
                  alt="Dexar Student Support"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, (max-width: 1280px) 45vw, 520px"
                  className="object-cover object-top lg:object-left-top"
                />
              </div>

              {/* Floating Contact Badges on Right Side of Image - Dexar Blue Theme */}
              <div className="relative z-20 flex flex-col gap-3.5 sm:gap-4 items-end ml-auto max-w-[270px] sm:max-w-[285px] w-full mb-3 sm:mb-5">
                
                {/* Badge 1: Remote Team */}
                <motion.a
                  href="https://www.google.com/maps"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.02 }}
                  className="w-full bg-white/95 backdrop-blur-md rounded-[16px] sm:rounded-[18px] p-2.5 sm:p-3 pr-4 sm:pr-5 border-0 shadow-none flex items-center gap-3 transition-transform text-left group"
                >
                  <div className="w-10 h-10 rounded-[12px] bg-[#2563eb] flex items-center justify-center flex-shrink-0 text-white border-0 shadow-none">
                    <Image
                      src="/images/contact-icon-building.svg"
                      alt="Office Icon"
                      width={20}
                      height={20}
                      className="w-5 h-5 brightness-0 invert"
                    />
                  </div>
                  <span className="text-[13px] sm:text-[14px] font-medium text-[#0a2540] leading-tight group-hover:text-[#2563eb] transition-colors">
                    Remote Team – Worldwide
                  </span>
                </motion.a>

                {/* Badge 2: Support Email - support@dexartechnologies.in */}
                <motion.a
                  href="mailto:support@dexartechnologies.in"
                  whileHover={{ scale: 1.02 }}
                  className="w-full bg-white/95 backdrop-blur-md rounded-[16px] sm:rounded-[18px] p-2.5 sm:p-3 pr-4 sm:pr-5 border-0 shadow-none flex items-center gap-3 transition-transform text-left group"
                >
                  <div className="w-10 h-10 rounded-[12px] bg-[#2563eb] flex items-center justify-center flex-shrink-0 text-white border-0 shadow-none">
                    <Image
                      src="/images/contact-icon-chat.svg"
                      alt="Chat Icon"
                      width={18}
                      height={18}
                      className="w-4.5 h-4.5 brightness-0 invert"
                    />
                  </div>
                  <span className="text-[12.5px] sm:text-[13.5px] font-medium text-[#0a2540] leading-tight group-hover:text-[#2563eb] transition-colors break-all">
                    support@dexartechnologies.in
                  </span>
                </motion.a>

                {/* Badge 3: Phone Number */}
                <motion.a
                  href="tel:+919182105968"
                  whileHover={{ scale: 1.02 }}
                  className="w-full bg-white/95 backdrop-blur-md rounded-[16px] sm:rounded-[18px] p-2.5 sm:p-3 pr-4 sm:pr-5 border-0 shadow-none flex items-center gap-3 transition-transform text-left group"
                >
                  <div className="w-10 h-10 rounded-[12px] bg-[#2563eb] flex items-center justify-center flex-shrink-0 text-white border-0 shadow-none">
                    <Image
                      src="/images/contact-icon-phone.svg"
                      alt="Phone Icon"
                      width={18}
                      height={18}
                      className="w-4.5 h-4.5 brightness-0 invert"
                    />
                  </div>
                  <span className="text-[13px] sm:text-[14px] font-medium text-[#0a2540] leading-tight group-hover:text-[#2563eb] transition-colors">
                    +91 9182105968
                  </span>
                </motion.a>

              </div>
            </motion.div>

            {/* RIGHT COLUMN: Contact Form Card - Dexar Blue Theme */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-7 bg-[#eff6ff]/70 rounded-[28px] sm:rounded-[36px] p-6 sm:p-10 lg:p-12 flex flex-col justify-center border-0 shadow-none"
            >
              {/* Category Pill Tag */}
              <div className="text-[13px] sm:text-[14px] font-semibold text-[#2563eb] mb-2 tracking-tight">
                Contact Us
              </div>

              {/* Main Heading - Dexar Brand */}
              <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-semibold text-[#0a2540] tracking-tight leading-snug mb-8 sm:mb-10">
                Get in Touch with Dexar
              </h2>

              {/* Form with Suspense for SearchParams */}
              <Suspense
                fallback={
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-[#2563eb] animate-spin" />
                  </div>
                }
              >
                <ContactFormInner />
              </Suspense>
            </motion.div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
