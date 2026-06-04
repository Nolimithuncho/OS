import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Download, CheckCircle, MessageSquare, Search, BookOpen, ArrowUpRight } from 'lucide-react';
import { Essay, Comment } from '../types';

interface CanonProps {
  selectedEssayId: string | null;
  setSelectedEssayId: (id: string | null) => void;
  parentEssaysList: Essay[];
  parentCommentsMap: Record<string, Comment[]>;
  onAddComment: (essayId: string, newComment: Comment) => void;
}

export const Canon: React.FC<CanonProps> = ({
  selectedEssayId,
  setSelectedEssayId,
  parentEssaysList,
  parentCommentsMap,
  onAddComment
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [commentName, setCommentName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [showCommentSuccess, setShowCommentSuccess] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const essays = parentEssaysList;
  const commentsMap = parentCommentsMap;

  // Extract all available categories dynamically
  const categories = useMemo(() => {
    const cats = essays.map((essay) => essay.category);
    return ['ALL', ...Array.from(new Set(cats))];
  }, [essays]);

  const activeEssay = useMemo(() => {
    return essays.find((essay) => essay.id === selectedEssayId) || null;
  }, [selectedEssayId, essays]);

  // Handle standard search & category filter
  const filteredEssays = useMemo(() => {
    return essays.filter((essay) => {
      const matchCategory = selectedCategory === 'ALL' || essay.category === selectedCategory;
      const terms = searchQuery.toLowerCase();
      const matchSearch =
        essay.title.toLowerCase().includes(terms) ||
        (essay.subtitle && essay.subtitle.toLowerCase().includes(terms)) ||
        essay.content.toLowerCase().includes(terms) ||
        essay.category.toLowerCase().includes(terms);
      return matchCategory && matchSearch;
    });
  }, [selectedCategory, searchQuery, essays]);

  // Group filtered essays by year of publication
  const groupedEssays = useMemo(() => {
    const groups: Record<number, Essay[]> = {};
    filteredEssays.forEach((essay) => {
      const year = essay.year;
      if (!groups[year]) {
        groups[year] = [];
      }
      groups[year].push(essay);
    });

    return Object.entries(groups)
      .map(([year, list]) => ({
        year: parseInt(year),
        essays: list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      }))
      .sort((a, b) => b.year - a.year);
  }, [filteredEssays]);

  // Export plain text file download
  const handleExportText = (id: string, title: string) => {
    if (!activeEssay) return;
    setDownloadingId(id);

    const docText = `OSITA CHIDOKA - THE CANON

TITLE: ${title}
DATE: ${activeEssay.date}
CATEGORY: ${activeEssay.category}

${activeEssay.content}
`;

    const blob = new Blob([docText], { type: 'text/plain' });
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = `${id}.txt`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    setTimeout(() => {
      setDownloadingId(null);
    }, 4000);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEssayId || !commentName.trim() || !commentText.trim()) return;

    const commentObj: Comment = {
      name: commentName,
      text: commentText,
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    };

    onAddComment(selectedEssayId, commentObj);
    setCommentName('');
    setCommentText('');
    setShowCommentSuccess(true);
    setTimeout(() => setShowCommentSuccess(false), 3000);
  };

  // Static publication series configuration (FRSC Reform series)
  const publicationSeries = {
    name: "FRSC Institutional Reform Series",
    parts: [
      {
        number: 1,
        title: "The Digitization of Civic Services: Computerizing Driver Records",
        essayId: "frsc-reform-part-1"
      },
      {
        number: 2,
        title: "Real-time Vehicle Verification & Decoupling Corruption Loops (En Route)",
        essayId: null
      },
      {
        number: 3,
        title: "The Ten-Fingerprint Biometric Standard & Inter-Agency Sync (En Route)",
        essayId: null
      }
    ]
  };

  return (
    <div className="bg-[#F7F3EC] min-h-[90vh]">
      <AnimatePresence mode="wait">
        {activeEssay ? (
          /* Essay Reader View */
          <motion.div
            key="reader"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-[720px] mx-auto px-6 sm:px-12 md:px-0 py-16"
          >
            {/* Back Button and Export button */}
            <div className="flex justify-between items-center mb-10 border-b border-[#D8D0C0] pb-4">
              <button
                onClick={() => setSelectedEssayId(null)}
                className="font-sans text-[12.5px] font-bold tracking-widest uppercase text-[#7A7A7A] hover:text-[#121212] flex items-center gap-1.5 cursor-pointer bg-transparent border-none outline-none py-1 transition-colors"
              >
                <ArrowLeft size={14} /> Back to Directory
              </button>
              <button
                onClick={() => handleExportText(activeEssay.id, activeEssay.title)}
                className="font-sans text-[11px] font-bold tracking-widest uppercase text-white bg-[#121212] hover:bg-[#9B7A2F] px-4 py-2 rounded-sm flex items-center gap-1.5 cursor-pointer border-none shadow-sm transition-colors"
                title="Download text document format"
              >
                <Download size={12} /> Export Document
              </button>
            </div>

            {/* Success notification popup */}
            {downloadingId === activeEssay.id && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-4 bg-[#9B7A2F]/10 border border-[#9B7A2F] text-[#9B7A2F] rounded-md text-xs font-sans tracking-wide flex items-center gap-2"
              >
                <CheckCircle size={15} />
                <span>
                  <strong>Success:</strong> Policy Memorandum downloaded securely for <strong>{activeEssay.title}</strong>. Check your download tray.
                </span>
              </motion.div>
            )}

            {/* Essay Metadata */}
            <div className="mb-10 text-center sm:text-left">
              <span className="font-sans text-[11px] font-bold tracking-[0.2em] text-[#9B7A2F] uppercase block mb-3">
                {activeEssay.category}
              </span>
              <h1 className="font-serif text-[32px] sm:text-[44px] font-black text-[#121212] leading-[1.12] tracking-tight mb-4 text-justify">
                {activeEssay.title}
              </h1>
              {activeEssay.subtitle && (
                <p className="font-serif text-[20px] sm:text-[22px] italic text-[#444444] mb-4 text-justify leading-relaxed">
                  {activeEssay.subtitle}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-[#7A7A7A] text-[13px] font-sans border-y border-[#D8D0C0]/50 py-3 mt-6">
                <span>By: <strong>Osita Chidoka</strong></span>
                <span className="text-[#C2BAA8]">•</span>
                <span>Published: {activeEssay.date}</span>
                {activeEssay.seriesName && (
                  <>
                    <span className="text-[#C2BAA8]">•</span>
                    <span className="text-white bg-[#444444] px-2 py-0.5 rounded-sm text-[11px] uppercase tracking-wider font-semibold whitespace-nowrap">
                      {activeEssay.seriesName} Part {activeEssay.seriesPart}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Render formatted memoir text with split headings */}
            <div className="text-justify font-sans text-[16.5px] leading-[1.8] text-[#121212] tracking-wide prose prose-[#121212] whitespace-pre-line mb-16">
              {activeEssay.content.split('\n\n').map((block, idx) => {
                if (block.startsWith('### ')) {
                  return (
                    <h3 key={idx} className="font-serif text-[22px] font-bold text-[#121212] mt-8 mb-4 tracking-tight leading-tight">
                      {block.replace('### ', '')}
                    </h3>
                  );
                } else if (block.startsWith('#### ')) {
                  return (
                    <h4 key={idx} className="font-sans text-[15px] font-bold text-[#9B7A2F] mt-6 mb-3 tracking-wider uppercase">
                      {block.replace('#### ', '')}
                    </h4>
                  );
                } else if (block.startsWith('> ')) {
                  return (
                    <blockquote key={idx} className="border-l-4 border-[#9B7A2F] pl-4 italic text-[#444444] my-6">
                      {block.replace('> ', '')}
                    </blockquote>
                  );
                } else {
                  return (
                    <p key={idx} className="mb-6 font-sans text-[16.5px] text-[#444444]">
                      {block}
                    </p>
                  );
                }
              })}
            </div>

            {/* Citation Disclaimer Card */}
            <div className="bg-[#9B7A2F]/5 border border-[#D8D0C0] p-6 rounded-sm mb-16 flex items-start gap-4">
              <BookOpen size={22} className="text-[#9B7A2F] flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="font-serif text-[15px] font-bold text-[#121212] mb-1">
                  Academic Citation and Circulation Note
                </h5>
                <p className="font-sans text-[13.5px] text-[#444444] leading-relaxed">
                  The opinions and research published in The Canon are authorized library records of Osita Chidoka. They may be reproduced, cited, or taught in whole or in part, provided credit is given directly to the author and the Athena Centre for Policy and Leadership.
                </p>
              </div>
            </div>

            {/* Public Responses Section */}
            <div className="border-t border-[#D8D0C0] pt-12">
              <h3 className="font-serif text-[22px] font-bold text-[#121212] mb-6 flex items-center gap-2">
                <MessageSquare size={20} className="text-[#9B7A2F]" /> Public Discourse & Responses
              </h3>

              <div className="flex flex-col gap-6 mb-10">
                {(commentsMap[activeEssay.id] || []).map((comment, index) => (
                  <div key={index} className="p-4 bg-[#F7F3EC]/50 border border-[#D8D0C0] rounded-sm">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-sans font-bold text-[14px] text-[#121212]">{comment.name}</span>
                      <span className="font-sans text-[12px] text-[#7A7A7A]">{comment.date}</span>
                    </div>
                    <p className="font-sans text-[14.5px] text-[#444444] leading-relaxed text-justify">{comment.text}</p>
                  </div>
                ))}
                {(!commentsMap[activeEssay.id] || commentsMap[activeEssay.id].length === 0) && (
                  <p className="font-serif text-[14.5px] italic text-[#7A7A7A]">
                    No public responses submitted yet. Be the first to draft a commentary statement below.
                  </p>
                )}
              </div>

              {/* Commentary form */}
              <form onSubmit={handleCommentSubmit} className="border border-[#D8D0C0] p-6 bg-[#F7F3EC] rounded-sm">
                <h4 className="font-sans text-[11px] font-bold tracking-[0.2em] text-[#7A7A7A] uppercase mb-4 block">
                  Draft a Response Memo
                </h4>
                {showCommentSuccess && (
                  <div className="mb-4 p-3 bg-green-50 text-green-700 bg-emerald-500/10 border border-emerald-500/30 text-xs font-sans tracking-wide rounded-sm flex items-center gap-1.5 animate-pulse">
                    <CheckCircle size={14} className="text-emerald-500" />
                    Comment submitted successfully to private review portal.
                  </div>
                )}
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 gap-1">
                    <label className="font-sans text-[11px] font-semibold text-[#7A7A7A] tracking-wider uppercase">
                      Your Name/Institution
                    </label>
                    <input
                      type="text"
                      required
                      value={commentName}
                      onChange={(e) => setCommentName(e.target.value)}
                      placeholder="e.g. Professor Alao, University of Ibadan"
                      className="bg-transparent border-b border-[#D8D0C0] outline-none font-sans text-[14.5px] text-[#121212] py-2 placeholder-[#C2BAA8] focus:border-[#9B7A2F] transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    <label className="font-sans text-[11px] font-semibold text-[#7A7A7A] tracking-wider uppercase">
                      Commentary Insight
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Type your strategic analysis or peer response text..."
                      className="bg-transparent border border-[#D8D0C0] outline-none font-sans text-[14.5px] text-[#121212] p-3 rounded-sm placeholder-[#C2BAA8] focus:border-[#9B7A2F] focus:ring-1 focus:ring-[#9B7A2F] transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    className="font-sans text-[11px] font-bold tracking-widest uppercase text-white bg-[#121212] hover:bg-[#9B7A2F] py-2.5 px-6 rounded-md border-0 cursor-pointer text-center mr-auto transition-colors"
                  >
                    Publish Commentary
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        ) : (
          /* Essays Directory View */
          <motion.div
            key="directory"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="pb-20"
          >
            {/* Header Text */}
            <div className="max-w-[960px] mx-auto px-6 sm:px-12 md:px-16 pt-20">
              <span className="font-sans text-[11px] font-bold tracking-[0.2em] text-[#9B7A2F] uppercase block mb-3">
                Publications & Speeches
              </span>
              <h1 className="font-serif text-[44px] sm:text-[62px] font-bold tracking-tight leading-[1.05] text-[#121212]">
                The Canon
              </h1>
              <p className="font-serif text-[19px] italic text-[#444444] leading-relaxed max-w-[560px] my-5 text-justify">
                A structured collection of essays, national reform briefings, columns, and letters examining governance ethics.
              </p>
              <p className="font-sans text-[15px] text-[#7A7A7A] max-w-[560px] leading-relaxed mb-12 text-justify">
                Click on any document below to open the complete authenticated reading mode, download as a formatted policy memo, or draft public comments.
              </p>
            </div>

            {/* Block Dark Publication Series */}
            <div className="bg-[#121212] text-white border-y border-[#D8D0C0] py-12 mb-16">
              <div className="max-w-[960px] mx-auto px-6 sm:px-12 md:px-16">
                <span className="font-sans text-[10.5px] font-bold tracking-[0.25em] text-[#9B7A2F] uppercase block mb-3 font-semibold">
                  Featured Publication Series
                </span>
                <h3 className="font-serif text-[24px] sm:text-[28px] font-bold mb-8 leading-tight tracking-tight text-white">
                  {publicationSeries.name}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                  {publicationSeries.parts.map((p) => {
                    const hasLink = p.essayId !== null;
                    return (
                      <div
                        key={p.number}
                        onClick={() => hasLink && setSelectedEssayId(p.essayId)}
                        className={`part-card flex flex-col justify-between p-5 border border-[#444444] rounded-sm transition-all ${
                          hasLink
                            ? 'hover:border-[#9B7A2F] hover:bg-[#444444]/30 cursor-pointer'
                            : 'opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div>
                          <span className="font-sans text-[9px] font-bold tracking-widest text-[#7A7A7A] uppercase block mb-2">
                            PART 0{p.number}
                          </span>
                          <h4 className="font-serif text-[16px] font-semibold text-[#F7F3EC] leading-[1.3] mb-4">
                            {p.title}
                          </h4>
                        </div>
                        <div className="flex items-center justify-between mt-4 border-t border-[#444444]/60 pt-3">
                          <span className="font-sans text-[10px] font-bold tracking-widest text-[#9B7A2F] uppercase">
                            {hasLink ? 'PUBLISHED' : 'IN RESEARCH'}
                          </span>
                          {hasLink && <ArrowUpRight size={14} className="text-[#9B7A2F]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Filter bar */}
            <div className="sticky top-[58px] z-40 bg-[#F7F3EC] border-b border-[#D8D0C0] shadow-sm">
              <div className="max-w-[960px] mx-auto px-6 sm:px-12 md:px-16 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 h-auto md:h-[54px] py-4 md:py-0">
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-none max-w-full">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`font-sans text-[11px] font-medium tracking-widest uppercase px-3 py-1 cursor-pointer transition-all bg-transparent border-0 outline-none whitespace-nowrap ${
                        selectedCategory === cat
                          ? 'text-[#121212] font-semibold border-b-2 border-[#121212]'
                          : 'text-[#7A7A7A] hover:text-[#121212]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 border-b border-[#D8D0C0] pb-1 w-full md:w-[240px]">
                  <Search size={15} className="text-[#7A7A7A]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search titles, abstracts..."
                    className="bg-transparent border-none outline-none font-sans text-[13.5px] text-[#121212] w-full placeholder-[#C2BAA8] italic"
                  />
                </div>
              </div>
            </div>

            {/* Indicator of found results quantity */}
            <div className="max-w-[960px] mx-auto px-6 sm:px-12 md:px-16 pt-8 pb-2 flex justify-between items-center">
              <span className="font-serif text-[14px] italic text-[#7A7A7A]">
                Showing <strong className="text-[#121212] font-semibold font-sans not-italic text-[16px]">{filteredEssays.length}</strong> essays in {selectedCategory === 'ALL' ? 'all fields' : selectedCategory}
              </span>
            </div>

            {/* List Grouped by Year */}
            <div className="max-w-[960px] mx-auto px-6 sm:px-12 md:px-16 pt-6">
              {groupedEssays.length > 0 ? (
                <div className="flex flex-col gap-12">
                  {groupedEssays.map(({ year, essays: list }) => (
                    <div key={year} className="grid grid-cols-1 md:grid-cols-4 gap-6 hover:bg-[#121212]/[0.01] p-2 rounded-md transition-colors">
                      <div className="md:col-span-1 pt-6">
                        <span className="font-serif text-[48px] sm:text-[56px] font-black text-[#C2BAA8]/45 inline-block leading-none tracking-tighter">
                          {year}
                        </span>
                      </div>
                      <div className="md:col-span-3 border-t border-[#D8D0C0]">
                        <div className="divide-y divide-[#D8D0C0]">
                          {list.map((essay) => (
                            <div
                              key={essay.id}
                              onClick={() => setSelectedEssayId(essay.id)}
                              className="group py-6 cursor-pointer flex flex-col justify-between gap-2"
                            >
                              <div className="flex justify-between items-start gap-4">
                                <h3 className="font-serif text-[20px] font-bold text-[#121212] group-hover:text-[#9B7A2F] transition-colors leading-[1.3] text-justify">
                                  {essay.title}
                                </h3>
                                <span className="font-sans text-[12.5px] text-[#7A7A7A] whitespace-nowrap pt-1">
                                  {essay.date}
                                </span>
                              </div>
                              {essay.subtitle && (
                                <p className="font-sans text-[14.5px] text-[#444444] italic">
                                  {essay.subtitle}
                                </p>
                              )}
                              {essay.deck && (
                                <p className="font-sans text-[14px] text-[#7A7A7A] line-clamp-2 leading-relaxed mt-1 text-justify">
                                  {essay.deck}
                                </p>
                              )}
                              <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
                                <div className="flex items-center gap-3">
                                  <span className="font-sans text-[10.5px] font-bold tracking-[0.14em] uppercase text-[#7A7A7A]">
                                    {essay.category}
                                  </span>
                                  {essay.seriesName && (
                                    <span className="font-sans text-[9px] font-bold tracking-wider uppercase text-white bg-[#444444] px-2 py-0.5 rounded-sm">
                                      {essay.seriesName} Part {essay.seriesPart}
                                    </span>
                                  )}
                                </div>
                                {essay.pdfAvailable ? (
                                  <span className="font-sans text-[10px] font-bold tracking-[0.14em] uppercase text-[#9B7A2F] flex items-center gap-1">
                                    <Download size={11} /> Memo Available
                                  </span>
                                ) : (
                                  <span className="font-sans text-[10px] font-bold tracking-[0.14em] uppercase text-[#7A7A7A] flex items-center gap-1">
                                    Read Online
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 border border-dashed border-[#D8D0C0] rounded-sm bg-[#F7F3EC]/50">
                  <p className="font-serif text-[22px] italic text-[#7A7A7A]">
                    No policy papers match your query "{searchQuery}"
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('ALL');
                    }}
                    className="mt-4 font-sans text-[12px] font-semibold tracking-widest uppercase text-[#9B7A2F] border-b border-[#9B7A2F] pb-0.5 cursor-pointer bg-transparent border-0 outline-none hover:text-[#121212] hover:border-[#121212] transition-colors"
                  >
                    Reset Directory filters
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
