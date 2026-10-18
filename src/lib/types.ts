// Shared client-side types mirroring Prisma models

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  cover: string | null;
  status: string;
  featured: boolean;
  views: number;
  author: string;
  createdAt: string;
  updatedAt: string;
}

export interface Ecosystem {
  id: string;
  number: number;
  name: string;
  cluster: string;
  scope: string;
  standard: string;
  icon: string;
  color: string;
  description: string;
  image: string | null;
}

export interface JourneyStep {
  id: string;
  step: number;
  title: string;
  activity: string;
  actor: string;
  output: string;
  icon: string;
}

export interface Roadmap {
  id: string;
  phase: string;
  period: string;
  focus: string;
  deliverables: string;
  order: number;
}

export interface Member {
  id: string;
  name: string;
  type: string;
  city: string;
  province: string;
  licenseNo: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  description: string | null;
  rating: number;
  status: string;
  memberSince: number;
}

export interface Tutorial {
  id: string;
  title: string;
  slug: string;
  category: string;
  level: string;
  duration: number;
  summary: string;
  content: string;
  order: number;
  published: boolean;
  views: number;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}

export interface MembershipApplication {
  id: string;
  orgName: string;
  type: string;
  contactName: string;
  email: string;
  phone: string;
  city: string;
  province: string;
  licenseNo: string;
  message: string | null;
  status: string;
  ticketCode?: string;
  reviewNote?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  rating: number;
  published: boolean;
}

export interface ManagementMember {
  id: string;
  name: string;
  position: string;
  bio: string | null;
  order: number;
}

/** Jaringan kepengurusan daerah — DPD/DPC & Branch Office (Task 19). */
export interface RegionalBranchItem {
  id: string;
  name: string;
  code: string;
  province: string;
  city: string;
  officeName: string;
  address: string;
  picName: string;
  picPhone: string;
  email: string | null;
  description: string | null;
  published: boolean;
  order: number;
}

export interface SiteSettings {
  [key: string]: string;
}

export interface AdminStats {
  articles: number;
  tutorials: number;
  members: number;
  pendingMembers: number;
  unreadMessages: number;
  pendingApplications: number;
  unreadComplaints?: number;
  subscribers?: number;
  totalViews: number;
  testimonials: number;
  faqs: number;
  byCategory: { category: string; count: number }[];
  memberByType?: { type: string; count: number }[]; // Task 33 — grup keanggotaan per jenis
  recentMessages: ContactMessage[];
  recentApplications: MembershipApplication[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive?: boolean;
}

/** Task 15-c — baris daftar akun admin (tanpa password). */
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

/** Task 15-d — konfigurasi notifikasi WhatsApp (token tidak pernah dikirim balik). */
export interface WhatsAppConfig {
  provider: string;
  apiUrl: string;
  target: string;
  enabled: boolean;
  notifyContact: boolean;
  notifyApplication: boolean;
  hasToken: boolean;
  tokenMasked: string;
  lastTestAt: string | null;
  lastTestStatus: string;
}

// ==================== KELENGKAPAN PORTAL (Task 18) ====================

export interface GalleryItem {
  id: string;
  title: string;
  caption: string | null;
  category: string;
  imageUrl: string;
  order: number;
  published: boolean;
  createdAt: string;
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string | null;
  category: string;
  published: boolean;
  createdAt: string;
}

export interface ResourceItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  fileUrl: string;
  fileType: string;
  published: boolean;
  downloads: number;
  createdAt: string;
}

export interface SubscriberItem {
  id: string;
  email: string;
  isActive: boolean;
  createdAt: string;
}

export interface ComplaintItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  targetMember: string | null;
  category: string;
  content: string;
  status: string; // UNREAD | PROCESSED | CLOSED
  responseNote: string | null;
  respondedBy: string | null;
  respondedAt: string | null;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  userId: string | null;
  userName: string;
  role: string;
  action: string;
  entity: string;
  entityId: string | null;
  detail: string | null;
  createdAt: string;
}

/** Hasil pelacakan publik — data sensitif disamarkan. */
export interface TrackResult {
  found: boolean;
  ticketCode: string;
  orgName: string;
  type: string;
  status: string;
  submittedAt: string;
  reviewedAt: string | null;
  reviewNote: string | null;
}

// ==================== NUSUK ====================

export type NusukPermitType = "VISA" | "HANDLING" | "MUTAWIF" | "HOTEL" | "TRANSPORT" | "RAUDAH";

export interface NusukConnection {
  id: string;
  environment: string;
  status: string;
  autoSync: boolean;
  totalSyncs: number;
  lastSyncAt: string | null;
  apiKeyMasked?: string;
  apiKey?: string;
  webhookSecret?: string;
}

export interface NusukPermit {
  id: string;
  memberId: string;
  type: string;
  permitNo: string;
  holderName: string;
  meta: string | null;
  status: string;
  issuedAt: string;
  expiresAt: string;
  syncedAt: string;
  member?: { id: string; name: string; type: string; city: string; licenseNo: string };
}

export interface NusukSyncLog {
  id: string;
  type: string;
  status: string;
  message: string;
  recordsAffected: number;
  durationMs: number;
  createdAt: string;
}

export interface NusukMetrics {
  permitsTotal: number;
  permitsActive: number;
  permitsPending: number;
  permitsExpired: number;
  permitsRejected: number;
  membersConnected: number;
  successRate: number;
  syncsLast7d: number;
  avgDurationMs: number;
  byType: { type: string; total: number; active: number }[];
}

export interface NusukPublicData {
  connection: {
    status: string;
    environment: string;
    lastSyncAt: string | null;
    totalSyncs: number;
    autoSync: boolean;
  };
  metrics: NusukMetrics;
  ecosystems: { number: number; name: string; icon: string; cluster: string }[];
  recentLogs: NusukSyncLog[];
  topMembers: {
    id: string;
    name: string;
    type: string;
    city: string;
    activePermits: number;
    compliance: number;
  }[];
}

export interface NusukSyncResult {
  logId: string;
  status: string;
  message: string;
  created: number;
  updated: number;
  expired: number;
  skipped: number;
  recordsAffected: number;
  durationMs: number;
}
