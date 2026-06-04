import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Check, Mail, Loader2, ArrowUpRight } from 'lucide-react';
import { Subscriber } from '../types';

interface SubscribeProps {
  onAddSubscriber: (subscriber: Subscriber) => void;
}

export const Subscribe: React.FC<SubscribeProps> = ({ onAddSubscriber }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    "Essays & Memoirs",
    "Governance, Policy & Database Systems"
  ]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<Subscriber | null>(null);

  const interestOptions = [
    { title: "Essays & Memoirs" },
    { title: "Governance, Policy & Database Systems" },
    { title: "Mekaria Fellowship & Mentorship Retreats" },
    { title: "Aviation & Infrastructure Briefs" }
  ];

  const handleInterestToggle = (title: string) => {
    if (selectedInterests.includes(title)) {
      setSelectedInterests(selectedInterests.filter((t) => t !== title));
    } else {
      setSelectedInterests([...selectedInterests, title]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    setLoading(true);

    setTimeout(() => {
      const generatedCode = `OSC-SUB-${Math.floor(100 + Math.random() * 900)}`;
      const subRecord: Subscriber = {
        code: generatedCode,
        name,
        email,
        interests: selectedInterests
      };

      onAddSubscriber(subRecord);
      setSuccess(subRecord);
      setLoading(false);

      setName('');
      setEmail('');
    }, 1200);
  };

  const handleReset = () => {
    setSuccess(null);
    setSelectedInterests(["Essays & Memoirs", "Governance, Policy & Database Systems"]);
  };

  return (
    <div className="bg-[#FAF8F5] min-h-[85vh] py-12 sm:py-20 flex items-center justify-center">
      <div className="max-w-[1100px] w-full mx-auto px-6 sm:px-12 md:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Information Display */}
          <div className="lg:col-span-5 flex flex-col gap-5 text-left animate-fadeIn">
            <span className="font-sans text-[10px] font-bold tracking-[0.25em] text-[#9B7A2F] uppercase block">
              Stay Engaged via Email
            </span>
            <h1 className="font-serif text-[42px] sm:text-[54px] font-black text-[#121212] tracking-tight leading-none mb-1">
              Subscribe
            </h1>
            <p className="font-sans text-[13.5px] text-[#4E4941] leading-relaxed max-w-[440px]">
              Join a community of thousands of civil advocates, public administration experts, and university students receiving weekly publications.
            </p>
            
            <div className="my-2 border-l-2 border-[#D8D0C0] pl-5 py-0.5">
              <blockquote className="font-serif text-[14.5px] italic text-[#6B6152] leading-relaxed">
                "By creating open channels of dialogue, we build a nation of responsive citizens working in sync toward civil excellence."
              </blockquote>
            </div>
            
            <div className="h-[1px] bg-[#E8E1D5] my-2 w-full max-w-[440px]" />
            
            <div className="flex items-center gap-2.5 text-[#7A7163] font-sans text-[11.5px] max-w-[440px] leading-normal">
              <Mail size={14} className="text-[#9B7A2F] flex-shrink-0" />
              <span>Delivered with absolute privacy. No spam. No third-party audits.</span>
            </div>
          </div>

          {/* Right Column: Subscriber Portal Form / Success Panel */}
          <div className="lg:col-span-7 w-full max-w-[560px] mx-auto">
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                  className="border border-[#D8D0C0] bg-[#FAF8F5] rounded-sm overflow-hidden shadow-xl relative transition-all duration-300"
                >
                  <div className="absolute top-0 left-0 right-0 h-[4px] bg-[#9B7A2F]" />
                  
                  <div className="p-8 sm:p-11 text-center">
                    <div className="w-14 h-14 bg-amber-50 border border-amber-200 text-[#9B7A2F] rounded-full flex items-center justify-center mb-6 mx-auto animate-pulse">
                      <Bell size={26} />
                    </div>
                    <span className="font-sans text-[9px] font-bold tracking-[0.25em] text-[#9B7A2F] uppercase block mb-1">
                      Subscribed Securely
                    </span>
                    <h3 className="font-serif text-[24px] font-bold text-[#121212] mb-3 tracking-tight">
                      You are on the alert list
                    </h3>
                    <p className="font-sans text-[13px] text-[#7A7A7A] leading-relaxed mb-6 max-w-[400px] mx-auto text-center">
                      Your email subscription has been authorized. You will receive immediate notifications whenever Chancellor Osita Chidoka releases a new Policy Memorandum or Memoir essay.
                    </p>

                    {/* Receipt Card */}
                    <div className="max-w-[420px] mx-auto bg-[#F7F3EC] border border-[#D8D0C0] p-5 rounded-sm text-left mb-6 shadow-xs">
                      <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#D8D0C0]">
                        <div>
                          <span className="font-sans font-bold text-[11px] uppercase tracking-wider text-[#121212]">Osita Chidoka Registry</span>
                          <p className="font-mono text-[8px] text-[#7A7A7A] m-0 tracking-wider">BI-WEEKLY INTEL DIRECTORY</p>
                        </div>
                        <span className="font-mono text-[11px] font-bold text-[#9B7A2F] bg-[#FAF8F5] px-2 py-0.5 border border-[#D8D0C0]">{success.code}</span>
                      </div>
                      <div className="flex flex-col gap-3.5 text-left">
                        <div>
                          <span className="text-[8px] text-[#7A7A7A]/90 font-bold uppercase tracking-wider block mb-0.5 animate-fadeIn">SUBSCRIBER</span>
                          <span className="font-sans text-[13.5px] font-bold text-[#121212]">{success.name}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-[#7A7A7A]/90 font-bold uppercase tracking-wider block mb-0.5 animate-fadeIn">DELIVERY GATEWAY</span>
                          <span className="font-mono text-[11.5px] text-[#444444] break-all">{success.email}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-[#7A7A7A]/90 font-bold uppercase tracking-wider block mb-0.5 animate-fadeIn">ENABLED CHANNELS</span>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {success.interests.map((it) => (
                              <span key={it} className="bg-[#FAF8F5] border border-[#D8D0C0] text-[9.5px] text-[#444444] px-2 py-0.5 rounded-sm font-sans font-medium">
                                {it}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleReset}
                      className="font-sans text-[10px] font-bold tracking-widest uppercase text-white bg-[#121212] hover:bg-[#9B7A2F] py-3.5 px-6 rounded-none border-none cursor-pointer transition-colors w-full"
                    >
                      Configure Another Alert Address
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                  className="border border-[#D8D0C0] bg-[#FAF8F5] rounded-sm overflow-hidden shadow-xl relative transition-all duration-300"
                >
                  <div className="absolute top-0 left-0 right-0 h-[4px] bg-[#9B7A2F]" />
                  
                  <div className="p-8 sm:p-11 text-left">
                    <h3 className="font-serif text-[23px] font-bold text-[#121212] mb-8 tracking-normal">
                      Establish Alert Subscription
                    </h3>
                    
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                      {/* Name Input */}
                      <div className="flex flex-col gap-1.5 relative">
                        <label className="font-sans text-[9px] font-bold text-[#7A7163] tracking-widest uppercase">
                          Name / Organization
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Amina Mohammed"
                          className="bg-transparent border-t-0 border-x-0 border-b-2 border-[#121212] focus:border-[#9B7A2F] outline-none pb-2 pt-1 font-sans text-sm text-[#121212] placeholder-[#A49E94]/60 transition-colors duration-200 w-full"
                        />
                      </div>

                      {/* Email Input */}
                      <div className="flex flex-col gap-1.5 relative">
                        <label className="font-sans text-[9px] font-bold text-[#7A7163] tracking-widest uppercase">
                          Email Address
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. amina@athena.org"
                          className="bg-transparent border-t-0 border-x-0 border-b-2 border-[#121212] focus:border-[#9B7A2F] outline-none pb-2 pt-1 font-sans text-sm text-[#121212] placeholder-[#A49E94]/60 transition-colors duration-200 w-full"
                        />
                      </div>

                      {/* Interests Pickers */}
                      <div className="flex flex-col gap-4 mt-2">
                        <label className="font-sans text-[9px] font-bold text-[#7A7163] tracking-widest uppercase block mb-1">
                          Choose Field Interests
                        </label>
                        <div className="flex flex-col gap-3.5">
                          {interestOptions.map((opt) => {
                            const isSelected = selectedInterests.includes(opt.title);
                            return (
                              <div
                                key={opt.title}
                                onClick={() => handleInterestToggle(opt.title)}
                                className="flex items-center gap-3.5 cursor-pointer select-none group"
                              >
                                <div
                                  className={`w-[18px] h-[18px] border-2 rounded-[3px] flex items-center justify-center flex-shrink-0 transition-all ${
                                    isSelected
                                      ? 'bg-[#9B7A2F] border-[#9B7A2F] text-[#FAF8F5]'
                                      : 'border-[#C1B7A6] bg-transparent group-hover:border-[#9B7A2F]'
                                  }`}
                                >
                                  {isSelected && (
                                    <Check size={12} strokeWidth={3} className="text-white" />
                                  )}
                                </div>
                                <span className="font-sans text-[13px] font-medium text-[#444444] group-hover:text-[#121212] transition-colors leading-none">
                                  {opt.title}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading || selectedInterests.length === 0}
                        className="font-sans text-[11px] font-bold tracking-[0.2em] uppercase text-[#FAF8F5] bg-[#121212] hover:bg-[#9B7A2F] py-4 rounded-sm cursor-pointer border-none transition-all duration-200 mt-4 text-center shadow-md hover:shadow-lg flex items-center justify-center gap-2 group disabled:bg-[#A49E94]/60 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <>
                            <Loader2 size={13} className="animate-spin text-white" />
                            <span>Confirming Entry...</span>
                          </>
                        ) : (
                          <>
                            <span>Confirm Subscription Entry</span>
                            <ArrowUpRight size={13} className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
};
