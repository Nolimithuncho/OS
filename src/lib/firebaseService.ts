import { 
  collection, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  where,
  Timestamp,
  setDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, auth, isMockConfig } from '../firebase';

export { isMockConfig };

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface ContentItem {
  id: string;
  section: 'about' | 'canon' | 'documents' | 'gallery';
  title: string;
  description: string;
  fileUrl?: string;
  fileType?: string; // 'image' | 'pdf' | 'file'
  imageUrl?: string;
  link?: string;
  order: number;
  status: 'published' | 'draft';
  createdAt: string;
  updatedAt: string;
}

export interface SectionDef {
  id: string;
  name: string;
  description: string;
}

const DEFAULT_SECTIONS: SectionDef[] = [
  { id: 'about', name: 'About', description: 'About Osita Chidoka, career highlights and personal history' },
  { id: 'canon', name: 'The Canon', description: 'Essays, speeches, columns and research papers' },
  { id: 'documents', name: 'Documents', description: 'Official files, letters, briefs and downloadable policy essays' },
  { id: 'gallery', name: 'Media Gallery', description: 'Image reels and press media' }
];

// Helper to convert File to Base64 for offline fallback mode
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Upload a file to Firebase Storage with a base64 fallback on error or mock env
export async function uploadFile(file: File, folder: string): Promise<{ url: string; fileType: string }> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'png', 'svg'].includes(extension || '');
  const isPdf = extension === 'pdf';
  const fileType = isImage ? 'image' : isPdf ? 'pdf' : 'file';

  if (isMockConfig) {
    console.warn('Firebase is in mock/unconfigured mode. Falling back to local Base64 URL.');
    const base64 = await fileToBase64(file);
    return { url: base64, fileType };
  }

  try {
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const storageRef = ref(storage, `${folder}/${fileName}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return { url: downloadUrl, fileType };
  } catch (error) {
    console.error('Firebase Storage upload failed, using local Base64 fallback:', error);
    const base64 = await fileToBase64(file);
    return { url: base64, fileType };
  }
}

// Local cache keys
const LOCAL_CONTENT_KEY = 'osc_firebase_content';
const LOCAL_SECTIONS_KEY = 'osc_firebase_sections';

// Seeding helper for initial mock contents
function getInitialLocalContent(): ContentItem[] {
  return [
    {
      id: 'mock-doc-1',
      section: 'documents',
      title: 'National Security Policy Memorandum',
      description: 'A strategic briefing paper detailing biometric electronic decoupling paradigms for state police forces and national intelligence agency alignments.',
      fileUrl: '#',
      fileType: 'pdf',
      order: 1,
      status: 'published',
      createdAt: '2026-06-04T00:00:00.000Z',
      updatedAt: '2026-06-04T00:00:00.000Z'
    },
    {
      id: 'mock-doc-2',
      section: 'documents',
      title: 'FRSC Modernization Whitepaper',
      description: 'The official technological overhaul brief sent to the presidential transition committee on integrating regional drivers databases into high-speed fiber-optic registries.',
      fileUrl: '#',
      fileType: 'pdf',
      order: 2,
      status: 'published',
      createdAt: '2026-06-04T00:00:00.000Z',
      updatedAt: '2026-06-04T00:00:00.000Z'
    },
    {
      id: 'mock-img-1',
      section: 'gallery',
      title: 'Osita Chidoka delivering keynote address at Athena Leadership Forum',
      description: 'Delivering the foundational speech on the digitization of public sectors in Nigeria in Abuja.',
      imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60',
      fileType: 'image',
      order: 1,
      status: 'published',
      createdAt: '2026-06-04T00:00:00.000Z',
      updatedAt: '2026-06-04T00:00:00.000Z'
    },
    {
      id: 'mock-img-2',
      section: 'gallery',
      title: 'Leadership Panel with Emerging Fellows',
      description: 'A session mentoring young West African civic leaders on the engineering of transparent public service mechanisms.',
      imageUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&auto=format&fit=crop&q=60',
      fileType: 'image',
      order: 2,
      status: 'published',
      createdAt: '2026-06-04T00:00:00.000Z',
      updatedAt: '2026-06-04T00:00:00.000Z'
    }
  ];
}

function isPermissionError(err: unknown): boolean {
  if (!err) return false;
  const message = String((err as any).message || '').toLowerCase();
  const code = String((err as any).code || '').toLowerCase();
  return code === 'permission-denied' || message.includes('permission') || message.includes('insufficient');
}

// Fetch all sections
export async function getSections(): Promise<SectionDef[]> {
  if (isMockConfig) {
    return DEFAULT_SECTIONS;
  }

  try {
    const q = collection(db, 'sections');
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      // Seed Firebase sections if empty with admin passcode
      for (const sect of DEFAULT_SECTIONS) {
        await setDoc(doc(db, 'sections', sect.id), { ...sect, passcode: 'admin' });
      }
      return DEFAULT_SECTIONS;
    }
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SectionDef));
  } catch (err) {
    if (isPermissionError(err)) {
      handleFirestoreError(err, OperationType.GET, 'sections');
    }
    console.error('Error fetching Firestore sections, falling back to defaults:', err);
    return DEFAULT_SECTIONS;
  }
}

// Fetch content items from Firestore with local fallback
export async function getContentItems(isAdmin?: boolean): Promise<ContentItem[]> {
  if (isMockConfig) {
    const cached = localStorage.getItem(LOCAL_CONTENT_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // Fallback below
      }
    }
    const initial = getInitialLocalContent();
    localStorage.setItem(LOCAL_CONTENT_KEY, JSON.stringify(initial));
    return initial;
  }

  try {
    const colRef = collection(db, 'content');
    const snapshot = await getDocs(colRef);
    let items = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) } as ContentItem));
    
    // Filter drafts if the client isn't an authenticated admin
    if (!isAdmin) {
      items = items.filter(item => item.status === 'published');
    }
    
    // Cache latest items to local storage for premium offline access
    localStorage.setItem(LOCAL_CONTENT_KEY, JSON.stringify(items));
    return items;
  } catch (err) {
    if (isPermissionError(err)) {
      handleFirestoreError(err, OperationType.LIST, 'content');
    }
    console.error('Error fetching Firestore content, falling back to cache:', err);
    const cached = localStorage.getItem(LOCAL_CONTENT_KEY);
    return cached ? JSON.parse(cached) : getInitialLocalContent();
  }
}

// Create content item in Firestore
export async function createContentItem(item: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContentItem> {
  const now = new Date().toISOString();
  const createdItem: Omit<ContentItem, 'id'> = {
    ...item,
    createdAt: now,
    updatedAt: now,
    passcode: 'admin'
  } as any;

  if (isMockConfig) {
    const items = await getContentItems(true);
    const newItem: ContentItem = {
      ...createdItem,
      id: `local-item-${Date.now()}`
    } as any;
    const updated = [newItem, ...items];
    localStorage.setItem(LOCAL_CONTENT_KEY, JSON.stringify(updated));
    return newItem;
  }

  try {
    const docRef = await addDoc(collection(db, 'content'), createdItem);
    const newItem: ContentItem = {
      ...createdItem,
      id: docRef.id
    } as any;
    return newItem;
  } catch (err) {
    if (isPermissionError(err)) {
      handleFirestoreError(err, OperationType.CREATE, 'content');
    }
    console.error('Firestore createContentItem crash state, falling back to local storage:', err);
    const items = await getContentItems(true);
    const newItem: ContentItem = {
      ...createdItem,
      id: `local-item-${Date.now()}`
    } as any;
    const updated = [newItem, ...items];
    localStorage.setItem(LOCAL_CONTENT_KEY, JSON.stringify(updated));
    return newItem;
  }
}

// Update content item in Firestore
export async function updateContentItem(id: string, updates: Partial<ContentItem>): Promise<ContentItem> {
  const now = new Date().toISOString();
  
  if (isMockConfig || id.startsWith('local-item-') || id.startsWith('mock-')) {
    const items = await getContentItems(true);
    const targetIdx = items.findIndex(item => item.id === id);
    if (targetIdx === -1) throw new Error('Content item not found in local cache');
    
    const updatedItem: ContentItem = {
      ...items[targetIdx],
      ...updates,
      updatedAt: now
    };
    
    items[targetIdx] = updatedItem;
    localStorage.setItem(LOCAL_CONTENT_KEY, JSON.stringify(items));
    return updatedItem;
  }

  try {
    const docRef = doc(db, 'content', id);
    const sanitizedUpdates = { ...updates, updatedAt: now, passcode: 'admin' };
    delete (sanitizedUpdates as any).id; // Make sure internal ID is not written inside doc
    
    await updateDoc(docRef, sanitizedUpdates);
    
    const items = await getContentItems(true);
    const updated = items.map(item => item.id === id ? { ...item, ...sanitizedUpdates } : item);
    localStorage.setItem(LOCAL_CONTENT_KEY, JSON.stringify(updated));
    
    return { id, ...sanitizedUpdates } as ContentItem;
  } catch (err) {
    if (isPermissionError(err)) {
      handleFirestoreError(err, OperationType.UPDATE, `content/${id}`);
    }
    console.error('Firestore updateContentItem failed, saving to cache:', err);
    const items = await getContentItems(true);
    const targetIdx = items.findIndex(item => item.id === id);
    if (targetIdx === -1) throw new Error('Content item not found');
    
    const updatedItem: ContentItem = {
      ...items[targetIdx],
      ...updates,
      updatedAt: now
    };
    items[targetIdx] = updatedItem;
    localStorage.setItem(LOCAL_CONTENT_KEY, JSON.stringify(items));
    return updatedItem;
  }
}

// Delete content item from Firestore
export async function deleteContentItem(id: string): Promise<void> {
  if (isMockConfig || id.startsWith('local-item-') || id.startsWith('mock-')) {
    const items = await getContentItems(true);
    const filtered = items.filter(item => item.id !== id);
    localStorage.setItem(LOCAL_CONTENT_KEY, JSON.stringify(filtered));
    return;
  }

  try {
    await deleteDoc(doc(db, 'content', id));
    const items = await getContentItems(true);
    const filtered = items.filter(item => item.id !== id);
    localStorage.setItem(LOCAL_CONTENT_KEY, JSON.stringify(filtered));
  } catch (err) {
    if (isPermissionError(err)) {
      handleFirestoreError(err, OperationType.DELETE, `content/${id}`);
    }
    console.error('Firestore deleteContentItem crashed, removing from local cache:', err);
    const items = await getContentItems(true);
    const filtered = items.filter(item => item.id !== id);
    localStorage.setItem(LOCAL_CONTENT_KEY, JSON.stringify(filtered));
  }
}

// -----------------------------------------------------
// REAL SUBSCRIBERS SECURITY FIRESTORE SERVICES
// -----------------------------------------------------
const LOCAL_SUBS_KEY = 'osc_subscribers';

export interface FirebaseSubscriber {
  code: string;
  name: string;
  email: string;
  interests: string[];
  createdAt?: string;
}

export async function getSubscribers(): Promise<FirebaseSubscriber[]> {
  if (isMockConfig) {
    const cached = localStorage.getItem(LOCAL_SUBS_KEY);
    return cached ? JSON.parse(cached) : [];
  }

  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.warn('Skipping Firestore subscribers list fetch: User not authenticated.');
    const cached = localStorage.getItem(LOCAL_SUBS_KEY);
    return cached ? JSON.parse(cached) : [];
  }

  try {
    const colRef = collection(db, 'subscribers');
    const snapshot = await getDocs(colRef);
    const items = snapshot.docs.map(d => ({ email: d.id, ...d.data() } as FirebaseSubscriber));
    localStorage.setItem(LOCAL_SUBS_KEY, JSON.stringify(items));
    return items;
  } catch (err) {
    console.error('Firestore getSubscribers failed, returning local storage cache:', err);
    const cached = localStorage.getItem(LOCAL_SUBS_KEY);
    return cached ? JSON.parse(cached) : [];
  }
}

export async function createSubscriber(sub: FirebaseSubscriber): Promise<FirebaseSubscriber> {
  const finalSub: FirebaseSubscriber = {
    ...sub,
    createdAt: sub.createdAt || new Date().toISOString()
  };

  if (isMockConfig) {
    const cached = localStorage.getItem(LOCAL_SUBS_KEY);
    const existing = cached ? JSON.parse(cached) : [];
    const updated = [finalSub, ...existing.filter((s: any) => s.email.toLowerCase() !== sub.email.toLowerCase())];
    localStorage.setItem(LOCAL_SUBS_KEY, JSON.stringify(updated));
    return finalSub;
  }

  try {
    const docRef = doc(db, 'subscribers', sub.email.toLowerCase());
    await setDoc(docRef, finalSub);
    const cached = localStorage.getItem(LOCAL_SUBS_KEY);
    const existing: any[] = cached ? JSON.parse(cached) : [];
    const updated = [finalSub, ...existing.filter(s => s.email.toLowerCase() !== sub.email.toLowerCase())];
    localStorage.setItem(LOCAL_SUBS_KEY, JSON.stringify(updated));
    return finalSub;
  } catch (err) {
    if (isPermissionError(err)) {
      handleFirestoreError(err, OperationType.WRITE, `subscribers/${sub.email}`);
    }
    console.error('Firestore createSubscriber crashed, fallback to local storage:', err);
    const cached = localStorage.getItem(LOCAL_SUBS_KEY);
    const existing: any[] = cached ? JSON.parse(cached) : [];
    const updated = [finalSub, ...existing.filter(s => s.email.toLowerCase() !== sub.email.toLowerCase())];
    localStorage.setItem(LOCAL_SUBS_KEY, JSON.stringify(updated));
    return finalSub;
  }
}

export async function getSubscriberByEmail(email: string): Promise<FirebaseSubscriber | null> {
  if (isMockConfig) {
    const subs = await getSubscribers();
    return subs.find(s => s.email.toLowerCase() === email.toLowerCase()) || null;
  }

  if (!auth.currentUser) {
    return null;
  }

  try {
    const docRef = doc(db, 'subscribers', email.toLowerCase());
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { email: docSnap.id, ...docSnap.data() } as FirebaseSubscriber;
    }
    return null;
  } catch (err) {
    console.error(`Firestore getSubscriberByEmail (${email}) failed:`, err);
    return null;
  }
}

export async function deleteSubscriber(email: string): Promise<void> {
  if (isMockConfig) {
    const subs = await getSubscribers();
    const filtered = subs.filter(s => s.email.toLowerCase() !== email.toLowerCase());
    localStorage.setItem(LOCAL_SUBS_KEY, JSON.stringify(filtered));
    return;
  }

  try {
    const docRef = doc(db, 'subscribers', email.toLowerCase());
    await deleteDoc(docRef);
    const cached = localStorage.getItem(LOCAL_SUBS_KEY);
    if (cached) {
      const subs: FirebaseSubscriber[] = JSON.parse(cached);
      const filtered = subs.filter(s => s.email.toLowerCase() !== email.toLowerCase());
      localStorage.setItem(LOCAL_SUBS_KEY, JSON.stringify(filtered));
    }
  } catch (err) {
    if (isPermissionError(err)) {
      handleFirestoreError(err, OperationType.DELETE, `subscribers/${email}`);
    }
    console.error('Firestore deleteSubscriber fail:', err);
  }
}

// -----------------------------------------------------
// REAL FELLOWSHIP/MENTORSHIP APPLICATIONS FIRESTORE SERVICES
// -----------------------------------------------------
const LOCAL_MENTORSHIP_KEY = 'osc_mentorship_apps';

export interface FirebaseMentorshipApp {
  id: string;
  name: string;
  email: string;
  discipline: string;
  proposal: string;
  focus: string;
  status: 'PENDING ADMISSION REVIEW' | 'APPROVED' | 'DECLINED';
  userId?: string;
  createdAt?: string;
  _unsynced?: boolean;
}

export async function getMentorshipApps(isAdminUser?: boolean): Promise<FirebaseMentorshipApp[]> {
  if (isMockConfig) {
    const cached = localStorage.getItem(LOCAL_MENTORSHIP_KEY);
    return cached ? JSON.parse(cached) : [];
  }

  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.warn('Skipping Firestore mentorship apps fetch: User not authenticated.');
    const cached = localStorage.getItem(LOCAL_MENTORSHIP_KEY);
    return cached ? JSON.parse(cached) : [];
  }

  try {
    const currentUid = currentUser.uid;
    const email = currentUser.email || '';
    const isUserAdmin = isAdminUser !== undefined 
      ? isAdminUser 
      : (email.toLowerCase().trim() === 'japhetprosper13@gmail.com' || email.toLowerCase().trim() === 'admin@chancellery.org');

    // Background sync of locally stored/offline applications up to Firestore database securely
    try {
      const cached = localStorage.getItem(LOCAL_MENTORSHIP_KEY);
      if (cached) {
        const localApps: FirebaseMentorshipApp[] = JSON.parse(cached);
        for (const app of localApps) {
          if (app.id && app._unsynced) {
            // Only sync if admin, or if it is our own app or a guest/new app
            const isOwner = app.userId === currentUid || app.userId === 'guest' || !app.userId;
            if (!isUserAdmin && !isOwner) {
              continue;
            }
            const docRef = doc(db, 'mentorship', app.id);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
              console.log('Background syncing offline application to Firestore:', app.id);
              const { _unsynced, ...cleanApp } = app;
              await setDoc(docRef, {
                ...cleanApp,
                createdAt: app.createdAt || new Date().toISOString(),
                status: app.status || 'PENDING ADMISSION REVIEW',
                userId: app.userId !== 'guest' ? app.userId : (currentUid || 'guest')
              });
            }
          }
        }
      }
    } catch (syncErr) {
      console.warn('Silent offline-to-cloud automatic syncing failed:', syncErr);
    }

    let snapshot;
    if (isUserAdmin) {
      const colRef = collection(db, 'mentorship');
      snapshot = await getDocs(colRef);
    } else if (currentUid) {
      const colRef = collection(db, 'mentorship');
      const q = query(colRef, where('userId', '==', currentUid));
      snapshot = await getDocs(q);
    } else {
      // Not logged in: no personal documents to fetch
      const cached = localStorage.getItem(LOCAL_MENTORSHIP_KEY);
      return cached ? JSON.parse(cached) : [];
    }

    const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FirebaseMentorshipApp));
    localStorage.setItem(LOCAL_MENTORSHIP_KEY, JSON.stringify(items));
    return items;
  } catch (err) {
    if (isPermissionError(err)) {
      handleFirestoreError(err, OperationType.LIST, 'mentorship');
    }
    console.error('Firestore getMentorships failed, fall back to local storage cache:', err);
    const cached = localStorage.getItem(LOCAL_MENTORSHIP_KEY);
    return cached ? JSON.parse(cached) : [];
  }
}

export async function createMentorshipApp(app: FirebaseMentorshipApp): Promise<FirebaseMentorshipApp> {
  const finalApp: FirebaseMentorshipApp = {
    ...app,
    createdAt: app.createdAt || new Date().toISOString(),
    status: app.status || 'PENDING ADMISSION REVIEW',
    userId: app.userId || auth.currentUser?.uid || 'guest'
  };

  if (isMockConfig) {
    const apps = await getMentorshipApps();
    const updated = [finalApp, ...apps.filter(a => a.id !== app.id)];
    localStorage.setItem(LOCAL_MENTORSHIP_KEY, JSON.stringify(updated));
    return finalApp;
  }

  try {
    const docRef = doc(db, 'mentorship', app.id);
    await setDoc(docRef, finalApp);
    const apps = await getMentorshipApps();
    const updated = [finalApp, ...apps.filter(a => a.id !== app.id)];
    localStorage.setItem(LOCAL_MENTORSHIP_KEY, JSON.stringify(updated));
    return finalApp;
  } catch (err) {
    if (isPermissionError(err)) {
      handleFirestoreError(err, OperationType.WRITE, `mentorship/${app.id}`);
    }
    console.error('Firestore createMentorshipApp crash, caching offline:', err);
    const apps = await getMentorshipApps();
    const offlineApp: FirebaseMentorshipApp = { ...finalApp, _unsynced: true };
    const updated = [offlineApp, ...apps.filter(a => a.id !== app.id)];
    localStorage.setItem(LOCAL_MENTORSHIP_KEY, JSON.stringify(updated));
    return offlineApp;
  }
}

export async function updateMentorshipAppStatus(appId: string, status: 'PENDING ADMISSION REVIEW' | 'APPROVED' | 'DECLINED'): Promise<void> {
  if (isMockConfig || appId.startsWith('mock-') || appId.startsWith('local-')) {
    const apps = await getMentorshipApps();
    const updated = apps.map(app => app.id === appId ? { ...app, status } : app as any);
    localStorage.setItem(LOCAL_MENTORSHIP_KEY, JSON.stringify(updated));
    return;
  }

  try {
    const docRef = doc(db, 'mentorship', appId);
    await updateDoc(docRef, { status });
  } catch (err) {
    if (isPermissionError(err)) {
      handleFirestoreError(err, OperationType.UPDATE, `mentorship/${appId}`);
    }
    console.error('Firestore updateMentorship status failure:', err);
  }
}

export async function deleteMentorshipApp(appId: string): Promise<void> {
  if (isMockConfig || appId.startsWith('mock-') || appId.startsWith('local-')) {
    const apps = await getMentorshipApps();
    const filtered = apps.filter(app => app.id !== appId);
    localStorage.setItem(LOCAL_MENTORSHIP_KEY, JSON.stringify(filtered));
    return;
  }

  try {
    const docRef = doc(db, 'mentorship', appId);
    await deleteDoc(docRef);
    const cached = localStorage.getItem(LOCAL_MENTORSHIP_KEY);
    if (cached) {
      const apps: FirebaseMentorshipApp[] = JSON.parse(cached);
      const filtered = apps.filter(app => app.id !== appId);
      localStorage.setItem(LOCAL_MENTORSHIP_KEY, JSON.stringify(filtered));
    }
  } catch (err) {
    if (isPermissionError(err)) {
      handleFirestoreError(err, OperationType.DELETE, `mentorship/${appId}`);
    }
    console.error('Firestore deleteMentorship failed:', err);
  }
}

// -----------------------------------------------------
// REAL COMMENTS SECURITY FIRESTORE SERVICES
// -----------------------------------------------------
const LOCAL_COMMENTS_KEY = 'osc_comments';

export interface FirebaseComment {
  id: string; // unique identification
  essayId: string;
  name: string;
  text: string;
  createdAt: string;
  userId?: string;
}

export async function getComments(): Promise<FirebaseComment[]> {
  if (isMockConfig) {
    const cached = localStorage.getItem(LOCAL_COMMENTS_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        return [];
      }
    }
    return [];
  }

  try {
    const colRef = collection(db, 'comments');
    const snapshot = await getDocs(colRef);
    const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FirebaseComment));
    localStorage.setItem(LOCAL_COMMENTS_KEY, JSON.stringify(items));
    return items;
  } catch (err) {
    if (isPermissionError(err)) {
      handleFirestoreError(err, OperationType.LIST, 'comments');
    }
    console.error('Firestore getComments failed, fallback to local storage:', err);
    const cached = localStorage.getItem(LOCAL_COMMENTS_KEY);
    return cached ? JSON.parse(cached) : [];
  }
}

export async function createComment(cmt: Omit<FirebaseComment, 'id'>): Promise<FirebaseComment> {
  const commentId = `comment-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
  const finalCmt: FirebaseComment = {
    ...cmt,
    id: commentId,
    userId: cmt.userId || auth.currentUser?.uid || 'guest'
  };

  if (isMockConfig) {
    const comments = await getComments();
    const updated = [finalCmt, ...comments];
    localStorage.setItem(LOCAL_COMMENTS_KEY, JSON.stringify(updated));
    return finalCmt;
  }

  try {
    const docRef = doc(db, 'comments', commentId);
    await setDoc(docRef, finalCmt);
    const comments = await getComments();
    const updated = [finalCmt, ...comments];
    localStorage.setItem(LOCAL_COMMENTS_KEY, JSON.stringify(updated));
    return finalCmt;
  } catch (err) {
    if (isPermissionError(err)) {
      handleFirestoreError(err, OperationType.CREATE, `comments/${commentId}`);
    }
    console.error('Firestore createComment failed, saving locally:', err);
    const comments = await getComments();
    const updated = [finalCmt, ...comments];
    localStorage.setItem(LOCAL_COMMENTS_KEY, JSON.stringify(updated));
    return finalCmt;
  }
}

export async function deleteComment(id: string): Promise<void> {
  if (isMockConfig) {
    const comments = await getComments();
    const filtered = comments.filter(c => c.id !== id);
    localStorage.setItem(LOCAL_COMMENTS_KEY, JSON.stringify(filtered));
    return;
  }

  try {
    const docRef = doc(db, 'comments', id);
    await deleteDoc(docRef);
    const comments = await getComments();
    const filtered = comments.filter(c => c.id !== id);
    localStorage.setItem(LOCAL_COMMENTS_KEY, JSON.stringify(filtered));
  } catch (err) {
    if (isPermissionError(err)) {
      handleFirestoreError(err, OperationType.DELETE, `comments/${id}`);
    }
    console.error('Firestore deleteComment crashed:', err);
  }
}

export interface FirebaseAdmin {
  email: string;
  addedAt: string;
}

const LOCAL_ADMINS_KEY = 'osc_firebase_admins';
const LOCAL_PASSPHRASE_KEY = 'osc_firebase_passphrase';

export async function getAdmins(): Promise<FirebaseAdmin[]> {
  if (isMockConfig) {
    const cached = localStorage.getItem(LOCAL_ADMINS_KEY);
    return cached ? JSON.parse(cached) : [];
  }

  try {
    const colRef = collection(db, 'admins');
    const snapshot = await getDocs(colRef);
    const items = snapshot.docs.map(d => ({ email: d.id, ...d.data() } as FirebaseAdmin));
    localStorage.setItem(LOCAL_ADMINS_KEY, JSON.stringify(items));
    return items;
  } catch (err) {
    if (isPermissionError(err)) {
      handleFirestoreError(err, OperationType.LIST, 'admins');
    }
    console.error('Firestore getAdmins failed, returning local cache:', err);
    const cached = localStorage.getItem(LOCAL_ADMINS_KEY);
    return cached ? JSON.parse(cached) : [];
  }
}

export async function createAdmin(email: string): Promise<FirebaseAdmin> {
  const finalAdmin: FirebaseAdmin = {
    email: email.toLowerCase().trim(),
    addedAt: new Date().toISOString()
  };

  if (isMockConfig) {
    const admins = await getAdmins();
    const updated = [finalAdmin, ...admins.filter(a => a.email !== finalAdmin.email)];
    localStorage.setItem(LOCAL_ADMINS_KEY, JSON.stringify(updated));
    return finalAdmin;
  }

  try {
    const docRef = doc(db, 'admins', finalAdmin.email);
    await setDoc(docRef, finalAdmin);
    const admins = await getAdmins();
    const updated = [finalAdmin, ...admins.filter(a => a.email !== finalAdmin.email)];
    localStorage.setItem(LOCAL_ADMINS_KEY, JSON.stringify(updated));
    return finalAdmin;
  } catch (err) {
    if (isPermissionError(err)) {
      handleFirestoreError(err, OperationType.WRITE, `admins/${finalAdmin.email}`);
    }
    console.error('Firestore createAdmin crashed, fallback to local storage:', err);
    const admins = await getAdmins();
    const updated = [finalAdmin, ...admins.filter(a => a.email !== finalAdmin.email)];
    localStorage.setItem(LOCAL_ADMINS_KEY, JSON.stringify(updated));
    return finalAdmin;
  }
}

export async function deleteAdmin(email: string): Promise<void> {
  const cleanEmail = email.toLowerCase().trim();
  if (isMockConfig) {
    const admins = await getAdmins();
    const filtered = admins.filter(a => a.email !== cleanEmail);
    localStorage.setItem(LOCAL_ADMINS_KEY, JSON.stringify(filtered));
    return;
  }

  try {
    const docRef = doc(db, 'admins', cleanEmail);
    await deleteDoc(docRef);
    const admins = await getAdmins();
    const filtered = admins.filter(a => a.email !== cleanEmail);
    localStorage.setItem(LOCAL_ADMINS_KEY, JSON.stringify(filtered));
  } catch (err) {
    if (isPermissionError(err)) {
      handleFirestoreError(err, OperationType.DELETE, `admins/${cleanEmail}`);
    }
    console.error('Firestore deleteAdmin crashed:', err);
  }
}

export async function getAdminPassphrase(): Promise<string> {
  if (isMockConfig) {
    return localStorage.getItem(LOCAL_PASSPHRASE_KEY) || 'admin';
  }

  try {
    const docRef = doc(db, 'config', 'admin_passphrase');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data && data.passphrase) {
        localStorage.setItem(LOCAL_PASSPHRASE_KEY, data.passphrase);
        return data.passphrase;
      }
    }
    const cached = localStorage.getItem(LOCAL_PASSPHRASE_KEY);
    return cached || 'admin';
  } catch (err) {
    console.error('Firestore getAdminPassphrase failed, using custom local cache:', err);
    return localStorage.getItem(LOCAL_PASSPHRASE_KEY) || 'admin';
  }
}

export async function updateAdminPassphrase(passphrase: string): Promise<void> {
  const cleanPass = passphrase.trim();
  if (isMockConfig) {
    localStorage.setItem(LOCAL_PASSPHRASE_KEY, cleanPass);
    return;
  }

  try {
    const docRef = doc(db, 'config', 'admin_passphrase');
    await setDoc(docRef, { passphrase: cleanPass });
    localStorage.setItem(LOCAL_PASSPHRASE_KEY, cleanPass);
  } catch (err) {
    if (isPermissionError(err)) {
      handleFirestoreError(err, OperationType.WRITE, 'config/admin_passphrase');
    }
    console.error('Firestore updateAdminPassphrase crashed:', err);
  }
}

export interface FirebaseAdminUser {
  name: string;
  email: string;
  password?: string;
  addedAt: string;
}

const LOCAL_ADMIN_USERS_KEY = 'osc_firebase_admin_users';

export async function getAdminUsers(): Promise<FirebaseAdminUser[]> {
  if (isMockConfig) {
    const cached = localStorage.getItem(LOCAL_ADMIN_USERS_KEY);
    return cached ? JSON.parse(cached) : [];
  }

  try {
    const colRef = collection(db, 'admin_users');
    const snapshot = await getDocs(colRef);
    const items = snapshot.docs.map(d => ({ email: d.id, ...d.data() } as FirebaseAdminUser));
    localStorage.setItem(LOCAL_ADMIN_USERS_KEY, JSON.stringify(items));
    return items;
  } catch (err) {
    if (isPermissionError(err)) {
      handleFirestoreError(err, OperationType.LIST, 'admin_users');
    }
    console.error('Firestore getAdminUsers failed, returning local cache:', err);
    const cached = localStorage.getItem(LOCAL_ADMIN_USERS_KEY);
    return cached ? JSON.parse(cached) : [];
  }
}

export async function createAdminUser(user: { name: string; email: string; password?: string }): Promise<FirebaseAdminUser> {
  const finalUser: FirebaseAdminUser = {
    name: user.name.trim(),
    email: user.email.toLowerCase().trim(),
    password: user.password || '',
    addedAt: new Date().toISOString()
  };

  if (isMockConfig) {
    const users = await getAdminUsers();
    const updated = [finalUser, ...users.filter(u => u.email !== finalUser.email)];
    localStorage.setItem(LOCAL_ADMIN_USERS_KEY, JSON.stringify(updated));
    return finalUser;
  }

  try {
    const docRef = doc(db, 'admin_users', finalUser.email);
    await setDoc(docRef, finalUser);
    
    // Also add to admins collection so that standard isAdmin() rules verify their email
    const docRefAdmins = doc(db, 'admins', finalUser.email);
    await setDoc(docRefAdmins, { email: finalUser.email, addedAt: finalUser.addedAt });

    const users = await getAdminUsers();
    const updated = [finalUser, ...users.filter(u => u.email !== finalUser.email)];
    localStorage.setItem(LOCAL_ADMIN_USERS_KEY, JSON.stringify(updated));
    return finalUser;
  } catch (err) {
    if (isPermissionError(err)) {
      handleFirestoreError(err, OperationType.WRITE, `admin_users/${finalUser.email}`);
    }
    console.error('Firestore createAdminUser crashed, fallback to local storage:', err);
    const users = await getAdminUsers();
    const updated = [finalUser, ...users.filter(u => u.email !== finalUser.email)];
    localStorage.setItem(LOCAL_ADMIN_USERS_KEY, JSON.stringify(updated));
    return finalUser;
  }
}

export async function getAdminUserByEmail(email: string): Promise<FirebaseAdminUser | null> {
  const cleanEmail = email.toLowerCase().trim();
  if (isMockConfig) {
    const users = await getAdminUsers();
    return users.find(u => u.email === cleanEmail) || null;
  }

  try {
    const docRef = doc(db, 'admin_users', cleanEmail);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { email: docSnap.id, ...docSnap.data() } as FirebaseAdminUser;
    }
    const list = await getAdminUsers();
    return list.find(u => u.email === cleanEmail) || null;
  } catch (err) {
    console.error(`Firestore getAdminUserByEmail (${cleanEmail}) failed:`, err);
    const users = await getAdminUsers();
    return users.find(u => u.email === cleanEmail) || null;
  }
}

// -----------------------------------------------------
// REAL FELLOWSHIP DECISION RESPONSES FIRESTORE SERVICES
// -----------------------------------------------------
const LOCAL_RESPONSES_KEY = 'osc_dec_responses';

export interface FirebaseDecisionResponse {
  id: string;
  appId: string;
  applicantName: string;
  applicantEmail: string;
  status: 'APPROVED' | 'DECLINED';
  feedback: string;
  respondedAt: string;
  respondedBy: string;
}

export async function getDecisionResponses(): Promise<FirebaseDecisionResponse[]> {
  if (isMockConfig) {
    const cached = localStorage.getItem(LOCAL_RESPONSES_KEY);
    return cached ? JSON.parse(cached) : [];
  }

  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.warn('Skipping Firestore decision responses fetch: User not authenticated.');
    const cached = localStorage.getItem(LOCAL_RESPONSES_KEY);
    return cached ? JSON.parse(cached) : [];
  }

  try {
    const colRef = collection(db, 'responses');
    const snapshot = await getDocs(colRef);
    const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FirebaseDecisionResponse));
    localStorage.setItem(LOCAL_RESPONSES_KEY, JSON.stringify(items));
    return items;
  } catch (err) {
    console.error('Firestore getDecisionResponses failed, fall back to cache:', err);
    const cached = localStorage.getItem(LOCAL_RESPONSES_KEY);
    return cached ? JSON.parse(cached) : [];
  }
}

export async function createDecisionResponse(resp: FirebaseDecisionResponse): Promise<FirebaseDecisionResponse> {
  const finalResp: FirebaseDecisionResponse = {
    ...resp,
    respondedAt: resp.respondedAt || new Date().toISOString()
  };

  if (isMockConfig) {
    const cached = localStorage.getItem(LOCAL_RESPONSES_KEY);
    const existing = cached ? JSON.parse(cached) : [];
    const updated = [finalResp, ...existing.filter((r: any) => r.id !== resp.id)];
    localStorage.setItem(LOCAL_RESPONSES_KEY, JSON.stringify(updated));
    return finalResp;
  }

  try {
    const docRef = doc(db, 'responses', resp.id);
    await setDoc(docRef, finalResp);
    const cached = localStorage.getItem(LOCAL_RESPONSES_KEY);
    const existing = cached ? JSON.parse(cached) : [];
    const updated = [finalResp, ...existing.filter((r: any) => r.id !== resp.id)];
    localStorage.setItem(LOCAL_RESPONSES_KEY, JSON.stringify(updated));
    return finalResp;
  } catch (err) {
    if (isPermissionError(err)) {
      handleFirestoreError(err, OperationType.WRITE, `responses/${resp.id}`);
    }
    console.error('Firestore createDecisionResponse failure, caching local:', err);
    const cached = localStorage.getItem(LOCAL_RESPONSES_KEY);
    const existing = cached ? JSON.parse(cached) : [];
    const updated = [finalResp, ...existing.filter((r: any) => r.id !== resp.id)];
    localStorage.setItem(LOCAL_RESPONSES_KEY, JSON.stringify(updated));
    return finalResp;
  }
}

export async function deleteDecisionResponse(id: string): Promise<void> {
  if (isMockConfig || id.startsWith('mock-') || id.startsWith('local-')) {
    const cached = localStorage.getItem(LOCAL_RESPONSES_KEY);
    if (cached) {
      const items: FirebaseDecisionResponse[] = JSON.parse(cached);
      const filtered = items.filter(r => r.id !== id);
      localStorage.setItem(LOCAL_RESPONSES_KEY, JSON.stringify(filtered));
    }
    return;
  }

  try {
    const docRef = doc(db, 'responses', id);
    await deleteDoc(docRef);
    const cached = localStorage.getItem(LOCAL_RESPONSES_KEY);
    if (cached) {
      const items: FirebaseDecisionResponse[] = JSON.parse(cached);
      const filtered = items.filter(r => r.id !== id);
      localStorage.setItem(LOCAL_RESPONSES_KEY, JSON.stringify(filtered));
    }
  } catch (err) {
    if (isPermissionError(err)) {
      handleFirestoreError(err, OperationType.DELETE, `responses/${id}`);
    }
    console.error('Firestore deleteDecisionResponse failure:', err);
  }
}

