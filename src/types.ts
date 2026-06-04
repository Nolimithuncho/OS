export interface Essay {
  id: string;
  title: string;
  subtitle?: string;
  deck?: string;
  category: string;
  date: string;
  year: number;
  isFeatured?: boolean;
  pdfAvailable?: boolean;
  seriesName?: string;
  seriesPart?: number;
  content: string;
}

export interface Institution {
  id: string;
  name: string;
  roleLabel: string;
  tagline: string;
  description: string;
  details: string[];
  websiteUrl?: string;
}

export interface MentorshipVector {
  title: string;
  description: string;
}

export interface Subscriber {
  code: string;
  name: string;
  email: string;
  interests: string[];
}

export interface MentorshipApp {
  id: string;
  name: string;
  email: string;
  discipline: string;
  proposal: string;
  focus: string;
  status: 'PENDING ADMISSION REVIEW' | 'APPROVED';
}

export interface Comment {
  name: string;
  text: string;
  date: string;
}

export interface User {
  role: 'admin' | 'subscriber';
  email: string;
  name: string;
  code?: string;
}
