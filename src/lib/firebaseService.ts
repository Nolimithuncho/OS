import { 
  collection, 
  getDocs, 
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
