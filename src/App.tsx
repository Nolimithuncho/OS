import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Home } from './components/Home';
import { Canon } from './components/Canon';
import { Mentorship } from './components/Mentorship';
import { About } from './components/About';
import { Subscribe } from './components/Subscribe';
import { Admin } from './components/Admin';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { 
  ContentItem, 
  getContentItems, 
  isMockConfig,
  getSubscribers, 
  getSubscriberByEmail,
  createSubscriber, 
  deleteSubscriber,
  getMentorshipApps, 
  createMentorshipApp, 
  updateMentorshipAppStatus, 
  deleteMentorshipApp,
  getComments, 
  createComment, 
  deleteComment,
  FirebaseComment,
  getAdmins,
  getDecisionResponses,
  createDecisionResponse,
  deleteDecisionResponse,
  FirebaseDecisionResponse
} from './lib/firebaseService';
import { initialEssays } from './data';
import { Essay, Subscriber, MentorshipApp, Comment, User, DecisionResponse } from './types';

export default function App() {
  const [activePage, setActivePage] = useState<string>(() => {
    const pathname = window.location.pathname;
    const hash = window.location.hash;
    const search = window.location.search;
    if (pathname === '/admin' || pathname.endsWith('/admin') || hash === '#/admin' || hash === '#admin' || search.includes('admin') || search.includes('page=admin')) {
      return 'admin';
    }
    if (pathname === '/canon' || hash === '#/canon' || hash === '#canon') {
      return 'canon';
    }
    if (pathname === '/mentorship' || hash === '#/mentorship' || hash === '#mentorship') {
      return 'mentorship';
    }
    if (pathname === '/about' || hash === '#/about' || hash === '#about') {
      return 'about';
    }
    if (pathname === '/subscribe' || hash === '#/subscribe' || hash === '#subscribe') {
      return 'subscribe';
    }
    return 'home';
  });
  const [selectedEssayId, setSelectedEssayId] = useState<string | null>(null);

  // Firestore Dynamic Content state
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loadingContent, setLoadingContent] = useState(true);

  const refreshContent = async (isAdminUser?: boolean) => {
    try {
      const isUserAdmin = isAdminUser !== undefined ? isAdminUser : (currentUser?.role === 'admin');
      const items = await getContentItems(isUserAdmin);
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

  const [decisionResponses, setDecisionResponses] = useState<DecisionResponse[]>(() => {
    const cached = localStorage.getItem('osc_dec_responses');
    return cached ? JSON.parse(cached) : [];
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Sync additional Firestore collections
  const syncFirestoreCollections = async (isAdminUser?: boolean) => {
    try {
      // 1. Fetch Subscribers from Firestore (available for fully registered elements)
      if (isAdminUser) {
        const subs = await getSubscribers();
        if (subs) {
          setSubscribersList(subs as any);
        }
      }

      // 2. Fetch Mentorship applications
      const apps = await getMentorshipApps(isAdminUser);
      if (apps) {
        setMentorshipApps(apps as any);
      }

      // 3. Fetch comments
      const rawComments = await getComments();
      if (rawComments && rawComments.length > 0) {
        const newCommentsMap: Record<string, Comment[]> = {};
        rawComments.forEach((c) => {
          if (!newCommentsMap[c.essayId]) {
            newCommentsMap[c.essayId] = [];
          }
          newCommentsMap[c.essayId].push({
            name: c.name,
            text: c.text,
            date: new Date(c.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            }),
            id: c.id,
            userId: c.userId
          } as any);
        });
        setCommentsMap(newCommentsMap);
      }

      // 4. Fetch Fellowship Decision Responses from Firestore if admin
      if (isAdminUser) {
        const reps = await getDecisionResponses();
        if (reps) {
          setDecisionResponses(reps as any);
        }
      }
    } catch (err) {
      console.error("Failed to sync Firestore collections on runtime:", err);
    }
  };

  // Setup actual Firebase Authentication Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const email = firebaseUser.email || '';
        const name = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Authorized User';
        
        // Boostrapped admin list verification or database-configured admins
        const systemAdmins = ['japhetprosper13@gmail.com', 'admin@chancellery.org'];
        let isUserAdmin = systemAdmins.includes(email.toLowerCase().trim());
        
        if (!isUserAdmin) {
          try {
            const extraAdmins = await getAdmins();
            isUserAdmin = extraAdmins.some(a => a.email.toLowerCase().trim() === email.toLowerCase().trim());
          } catch (e) {
            console.error("Firestore admin email check failed:", e);
          }
        }
        
        if (isUserAdmin) {
          setCurrentUser({
            role: 'admin',
            email: email,
            name: name
          });
        } else {
          try {
            // Check subscribers securely by single document ID lookup
            const foundSub = await getSubscriberByEmail(email);
            
            if (foundSub) {
              setCurrentUser({
                role: 'subscriber',
                email: email,
                name: foundSub.name || name,
                code: foundSub.code
              });
            } else {
              // Create dynamic subscriber record on authenticating
              const randomCode = 'OSC-SUB-' + Math.floor(100 + Math.random() * 900);
              const temporarySub = {
                code: randomCode,
                name: name,
                email: email,
                interests: ["Essays & Memoirs"]
              };
              
              await createSubscriber(temporarySub);
              setCurrentUser({
                role: 'subscriber',
                email: email,
                name: name,
                code: randomCode
              });
            }
          } catch (e) {
            // Fallback for simple subscribers offline tracking
            setCurrentUser({
              role: 'subscriber',
              email: email,
              name: name,
              code: 'OSC-SUB-' + Math.floor(100 + Math.random() * 900)
            });
          }
        }
      } else {
        setCurrentUser(null);
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Synchronize routing state on browser back/forward buttons or hash change
  useEffect(() => {
    const handleUrlRouting = () => {
      const pathname = window.location.pathname;
      const hash = window.location.hash;
      const search = window.location.search;

      let page = 'home';
      if (pathname === '/admin' || pathname.endsWith('/admin') || hash === '#/admin' || hash === '#admin' || search.includes('admin') || search.includes('page=admin')) {
        page = 'admin';
      } else if (pathname === '/canon' || hash === '#/canon' || hash === '#canon') {
        page = 'canon';
      } else if (pathname === '/mentorship' || hash === '#/mentorship' || hash === '#mentorship') {
        page = 'mentorship';
      } else if (pathname === '/about' || hash === '#/about' || hash === '#about') {
        page = 'about';
      } else if (pathname === '/subscribe' || hash === '#/subscribe' || hash === '#subscribe') {
        page = 'subscribe';
      }

      setActivePage(page);

      // Extract optional essay param securely
      const searchParams = new URLSearchParams(window.location.search);
      const essayId = searchParams.get('essay');
      if (essayId) {
        setSelectedEssayId(essayId);
      } else if (page !== 'canon') {
        setSelectedEssayId(null);
      }
    };

    window.addEventListener('popstate', handleUrlRouting);
    window.addEventListener('hashchange', handleUrlRouting);

    // Run initial check for custom query parameters
    const searchParams = new URLSearchParams(window.location.search);
    const essayId = searchParams.get('essay');
    if (essayId) {
      setSelectedEssayId(essayId);
    }

    return () => {
      window.removeEventListener('popstate', handleUrlRouting);
      window.removeEventListener('hashchange', handleUrlRouting);
    };
  }, []);

  // Load and refresh content based on currentUser context
  useEffect(() => {
    refreshContent(currentUser?.role === 'admin');
    syncFirestoreCollections(currentUser?.role === 'admin');
  }, [currentUser]);

  // Synchronizers to sync local store fallback
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

  useEffect(() => {
    localStorage.setItem('osc_dec_responses', JSON.stringify(decisionResponses));
  }, [decisionResponses]);

  // Action dispatches to manipulate shared structures with Firestore endpoints
  const handleAddNewSubscriber = async (sub: Subscriber) => {
    try {
      const addedSub = await createSubscriber({
        code: sub.code,
        name: sub.name,
        email: sub.email,
        interests: sub.interests
      });
      setSubscribersList((prev) => {
        const filtered = prev.filter((s) => s.email.toLowerCase() !== sub.email.toLowerCase());
        return [addedSub, ...filtered];
      });
    } catch (err) {
      console.error("Subscriber write fallback:", err);
      setSubscribersList((prev) => {
        const exists = prev.some((s) => s.email.toLowerCase() === sub.email.toLowerCase());
        if (exists) return prev;
        return [sub, ...prev];
      });
    }
  };

  const handleAddNewEssay = (essay: Essay) => {
    setEssaysList((prev) => [essay, ...prev]);
  };

  const handleApplyMentorship = async (app: MentorshipApp) => {
    try {
      const createdApp = await createMentorshipApp({
        id: app.id,
        name: app.name,
        email: app.email,
        discipline: app.discipline,
        proposal: app.proposal,
        focus: app.focus,
        status: app.status,
        userId: auth.currentUser?.uid || 'guest'
      });
      setMentorshipApps((prev) => [createdApp as any, ...prev.filter(a => a.id !== app.id)]);
    } catch (err) {
      console.error("Mentorship apply fallback:", err);
      setMentorshipApps((prev) => [app, ...prev]);
    }
  };

  const handleUpdateMentorshipStatus = async (
    appId: string, 
    status: 'PENDING ADMISSION REVIEW' | 'APPROVED' | 'DECLINED',
    feedback?: string
  ) => {
    try {
      await updateMentorshipAppStatus(appId, status);
      setMentorshipApps((prev) =>
        prev.map((app) => (app.id === appId ? { ...app, status } : app))
      );

      // Save a structured decision response record to Firestore
      if (status === 'APPROVED' || status === 'DECLINED') {
        const app = mentorshipApps.find(a => a.id === appId);
        if (app) {
          const finalFeedback = feedback?.trim() || `Administrative review complete. Fellowship application was ${status === 'APPROVED' ? 'approved' : 'declined'}.`;
          const responseId = `resp-${Date.now()}`;
          const responseRecord: DecisionResponse = {
            id: responseId,
            appId: appId,
            applicantName: app.name,
            applicantEmail: app.email,
            status,
            feedback: finalFeedback,
            respondedAt: new Date().toISOString(),
            respondedBy: currentUser?.email || 'admin@chancellery.org'
          };
          
          await createDecisionResponse(responseRecord);
          setDecisionResponses((prev) => [responseRecord, ...prev]);
        }
      }
    } catch (err) {
      console.error("Mentorship state write failure:", err);
      setMentorshipApps((prev) =>
        prev.map((app) => (app.id === appId ? { ...app, status } : app))
      );
    }
  };

  const handleDeleteMentorshipApp = async (appId: string) => {
    try {
      await deleteMentorshipApp(appId);
      setMentorshipApps((prev) => prev.filter((app) => app.id !== appId));
    } catch (err) {
      console.error("Mentorship delete failure:", err);
      setMentorshipApps((prev) => prev.filter((app) => app.id !== appId));
    }
  };

  const handleDeleteDecisionResponse = async (id: string) => {
    try {
      await deleteDecisionResponse(id);
      setDecisionResponses((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Decision response delete failure:", err);
      setDecisionResponses((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const handleDeleteSubscriber = async (email: string) => {
    try {
      await deleteSubscriber(email);
      setSubscribersList((prev) => prev.filter((s) => s.email.toLowerCase() !== email.toLowerCase()));
    } catch (err) {
      console.error("Subscriber delete failure:", err);
      setSubscribersList((prev) => prev.filter((s) => s.email.toLowerCase() !== email.toLowerCase()));
    }
  };

  const handleDeleteEssay = (id: string) => {
    setEssaysList((prev) => prev.filter((e) => e.id !== id));
  };

  const handleAddComment = async (essayId: string, newComment: Comment) => {
    try {
      const createdCmt = await createComment({
        essayId,
        name: newComment.name,
        text: newComment.text,
        createdAt: new Date().toISOString(),
        userId: auth.currentUser?.uid || 'guest'
      });
      
      const mappedCmt: Comment = {
        name: createdCmt.name,
        text: createdCmt.text,
        date: new Date(createdCmt.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        id: createdCmt.id,
        userId: createdCmt.userId
      } as any;

      setCommentsMap((prev) => ({
        ...prev,
        [essayId]: [...(prev[essayId] || []), mappedCmt]
      }));
    } catch (err) {
      console.error("Comment create failure:", err);
      setCommentsMap((prev) => ({
        ...prev,
        [essayId]: [...(prev[essayId] || []), newComment]
      }));
    }
  };

  const handleDeleteComment = async (essayId: string, index: number) => {
    const list = commentsMap[essayId] || [];
    const targetCmt = list[index] as any;

    if (targetCmt && targetCmt.id) {
      try {
        await deleteComment(targetCmt.id);
      } catch (err) {
        console.error("Comment delete failure:", err);
      }
    }

    setCommentsMap((prev) => {
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
    
    // Smoothly push path history
    const targetPath = `/canon?essay=${essayId}`;
    if (window.location.pathname + window.location.search !== targetPath) {
      window.history.pushState({ page: 'canon', essayId }, '', targetPath);
    }
  };

  const handlePageNavigation = (pageId: string) => {
    if (pageId !== 'canon') {
      setSelectedEssayId(null);
    }
    setActivePage(pageId);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Smoothly push page pathname history
    const targetPath = pageId === 'home' ? '/' : `/${pageId}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ page: pageId }, '', targetPath);
    }
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
            currentUser={currentUser}
            contentItems={contentItems}
          />
        );
      case 'mentorship':
        return (
          <Mentorship parentApps={mentorshipApps} onApplyApp={handleApplyMentorship} currentUser={currentUser} />
        );
      case 'about':
        return <About items={contentItems} />;
      case 'subscribe':
        return <Subscribe onAddSubscriber={handleAddNewSubscriber} currentUser={currentUser} />;
      case 'admin':
        return (
          <Admin
            essaysList={essaysList}
            onAddEssay={handleAddNewEssay}
            onDeleteEssay={handleDeleteEssay}
            subscribersList={subscribersList}
            onAddSubscriber={handleAddNewSubscriber}
            onDeleteSubscriber={handleDeleteSubscriber}
            mentorshipApps={mentorshipApps}
            onUpdateAppStatus={handleUpdateMentorshipStatus}
            onDeleteApp={handleDeleteMentorshipApp}
            commentsMap={commentsMap}
            onDeleteComment={handleDeleteComment}
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            contentItems={contentItems}
            refreshContent={refreshContent}
            decisionResponses={decisionResponses}
            onDeleteDecisionResponse={handleDeleteDecisionResponse}
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
          currentUser={currentUser}
        />
        <main>{renderActiveRoute()}</main>
      </div>
      <Footer setActivePage={handlePageNavigation} />
    </div>
  );
}
