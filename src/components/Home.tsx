import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { Essay } from '../types';

interface HomeProps {
  onReadEssay: (essayId: string) => void;
  setActivePage: (page: string) => void;
  featuredEssay: Essay;
}

export const Home: React.FC<HomeProps> = ({ onReadEssay, setActivePage, featuredEssay }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' }
    }
  };

  const institutionsSummary = [
    {
      id: "athena-centre",
      name: "Athena Centre for Policy & Leadership",
      category: "Governance Research",
      desc: "Pioneering non-partisan strategic blueprints for federal administrative systems, grid deregulation, and fiscal responsibility."
    },
    {
      id: "frsc",
      name: "Federal Road Safety Corps (FRSC)",
      category: "Technology Overhaul",
      desc: "Re-engineering Nigeria’s motorist registries and driver’s license networks into an award-winning computerized database system."
    },
    {
      id: "ministry-aviation",
      name: "Ministry of Aviation",
      category: "Infrastructure Modernization",
      desc: "Spearheading complete terminal expansion developments, modern ILS safety arrays, and open bidding procurement practices."
    }
  ];

  const handleInstitutionalClick = (id: string) => {
    setActivePage('institutions');
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="bg-[#F7F3EC] text-[#121212]"
    >
      {/* Hero Section */}
      <section className="border-b border-[#D8D0C0] px-6 sm:px-12 md:px-16 pt-20 pb-16 max-w-[960px] mx-auto">
        <motion.p
          variants={itemVariants}
          className="font-sans text-[11px] font-semibold tracking-[0.25em] text-[#7A7A7A] uppercase mb-[18px] inline-block"
        >
          Public Servant · Writer · Institution Builder
        </motion.p>
        <motion.h1
          variants={itemVariants}
          className="font-serif text-[48px] sm:text-[68px] md:text-[80px] font-bold tracking-tight leading-[0.98] mb-8 text-[#121212]"
        >
          Osita Chidoka
        </motion.h1>
        <motion.p
          variants={itemVariants}
          className="font-serif text-[20px] sm:text-[22px] italic font-normal text-[#444444] leading-[1.55] max-w-[580px] text-justify"
        >
          I write about building sustained institutions, technology-driven public policy reforms, national security architectures, and the ethical mentorship of West Africa's emerging civil leaders.
        </motion.p>
      </section>

      {/* Featured Memoir Section */}
      {featuredEssay && (
        <section className="border-b border-[#D8D0C0] px-6 sm:px-12 md:px-16 py-16 max-w-[960px] mx-auto">
          <motion.div variants={itemVariants} className="mb-6">
            <span className="font-sans text-[11px] font-bold tracking-[0.2em] uppercase text-[#9B7A2F] bg-[#9B7A2F]/10 px-2.5 py-1 rounded-sm">
              Featured Memoir
            </span>
          </motion.div>
          <motion.h2
            variants={itemVariants}
            className="font-serif text-[32px] sm:text-[44px] md:text-[48px] font-bold tracking-tight leading-[1.1] text-[#121212] mb-4"
          >
            {featuredEssay.title}
          </motion.h2>
          {featuredEssay.subtitle && (
            <motion.p
              variants={itemVariants}
              className="font-serif text-[18px] sm:text-[20px] italic text-[#444444] mb-4 text-justify leading-relaxed"
            >
              {featuredEssay.subtitle}
            </motion.p>
          )}
          {featuredEssay.deck && (
            <motion.p
              variants={itemVariants}
              className="font-sans text-[15.5px] text-[#7A7A7A] mb-8 max-w-[700px] leading-relaxed"
            >
              {featuredEssay.deck}
            </motion.p>
          )}
          <motion.div variants={itemVariants}>
            <button
              onClick={() => onReadEssay(featuredEssay.id)}
              className="group font-sans text-[13px] font-semibold tracking-wider uppercase text-[#121212] flex items-center gap-2 border-b border-[#121212] pb-0.5 hover:text-[#9B7A2F] hover:border-[#9B7A2F] transition-all bg-transparent border-0 outline-none cursor-pointer"
            >
              Read Full Essay
              <ArrowUpRight
                size={15}
                className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </button>
          </motion.div>
        </section>
      )}

      {/* The Work Section */}
      <section className="border-b border-[#D8D0C0] px-6 sm:px-12 md:px-16 py-16 max-w-[960px] mx-auto">
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16 mb-12">
          <div className="md:col-span-1">
            <h3 className="font-serif text-[32px] font-bold text-[#121212] leading-tight">
              The Work
            </h3>
          </div>
          <div className="md:col-span-2 md:pt-1">
            <p className="font-sans text-[16.5px] text-[#444444] leading-relaxed">
              Throughout my administrative journey, I have focused on rebuilding essential public agencies. True transformation happens when executive authority yields to computer workflows, rigorous databases, and transparent public indicators.
            </p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="border-t border-[#D8D0C0] divide-y divide-[#D8D0C0]">
          {institutionsSummary.map((inst) => (
            <div
              key={inst.id}
              onClick={() => handleInstitutionalClick(inst.id)}
              className="py-6 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-16 cursor-pointer group hover:bg-[#9B7A2F]/5 px-2 -mx-2 transition-colors rounded-sm"
            >
              <div className="md:col-span-1">
                <span className="font-sans text-[11px] font-bold tracking-[0.15em] uppercase text-[#9B7A2F] block mb-2">
                  {inst.category}
                </span>
                <h4 className="font-serif text-[18px] font-bold text-[#121212] group-hover:text-[#9B7A2F] transition-colors leading-[1.3]">
                  {inst.name}
                </h4>
              </div>
              <div className="md:col-span-2 flex flex-col justify-between">
                <p className="font-sans text-[15px] text-[#444444] leading-relaxed mb-3">
                  {inst.desc}
                </p>
                <span className="font-sans text-[11px] font-semibold tracking-wider uppercase text-[#9B7A2F] flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  View structural details <ArrowUpRight size={13} />
                </span>
              </div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Quote Section */}
      <section className="border-b border-[#D8D0C0] px-6 sm:px-12 md:px-16 py-16 max-w-[960px] mx-auto">
        <motion.div variants={itemVariants} className="border-l-2 border-[#9B7A2F] pl-6 md:pl-8 py-4">
          <p className="font-serif text-[24px] sm:text-[30px] italic font-normal text-[#444444] leading-[1.5]">
            "We must stop building monuments to ourselves and start building mechanisms for our descendants."
          </p>
        </motion.div>
      </section>

      {/* Subscription CTA Section */}
      <section className="px-6 sm:px-12 md:px-16 py-16 max-w-[960px] mx-auto">
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 border border-[#D8D0C0] bg-[#F7F3EC] px-8 py-8 rounded-sm shadow-sm">
          <div>
            <h3 className="font-serif text-[22px] font-bold text-[#121212] mb-2 leading-tight">
              Weekly Public Policy Essays
            </h3>
            <p className="font-sans text-[14.5px] text-[#7A7A7A] max-w-[480px] leading-relaxed">
              Stay connected. Subscribe to receive Osita’s structured opinions on governance reform directly to your inbox.
            </p>
          </div>
          <button
            onClick={() => {
              setActivePage('subscribe');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="group font-sans text-[12px] font-bold tracking-widest uppercase text-white bg-[#121212] hover:bg-[#9B7A2F] px-6 py-3 rounded-md transition-all shadow-sm cursor-pointer whitespace-nowrap flex items-center gap-2 border-0"
          >
            Become a Subscriber
            <ArrowUpRight
              size={14}
              className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
            />
          </button>
        </motion.div>
      </section>
    </motion.div>
  );
};
