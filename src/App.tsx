import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Home } from './components/Home';
import { Canon } from './components/Canon';
import { Mentorship } from './components/Mentorship';
import { About } from './components/About';
import { Subscribe } from './components/Subscribe';
import { Admin } from './components/Admin';
import { ContentItem, getContentItems, isMockConfig } from './lib/firebaseService';
import { initialEssays } from './data';
import { Essay, Subscriber, MentorshipApp, Comment, User } from './types';

export default function App() {
  const [activePage, setActivePage] = useState<string>('home');
  const [selectedEssayId, setSelectedEssayId] = useState<string | null>(null);

  // Firestore Dynamic Content state
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loadingContent, setLoadingContent] = useState(true);

  const refreshContent = async (isAdminUser?: boolean) => {
    try {
      const items = await getContentItems(isAdminUser);
      setContentItems(items);
    } catch (e) {
      console.error("Error fetching dynamic section elements:", e);
    } finally {
      setLoadingContent(false);
    }
  };

  // Essays List state
  const [essaysList, setEssaysList] = useState<Essay[]>(() => {
    const cached = localStorage.getItem('osc_essays');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        // Fallback
      }
    }
    return initialEssays;
  });

  // Subscribers state
  const [subscribersList, setSubscribersList] = useState<Subscriber[]>(() => {
    const cached = localStorage.getItem('osc_subscribers');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        // Fallback
      }
    }
    return [
      {
        code: "OSC-SUB-283",
        name: "Amina Mohammed",
        email: "amina@athena.org",
        interests: ["Essays & Memoirs", "Governance, Policy & Database Systems"]
      },
      {
        code: "OSC-SUB-492",
        name: "Ibrahim Yusuf",
        email: "yusuf@frsc-reforms.gov.ng",
        interests: ["Governance, Policy & Database Systems", "Aviation & Infrastructure Briefs"]
      }
    ];
  });

  // Mentorship fellows applications state
  const [mentorshipApps, setMentorshipApps] = useState<MentorshipApp[]>(() => {
    const cached = localStorage.getItem('osc_mentorship_apps');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        // Fallback
      }
    }
    return [
      {
        id: "MLF-2026-4028",
        name: "Tunde Alabi",
        email: "tunde@athenacentre.org",
        discipline: "Public Policy Graduate, UNILAG",
        proposal: "Implementing localized paper-decoupling in local government revenue collection units to decrease duplicate billing arrays.",
        focus: "Ethical Public Administration",
        status: "PENDING ADMISSION REVIEW"
      }
    ];
  });

  // Comments mapping state
  const [commentsMap, setCommentsMap] = useState<Record<string, Comment[]>>(() => {
    const cached = localStorage.getItem('osc_comments');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        // Fallback
      }
    }
    return {
      "from-20-to-destiny": [
        {
          name: "Dr. Chika Opara",
          text: "An incredibly inspiring story. Public administrative systems indeed require exactly this type of bold foresight.",
          date: "May 14, 2024"
        },
        {
          name: "Abubakar Bello",
          text: "This teaches our youth the importance of preparation meeting opportunity.",
          date: "May 15, 2024"
        }
      ],
      "frsc-reform-part-1": [
        {
          name: "Engr. Yusuf",
          text: "I remember when licenses were just papers. This computerized database reform completely changed public life in Nigeria.",
          date: "September 18, 2025"
        }
      ]
    };
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Load and refresh content based on currentUser context
  useEffect(() => {
    refreshContent(currentUser?.role === 'admin');
  }, [currentUser]);

  // Synchronizers to sync local store
  useEffect(() => {
    localStorage.setItem('osc_essays', JSON.stringify(essaysList));
  }, [essaysList]);

  useEffect(() => {
    localStorage.setItem('osc_subscribers', JSON.stringify(subscribersList));
  }, [subscribersList]);

  useEffect(() => {
    localStorage.setItem('osc_mentorship_apps', JSON.stringify(mentorshipApps));
  }, [mentorshipApps]);

  useEffect(() => {
    localStorage.setItem('osc_comments', JSON.stringify(commentsMap));
  }, [commentsMap]);

  // Action dispatches to manipulate shared structures
  const handleAddNewSubscriber = (sub: Subscriber) => {
    setSubscribersList((prev) => {
      const exists = prev.some((s) => s.email.toLowerCase() === sub.email.toLowerCase());
      if (exists) return prev;
      return [sub, ...prev];
    });
  };

  const handleAddNewEssay = (essay: Essay) => {
    setEssaysList((prev) => [essay, ...prev]);
  };

  const handleApplyMentorship = (app: MentorshipApp) => {
    setMentorshipApps((prev) => [app, ...prev]);
  };

  const handleUpdateMentorshipStatus = (appId: string, status: 'PENDING ADMISSION REVIEW' | 'APPROVED') => {
    setMentorshipApps((prev) =>
      prev.map((app) => (app.id === appId ? { ...app, status } : app))
    );
  };

  const handleDeleteMentorshipApp = (appId: string) => {
    setMentorshipApps((prev) => prev.filter((app) => app.id !== appId));
  };

  const handleAddComment = (essayId: string, newComment: Comment) => {
    setCommentsMap((prev) => ({
      ...prev,
      [essayId]: [...(prev[essayId] || []), newComment]
    }));
  };

  const handleDeleteComment = (essayId: string, index: number) => {
    setCommentsMap((prev) => {
      const list = prev[essayId] || [];
      const updatedList = list.filter((_, idx) => idx !== index);
      return {
        ...prev,
        [essayId]: updatedList
      };
    });
  };

  // Dynamically map Firestore content of category "canon" into essaysList format
  const dynamicEssays: Essay[] = contentItems
    .filter(item => item.section === 'canon' && item.status === 'published')
    .map(item => ({
      id: item.id,
      title: item.title,
      subtitle: item.description.slice(0, 80) + (item.description.length > 80 ? '...' : ''),
      deck: item.description.slice(0, 160) + (item.description.length > 160 ? '...' : ''),
      category: 'Institutional Reform',
      date: new Date(item.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      year: new Date(item.createdAt).getFullYear(),
      content: item.description,
      pdfAvailable: !!item.fileUrl
    }));

  const mergedEssaysList = [...dynamicEssays, ...essaysList];

  // Find Featured Essay securely (isFeatured or first elements)
  const featuredEssay = mergedEssaysList.find((e) => e.isFeatured) || mergedEssaysList[0];

  const handleReadEssayDirectly = (essayId: string) => {
    setSelectedEssayId(essayId);
    setActivePage('canon');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageNavigation = (pageId: string) => {
    if (pageId !== 'canon') {
      setSelectedEssayId(null);
    }
    setActivePage(pageId);
  };

  const renderActiveRoute = () => {
    switch (activePage) {
      case 'home':
        return (
          <Home
            onReadEssay={handleReadEssayDirectly}
            setActivePage={handlePageNavigation}
            featuredEssay={featuredEssay}
          />
        );
       case 'canon':
        return (
          <Canon
            selectedEssayId={selectedEssayId}
            setSelectedEssayId={setSelectedEssayId}
            parentEssaysList={mergedEssaysList}
            parentCommentsMap={commentsMap}
            onAddComment={handleAddComment}
          />
        );
      case 'mentorship':
        return (
          <Mentorship parentApps={mentorshipApps} onApplyApp={handleApplyMentorship} />
        );
      case 'about':
        return <About items={contentItems} />;
      case 'subscribe':
        return <Subscribe onAddSubscriber={handleAddNewSubscriber} />;
      case 'admin':
        return (
          <Admin
            essaysList={essaysList}
            onAddEssay={handleAddNewEssay}
            subscribersList={subscribersList}
            onAddSubscriber={handleAddNewSubscriber}
            mentorshipApps={mentorshipApps}
            onUpdateAppStatus={handleUpdateMentorshipStatus}
            onDeleteApp={handleDeleteMentorshipApp}
            commentsMap={commentsMap}
            onDeleteComment={handleDeleteComment}
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            contentItems={contentItems}
            refreshContent={refreshContent}
          />
        );
      default:
        return (
          <Home
            onReadEssay={handleReadEssayDirectly}
            setActivePage={handlePageNavigation}
            featuredEssay={featuredEssay}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F7F3EC] p-0 m-0 text-[#121212] font-sans antialiased overflow-x-hidden selection:bg-[#9B7A2F]/20 selection:text-[#121212]">
      <div>
        <Header 
          activePage={activePage} 
          setActivePage={handlePageNavigation} 
          essays={mergedEssaysList}
          onReadEssay={handleReadEssayDirectly}
        />
        <main>{renderActiveRoute()}</main>
      </div>
      <Footer setActivePage={handlePageNavigation} />
    </div>
  );
}
