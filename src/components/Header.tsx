import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Search, ArrowRight } from 'lucide-react';
import { Essay } from '../types';

interface HeaderProps {
  activePage: string;
  setActivePage: (page: string) => void;
  essays: Essay[];
  onReadEssay: (essayId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activePage, setActivePage, essays, onReadEssay }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'canon', label: 'The Canon' },
    { id: 'mentorship', label: 'Mentorship' }
  ];

  const handleNavClick = (pageId: string) => {
    setActivePage(pageId);
    setIsOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredEssays = searchQuery.trim()
    ? essays.filter(e =>
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.subtitle && e.subtitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (e.content && e.content.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 5)
    : [];

  return (
    <nav className="sticky top-0 z-50 bg-[#F7F3EC] border-b border-[#D8D0C0] shadow-sm">
      <div className="max-w-[1200px] mx-auto px-6 sm:px-12 md:px-16 h-[58px] flex items-center justify-between">
        <button
          onClick={() => handleNavClick('home')}
          className="font-serif text-[18px] sm:text-[20px] font-black text-[#121212] tracking-tight hover:text-[#9B7A2F] transition-colors cursor-pointer bg-transparent border-none outline-none"
        >
          Osita Chidoka
        </button>

        {/* Desktop Container */}
        <div className="hidden sm:flex items-center gap-6 md:gap-7">
          {/* Main Navigation Links */}
          <ul className="flex gap-6 md:gap-[1.8rem] list-none m-0 p-0 items-center">
            {navLinks.map((item) => {
              const isActive = activePage === item.id;
              return (
                <li key={item.id} className="relative">
                  <button
                    onClick={() => handleNavClick(item.id)}
                    className={`font-sans text-[11px] md:text-[11.5px] font-bold tracking-widest uppercase cursor-pointer bg-transparent border-none outline-none py-1 transition-colors ${
                      isActive ? 'text-[#121212]' : 'text-[#7A7A7A] hover:text-[#121212]'
                    }`}
                  >
                    {item.label}
                  </button>
                  {isActive && (
                    <motion.div
                      layoutId="nav-underline"
                      className="absolute bottom-[-19px] left-0 right-0 h-[2px] bg-[#121212]"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </li>
              );
            })}
          </ul>

          {/* Minimal Underlined Search Bar (Styled after Reference Image) */}
          <div className="relative flex items-center ml-2">
            <div className="flex items-center border-b border-[#D8D0C0] pb-1 bg-transparent px-0.5 focus-within:border-[#9B7A2F] transition-colors duration-200">
              <Search size={14} className="text-[#9B7A2F] mr-1.5 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
                onBlur={() => {
                  // Delay to allow clicking on results
                  setTimeout(() => setShowResults(false), 250);
                }}
                placeholder="Search..."
                className="bg-transparent border-none outline-none text-[11px] font-sans w-[90px] md:w-[130px] focus:w-[120px] md:focus:w-[160px] transition-all duration-300 placeholder-[#7A7A7A]/70 text-[#121212] py-0"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-[#7A7A7A] hover:text-[#121212] ml-1 bg-transparent border-none p-0 cursor-pointer flex items-center justify-center outline-none"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Dropdown Results */}
            <AnimatePresence>
              {showResults && searchQuery.trim() && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute right-0 top-[35px] w-[300px] md:w-[350px] bg-[#FAF8F5] border border-[#D8D0C0] rounded-sm shadow-xl z-50 overflow-hidden"
                >
                  <div className="p-2 border-b border-[#D8D0C0]/50 bg-[#F3EFE6] flex justify-between items-center">
                    <span className="font-sans text-[10px] uppercase tracking-wider font-bold text-[#9B7A2F]">
                      Search Results ({filteredEssays.length})
                    </span>
                  </div>
                  
                  {filteredEssays.length > 0 ? (
                    <div className="max-h-[250px] overflow-y-auto divide-y divide-[#D8D0C0]/30">
                      {filteredEssays.map((essay) => (
                        <button
                          key={essay.id}
                          onMouseDown={(e) => {
                            // Prevent blur from closing dropdown before action completes
                            e.preventDefault();
                          }}
                          onClick={() => {
                            onReadEssay(essay.id);
                            setSearchQuery('');
                            setShowResults(false);
                          }}
                          className="w-full text-left p-3 hover:bg-[#F3EFE6] transition-colors bg-transparent border-none outline-none cursor-pointer flex flex-col"
                        >
                          <span className="font-serif text-[12.5px] font-bold text-[#121212] line-clamp-1 mb-0.5">
                            {essay.title}
                          </span>
                          <span className="font-sans text-[11px] text-[#7A7A7A]/90 line-clamp-2 leading-relaxed text-justify">
                            {essay.subtitle || essay.content?.replace(/[#*`_-]/g, '').slice(0, 100)}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-[#7A7A7A] font-sans text-xs italic">
                      No essays found for "{searchQuery}"
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Outlined "Sign In" Box Button (Styled after Reference Image) */}
          <button
            onClick={() => handleNavClick('admin')}
            className={`font-sans text-[11px] font-bold tracking-widest uppercase cursor-pointer bg-transparent border border-[#C5BCAC] hover:border-[#121212] px-[16px] py-[6px] rounded-none text-[#121212] transition-colors hover:bg-[#121212]/5 outline-none`}
          >
            Sign In
          </button>

          {/* Subscribe Button (Shifted after Sign In) */}
          <button
            onClick={() => handleNavClick('subscribe')}
            className={`group flex items-center gap-1.5 font-sans text-[11px] font-bold tracking-widest uppercase cursor-pointer bg-[#9B7A2F] text-[#FAF8F5] border border-[#9B7A2F] hover:bg-[#121212] hover:border-[#121212] px-4 py-[6px] rounded-sm transition-all duration-200 outline-none`}
          >
            <span>Subscribe</span>
            <ArrowRight 
              size={11} 
              className="transform group-hover:translate-x-1 transition-transform duration-200" 
            />
          </button>
        </div>

        {/* Hamburger / Close Icon */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex sm:hidden p-1 text-[#121212] hover:text-[#9B7A2F] transition-colors bg-transparent border-none outline-none cursor-pointer"
          aria-label="Toggle Navigation Menu"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="sm:hidden absolute top-[58px] left-0 right-0 bg-[#F7F3EC] border-b border-[#D8D0C0] px-6 py-5 flex flex-col gap-4 shadow-lg z-50 animate-fade-in"
          >
            {/* Mobile Search Bar */}
            <div className="relative w-full mb-1">
              <div className="flex items-center bg-[#FAF8F5] border border-[#D8D0C0] rounded-sm px-3 py-2 text-xs text-[#121212]">
                <Search size={14} className="text-[#9B7A2F] mr-2 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search essays..."
                  className="bg-transparent border-none outline-none text-[13px] w-full placeholder-[#7A7A7A]/75 text-[#121212]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-[#7A7A7A] hover:text-[#121212] ml-1 bg-transparent border-none p-0 cursor-pointer flex items-center justify-center outline-none"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Mobile Search Results */}
              {searchQuery.trim() && (
                <div className="absolute left-0 right-0 mt-1 bg-[#FAF8F5] border border-[#D8D0C0] rounded-sm shadow-xl z-50 max-h-[220px] overflow-y-auto divide-y divide-[#D8D0C0]/30">
                  {filteredEssays.length > 0 ? (
                    filteredEssays.map((essay) => (
                      <button
                        key={essay.id}
                        onClick={() => {
                          onReadEssay(essay.id);
                          setSearchQuery('');
                          setIsOpen(false);
                        }}
                        className="w-full text-left p-3 hover:bg-[#F3EFE6] transition-colors bg-transparent border-none outline-none cursor-pointer flex flex-col"
                      >
                        <span className="font-serif text-[13px] font-bold text-[#121212] line-clamp-1 mb-0.5">
                          {essay.title}
                        </span>
                        <span className="font-sans text-[10.5px] text-[#7A7A7A] line-clamp-1">
                          {essay.subtitle || essay.content?.slice(0, 50)}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-center text-[#7A7A7A] font-sans text-xs italic">
                      No matching essays
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile links */}
            {navLinks.map((item) => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`font-sans text-[13px] font-semibold tracking-widest uppercase text-left py-2 border-b border-dashed border-[#D8D0C0]/50 bg-transparent outline-none cursor-pointer ${
                    isActive ? 'text-[#121212] font-semibold' : 'text-[#7A7A7A]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}

            {/* Mobile Sign In */}
            <button
              onClick={() => handleNavClick('admin')}
              className={`font-sans text-[13px] font-semibold tracking-widest uppercase text-left py-2 border-b border-dashed border-[#D8D0C0]/50 bg-transparent outline-none cursor-pointer ${
                activePage === 'admin' ? 'text-[#121212] font-semibold' : 'text-[#7A7A7A]'
              }`}
            >
              Sign In
            </button>

            {/* Mobile Subscribe */}
            <button
              onClick={() => handleNavClick('subscribe')}
              className={`group flex items-center justify-between font-sans text-[12px] font-bold tracking-widest uppercase text-left py-2.5 px-4 mt-2 rounded-sm transition-colors border-none outline-none cursor-pointer w-full shadow-sm ${
                activePage === 'subscribe' ? 'bg-[#121212] text-[#FAF8F5]' : 'bg-[#9B7A2F] text-[#FAF8F5]'
              }`}
            >
              <span>Subscribe</span>
              <ArrowRight size={13} className="transform group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
