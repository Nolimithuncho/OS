import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, BookOpen, Users, MessageSquare, PlusCircle, CheckCircle, Trash2, Key, AlertCircle, FileText, Search, ShieldAlert, BadgeInfo, FolderEdit, Settings, Edit3, Image, FileUp, Globe, Eye, EyeOff, Loader2, Mail, ArrowRight } from 'lucide-react';
import { Essay, Subscriber, MentorshipApp, Comment, User, DecisionResponse } from '../types';
import { ContentItem, uploadFile, createContentItem, updateContentItem, deleteContentItem, isMockConfig, FirebaseAdmin, getAdmins, createAdmin, deleteAdmin, getAdminPassphrase, updateAdminPassphrase, getAdminUserByEmail } from '../lib/firebaseService';
import { signOut, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

interface AdminProps {
  essaysList: Essay[];
  onAddEssay: (essay: Essay) => void;
  onDeleteEssay?: (essayId: string) => void;
  subscribersList: Subscriber[];
  onAddSubscriber: (subscriber: Subscriber) => void;
  onDeleteSubscriber?: (email: string) => Promise<void>;
  mentorshipApps: MentorshipApp[];
  onUpdateAppStatus: (appId: string, status: 'PENDING ADMISSION REVIEW' | 'APPROVED' | 'DECLINED', feedback?: string) => void;
  onDeleteApp: (appId: string) => void;
  commentsMap: Record<string, Comment[]>;
  onDeleteComment: (essayId: string, idx: number) => void;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  contentItems: ContentItem[];
  refreshContent: () => Promise<void>;
  decisionResponses?: DecisionResponse[];
  onDeleteDecisionResponse?: (id: string) => Promise<void>;
}

export const Admin: React.FC<AdminProps> = ({
  essaysList,
  onAddEssay,
  onDeleteEssay,
  subscribersList,
  onAddSubscriber,
  onDeleteSubscriber,
  mentorshipApps,
  onUpdateAppStatus,
  onDeleteApp,
  commentsMap,
  onDeleteComment,
  currentUser,
  setCurrentUser,
  contentItems,
  refreshContent,
  decisionResponses = [],
  onDeleteDecisionResponse
}) => {
  // Login flow states
  const [adminEmail, setAdminEmail] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Dashboard navigation tab: 'overview' | 'essays' | 'subscribers' | 'mentorship' | 'responses' | 'comments' | 'cms' | 'settings'
  const [activeTab, setActiveTab] = useState<'overview' | 'essays' | 'subscribers' | 'mentorship' | 'responses' | 'comments' | 'cms' | 'settings'>('overview');

  // Credentials Setup and Settings states
  const [adminsList, setAdminsList] = useState<FirebaseAdmin[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [consolePassphrase, setConsolePassphrase] = useState('');
  const [settingsMessage, setSettingsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Search filter states inside dashboards
  const [subSearch, setSubSearch] = useState('');
  const [mentorshipSearch, setMentorshipSearch] = useState('');

  // Essay Publisher Form States
  const [essayTitle, setEssayTitle] = useState('');
  const [essaySubtitle, setEssaySubtitle] = useState('');
  const [essayDeck, setEssayDeck] = useState('');
  const [essayCategory, setEssayCategory] = useState('Memoirs');
  const [essayContent, setEssayContent] = useState('');
  const [essayYear, setEssayYear] = useState<number>(new Date().getFullYear());
  const [essaySuccess, setEssaySuccess] = useState(false);

  // Firestore Content CMS Form States
  const [cmsSection, setCmsSection] = useState<'about' | 'canon' | 'documents' | 'gallery'>('about');
  const [cmsTitle, setCmsTitle] = useState('');
  const [cmsDescription, setCmsDescription] = useState('');
  const [cmsOrder, setCmsOrder] = useState<number>(1);
  const [cmsStatus, setCmsStatus] = useState<'published' | 'draft'>('published');
  const [cmsLink, setCmsLink] = useState('');
  
  // File uploads
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  
  // Existing uploaded references
  const [cmsImageUrl, setCmsImageUrl] = useState('');
  const [cmsFileUrl, setCmsFileUrl] = useState('');
  const [cmsFileType, setCmsFileType] = useState('');

  // Editing state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [decidingAppId, setDecidingAppId] = useState<string | null>(null);
  const [decisionType, setDecisionType] = useState<'APPROVED' | 'DECLINED' | null>(null);
  const [decisionFeedback, setDecisionFeedback] = useState('');
  const [cmsLoading, setCmsLoading] = useState(false);
  const [cmsMessage, setCmsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [cmsFilterSection, setCmsFilterSection] = useState<'all' | 'about' | 'canon' | 'documents' | 'gallery'>('all');

  const resetCmsForm = () => {
    setEditingItemId(null);
    setCmsTitle('');
    setCmsDescription('');
    setCmsOrder(1);
    setCmsStatus('published');
    setCmsLink('');
    setImageFile(null);
    setDocFile(null);
    setCmsImageUrl('');
    setCmsFileUrl('');
    setCmsFileType('');
  };

  // Load settings and admin email lists if auth role resolves to admin
  useEffect(() => {
    if (currentUser?.role === 'admin') {
      const loadSettings = async () => {
        try {
          const admins = await getAdmins();
          setAdminsList(admins);
          
          const pass = await getAdminPassphrase();
          setConsolePassphrase(pass);
        } catch (e) {
          console.error("Failed loading administrative directories:", e);
        }
      };
      loadSettings();
    }
  }, [currentUser]);

  // Handle adding a new authorized admin email to Firebase
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsMessage(null);
    if (!newAdminEmail.trim() || !newAdminEmail.includes('@')) {
      setSettingsMessage({ type: 'error', text: 'Please enter a valid Google email address.' });
      return;
    }

    setSettingsLoading(true);
    try {
      const added = await createAdmin(newAdminEmail);
      setAdminsList(prev => [added, ...prev.filter(a => a.email !== added.email)]);
      setNewAdminEmail('');
      setSettingsMessage({ type: 'success', text: `Successfully authorized admin access for ${added.email}.` });
    } catch (err: any) {
      console.error(err);
      setSettingsMessage({ type: 'error', text: 'Failed to authorize email access. Verify you have network connectivity.' });
    } finally {
      setSettingsLoading(false);
    }
  };

  // Handle removing/revoking an authorized admin email
  const handleRemoveAdmin = async (email: string) => {
    if (!window.confirm(`Are you sure you want to revoke moderator privileges for ${email}?`)) {
      return;
    }

    setSettingsMessage(null);
    setSettingsLoading(true);
    try {
      await deleteAdmin(email);
      setAdminsList(prev => prev.filter(a => a.email !== email));
      setSettingsMessage({ type: 'success', text: `Revoked admin privileges for ${email}.` });
    } catch (err: any) {
      console.error(err);
      setSettingsMessage({ type: 'error', text: 'Failed to revoke email access privileges.' });
    } finally {
      setSettingsLoading(false);
    }
  };

  // Handle updating the fallback passphrase
  const handleUpdatePassphrase = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsMessage(null);
    if (!consolePassphrase.trim() || consolePassphrase.length < 4) {
      setSettingsMessage({ type: 'error', text: 'Passphrase must be at least 4 characters long.' });
      return;
    }

    setSettingsLoading(true);
    try {
      await updateAdminPassphrase(consolePassphrase);
      setSettingsMessage({ type: 'success', text: 'Console access passphrase updated successfully.' });
    } catch (err: any) {
      console.error(err);
      setSettingsMessage({ type: 'error', text: 'Failed to update access passphrase.' });
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleCmsFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmsTitle.trim() || !cmsDescription.trim()) {
      setCmsMessage({ type: 'error', text: 'Title and Description body text are required.' });
      return;
    }
    
    setCmsLoading(true);
    setCmsMessage(null);
    
    try {
      let finalImageUrl = cmsImageUrl;
      let finalFileUrl = cmsFileUrl;
      let finalFileType = cmsFileType;
      
      // 1. Upload image if selected
      if (imageFile) {
        const { url } = await uploadFile(imageFile, 'gallery_images');
        finalImageUrl = url;
      }
      
      // 2. Upload document/file if selected
      if (docFile) {
        const { url, fileType } = await uploadFile(docFile, 'documents');
        finalFileUrl = url;
        finalFileType = fileType;
      }
      
      // If none, but it is standard documents section, set mock file type
      if (cmsSection === 'documents' && !finalFileType) {
        finalFileType = 'pdf';
      }
      if (cmsSection === 'gallery' && !finalFileType) {
        finalFileType = 'image';
      }

      if (editingItemId) {
        // Edit Mode
        await updateContentItem(editingItemId, {
          section: cmsSection,
          title: cmsTitle.trim(),
          description: cmsDescription.trim(),
          order: Number(cmsOrder) || 1,
          status: cmsStatus,
          link: cmsLink.trim() || undefined,
          imageUrl: finalImageUrl || undefined,
          fileUrl: finalFileUrl || undefined,
          fileType: finalFileType || undefined
        });
        setCmsMessage({ type: 'success', text: 'Document content updated successfully in Firestore!' });
      } else {
        // Create Mode
        await createContentItem({
          section: cmsSection,
          title: cmsTitle.trim(),
          description: cmsDescription.trim(),
          order: Number(cmsOrder) || 1,
          status: cmsStatus,
          link: cmsLink.trim() || undefined,
          imageUrl: finalImageUrl || undefined,
          fileUrl: finalFileUrl || undefined,
          fileType: finalFileType || undefined
        });
        setCmsMessage({ type: 'success', text: 'New content published successfully to Firestore!' });
      }
      
      // Reset form variables
      resetCmsForm();
      await refreshContent();
    } catch (error) {
      console.error(error);
      setCmsMessage({ type: 'error', text: 'Error executing Firestore/Storage action.' });
    } finally {
      setCmsLoading(false);
    }
  };

  const handleEditCmsItem = (item: ContentItem) => {
    setEditingItemId(item.id);
    setCmsSection(item.section);
    setCmsTitle(item.title);
    setCmsDescription(item.description);
    setCmsOrder(item.order);
    setCmsStatus(item.status);
    setCmsLink(item.link || '');
    setCmsImageUrl(item.imageUrl || '');
    setCmsFileUrl(item.fileUrl || '');
    setCmsFileType(item.fileType || '');
    // Scroll smoothly to form
    const formElement = document.getElementById('cms-form-top');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDeleteCmsItem = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to completely delete "${name}" from Firestore?`)) return;
    try {
      await deleteContentItem(id);
      setCmsMessage({ type: 'success', text: 'Content deleted successfully.' });
      await refreshContent();
    } catch (e) {
      setCmsMessage({ type: 'error', text: 'Failed to delete item.' });
    }
  };

  // Authentication Google implementation
  const handleGoogleSignIn = async () => {
    setLoginError('');
    setLoginLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const credentials = await signInWithPopup(auth, provider);
      // Success is tracked dynamically by onAuthStateChanged in App.tsx
      if (isMockConfig) {
        setLoginError('Google Auth is currently unconfigured inside standard offline compiling mock state.');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-blocked') {
        setLoginError('Popup blocked by browser. Please allow popup prompts for this domain to authenticate.');
      } else {
        setLoginError(`Google authentication mismatch: ${err.message || 'Unknown network error'}`);
      }
    } finally {
      setLoginLoading(false);
    }
  };

  // Authentication submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const cleanEmail = adminEmail.trim().toLowerCase();
      if (cleanEmail) {
        // Find custom database-registered admin user
        const foundAdmin = await getAdminUserByEmail(cleanEmail);
        const inputPassword = passphrase.trim();

        if (foundAdmin && foundAdmin.password && inputPassword === foundAdmin.password.trim()) {
          // If Firestore is real, authenticate in Firebase Auth
          if (!isMockConfig) {
            try {
              await signInWithEmailAndPassword(auth, foundAdmin.email, inputPassword);
            } catch (authErr: any) {
              console.warn("Firebase email auth account not found or failed, attempts to auto-register: ", authErr);
              if (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential' || authErr.code === 'auth/invalid-login-credentials') {
                try {
                  await createUserWithEmailAndPassword(auth, foundAdmin.email, inputPassword);
                } catch (createErr: any) {
                  console.error("Could not register custom admin in Firebase Auth: ", createErr);
                }
              }
            }
          }

          setCurrentUser({
            role: 'admin',
            email: foundAdmin.email,
            name: foundAdmin.name
          });
          setLoginLoading(false);
        } else {
          setLoginError(`Invalid administrator email or password combination.`);
          setLoginLoading(false);
        }
      } else {
        // Fallback Admin passphrase match (dynamically checked against Firestore config)
        const dbPassphrase = await getAdminPassphrase();
        const inputPassword = passphrase.trim();

        if (inputPassword === dbPassphrase) {
          const fallbackEmail = 'admin@chancellery.org';
          // Ensure we are signed into auth for fallback admin
          if (!isMockConfig) {
            try {
              await signInWithEmailAndPassword(auth, fallbackEmail, inputPassword);
            } catch (authErr: any) {
              console.warn("Fallback auth account not found or failed, attempts to register: ", authErr);
              try {
                await createUserWithEmailAndPassword(auth, fallbackEmail, inputPassword);
              } catch (createErr) {
                console.error("Could not register fallback admin in Firebase Auth: ", createErr);
              }
            }
          }

          setCurrentUser({
            role: 'admin',
            email: fallbackEmail,
            name: 'Osita Chidoka'
          });
          setLoginLoading(false);
        } else {
          setLoginError(`Invalid credentials. Please specify a correct administrator email or authorized passphrase.`);
          setLoginLoading(false);
        }
      }
    } catch (err: any) {
      console.error("Authentication failed: ", err);
      setLoginError(`Authentication failure: ${err.message || 'Unknown network error'}`);
      setLoginLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      if (!isMockConfig) {
        await signOut(auth);
      }
    } catch (err) {
      console.error("Firebase sign out failed: ", err);
    }
    setCurrentUser(null);
    setAdminEmail('');
    setPassphrase('');
    setLoginError('');
  };

  // Add customized essays
  const handlePublishEssay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!essayTitle.trim() || !essayContent.trim()) return;

    const newEssayId = essayTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newEssayRecord: Essay = {
      id: newEssayId,
      title: essayTitle.trim(),
      subtitle: essaySubtitle.trim() || undefined,
      deck: essayDeck.trim() || undefined,
      category: essayCategory,
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      year: essayYear,
      content: essayContent.trim()
    };

    onAddEssay(newEssayRecord);

    setEssaySuccess(true);
    setTimeout(() => setEssaySuccess(false), 3000);

    // Reset Form fields
    setEssayTitle('');
    setEssaySubtitle('');
    setEssayDeck('');
    setEssayContent('');
  };

  // Filtered subscribers list
  const filteredSubs = useMemo(() => {
    return subscribersList.filter((s) => {
      const terms = subSearch.toLowerCase();
      return (
        s.name.toLowerCase().includes(terms) ||
        s.email.toLowerCase().includes(terms) ||
        s.code.toLowerCase().includes(terms)
      );
    });
  }, [subscribersList, subSearch]);

  // Filtered mentorship list
  const filteredMentorships = useMemo(() => {
    return mentorshipApps.filter((app) => {
      const terms = mentorshipSearch.toLowerCase();
      return (
        app.name.toLowerCase().includes(terms) ||
        app.email.toLowerCase().includes(terms) ||
        app.discipline.toLowerCase().includes(terms) ||
        app.id.toLowerCase().includes(terms) ||
        app.focus.toLowerCase().includes(terms)
      );
    });
  }, [mentorshipApps, mentorshipSearch]);

  // Total count of commentary reviews
  const totalCommentsCount = useMemo(() => {
    let count = 0;
    (Object.values(commentsMap) as Comment[][]).forEach((list) => {
      count += list.length;
    });
    return count;
  }, [commentsMap]);

  return (
    <div className="bg-[#F7F3EC] min-h-[90vh]">
      <AnimatePresence mode="wait">
        {!currentUser ? (
          /* LoginPage Layout view */
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="w-full max-w-[560px] mx-auto px-4 py-16 sm:py-24 flex flex-col justify-center min-h-[80vh]"
          >
            <div className="border border-[#D8D0C0] bg-[#FAF8F5] rounded-sm overflow-hidden shadow-xl relative transition-all duration-300">
              {/* Gold Top Trim Accent */}
              <div className="absolute top-0 left-0 right-0 h-[4px] bg-[#9B7A2F]" />
              
              <div className="p-8 sm:p-11">
                {/* Secure Authentication Portal Header */}
                <div className="text-center mb-8">
                  <span className="font-sans text-[10px] font-bold tracking-[0.25em] text-[#9B7A2F] uppercase block mb-3">
                    Secure Authentication Portal
                  </span>
                  <h2 className="font-serif text-[30px] sm:text-[34px] font-bold tracking-normal text-[#121212] leading-tight">
                    Osita Chidoka Connect
                  </h2>
                  <p className="font-sans text-[13.5px] text-[#7A7A7A] mt-2.5 leading-relaxed max-w-[420px] mx-auto">
                    Access the digital administrative system and publisher interface.
                  </p>
                </div>

                {loginError && (
                  <div className="mb-6 p-4 border border-red-200 bg-red-50 text-red-700 font-sans text-[12px] flex items-start gap-2.5 rounded-sm text-justify leading-relaxed">
                    <ShieldAlert size={15} className="text-red-600 flex-shrink-0 mt-0.5" />
                    <span>{loginError}</span>
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="flex flex-col gap-6">
                  {/* Admin Email Input */}
                  <div className="flex flex-col gap-1.5 relative">
                    <div className="flex items-center gap-1.5 text-[#9B7A2F]">
                      <Mail size={13} className="text-[#9B7A2F]" />
                      <label className="font-sans text-[10px] font-bold text-[#9B7A2F] tracking-wider uppercase">
                        Admin Email Address
                      </label>
                      <span className="font-sans text-[9px] text-[#A49E94] uppercase tracking-wider ml-auto">
                        Optional for bypass
                      </span>
                    </div>
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="e.g. admin@chancellery.org"
                      className="bg-transparent border-t-0 border-x-0 border-b border-[#D8D0C0]/85 focus:border-[#9B7A2F] outline-none pb-2 pt-1 font-sans text-sm text-[#121212] placeholder-[#A49E94]/60 transition-colors duration-200 w-full"
                    />
                  </div>

                  {/* Password / Passphrase Input */}
                  <div className="flex flex-col gap-1.5 relative">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5 text-[#9B7A2F]">
                        <Key size={13} className="text-[#9B7A2F]" />
                        <label className="font-sans text-[10px] font-bold text-[#9B7A2F] tracking-wider uppercase">
                          Password or Console Passphrase
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[#9B7A2F] hover:text-[#121212] text-[10px] font-semibold flex items-center gap-1 bg-transparent border-none cursor-pointer outline-none"
                      >
                        {showPassword ? <EyeOff size={11} /> : <Eye size={11} />}
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={passphrase}
                      onChange={(e) => setPassphrase(e.target.value)}
                      placeholder="Enter credentials..."
                      className="bg-transparent border-t-0 border-x-0 border-b border-[#D8D0C0]/85 focus:border-[#9B7A2F] outline-none pb-2 pt-1 font-sans text-sm text-[#121212] placeholder-[#A49E94]/60 transition-colors duration-200 w-full"
                    />
                    <p className="font-sans text-[11px] italic text-[#7A7A7A] leading-relaxed mt-2.5 text-left">
                      Provide either your personal administrator account credentials or the global console entry passphrase.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="font-sans text-[11px] font-bold tracking-[0.2em] uppercase text-[#FAF8F5] bg-[#121212] hover:bg-[#9B7A2F] py-4 rounded-sm cursor-pointer border-none transition-all duration-200 mt-2 text-center shadow-md hover:shadow-lg flex items-center justify-center gap-2 group w-full"
                  >
                    {loginLoading ? (
                      <>
                        <Loader2 size={13} className="animate-spin text-white" />
                        <span>Verifying Access Clearance...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify Access Clearance</span>
                        <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-1" />
                      </>
                    )}
                  </button>

                  <div className="relative flex py-2 items-center my-1">
                    <div className="flex-grow border-t border-[#D8D0C0]/65"></div>
                    <span className="flex-shrink mx-4 text-[9px] text-[#A49E94] uppercase tracking-[0.2em] font-bold">
                      or secure single sign-on
                    </span>
                    <div className="flex-grow border-t border-[#D8D0C0]/65"></div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loginLoading}
                    className="font-sans text-[11px] font-bold tracking-[0.2em] uppercase text-[#121212] bg-[#FAF8F5] hover:bg-[#121212] hover:text-[#FAF8F5] border border-[#121212] py-4 rounded-sm cursor-pointer transition-all duration-200 text-center shadow-sm hover:shadow flex items-center justify-center gap-2 w-full"
                  >
                    {loginLoading ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>Authenticating...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        <span>Continue with Google</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Faded Note below the login card */}
            <p className="text-center font-sans text-[11px] text-[#8C857A] mt-8 leading-relaxed max-w-[420px] mx-auto">
              <strong>Access Credentials Prompt:</strong> Use console passphrase <code className="bg-[#FAF8F5]/80 px-1.5 py-0.5 border border-[#D8D0C0]/50 rounded-sm text-[#9B7A2F] font-mono text-[10px]">admin</code> for administrator controls. Subscriptions can be launched in the navigation bar to test the Subscriber dossiers flow.
            </p>
          </motion.div>
        ) : (
          /* Dashboard Panel layout block */
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-[960px] mx-auto px-6 sm:px-12 md:px-16 py-12"
          >
            {/* Upper profile header block */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#D8D0C0] pb-6 mb-10 gap-4">
              <div>
                <span className="font-sans text-[11px] font-bold tracking-[0.2em] text-[#9B7A2F] uppercase block mb-1">
                  {currentUser.role === 'admin' ? 'CHANCELLOR BOARD' : 'SUBSCRIBER DOSSIER'}
                </span>
                <h1 className="font-serif text-[32px] font-bold text-[#121212] tracking-tight leading-none">
                  Welcome, {currentUser.name}
                </h1>
                <p className="font-mono text-[11px] text-[#7A7A7A] mt-1.5">
                  Logged in as: <strong>{currentUser.email}</strong> {currentUser.code && `(${currentUser.code})`}
                </p>
              </div>

              <button
                onClick={handleSignOut}
                className="font-sans text-[11px] font-bold tracking-widest uppercase border border-[#D8D0C0] text-[#7A7A7A] hover:text-[#121212] hover:border-[#121212] bg-white px-4 py-2 rounded-sm cursor-pointer transition-all flex items-center gap-1.5"
              >
                Sign Out <LogOut size={13} />
              </button>
            </div>

            {/* Check for Subscriber portal versus Chancellor Admin */}
            {currentUser.role === 'subscriber' ? (
              /* Subscriber customized view */
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="col-span-1 border border-[#D8D0C0] p-6 bg-white rounded-sm shadow-sm h-fit">
                  <div className="text-center pb-6 border-b border-[#D8D0C0] mb-6">
                    <span className="w-12 h-12 bg-amber-50 text-[#9B7A2F] rounded-full flex items-center justify-center text-[18px] font-bold font-serif mx-auto mb-3">
                      {currentUser.name.charAt(0)}
                    </span>
                    <h4 className="font-serif text-[17px] font-bold text-[#121212] leading-none mb-1">{currentUser.name}</h4>
                    <span className="font-mono text-[10px] text-zinc-400">ACTIVE REGISTRY MEMBER</span>
                  </div>

                  <div className="flex flex-col gap-4 text-justify">
                    <div>
                      <span className="text-[9px] text-[#7A7A7A] font-bold uppercase block">SUBSCRIBER CODE</span>
                      <span className="font-mono text-[13px] font-bold text-[#121212]">{currentUser.code}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#7A7A7A] font-bold uppercase block">EMAIL</span>
                      <span className="font-mono text-[12.5px] text-[#444444]">{currentUser.email}</span>
                    </div>
                  </div>
                </div>

                {/* Subscribed Interests Dashboard */}
                <div className="col-span-2 border border-[#D8D0C0] p-6 bg-white rounded-sm shadow-sm">
                  <h3 className="font-serif text-[22px] font-bold text-[#121212] tracking-tight mb-4 pb-2 border-b border-[#D8D0C0]">
                    Your Subscriber Preferences & Activities
                  </h3>
                  <p className="font-sans text-[14.5px] text-[#444444] leading-relaxed mb-6">
                    You have successfully established a bi-weekly notification hook to receive essays published by Chancellor Osita Chidoka. Below are your current dispatch interests:
                  </p>

                  <div className="flex flex-col gap-3">
                    <div className="p-4 bg-[#F7F3EC] border border-[#D8D0C0]">
                      <span className="font-sans text-[10px] font-bold tracking-widest uppercase text-[#9B7A2F] block mb-2">ENABLED DISPATCHES</span>
                      <ul className="list-disc pl-5 font-sans text-[13.5px] text-[#444444] space-y-1">
                        <li>Memoirs & Personal Reflections</li>
                        <li>Non-partisan Policy blueprints & Governance indexes</li>
                      </ul>
                    </div>

                    <div className="p-4 bg-emerald-50/50 border border-emerald-200 text-[#155724] rounded-sm text-xs text-justify">
                      <p className="m-0 leading-relaxed font-sans">
                        <strong>Registry Sync Status:</strong> Active. Your alert channel is coupled directly to the central chancellery database registry. No further actions are required from your side.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* FULL ADMIN CONSOLE */
              <div>
                {/* Admin Tab buttons navigation */}
                <div className="flex border-b border-[#D8D0C0] mb-8 gap-4 overflow-x-auto scrollbar-none font-sans">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`font-sans text-[11.5px] font-bold tracking-widest uppercase pb-3 cursor-pointer transition-all bg-transparent border-0 outline-none whitespace-nowrap ${
                      activeTab === 'overview' ? 'text-[#121212] border-b-2 border-[#121212] font-semibold' : 'text-[#7A7A7A] hover:text-[#121212]'
                    }`}
                  >
                    Console Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('essays')}
                    className={`font-sans text-[11.5px] font-bold tracking-widest uppercase pb-3 cursor-pointer transition-all bg-transparent border-0 outline-none whitespace-nowrap ${
                      activeTab === 'essays' ? 'text-[#121212] border-b-2 border-[#121212] font-semibold' : 'text-[#7A7A7A] hover:text-[#121212]'
                    }`}
                  >
                    Draft Essay
                  </button>
                  <button
                    onClick={() => setActiveTab('subscribers')}
                    className={`font-sans text-[11.5px] font-bold tracking-widest uppercase pb-3 cursor-pointer transition-all bg-transparent border-0 outline-none whitespace-nowrap ${
                      activeTab === 'subscribers' ? 'text-[#121212] border-b-2 border-[#121212] font-semibold' : 'text-[#7A7A7A] hover:text-[#121212]'
                    }`}
                  >
                    Subscribers ({subscribersList.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('mentorship')}
                    className={`font-sans text-[11.5px] font-bold tracking-widest uppercase pb-3 cursor-pointer transition-all bg-transparent border-0 outline-none whitespace-nowrap ${
                      activeTab === 'mentorship' ? 'text-[#121212] border-b-2 border-[#121212] font-semibold' : 'text-[#7A7A7A] hover:text-[#121212]'
                    }`}
                  >
                    Mentorship Fellowship ({mentorshipApps.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('responses')}
                    className={`font-sans text-[11.5px] font-bold tracking-widest uppercase pb-3 cursor-pointer transition-all bg-transparent border-0 outline-none whitespace-nowrap ${
                      activeTab === 'responses' ? 'text-[#121212] border-b-2 border-[#121212] font-semibold' : 'text-[#7A7A7A] hover:text-[#121212]'
                    }`}
                  >
                    Decisions Log ({decisionResponses.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('comments')}
                    className={`font-sans text-[11.5px] font-bold tracking-widest uppercase pb-3 cursor-pointer transition-all bg-transparent border-0 outline-none whitespace-nowrap ${
                      activeTab === 'comments' ? 'text-[#121212] border-b-2 border-[#121212] font-semibold' : 'text-[#7A7A7A] hover:text-[#121212]'
                    }`}
                  >
                    Comments ({totalCommentsCount})
                  </button>
                  <button
                    onClick={() => setActiveTab('cms')}
                    className={`font-sans text-[11.5px] font-bold tracking-widest uppercase pb-3 cursor-pointer transition-all bg-transparent border-0 outline-none whitespace-nowrap ${
                      activeTab === 'cms' ? 'text-[#121212] border-b-2 border-[#D8D0C0] font-bold text-[#9B7A2F]' : 'text-[#7A7A7A] hover:text-[#121212]'
                    }`}
                  >
                    Firestore CMS ({contentItems.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`font-sans text-[11.5px] font-bold tracking-widest uppercase pb-3 cursor-pointer transition-all bg-transparent border-0 outline-none whitespace-nowrap flex items-center gap-1.5 ${
                      activeTab === 'settings' ? 'text-[#121212] border-b-2 border-slate-800 font-bold text-slate-800' : 'text-[#7A7A7A] hover:text-[#121212]'
                    }`}
                  >
                    <Settings size={13} />
                    Credentials Settings
                  </button>
                </div>

                {/* Switch Tab Content */}
                <AnimatePresence mode="wait">
                  {activeTab === 'overview' && (
                    <motion.div
                      key="overview"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-10"
                    >
                      {/* Count of essays */}
                      <div className="border border-[#D8D0C0] p-6 bg-white rounded-sm shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-3">
                          <span className="font-sans text-[10.5px] font-bold tracking-[0.2em] text-[#7A7A7A] uppercase block">ESSAYS IN CACHE</span>
                          <BookOpen size={16} className="text-[#9B7A2F]" />
                        </div>
                        <h2 className="font-serif text-[42px] font-black text-[#121212] leading-none mb-1">{essaysList.length}</h2>
                        <span className="font-sans text-[11px] text-[#7A7A7A]">Published in directory</span>
                      </div>

                      {/* Count of subscribers */}
                      <div className="border border-[#D8D0C0] p-6 bg-white rounded-sm shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-3">
                          <span className="font-sans text-[10.5px] font-bold tracking-[0.2em] text-[#7A7A7A] uppercase block">SUBSCRIBERS</span>
                          <Users size={16} className="text-[#9B7A2F]" />
                        </div>
                        <h2 className="font-serif text-[42px] font-black text-[#121212] leading-none mb-1">{subscribersList.length}</h2>
                        <span className="font-sans text-[11px] text-[#7A7A7A]">Alert system delivery nodes</span>
                      </div>

                      {/* Count of Fellowship apps */}
                      <div className="border border-[#D8D0C0] p-6 bg-white rounded-sm shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-3">
                          <span className="font-sans text-[10.5px] font-bold tracking-[0.2em] text-[#7A7A7A] uppercase block">FELLOWSHIP APPS</span>
                          <FileText size={16} className="text-[#9B7A2F]" />
                        </div>
                        <h2 className="font-serif text-[42px] font-black text-[#121212] leading-none mb-1">{mentorshipApps.length}</h2>
                        <span className="font-sans text-[11px] text-[#7A7A7A]">Admin dossier queue</span>
                      </div>

                      {/* Count of commentary reviews */}
                      <div className="border border-[#D8D0C0] p-6 bg-white rounded-sm shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-3">
                          <span className="font-sans text-[10.5px] font-bold tracking-[0.2em] text-[#7A7A7A] uppercase block">RESPONSES</span>
                          <MessageSquare size={16} className="text-[#9B7A2F]" />
                        </div>
                        <h2 className="font-serif text-[42px] font-black text-[#121212] leading-none mb-1">{totalCommentsCount}</h2>
                        <span className="font-sans text-[11px] text-[#7A7A7A]">Submitted insights</span>
                      </div>

                      {/* Introduction panel */}
                      <div className="sm:col-span-2 md:col-span-4 border border-[#D8D0C0] bg-white rounded-sm p-6 flex flex-col sm:flex-row gap-6 mt-4 hover:shadow-md transition-shadow justify-between items-center text-justify">
                        <div className="p-1 max-w-[580px]">
                          <h4 className="font-serif text-[18px] font-bold text-[#121212] mb-2 leading-none">Console Administration Instructions</h4>
                          <p className="font-sans text-[13.5px] text-[#444444] leading-relaxed">
                            This dynamic console manages all records inside browser LocalStorage. Use the tabs above to publish custom essays, remove comments, view alert directories, or change fellows state from 'PENDING' to 'APPROVED'. Porting your custom content was never so easy.
                          </p>
                        </div>
                        <button
                          onClick={() => setActiveTab('essays')}
                          className="font-sans text-[11px] font-bold tracking-widest uppercase text-white bg-[#121212] hover:bg-[#9B7A2F] py-3.5 px-6 rounded-md cursor-pointer border-none transition-colors w-full sm:w-auto text-center"
                        >
                          Draft New essay
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'essays' && (
                    <motion.div
                      key="essays"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="border border-[#D8D0C0] bg-white rounded-sm p-8 max-w-[720px] mx-auto"
                    >
                      <h3 className="font-serif text-[22px] font-bold text-[#121212] tracking-tight mb-1">
                        Draft a Policy Essay
                      </h3>
                      <p className="font-sans text-[13.5px] text-[#7A7A7A] mb-8 leading-normal mt-1">
                        Compose your essay or legislative breakdown. Submitting compiles this directly into the live Directory, enabling comments.
                      </p>

                      {essaySuccess && (
                        <div className="mb-6 p-4 bg-emerald-50 text-emerald-800 bg-emerald-500/10 border border-emerald-500/30 text-xs font-sans rounded-sm flex items-center gap-1.5 animate-pulse">
                          <CheckCircle size={15} />
                          Essay compiled and circulates across directory feed securely.
                        </div>
                      )}

                      <form onSubmit={handlePublishEssay} className="flex flex-col gap-5">
                        <div className="grid grid-cols-1 gap-1">
                          <label className="font-sans text-[10.5px] font-bold text-[#7A7A7A] tracking-wider uppercase">Essay Title *</label>
                          <input
                            type="text"
                            required
                            value={essayTitle}
                            onChange={(e) => setEssayTitle(e.target.value)}
                            placeholder="e.g. Rethinking State Policing Devolution"
                            className="bg-[#F7F3EC]/40 border border-[#D8D0C0] focus:border-[#9B7A2F] outline-none p-3 text-sm text-[#121212] rounded-sm transition-colors font-semibold"
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-1">
                          <label className="font-sans text-[10.5px] font-bold text-[#7A7A7A] tracking-wider uppercase">Subtitle / Focus Argument</label>
                          <input
                            type="text"
                            value={essaySubtitle}
                            onChange={(e) => setEssaySubtitle(e.target.value)}
                            placeholder="e.g. Constitutional restructuring and civil oversight boards in decentralization models..."
                            className="bg-[#F7F3EC]/40 border border-[#D8D0C0] focus:border-[#9B7A2F] outline-none p-3 text-sm text-[#121212] rounded-sm transition-colors"
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-1">
                          <label className="font-sans text-[10.5px] font-bold text-[#7A7A7A] tracking-wider uppercase">Abstract Abstract Deck Summary</label>
                          <textarea
                            rows={2}
                            value={essayDeck}
                            onChange={(e) => setEssayDeck(e.target.value)}
                            placeholder="A concise, highly scannable teaser describing your core policy proposal..."
                            className="bg-[#F7F3EC]/40 border border-[#D8D0C0] focus:border-[#9B7A2F] outline-none p-3 text-sm text-[#121212] rounded-sm leading-relaxed"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div className="flex flex-col gap-1">
                            <label className="font-sans text-[10.5px] font-bold text-[#7A7A7A] tracking-wider uppercase">Category Tag</label>
                            <select
                              value={essayCategory}
                              onChange={(e) => setEssayCategory(e.target.value)}
                              className="bg-[#F7F3EC]/40 border border-[#D8D0C0] focus:border-[#9B7A2F] outline-none p-3 text-sm text-[#121212] rounded-sm"
                            >
                              <option value="Memoirs">Memoirs</option>
                              <option value="Institutional Reform">Institutional Reform</option>
                              <option value="Aviation">Aviation</option>
                              <option value="Public Safety">Public Safety</option>
                              <option value="Governance Indexes">Governance Indexes</option>
                            </select>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="font-sans text-[10.5px] font-bold text-[#7A7A7A] tracking-wider uppercase">Year of Publication</label>
                            <input
                              type="number"
                              required
                              value={essayYear}
                              onChange={(e) => setEssayYear(parseInt(e.target.value) || new Date().getFullYear())}
                              className="bg-[#F7F3EC]/40 border border-[#D8D0C0] focus:border-[#9B7A2F] outline-none p-3 text-sm text-[#121212] rounded-sm"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-1">
                          <label className="font-sans text-[10.5px] font-bold text-[#7A7A7A] tracking-wider uppercase">
                            Essay Content Text (Use '### Headings' to divide chapters) *
                          </label>
                          <textarea
                            required
                            rows={12}
                            value={essayContent}
                            onChange={(e) => setEssayContent(e.target.value)}
                            placeholder="### Introduction of Policy Challenges&#10;&#10;In reforming public administrative mechanisms, a central checkpoint must be designed..."
                            className="bg-[#F7F3EC]/40 border border-[#D8D0C0] focus:border-[#9B7A2F] outline-none p-3.5 text-sm text-[#121212] rounded-sm leading-relaxed"
                          />
                        </div>

                        <button
                          type="submit"
                          className="font-sans text-[11px] font-bold tracking-[0.2em] uppercase text-white bg-[#121212] hover:bg-[#9B7A2F] py-3.5 rounded-sm cursor-pointer border-none transition-colors mt-2 text-center flex items-center justify-center gap-2"
                        >
                          Compile & Publish Essay <PlusCircle size={15} />
                        </button>
                      </form>

                      {/* Active Archive Directory and Record List */}
                      <div className="mt-12 border-t border-[#D8D0C0] pt-8 text-left">
                        <h4 className="font-serif text-[17px] font-bold text-[#121212] tracking-normal mb-1 uppercase">
                          Dossier of Compiled Literary Memoirs & Policy Essays
                        </h4>
                        <p className="font-sans text-[12px] text-[#7A7A7A] mb-5">
                          Below is the registry of all current essays available for public view. You can purge an entry instantly.
                        </p>
                        
                        <div className="flex flex-col gap-3">
                          {essaysList.map((essay) => (
                            <div 
                              key={essay.id} 
                              className="border border-[#D8D0C0]/60 bg-[#F7F3EC]/20 rounded-sm p-4 flex justify-between items-center gap-4 hover:bg-[#F7F3EC]/40 transition-colors"
                            >
                              <div className="text-left">
                                <span className="font-mono text-[9px] text-[#9B7A2F] uppercase block mb-0.5 tracking-wider font-bold">
                                  {essay.category} — {essay.year}
                                </span>
                                <h5 className="font-serif text-[14.5px] font-bold text-[#121212] m-0">
                                  {essay.title}
                                </h5>
                                <span className="font-mono text-[9.5px] text-zinc-400">
                                  ID REF: {essay.id}
                                </span>
                              </div>
                              
                              <button
                                onClick={() => {
                                  if (confirm(`Are you absolutely sure you want to delete and purge the essay: "${essay.title}"?`)) {
                                    if (onDeleteEssay) {
                                      onDeleteEssay(essay.id);
                                    }
                                  }
                                }}
                                className="text-zinc-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-sm bg-transparent border-none outline-none cursor-pointer transition-colors"
                                title="Delete Memoir"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))}
                          
                          {essaysList.length === 0 && (
                            <p className="font-serif text-xs italic text-zinc-500">
                              No memoir titles recorded in the active workspace.
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'subscribers' && (
                    <motion.div
                      key="subscribers"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      {/* Search box */}
                      <div className="flex items-center gap-2 border border-[#D8D0C0] bg-white px-3 py-2 rounded-sm mb-6 max-w-[320px] font-sans">
                        <Search size={14} className="text-[#7A7A7A]" />
                        <input
                          type="text"
                          value={subSearch}
                          onChange={(e) => setSubSearch(e.target.value)}
                          placeholder="Search alerts register..."
                          className="bg-transparent border-none outline-none font-sans text-xs text-[#121212] w-full placeholder-[#C2BAA8] italic"
                        />
                      </div>

                      {/* Graphic Table list */}
                      <div className="border border-[#D8D0C0] bg-white rounded-md overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left font-sans text-sm border-collapse">
                            <thead>
                              <tr className="bg-[#F7F3EC] border-b border-[#D8D0C0] text-[10px] font-bold text-[#7A7A7A] uppercase tracking-wider">
                                <th className="p-4">CODE</th>
                                <th className="p-4">NAME</th>
                                <th className="p-4">CHANNELS & INTERESTS</th>
                                <th className="p-4">EMAIL GATEWAY</th>
                                <th className="p-4 text-right">ACTION</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#D8D0C0]/50">
                              {filteredSubs.map((sub) => (
                                <tr key={sub.code} className="hover:bg-neutral-50/50 transition-colors">
                                  <td className="p-4 font-mono font-bold text-[#9B7A2F]">{sub.code}</td>
                                  <td className="p-4 font-serif font-bold text-[#121212]">{sub.name}</td>
                                  <td className="p-4">
                                    <div className="flex flex-wrap gap-1">
                                      {sub.interests.map((it) => (
                                        <span key={it} className="bg-neutral-100 border border-[#D8D0C0]/65 text-[9px] text-[#7A7A7A] px-1.5 py-0.5 rounded-sm font-sans uppercase">
                                          {it}
                                        </span>
                                      ))}
                                    </div>
                                  </td>
                                  <td className="p-4 font-mono text-zinc-500 text-xs">{sub.email}</td>
                                  <td className="p-4 text-right">
                                    <button
                                      onClick={async () => {
                                        if (confirm(`Remove subscriber ${sub.name} from alert registers?`)) {
                                          if (onDeleteSubscriber) {
                                            await onDeleteSubscriber(sub.email);
                                          }
                                        }
                                      }}
                                      className="text-[#7A7A7A] hover:text-red-700 p-1 bg-transparent border-none outline-none cursor-pointer transition-colors"
                                      title="Remove from system"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                              {filteredSubs.length === 0 && (
                                <tr>
                                  <td colSpan={5} className="p-8 text-center font-serif text-[15px] italic text-[#7A7A7A]">
                                    No alert records match your search criteria.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'mentorship' && (
                    <motion.div
                      key="mentorship"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      {/* Search box */}
                      <div className="flex items-center gap-2 border border-[#D8D0C0] bg-white px-3 py-2 rounded-sm mb-6 max-w-[320px] font-sans">
                        <Search size={14} className="text-[#7A7A7A]" />
                        <input
                          type="text"
                          value={mentorshipSearch}
                          onChange={(e) => setMentorshipSearch(e.target.value)}
                          placeholder="Search applicant fields..."
                          className="bg-transparent border-none outline-none font-sans text-xs text-[#121212] w-full placeholder-[#C2BAA8] italic"
                        />
                      </div>

                      {/* Fellows Dossier Listing */}
                      <div className="flex flex-col gap-6 text-justify">
                        {filteredMentorships.map((app) => (
                          <div
                            key={app.id}
                            className="border border-[#D8D0C0] bg-white p-6 rounded-md shadow-sm relative overflow-hidden group"
                          >
                            <div className="absolute top-0 right-0 py-1.5 px-3 bg-[#121212] text-white font-mono text-[9px] tracking-widest uppercase">
                              {app.id}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start mt-2">
                              <div className="md:col-span-1 border-r border-[#D8D0C0]/0 md:border-r md:border-[#D8D0C0]/50 pr-0 md:pr-4">
                                <h4 className="font-serif text-[17px] font-bold text-[#121212] leading-tight mb-1">{app.name}</h4>
                                <span className="font-mono text-[10px] text-zinc-400 block mb-3 overflow-hidden text-ellipsis whitespace-nowrap" title={app.email}>{app.email}</span>
                                <span className={`font-mono text-[9px] px-2 py-0.5 rounded-sm font-semibold inline-block ${
                                  app.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-800' : 
                                  app.status === 'DECLINED' ? 'bg-red-50 text-red-800' : 'bg-amber-50 text-amber-800'
                                }`}>
                                  {app.status}
                                </span>
                              </div>

                              <div className="md:col-span-2">
                                <p className="font-sans text-[12.5px] font-bold text-[#9B7A2F] mb-1 uppercase tracking-wide">
                                  Vector Focus: {app.focus}
                                </p>
                                <p className="font-sans text-[13px] text-[#7A7A7A] mb-3 italic">
                                  Credentials: {app.discipline}
                                </p>
                                <p className="font-sans text-[13.5px] text-[#444444] leading-relaxed bg-[#F7F3EC]/30 p-3 border border-[#D8D0C0]/35 rounded-sm m-0">
                                  "{app.proposal}"
                                </p>
                              </div>

                              <div className="md:col-span-1 flex flex-col gap-3 justify-end h-full items-end">
                                {app.status === 'PENDING ADMISSION REVIEW' && decidingAppId !== app.id && (
                                  <div className="flex flex-row md:flex-col gap-2 w-full lg:max-w-[180px]">
                                    <button
                                      onClick={() => {
                                        setDecidingAppId(app.id);
                                        setDecisionType('APPROVED');
                                        setDecisionFeedback('We are delighted to inform you that your blueprint proposal has been approved for the Mekaria Fellowship program.');
                                      }}
                                      className="w-full font-sans text-[10px] font-bold tracking-widest uppercase text-white bg-emerald-700 hover:bg-emerald-800 p-2.5 rounded-sm cursor-pointer border-none flex items-center justify-center gap-1 leading-none shadow-sm transition-colors text-center"
                                    >
                                      Approve <CheckCircle size={10} />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setDecidingAppId(app.id);
                                        setDecisionType('DECLINED');
                                        setDecisionFeedback('Thank you for submitting your proposal. After careful evaluation, we are unable to admit your application to the current cohort.');
                                      }}
                                      className="w-full font-sans text-[10px] font-bold tracking-widest uppercase text-white bg-red-800 hover:bg-red-900 p-2.5 rounded-sm cursor-pointer border-none flex items-center justify-center gap-1 leading-none shadow-sm transition-colors text-center"
                                    >
                                      Decline <ShieldAlert size={10} />
                                    </button>
                                  </div>
                                )}

                                {decidingAppId === app.id && (
                                  <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="w-full text-left bg-neutral-50 p-3 border border-[#D8D0C0] rounded-sm flex flex-col gap-2 lg:max-w-[200px]"
                                  >
                                    <span className="font-sans text-[9px] font-bold tracking-wider uppercase text-[#9B7A2F]">
                                      Feedback for {decisionType}
                                    </span>
                                    <textarea
                                      rows={3}
                                      value={decisionFeedback}
                                      onChange={(e) => setDecisionFeedback(e.target.value)}
                                      placeholder="Write administrative review statement..."
                                      className="w-full p-2 text-[11px] font-sans border border-[#D8D0C0] rounded-sm bg-white outline-none resize-none leading-normal text-[#121212]"
                                    />
                                    <div className="flex gap-1 justify-end">
                                      <button
                                        onClick={() => {
                                          setDecidingAppId(null);
                                          setDecisionType(null);
                                          setDecisionFeedback('');
                                        }}
                                        className="font-sans text-[8px] font-bold tracking-widest uppercase bg-transparent text-zinc-500 hover:text-zinc-800 px-1.5 py-1 rounded-sm border border-zinc-300 cursor-pointer transition-colors"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (decisionType) {
                                            onUpdateAppStatus(app.id, decisionType, decisionFeedback);
                                            setDecidingAppId(null);
                                            setDecisionType(null);
                                            setDecisionFeedback('');
                                          }
                                        }}
                                        className="font-sans text-[8px] font-bold tracking-widest uppercase text-white bg-[#121212] hover:bg-[#9B7A2F] px-1.5 py-1 rounded-sm border-none cursor-pointer transition-colors"
                                      >
                                        Submit
                                      </button>
                                    </div>
                                  </motion.div>
                                )}

                                {decidingAppId !== app.id && (
                                  <button
                                    onClick={() => {
                                      if (confirm(`Completely purge mentorship fellow dossier ${app.id}?`)) {
                                        onDeleteApp(app.id);
                                      }
                                    }}
                                    className="w-full lg:max-w-[180px] font-sans text-[10px] font-bold tracking-widest uppercase border border-red-200 text-red-700 hover:text-white hover:bg-red-700 p-2.5 rounded-sm cursor-pointer transition-colors flex items-center justify-center gap-1 leading-none"
                                  >
                                    Purge Dossier <Trash2 size={10} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}

                        {filteredMentorships.length === 0 && (
                          <div className="text-center py-16 border border-dashed border-[#D8D0C0] bg-white rounded-sm">
                            <p className="font-serif text-[15.5px] italic text-[#7A7A7A] m-0">
                              No mentorship fellowship records found.
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'responses' && (
                    <motion.div
                      key="responses"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="border border-[#D8D0C0] bg-white rounded-md p-6 shadow-sm">
                        <div className="border-b border-[#D8D0C0]/50 pb-4 mb-6 text-left">
                          <h4 className="font-serif text-[18px] font-bold text-[#121212] tracking-tight mb-1">
                            Fellowship Decision Memo Logs
                          </h4>
                          <span className="font-sans text-[11.5px] text-[#7A7A7A]">
                            Every administrative approval and decline response is securely recorded in Firebase.
                          </span>
                        </div>

                        {/* List items */}
                        <div className="flex flex-col gap-4 text-justify">
                          {decisionResponses.map((resp) => (
                            <div 
                              key={resp.id} 
                              className="border border-[#D8D0C0]/60 bg-white hover:bg-[#F7F3EC]/5 p-5 rounded-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors"
                            >
                              <div className="text-left space-y-1 max-w-[580px]">
                                <div className="flex items-center gap-2">
                                  <span className={`font-mono text-[9px] px-2 py-0.5 rounded-sm font-bold uppercase ${
                                    resp.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {resp.status}
                                  </span>
                                  <span className="font-sans text-[10px] text-zinc-400">
                                    MEMO REF: {resp.id}
                                  </span>
                                </div>
                                <h5 className="font-serif text-[15.5px] font-bold text-[#121212] leading-snug">
                                  {resp.applicantName} ({resp.applicantEmail})
                                </h5>
                                <p className="font-sans text-[13px] text-[#444444] leading-relaxed bg-[#FAF8F5] p-3 border border-neutral-200/60 rounded-xs italic m-0">
                                  "{resp.feedback}"
                                </p>
                                <span className="font-mono text-[10px] text-[#7A7A7A] block mt-1">
                                  Responded by {resp.respondedBy} on {new Date(resp.respondedAt).toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>

                              <button
                                onClick={async () => {
                                  if (confirm(`Permanently delete this decision response record from Firebase?`)) {
                                    if (onDeleteDecisionResponse) {
                                      await onDeleteDecisionResponse(resp.id);
                                    }
                                  }
                                }}
                                className="text-[#7A7A7A] hover:text-red-700 p-2 hover:bg-red-50 rounded-sm bg-transparent border-none outline-none cursor-pointer transition-colors flex-shrink-0"
                                title="Purge response statement"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))}

                          {decisionResponses.length === 0 && (
                            <div className="text-center py-12 border border-dashed border-[#D8D0C0] bg-neutral-50/45 rounded-sm">
                              <p className="font-serif text-sm italic text-[#7A7A7A] m-0">
                                No fellowship decision memo letters recorded.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'comments' && (
                    <motion.div
                      key="comments"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      {/* Comments Grouped by Essay title */}
                      <div className="flex flex-col gap-8 text-justify">
                        {essaysList.map((essay) => {
                          const list = commentsMap[essay.id] || [];
                          if (list.length === 0) return null;

                          return (
                            <div key={essay.id} className="border border-[#D8D0C0] bg-white rounded-sm p-6 shadow-sm">
                              <span className="font-sans text-[9px] tracking-widest font-bold uppercase text-[#9B7A2F] bg-[#9B7A2F]/10 px-2 py-0.5 rounded-sm inline-block mb-3">
                                Published Memoir Responses
                              </span>
                              <h4 className="font-serif text-[18px] font-bold text-[#121212] tracking-tight mb-4 border-b border-[#D8D0C0] pb-2 text-justify uppercase">
                                {essay.title}
                              </h4>

                              <div className="divide-y divide-[#D8D0C0]/50">
                                {list.map((comment, idx) => (
                                  <div key={idx} className="py-4 flex justify-between items-start gap-6 group hover:bg-neutral-50 p-1.5 rounded-sm transition-colors">
                                    <div className="max-w-[480px]">
                                      <div className="flex items-center gap-3 mb-1.5">
                                        <span className="font-sans font-bold text-[13.5px] text-[#121212]">{comment.name}</span>
                                        <span className="text-[#C2BAA8] leading-none">•</span>
                                        <span className="font-mono text-[11px] text-[#7A7A7A]">{comment.date}</span>
                                      </div>
                                      <p className="font-sans text-[13px] text-[#444444] leading-relaxed m-0 italic text-justify">
                                        "{comment.text}"
                                      </p>
                                    </div>
                                    <button
                                      onClick={() => onDeleteComment(essay.id, idx)}
                                      className="text-neutral-400 hover:text-red-700 bg-transparent border-0 outline-none p-1.5 cursor-pointer flex-shrink-0 transition-colors"
                                      title="Purge review commentary statement"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}

                        {totalCommentsCount === 0 && (
                          <div className="text-center py-20 border border-dashed border-[#D8D0C0] bg-white rounded-sm">
                            <p className="font-serif text-[15px] italic text-[#7A7A7A] m-0">
                              No public discourse responses filed.
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'cms' && (
                    <motion.div
                      key="cms"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="space-y-10"
                    >
                      {/* Form Container */}
                      <div id="cms-form-top" className="border border-[#D8D0C0] bg-white rounded-md p-6 sm:p-8 shadow-sm">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#D8D0C0]/60 pb-4 mb-6 gap-3">
                          <div>
                            <span className="font-sans text-[11px] font-bold tracking-[0.2em] text-[#9B7A2F] uppercase block mb-1">
                              PORTAL MANAGER
                            </span>
                            <h3 className="font-serif text-[22px] font-bold text-[#121212] tracking-tight">
                              {editingItemId ? 'Edit Content Block' : 'Publish Section Content Block'}
                            </h3>
                            <p className="font-sans text-[13.5px] text-[#7A7A7A] mt-1 m-0">
                              Directly populate files, text, and documents to target frontend sections.
                            </p>
                          </div>
                          
                          {/* Sync Engine Badge */}
                          <div className={`px-2.5 py-1 rounded-sm border font-mono text-[9px] font-bold tracking-wider uppercase flex items-center gap-1.5 ${
                            !isMockConfig 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${!isMockConfig ? 'bg-emerald-600' : 'bg-amber-600 animate-pulse'}`} />
                            {!isMockConfig ? 'Firestore Live' : 'Offline Cache Engine'}
                          </div>
                        </div>

                        {cmsMessage && (
                          <div className={`mb-6 p-4 text-xs font-sans rounded-sm flex items-start gap-2 border ${
                            cmsMessage.type === 'success' 
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 bg-emerald-500/5' 
                              : 'bg-red-50 border-red-200 text-red-800 bg-red-500/5'
                          }`}>
                            <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                            <p className="m-0 leading-relaxed text-justify font-sans">{cmsMessage.text}</p>
                          </div>
                        )}

                        <form onSubmit={handleCmsFormSubmit} className="flex flex-col gap-5 text-justify">
                          {/* Form Section Select rows */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5All">
                            <div className="flex flex-col gap-1.5">
                              <label className="font-sans text-[10.5px] font-bold text-[#7A7A7A] tracking-wider uppercase">
                                Website Section Deployment *
                              </label>
                              <select
                                required
                                value={cmsSection}
                                onChange={(e) => setCmsSection(e.target.value as any)}
                                className="bg-[#F7F3EC]/40 border border-[#D8D0C0] focus:border-[#9B7A2F] outline-none p-3 text-sm text-[#121212] rounded-sm font-semibold"
                              >
                                <option value="about">About ( supplemental milestones/bulletins )</option>
                                <option value="canon">The Canon ( dynamic memoirs & essays )</option>
                                <option value="documents">Documents ( administrative files/materials )</option>
                                <option value="gallery">Media Gallery ( image grid memories )</option>
                              </select>
                            </div>

                            <div className="flex flex-col gap-1.5">
                              <label className="font-sans text-[10.5px] font-bold text-[#7A7A7A] tracking-wider uppercase">
                                Title *
                              </label>
                              <input
                                type="text"
                                required
                                value={cmsTitle}
                                onChange={(e) => setCmsTitle(e.target.value)}
                                placeholder="e.g. Statement on Federal Civil Service Reforms"
                                className="bg-[#F7F3EC]/40 border border-[#D8D0C0] focus:border-[#9B7A2F] outline-none p-3 text-sm text-[#121212] rounded-sm font-semibold"
                              />
                            </div>
                          </div>

                          {/* Description box */}
                          <div className="flex flex-col gap-1.5">
                            <label className="font-sans text-[10.5px] font-bold text-[#7A7A7A] tracking-wider uppercase">
                              Main Content / Description Body *
                            </label>
                            <textarea
                              required
                              rows={5}
                              value={cmsDescription}
                              onChange={(e) => setCmsDescription(e.target.value)}
                              placeholder={
                                cmsSection === 'gallery' 
                                  ? 'A brief caption or context for this gallery photo...' 
                                  : 'Rich text content of the article or explanation of the attached asset...'
                              }
                              className="bg-[#F7F3EC]/40 border border-[#D8D0C0] focus:border-[#9B7A2F] outline-none p-3.5 text-sm text-[#121212] rounded-sm leading-relaxed"
                            />
                          </div>

                          {/* Order, Link, and Status */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <div className="flex flex-col gap-1.5">
                              <label className="font-sans text-[10.5px] font-bold text-[#7A7A7A] tracking-wider uppercase">
                                Sort Order Weight (Ascending)
                              </label>
                              <input
                                type="number"
                                required
                                min={1}
                                value={cmsOrder}
                                onChange={(e) => setCmsOrder(parseInt(e.target.value) || 1)}
                                className="bg-[#F7F3EC]/40 border border-[#D8D0C0] focus:border-[#9B7A2F] outline-none p-3 text-sm text-[#121212] rounded-sm"
                              />
                            </div>

                            <div className="flex flex-col gap-1.5">
                              <label className="font-sans text-[10.5px] font-bold text-[#7A7A7A] tracking-wider uppercase">
                                Optional Reference Link URL
                              </label>
                              <input
                                type="url"
                                value={cmsLink}
                                onChange={(e) => setCmsLink(e.target.value)}
                                placeholder="https://..."
                                className="bg-[#F7F3EC]/40 border border-[#D8D0C0] focus:border-[#9B7A2F] outline-none p-3 text-sm text-[#121212] rounded-sm"
                              />
                            </div>

                            <div className="flex flex-col gap-1.5">
                              <label className="font-sans text-[10.5px] font-bold text-[#7A7A7A] tracking-wider uppercase">
                                Visibility Status *
                              </label>
                              <select
                                required
                                value={cmsStatus}
                                onChange={(e) => setCmsStatus(e.target.value as any)}
                                className="bg-[#F7F3EC]/40 border border-[#D8D0C0] focus:border-[#9B7A2F] outline-none p-3 text-sm text-[#121212] rounded-sm font-semibold"
                              >
                                <option value="published">Published ( Visible to public )</option>
                                <option value="draft">Draft ( Saved as administrative draft )</option>
                              </select>
                            </div>
                          </div>

                          {/* File selectors */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-[#F7F3EC]/45 border border-[#D8D0C0] rounded-sm">
                            {/* Image selector */}
                            <div className="space-y-2">
                              <label className="font-sans text-[10.5px] font-bold text-[#7A7A7A] tracking-wider uppercase flex items-center gap-1.5">
                                <Image size={13} className="text-[#9B7A2F]" /> Image Upload (Storage Bucket)
                              </label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                className="font-sans text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border file:border-[#D8D0C0] file:text-xs file:font-semibold file:bg-white file:text-[#7A7A7A] hover:file:text-[#121212] hover:file:bg-[#F7F3EC] cursor-pointer"
                              />
                              {(imageFile || cmsImageUrl) && (
                                <p className="font-mono text-[9px] text-emerald-800 m-0 truncate">
                                  {imageFile ? `Selected: ${imageFile.name}` : `Currently uploaded: ${cmsImageUrl.slice(0, 40)}...`}
                                </p>
                              )}
                            </div>

                            {/* Document/File selector */}
                            <div className="space-y-2">
                              <label className="font-sans text-[10.5px] font-bold text-[#7A7A7A] tracking-wider uppercase flex items-center gap-1.5">
                                <FileUp size={13} className="text-[#9B7A2F]" /> Document / PDF File Upload
                              </label>
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx,.txt,.zip"
                                onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                                className="font-sans text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border file:border-[#D8D0C0] file:text-xs file:font-semibold file:bg-white file:text-[#7A7A7A] hover:file:text-[#121212] hover:file:bg-[#F7F3EC] cursor-pointer"
                              />
                              {(docFile || cmsFileUrl) && (
                                <p className="font-mono text-[9px] text-emerald-800 m-0 truncate">
                                  {docFile ? `Selected: ${docFile.name}` : `Currently uploaded: ${cmsFileUrl.slice(0, 40)}...`}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Submit actions */}
                          <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
                            {editingItemId ? (
                              <div className="flex items-center gap-3 w-full sm:w-auto">
                                <button
                                  type="submit"
                                  disabled={cmsLoading}
                                  className="font-sans text-[11px] font-bold tracking-[0.2em] uppercase text-white bg-emerald-700 hover:bg-emerald-800 py-3.5 px-6 rounded-sm cursor-pointer border-none transition-colors flex items-center gap-2"
                                >
                                  {cmsLoading ? (
                                    <>
                                      <Loader2 size={13} className="animate-spin" /> Updating Block...
                                    </>
                                  ) : (
                                    'Apply Updated Content'
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={resetCmsForm}
                                  className="font-sans text-[11px] font-bold tracking-widest uppercase border border-red-200 text-red-700 hover:text-white hover:bg-red-700 py-3.5 px-5 rounded-sm cursor-pointer transition-colors"
                                >
                                  Cancel Edit
                                </button>
                              </div>
                            ) : (
                              <button
                                type="submit"
                                disabled={cmsLoading}
                                className="font-sans text-[11px] font-bold tracking-[0.2em] uppercase text-white bg-[#121212] hover:bg-[#9B7A2F] py-3.5 px-8 rounded-sm cursor-pointer border-none transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
                              >
                                {cmsLoading ? (
                                  <>
                                    <Loader2 size={13} className="animate-spin" /> Syncing with Firebase...
                                  </>
                                ) : (
                                  'Publish Section Content'
                                )}
                              </button>
                            )}
                          </div>
                        </form>
                      </div>

                      {/* Display Table List of Firestore contents */}
                      <div className="border border-[#D8D0C0] bg-white rounded-md p-6 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-[#D8D0C0]/50 pb-4">
                          <div>
                            <h4 className="font-serif text-[18px] font-bold text-[#121212] tracking-tight">
                              Dynamic Website Catalog Listings
                            </h4>
                            <span className="font-sans text-[11.5px] text-[#7A7A7A]">
                              Manage, edit or purge records.
                            </span>
                          </div>

                          {/* Section filter toggles */}
                          <div className="flex flex-wrap gap-1 font-sans text-xs bg-[#F7F3EC] p-1 border border-[#D8D0C0] rounded-sm">
                            {(['all', 'about', 'canon', 'documents', 'gallery'] as const).map((filterSec) => (
                              <button
                                key={filterSec}
                                onClick={() => setCmsFilterSection(filterSec)}
                                className={`px-2.5 py-1 text-[10px] font-bold uppercase cursor-pointer border-none transition-colors rounded-xs ${
                                  cmsFilterSection === filterSec 
                                    ? 'bg-[#121212] text-white' 
                                    : 'bg-transparent text-[#7A7A7A] hover:bg-white/50'
                                }`}
                              >
                                {filterSec}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* List items */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-left font-sans text-xs border-collapse">
                            <thead>
                              <tr className="bg-[#F7F3EC] border-b border-[#D8D0C0] text-[9.5px] font-bold text-[#7A7A7A] uppercase tracking-wider">
                                <th className="p-3 w-16 text-center">ORDER</th>
                                <th className="p-3 w-24">SECTION</th>
                                <th className="p-3">CONTENT INFORMATION</th>
                                <th className="p-3 w-28 text-center">MEDIA STATUS</th>
                                <th className="p-3 w-20">VISIBILITY</th>
                                <th className="p-3 w-20 text-right">ACTIONS</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#D8D0C0]/40">
                              {contentItems
                                .filter(item => cmsFilterSection === 'all' || item.section === cmsFilterSection)
                                .sort((a,b) => {
                                  if (a.section !== b.section) return a.section.localeCompare(b.section);
                                  return a.order - b.order;
                                })
                                .map((item) => (
                                  <tr key={item.id} className="hover:bg-[#F7F3EC]/20 transition-colors">
                                    <td className="p-3 font-mono font-bold text-[#9B7A2F] text-center text-sm">
                                      {item.order}
                                    </td>
                                    <td className="p-3 uppercase font-semibold text-[10px] text-[#7A7A7A] tracking-wider">
                                      <span className="px-1.5 py-0.5 bg-neutral-100 border border-[#D8D0C0]/60 rounded-xs">
                                        {item.section}
                                      </span>
                                    </td>
                                    <td className="p-3 text-justify">
                                      <h5 className="font-serif font-bold text-[13.5px] text-[#121212] mb-0.5">
                                        {item.title}
                                      </h5>
                                      <p className="m-0 font-sans text-[#7A7A7A] text-[11.5px] line-clamp-1 truncate max-w-[320px]">
                                        {item.description}
                                      </p>
                                    </td>
                                    <td className="p-3">
                                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                        {item.imageUrl && (
                                          <span className="flex items-center gap-0.5 p-1 bg-blue-50 border border-blue-200 text-blue-800 text-[9px] font-semibold uppercase rounded-xs" title="Connected Image Thumbnail">
                                            <Image size={10} /> Img
                                          </span>
                                        )}
                                        {item.fileUrl && (
                                          <span className="flex items-center gap-0.5 p-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[9px] font-semibold uppercase rounded-xs" title="Downloadable PDF File Attached">
                                            <FileUp size={10} /> Doc
                                          </span>
                                        )}
                                        {item.link && (
                                          <span className="flex items-center gap-0.5 p-1 bg-amber-50 border border-amber-200 text-amber-800 text-[9px] font-semibold uppercase rounded-xs" title="Linked Domain">
                                            <Globe size={10} /> Link
                                          </span>
                                        )}
                                        {!item.imageUrl && !item.fileUrl && !item.link && (
                                          <span className="text-[#C2BAA8] font-sans antialiased italic">Plain text</span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="p-3">
                                      <span className={`inline-flex items-center gap-1 font-sans text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase ${
                                        item.status === 'published' 
                                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300/40' 
                                          : 'bg-zinc-100 text-zinc-500 border border-zinc-200'
                                      }`}>
                                        {item.status === 'published' ? <Eye size={10} /> : <EyeOff size={10} />}
                                        {item.status}
                                      </span>
                                    </td>
                                    <td className="p-3 text-right">
                                      <div className="flex items-center justify-end gap-1.5">
                                        <button
                                          onClick={() => handleEditCmsItem(item)}
                                          className="p-1 bg-transparent hover:bg-neutral-100 rounded-sm text-[#7A7A7A] hover:text-[#121212] border-none cursor-pointer"
                                          title="Modify Item Details"
                                        >
                                          <Edit3 size={13} />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteCmsItem(item.id, item.title)}
                                          className="p-1 bg-transparent hover:bg-red-50 rounded-sm text-[#7A7A7A] hover:text-red-700 border-none cursor-pointer"
                                          title="Permanently Delete Item"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}

                              {contentItems.filter(item => cmsFilterSection === 'all' || item.section === cmsFilterSection).length === 0 && (
                                <tr>
                                  <td colSpan={6} className="text-center font-serif text-[14.5px] italic text-[#7A7A7A] py-12">
                                    No dynamic content blocks registered inside this section collection yet.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'settings' && (
                    <motion.div
                      key="settings"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="space-y-10"
                    >
                      {/* Section Heading */}
                      <div className="border border-[#D8D0C0] bg-white rounded-md p-6 sm:p-8 shadow-sm">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#D8D0C0]/60 pb-4 mb-6 gap-3">
                          <div>
                            <span className="font-sans text-[11px] font-bold tracking-[0.2em] text-[#9B7A2F] uppercase block mb-1">
                              PORTAL CONTROLLER
                            </span>
                            <h3 className="font-serif text-[22px] font-bold text-[#121212] tracking-tight">
                              Credential Settings & Access Control
                            </h3>
                            <p className="font-sans text-[13.5px] text-[#7A7A7A] mt-1 m-0">
                              Configure credentials, register administrator Google profiles, and elevate access security.
                            </p>
                          </div>
                        </div>

                        {settingsMessage && (
                          <div className={`mb-6 p-4 text-xs font-sans rounded-sm border flex items-start gap-2 ${
                            settingsMessage.type === 'success' 
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                              : 'bg-red-50 border-red-200 text-red-800'
                          }`}>
                            <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                            <div>{settingsMessage.text}</div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {/* Left Column: Fallback Passphrase */}
                          <div className="space-y-6">
                            <div>
                              <h4 className="font-serif text-[18px] font-bold text-[#121212] mb-1">
                                Fallback Console Passphrase
                              </h4>
                              <p className="font-sans text-[13px] text-[#7A7A7A] leading-relaxed mb-4">
                                Change the fallback password used to access the Admin Console with direct keyboard sign-in. Min 4 characters.
                              </p>

                              <form onSubmit={handleUpdatePassphrase} className="space-y-3">
                                <div>
                                  <label className="font-sans text-[10px] font-bold tracking-wider text-[#121212] uppercase block mb-1.5">
                                    CURRENT ACTIVE PASSPHRASE
                                  </label>
                                  <input
                                    type="text"
                                    value={consolePassphrase}
                                    onChange={(e) => setConsolePassphrase(e.target.value)}
                                    placeholder="Enter secure passphrase"
                                    disabled={settingsLoading}
                                    className="w-full bg-[#FAFAFA] border border-[#D8D0C0] px-4 py-2.5 rounded-sm font-sans text-sm text-[#121212] focus:outline-none focus:border-[#bac70a]"
                                  />
                                </div>

                                <button
                                  type="submit"
                                  disabled={settingsLoading}
                                  className="px-4 py-2.5 bg-[#121212] hover:bg-[#252525] text-white font-sans text-xs font-bold tracking-widest uppercase cursor-pointer rounded-sm border-none transition-colors w-full flex items-center justify-center gap-1.5"
                                >
                                  {settingsLoading ? <Loader2 size={13} className="animate-spin" /> : <Key size={13} />}
                                  Update Entry Passphrase
                                </button>
                              </form>
                            </div>
                          </div>

                          {/* Right Column: Google Admin Lists */}
                          <div className="space-y-6">
                            <div>
                              <h4 className="font-serif text-[18px] font-bold text-[#121212] mb-1">
                                Authorized Google Administrators
                              </h4>
                              <p className="font-sans text-[13px] text-[#7A7A7A] leading-relaxed mb-4">
                                Authorize specific email addresses. Eligible users will be automatically recognized as Admins when logging in securely with Google Auth.
                              </p>

                              <form onSubmit={handleAddAdmin} className="space-y-3 mb-6">
                                <div>
                                  <label className="font-sans text-[10px] font-bold tracking-wider text-[#121212] uppercase block mb-1.5">
                                    ADD ADMINISTRATOR EMAIL ADDRESS
                                  </label>
                                  <div className="flex gap-2">
                                    <input
                                      type="email"
                                      value={newAdminEmail}
                                      onChange={(e) => setNewAdminEmail(e.target.value)}
                                      placeholder="e.g. chancellor@chancellery.org"
                                      disabled={settingsLoading}
                                      className="flex-1 bg-[#FAFAFA] border border-[#D8D0C0] px-3 py-2 rounded-sm font-sans text-sm text-[#121212] focus:outline-none focus:border-[#bac70a]"
                                    />
                                    <button
                                      type="submit"
                                      disabled={settingsLoading}
                                      className="px-4 py-2 bg-[#9B7A2F] hover:bg-[#856828] text-white font-sans text-xs font-bold tracking-widest uppercase cursor-pointer rounded-sm border-none transition-colors whitespace-nowrap"
                                    >
                                      {settingsLoading ? <Loader2 size={13} className="animate-spin" /> : 'Authorize'}
                                    </button>
                                  </div>
                                </div>
                              </form>

                              {/* Registered emails list */}
                              <div>
                                <label className="font-sans text-[10px] font-bold tracking-wider text-[#7A7A7A] uppercase block mb-2">
                                  CURRENTLY DEPLOYED DELEGATES ({adminsList.length + 2})
                                </label>
                                <div className="border border-[#D8D0C0] rounded-sm divide-y divide-[#D8D0C0]/50 max-h-56 overflow-y-auto scrollbar-thin">
                                  {/* Bootstrapped system levels */}
                                  <div className="px-3 py-2 bg-slate-50 flex justify-between items-center text-xs">
                                    <div className="font-sans font-medium text-slate-700">
                                      japhetprosper13@gmail.com
                                      <span className="ml-2 px-1 text-[8px] border border-blue-200 text-blue-700 uppercase font-bold rounded-sm">system root</span>
                                    </div>
                                    <span className="font-sans text-[10px] text-slate-400 italic">Preconfigured</span>
                                  </div>
                                  <div className="px-3 py-2 bg-slate-50 flex justify-between items-center text-xs">
                                    <div className="font-sans font-medium text-slate-700">
                                      admin@chancellery.org
                                      <span className="ml-2 px-1 text-[8px] border border-blue-200 text-blue-700 uppercase font-bold rounded-sm">system root</span>
                                    </div>
                                    <span className="font-sans text-[10px] text-slate-400 italic">Preconfigured</span>
                                  </div>

                                  {/* Dynamic list */}
                                  {adminsList.map((adm) => (
                                    <div key={adm.email} className="px-3 py-2 bg-white flex justify-between items-center text-xs">
                                      <div className="font-sans text-[#121212] overflow-x-hidden truncate mr-2" title={adm.email}>
                                        {adm.email}
                                        <span className="ml-2 px-1 text-[8px] border border-[#D8D0C0] text-[#9B7A2F] uppercase font-bold rounded-sm">Mod</span>
                                      </div>
                                      <button
                                        onClick={() => handleRemoveAdmin(adm.email)}
                                        disabled={settingsLoading}
                                        className="p-1 px-2 border-none bg-transparent hover:bg-red-50 text-red-500 rounded-sm hover:text-red-700 cursor-pointer font-sans text-[10px] font-bold uppercase tracking-wider animate-none flex-shrink-0"
                                        title="Revoke admin authorization privileges"
                                      >
                                        Revoke
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
