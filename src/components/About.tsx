import React from 'react';
import { motion } from 'motion/react';
import { Award, Briefcase, Calendar, GraduationCap, ArrowUpRight } from 'lucide-react';
import { ContentItem } from '../lib/firebaseService';
import { institutionsData } from '../data';

interface AboutProps {
  items?: ContentItem[];
}

export const About: React.FC<AboutProps> = ({ items = [] }) => {
  const profileTimeline = [
    {
      year: "2015 – Present",
      role: "Founder & Chancellor",
      institution: "Athena Centre for Policy & Leadership",
      type: "thinktank",
      detail: "Establishing a premier West African public policy research institute. Formulating non-partisan blue-prints on fiscal devolution, sub-national electricity grid networks, and safety reforms."
    },
    {
      year: "2014 – 2015",
      role: "Minister of Aviation",
      institution: "Federal Republic of Nigeria",
      type: "ministry",
      detail: "Drove complete structural renovations across all national airport terminals. Integrated automated security systems, open procurement models, and digital airline safety checklists."
    },
    {
      year: "2007 – 2014",
      role: "Corps Marshal & Chief Executive",
      institution: "Federal Road Safety Corps (FRSC)",
      type: "administration",
      detail: "Led a massive digitization audit of Nigerian motorists databases. Built the award-winning National Uniform Licensing Scheme (NULS) biometric network, connecting 36 state capitals."
    },
    {
      year: "2003",
      role: "Master of Public Administration (MPA)",
      institution: "George Mason University, USA",
      type: "education",
      detail: "Studied systematic public policy, federal institution building, spatial state modeling, and comparative administration frameworks."
    },
    {
      year: "1995",
      role: "Bachelor’s Degree in Management",
      institution: "University of Nigeria, Nsukka (UNN)",
      type: "education",
      detail: "Completed foundational degree in enterprise leadership, financial budgeting, and organizational management systems."
    }
  ];

  return (
    <div className="bg-[#F7F3EC] pb-24 text-justify">
      {/* Header Profile Summary */}
      <section className="max-w-[960px] mx-auto px-6 sm:px-12 md:px-16 pt-20">
        <span className="font-sans text-[11px] font-bold tracking-[0.25em] text-[#7A7A7A] uppercase block mb-3">
          Biographical Dossier
        </span>
        <h1 className="font-serif text-[44px] sm:text-[62px] font-bold tracking-tight leading-[1.05] text-[#121212] mb-6">
          About Osita Chidoka
        </h1>
        <p className="font-serif text-[20px] sm:text-[23px] text-[#444444] italic font-medium tracking-tight mb-12 max-w-[580px] border-b border-[#D8D0C0] pb-8">
          "The greatest calling is to design systems that make integrity the easiest default choice for citizens."
        </p>
      </section>

      {/* Narrative Section */}
      <section className="max-w-[960px] mx-auto px-6 sm:px-12 md:px-16 grid grid-cols-1 md:grid-cols-3 gap-12 mb-20">
        <div className="col-span-1 border-l-2 border-[#9B7A2F] pl-6 py-2">
          <h3 className="font-serif text-[22px] font-bold text-[#121212] tracking-tight mb-4">
            System Builder
          </h3>
          <p className="font-sans text-[14.5px] text-[#7A7A7A] leading-relaxed">
            A scholar of public administration, Osita Chidoka has dedicated his administrative career to rebuilding broken processes in high-stress road transport and aviation systems.
          </p>
        </div>
        <div className="col-span-2">
          <h3 className="font-serif text-[22px] font-bold text-[#121212] tracking-tight mb-4">
            An Administrative Philosophy
          </h3>
          <p className="font-sans text-[15.5px] text-[#444444] leading-relaxed mb-4 text-justify">
            Born in Obosi, Anambra State, Osita Chidoka has combined rigorous academic training with practical, high-stakes executive authority. Having served as the Corps Marshal of the FRSC and the Minister of Aviation, his reforms have repeatedly demonstrated that developing states do not suffer from a lack of written blueprints, but from the lack of system discipline to enforce them.
          </p>
          <p className="font-sans text-[15.5px] text-[#444444] leading-relaxed text-justify">
            Under his leadership, the Federal Road Safety Corps became Nigeria's finest computer data-authoritative agency, winning standard international certification. Today, through the Athena Centre for Policy and Leadership, he focuses on training Nigeria's next generation of public administration fellowship scholars to build mechanisms that outlast their architects.
          </p>
        </div>
      </section>

      {/* Chronological career timeline */}
      <section className="max-w-[720px] mx-auto px-6 sm:px-12 md:px-0">
        <div className="mb-12">
          <span className="font-sans text-[10.5px] font-bold tracking-[0.2em] text-[#9B7A2F] uppercase block mb-2">
            CHRONOLOGICAL BRIEF
          </span>
          <h2 className="font-serif text-[28px] sm:text-[32px] font-black tracking-tight text-[#121212]">
            Track Record & Civic Path
          </h2>
        </div>

        <div className="relative border-l border-[#D8D0C0] pl-6 sm:pl-8 ml-3 sm:ml-4 flex flex-col gap-10">
          {profileTimeline.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative relative-timeline-item"
            >
              {/* Bullet points mapping */}
              <span className="absolute left-[calc(-24px-16px-1px)] sm:left-[calc(-32px-16px-2px)] top-1.5 w-7 h-7 rounded-full bg-[#121212] border border-[#9B7A2F] flex items-center justify-center text-[#9B7A2F] shadow-sm z-10">
                {item.type === 'education' ? (
                  <GraduationCap size={13} />
                ) : item.type === 'thinktank' ? (
                  <Award size={13} />
                ) : (
                  <Briefcase size={13} />
                )}
              </span>

              {/* Box container */}
              <div className="p-6 bg-white/45 border border-[#D8D0C0] rounded-sm shadow-sm hover:shadow-md transition-shadow relative">
                <span className="font-mono text-[11px] font-semibold text-[#9B7A2F] flex items-center gap-1.5 mb-2.5">
                  <Calendar size={11} /> {item.year}
                </span>
                <h3 className="font-serif text-[18px] font-bold text-[#121212] tracking-tight leading-tight mb-1">
                  {item.role}
                </h3>
                <h4 className="font-sans text-[13.5px] font-semibold text-[#7A7A7A] mb-4">
                  {item.institution}
                </h4>
                <p className="font-sans text-[14px] text-[#444444] leading-relaxed m-0 text-justify">
                  {item.detail}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Built Institutions Section */}
      <section className="max-w-[720px] mx-auto px-6 sm:px-12 md:px-0 mt-24 pt-16 border-t border-[#D8D0C0]">
        <div className="mb-12">
          <span className="font-sans text-[10.5px] font-bold tracking-[0.2em] text-[#9B7A2F] uppercase block mb-2">
            EXECUTIVE LEGACY
          </span>
          <h2 className="font-serif text-[28px] sm:text-[32px] font-black tracking-tight text-[#121212]">
            Built Institutions
          </h2>
          <p className="font-sans text-[14.5px] text-[#7A7A7A] mt-2 leading-relaxed">
            A nation remains backward until standard processes replace the individual whims of their governors. Below are the key institutions established, chaired, or configured to ensure systemic efficiency and modern leadership.
          </p>
        </div>

        <div className="flex flex-col gap-12">
          {institutionsData.map((inst, index) => (
            <motion.div
              id={inst.id}
              key={inst.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-6 bg-white/45 border border-[#D8D0C0] rounded-sm shadow-sm hover:shadow-md transition-shadow relative text-justify"
            >
              <div className="flex justify-between items-start border-b border-[#D8D0C0]/40 pb-3 mb-4">
                <div>
                  <span className="font-sans text-[10px] font-bold tracking-[0.15em] text-[#9B7A2F] uppercase block mb-1">
                    {inst.roleLabel}
                  </span>
                  <h3 className="font-serif text-[22px] font-bold text-[#121212] tracking-tight leading-tight">
                    {inst.name}
                  </h3>
                </div>
                {inst.websiteUrl && (
                  <a
                    href={inst.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-sans text-[11px] font-bold tracking-widest text-[#121212] flex items-center gap-1 uppercase hover:text-[#9B7A2F] transition-colors bg-white/80 border border-[#D8D0C0]/50 rounded-sm px-2.5 py-1 text-xs"
                  >
                    Site <ArrowUpRight size={11} />
                  </a>
                )}
              </div>

              <p className="font-sans text-[14px] font-semibold text-[#7A7A7A] italic leading-relaxed mb-3">
                {inst.tagline}
              </p>
              <p className="font-sans text-[14.5px] text-[#444444] leading-relaxed mb-4">
                {inst.description}
              </p>

              <div className="bg-[#9B7A2F]/5 p-5 rounded-xs border border-[#9B7A2F]/10">
                <span className="font-sans text-[9.5px] font-bold tracking-[0.2em] text-[#9B7A2F] uppercase block mb-3">
                  Key Milestones
                </span>
                <ul className="flex flex-col gap-2.5 list-none m-0 p-0 text-left">
                  {inst.details.map((detail, idx) => (
                    <li key={idx} className="flex gap-2.5 items-start">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#9B7A2F]/80 flex-shrink-0 mt-[7px]" />
                      <p className="font-sans text-[13.5px] text-[#444444] leading-relaxed m-0 text-justify">
                        {detail}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Dynamic biography highlights from CMS */}
      {items.filter(item => item.section === 'about' && item.status === 'published').length > 0 && (
        <section className="max-w-[720px] mx-auto px-6 sm:px-12 md:px-0 mt-20 pt-16 border-t border-[#D8D0C0]">
          <div className="mb-12">
            <span className="font-sans text-[10.5px] font-bold tracking-[0.2em] text-[#9B7A2F] uppercase block mb-2">
              SUPPLEMENTAL BIOGRAPHICAL BIO
            </span>
            <h2 className="font-serif text-[28px] sm:text-[32px] font-black tracking-tight text-[#121212]">
              Supplemental Essays & Highlights
            </h2>
          </div>
          <div className="flex flex-col gap-10">
            {items
              .filter(item => item.section === 'about' && item.status === 'published')
              .sort((a, b) => a.order - b.order)
              .map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="p-6 bg-white/45 border border-[#D8D0C0] rounded-sm shadow-sm hover:shadow-md transition-shadow relative text-justify"
                >
                  {item.imageUrl && (
                    <div className="aspect-video w-full overflow-hidden bg-[#D8D0C0]/20 mb-4 rounded-xs">
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  {item.fileUrl && item.fileUrl !== '#' && (
                    <span className="font-mono text-[9px] font-semibold text-[#9B7A2F] uppercase bg-[#9B7A2F]/10 px-2 py-0.5 rounded-sm inline-block mb-3">
                      Attached Document Available
                    </span>
                  )}
                  <h3 className="font-serif text-[19px] font-bold text-[#121212] tracking-tight mb-2">
                    {item.title}
                  </h3>
                  <p className="font-sans text-[14.5px] text-[#444444] leading-relaxed whitespace-pre-line m-0">
                    {item.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-4 items-center mt-4 pt-4 border-t border-[#D8D0C0]/30 justify-between">
                    {item.link && (
                      <a href={item.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#9B7A2F] hover:text-[#121212] uppercase tracking-wider transition-colors">
                        Learn More &rarr;
                      </a>
                    )}
                    {item.fileUrl && item.fileUrl !== '#' && (
                      <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#121212] hover:text-[#9B7A2F] uppercase tracking-wider transition-colors">
                        Download Attached Brief
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
          </div>
        </section>
      )}
    </div>
  );
};
