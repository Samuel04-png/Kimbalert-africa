export type Role = 'guardian' | 'admin' | 'partner';

export type ReportStatus = 'pending' | 'active' | 'found' | 'closed' | 'retracted';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export type PartnerType = 'police' | 'hospital' | 'school' | 'media' | 'community';

export interface UserBase {
  id: string;
  role: Role;
  fullName: string;
  phone: string;
  email: string;
  nationalId?: string;
  location?: string;
  avatarUrl?: string;
  joinedAt: string;
}

export interface GuardianUser extends UserBase {
  role: 'guardian';
  childrenCount: number;
  verified: boolean;
}

export interface AdminUser extends UserBase {
  role: 'admin';
  permissions: string[];
  online: boolean;
}

export interface PartnerUser extends UserBase {
  role: 'partner';
  partnerType: PartnerType;
  active: boolean;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  whatsapp?: string;
}

export interface ChildMedical {
  bloodType: string;
  conditions: string[];
  medications: string[];
  allergies: string[];
  doctorPhone?: string;
}

export interface ChildLocation {
  schoolName: string;
  safeZoneLabel: string;
  address: string;
  lat: number;
  lng: number;
}

export interface ChildProfile {
  id: string;
  guardianId: string;
  name: string;
  dob: string;
  age: number;
  gender: string;
  photoUrls: string[];
  physicalDescription: string;
  medical: ChildMedical;
  location: ChildLocation;
  languages: string[];
  emergencyContacts: EmergencyContact[];
  qrBraceletId: string;
  qrLinked: boolean;
  vaultScore: number;
  lastUpdated: string;
  createdAt: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  detail: string;
  severity: 'info' | 'warning' | 'success' | 'danger';
  actor?: string;
}

export interface CommunityTip {
  id: string;
  reportId: string;
  createdAt: string;
  reporterName: string;
  description: string;
  location: string;
  when: string;
  status: 'pending' | 'credible' | 'investigate' | 'dismissed';
  dismissReason?: string;
}

export interface MissingReport {
  id: string;
  childId: string;
  guardianId: string;
  status: ReportStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  startedAt: string;
  closedAt?: string;
  lastSeenLocation: {
    address: string;
    lat: number;
    lng: number;
  };
  lastSeenAt: string;
  outfit: string;
  context: string;
  whoNearby?: string;
  withKnownPerson?: boolean;
  knownPersonDetails?: string;
  anonymousReport: boolean;
  currentRadiusKm: number;
  expansionRateKmPerHour: number;
  notifiedCount: number;
  tipsReceived: number;
  partnerNotified: Record<PartnerType, boolean>;
  timeline: TimelineEvent[];
  assignedAdminId?: string;
  caseNotes: string[];
  resolutionType?: 'found_safe' | 'found_medical' | 'false_report' | 'guardian_retracted';
}

export interface CommunityAlert {
  id: string;
  reportId: string;
  firstName: string;
  age: number;
  distanceKm: number;
  location: string;
  lastSeenAt: string;
  status: ReportStatus;
  radiusKm: number;
  notifiedCount: number;
  blurredPhotoUrl?: string;
  followed?: boolean;
}

export interface ResourceContact {
  id: string;
  type: 'police' | 'hospital' | 'school';
  name: string;
  phone: string;
  whatsapp?: string;
  address: string;
  lat: number;
  lng: number;
  personal?: boolean;
}

export interface PartnerNode {
  id: string;
  name: string;
  type: PartnerType;
  contactPhone: string;
  email?: string;
  location: string;
  active: boolean;
  lastNotifiedAt?: string;
  notificationHistory: string[];
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  createdAt: string;
  read: boolean;
  route?: string;
}

export interface AnalyticsDay {
  date: string;
  alerts: number;
  avgResponseMins: number;
  found: number;
  falseReports: number;
  open: number;
  pushSent: number;
  smsSent: number;
}

export interface HeatMapPoint {
  area: string;
  level: number;
}

export interface ToastMessage {
  id: string;
  title: string;
  message?: string;
  type: NotificationType;
}

export interface AppContextState {
  currentUser: GuardianUser | AdminUser;
  guardians: GuardianUser[];
  admins: AdminUser[];
  children: ChildProfile[];
  reports: MissingReport[];
  communityAlerts: CommunityAlert[];
  resources: ResourceContact[];
  partners: PartnerNode[];
  notifications: NotificationItem[];
  analytics: AnalyticsDay[];
  tips: CommunityTip[];
  toasts: ToastMessage[];
  addChild: (child: Omit<ChildProfile, 'id' | 'createdAt' | 'lastUpdated' | 'age'>) => string;
  updateChild: (id: string, updates: Partial<ChildProfile>) => void;
  deleteChild: (id: string) => void;
  addReport: (report: Omit<MissingReport, 'id' | 'startedAt' | 'timeline' | 'notifiedCount' | 'tipsReceived'>) => string;
  updateReport: (id: string, updates: Partial<MissingReport>) => void;
  addTip: (tip: Omit<CommunityTip, 'id' | 'createdAt' | 'status'>) => void;
  updateTipStatus: (id: string, status: CommunityTip['status'], dismissReason?: string) => void;
  addNotification: (item: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  pushToast: (type: NotificationType, title: string, message?: string) => void;
  dismissToast: (id: string) => void;
  setCurrentUser: (user: GuardianUser | AdminUser) => void;
}
