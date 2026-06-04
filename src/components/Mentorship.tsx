import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ChevronRight, GraduationCap, CheckCircle, Award, Users } from 'lucide-react';
import { MentorshipApp } from '../types';
import { mentorshipVectors } from '../data';

interface MentorshipProps {
  parentApps: MentorshipApp[];
  onApplyApp: (application: MentorshipApp) => void;
}

export const Mentorship: React.FC<MentorshipProps> = ({ parentApps, onApplyApp }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [discipline, setDiscipline] = useState('');
  const [proposal, setProposal] = useState('');
  const [focusVector, setFocusVector] = useState(mentorshipVectors[0].title);
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<MentorshipApp | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !discipline || !proposal) return;

    setSubmitting(true);

    setTimeout(() => {
      const generatedId = `MLF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const appRecord: MentorshipApp = {
        id: generatedId,
        name: fullName,
        email,
        discipline,
        proposal,
        focus: focusVector,
        status: 'PENDING ADMISSION REVIEW'
      };

      onApplyApp(appRecord);
      setReceipt(appRecord);
      setSubmitting(false);

      // Reset form fields
      setFullName('');
      setEmail('');
      setDiscipline('');
      setProposal('');
    }, 1500);
  };

  const resetDossier = () => {
    setReceipt(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-[#F7F3EC] pb-20"
    >
      {/* Hero Header Section */}
      <section className="max-w-[960px] mx-auto px-6 sm:px-12 md:px-16 pt-20">
        <span className="font-sans text-[11px] font-bold tracking-[0.22em] text-[#7A7A7A] uppercase block mb-3">
          Ethical Youth Cultivation
        </span>
        <h1 className="font-serif text-[44px] sm:text-[62px] font-bold tracking-tight leading-[1.05] text-[#121212] mb-6">
          Mekaria Mentorship
        </h1>
        <div className="border-l-2 border-[#9B7A2F] pl-6 md:pl-8 py-2 max-w-[580px] mt-8 mb-12">
          <p className="font-serif text-[20px] sm:text-[24px] italic text-[#444444] leading-[1.5] text-justify">
            "Mekaria is drawing-board courage. It is the moral demand to 'do more,' to engineer excellence in our immediate offices, and to accept responsibilities that exceed our credentials."
          </p>
        </div>
      </section>

      {/* Program Content Overview */}
      <section className="max-w-[960px] mx-auto px-6 sm:px-12 md:px-16 py-12 grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-11 border-t border-[#D8D0C0]">
        <div className="md:col-span-1 pt-1.5">
          <span className="font-sans text-[11px] font-bold tracking-[0.2em] text-[#9B7A2F] uppercase block mb-2">
            The Philosophy
          </span>
          <p className="font-sans text-[13.5px] text-[#7A7A7A] leading-relaxed mt-4 text-justify">
            Under this program, Osita Chidoka brings together groups of young public analysts during intensive retreats to study operational governance systems.
          </p>
        </div>

        <div className="md:col-span-3">
          <h3 className="font-serif text-[24px] font-bold text-[#121212] mb-6 tracking-tight">
            Our Mentorship Focus Vectors
          </h3>

          <div className="flex flex-col gap-0 border-t border-[#D8D0C0]">
            {mentorshipVectors.map((vec, idx) => (
              <div
                key={idx}
                className="py-6 border-b border-[#D8D0C0] flex items-start gap-4 hover:bg-[#9B7A2F]/5 p-2 transition-colors rounded-sm"
              >
                <span className="font-serif text-[18px] sm:text-[20px] font-bold text-[#9B7A2F] flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-[#9B7A2F]/10 border border-[#9B7A2F]/25 leading-none">
                  0{idx + 1}
                </span>
                <div>
                  <h4 className="font-serif text-[18px] font-bold text-[#121212] tracking-tight mb-2">
                    {vec.title}
                  </h4>
                  <p className="font-sans text-[14px] text-[#444444] leading-relaxed text-justify">
                    {vec.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form Submission dossier section */}
      <section className="max-w-[720px] mx-auto px-6 sm:px-12 md:px-0 py-12 border-t border-[#D8D0C0]">
        <div className="border border-[#D8D0C0] bg-white rounded-sm overflow-hidden shadow-md relative">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#121212]" />

          <AnimatePresence mode="wait">
            {receipt ? (
              <motion.div
                key="receipt"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="p-8 sm:p-12 text-center"
              >
                <div className="max-w-[460px] mx-auto text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-amber-50 border border-amber-200 text-[#9B7A2F] rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <Award size={36} />
                  </div>
                  <span className="font-sans text-[11px] font-bold tracking-[0.2em] text-[#9B7A2F] uppercase block mb-1">
                    APPLICATION SUBMITTED SUCCESSFULLY
                  </span>
                  <h3 className="font-serif text-[24px] sm:text-[28px] font-bold text-[#121212] mb-3 tracking-tight">
                    Mekaria Fellowship Dossier Filed
                  </h3>
                  <p className="font-sans text-[13.5px] text-[#7A7A7A] leading-relaxed mb-8 text-center">
                    Your institutional blueprint program application is locked in place. Your administrative dossier ID is <strong>{receipt.id}</strong>. Review this status in your subscriber panel or check with fellowship coordinators.
                  </p>
                </div>

                {/* Styled dossier paper */}
                <div className="max-w-[480px] mx-auto bg-[#F7F3EC] border border-[#D8D0C0] text-[#121212] p-6 rounded-sm text-left font-sans shadow-inner mb-8">
                  <div className="flex justify-between items-center mb-6 pb-3 border-b border-[#D8D0C0]">
                    <div>
                      <h4 className="font-serif text-[16px] font-bold uppercase tracking-wider">
                        Mekaria Institute
                      </h4>
                      <span className="font-mono text-[9px] text-[#7A7A7A]">FELLOWSHIP NOMINATION MEMO</span>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-[#9B7A2F] tracking-widest">{receipt.id}</span>
                  </div>

                  <div className="flex flex-col gap-4 text-justify">
                    <div>
                      <span className="text-[9px] text-[#7A7A7A] font-bold uppercase block">APPLICANT</span>
                      <span className="font-sans text-[15px] font-bold text-[#121212]">{receipt.name}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#7A7A7A] font-bold uppercase block">DISCIPLINE & CREDENTIALS</span>
                      <span className="font-sans text-[14px] text-[#444444] italic">{receipt.discipline}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#7A7A7A] font-bold uppercase block">FOCUS SECTOR VECTOR</span>
                      <span className="font-sans text-[13.5px] font-semibold text-[#9B7A2F]">{receipt.focus}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#7A7A7A] font-bold uppercase block">BLUEPRINT PROPOSAL</span>
                      <p className="font-sans text-[13.5px] text-[#444444] leading-relaxed italic m-0 bg-white/40 p-3 border border-[#D8D0C0]/50 rounded-sm">
                        "{receipt.proposal}"
                      </p>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-[#D8D0C0]/60 text-[11px] font-mono">
                      <span>DOCKET STATUS:</span>
                      <span className="text-white bg-slate-800 px-2 py-0.5 rounded-sm font-semibold">{receipt.status}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={resetDossier}
                  className="font-sans text-[11px] font-bold tracking-widest uppercase text-white bg-[#121212] hover:bg-[#9B7A2F] py-3 px-6 rounded-md border-none cursor-pointer mt-4 transition-colors"
                >
                  Apply with another Proposal
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-8 sm:p-12 text-left"
              >
                <div className="mb-8 text-center sm:text-left">
                  <span className="font-sans text-[11px] font-bold tracking-[0.2em] text-[#9B7A2F] uppercase block mb-2">
                    FELLOWSHIP REGISTER
                  </span>
                  <h2 className="font-serif text-[28px] sm:text-[34px] font-black text-[#121212] tracking-tight">
                    Submit Fellowship Nominee Blueprint
                  </h2>
                  <p className="font-sans text-[14px] text-[#7A7A7A] mt-2">
                    Submit your credentials and governance proposal below. High-potential applicants will be selected for intensive executive leadership retreats.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-sans text-[10.5px] font-bold text-[#7A7A7A] tracking-wider uppercase">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your full name"
                        className="bg-[#F7F3EC]/40 border border-[#D8D0C0] focus:border-[#9B7A2F] outline-none p-3 text-sm text-[#121212] rounded-sm transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-sans text-[10.5px] font-bold text-[#7A7A7A] tracking-wider uppercase">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="bg-[#F7F3EC]/40 border border-[#D8D0C0] focus:border-[#9B7A2F] outline-none p-3 text-sm text-[#121212] rounded-sm transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-sans text-[10.5px] font-bold text-[#7A7A7A] tracking-wider uppercase flex items-center gap-1">
                      <GraduationCap size={13} className="text-[#9B7A2F]" /> Higher Education Discipline & Institution *
                    </label>
                    <input
                      type="text"
                      required
                      value={discipline}
                      onChange={(e) => setDiscipline(e.target.value)}
                      placeholder="e.g. Master’s in Social Work, University of Ibadan"
                      className="bg-[#F7F3EC]/40 border border-[#D8D0C0] focus:border-[#9B7A2F] outline-none p-3 text-sm text-[#121212] rounded-sm transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-sans text-[10.5px] font-bold text-[#7A7A7A] tracking-wider uppercase">
                      Select Focus Vector *
                    </label>
                    <select
                      value={focusVector}
                      onChange={(e) => setFocusVector(e.target.value)}
                      className="bg-[#F7F3EC]/40 border border-[#D8D0C0] focus:border-[#9B7A2F] outline-none p-3 text-sm text-[#121212] rounded-sm"
                    >
                      {mentorshipVectors.map((vec, idx) => (
                        <option key={idx} value={vec.title}>
                          {vec.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-sans text-[10.5px] font-bold text-[#7A7A7A] tracking-wider uppercase">
                      System Reform Proposal Abstract *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={proposal}
                      onChange={(e) => setProposal(e.target.value)}
                      placeholder="Specify a targeted administrative challenge and describe the technological or rules-based decentralization mechanism to decouple discretionary power or reduce leakages..."
                      className="bg-[#F7F3EC]/40 border border-[#D8D0C0] focus:border-[#9B7A2F] outline-none p-3.5 text-sm text-[#121212] rounded-sm leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="font-sans text-[11px] font-bold tracking-widest uppercase text-white bg-[#121212] hover:bg-[#9B7A2F] py-4 px-8 rounded-sm cursor-pointer border-none transition-colors mt-4 text-center flex items-center justify-center gap-2 self-start hover:shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Transmitting Memorandum..." : "Submit Proposal"} <ChevronRight size={13} />
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </motion.div>
  );
};
