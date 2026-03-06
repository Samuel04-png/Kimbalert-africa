import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  increment,
  collection,
  deleteDoc,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  QuerySnapshot,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  AdminActionLog,
  AdminInvite,
  AdminUser,
  AnalyticsDay,
  AppContextState,
  ChildProfile,
  CommunityAlert,
  CommunityTip,
  GuardianUser,
  MissingReport,
  NotificationItem,
  PartnerNode,
  ResourceContact,
  SystemConfig,
  ToastMessage,
} from '../types';
import {
  adminsSeed,
  analyticsSeed,
  childrenSeed,
  communityAlertsSeed,
  guardiansSeed,
  notificationsSeed,
  partnersSeed,
  reportsSeed,
  resourcesSeed,
  tipsSeed,
} from '../mockData';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';

const AppContext = createContext<AppContextState | null>(null);

const defaultSystemConfig: SystemConfig = {
  id: 'system',
  defaultRadiusKm: 10,
  expansionRateKmPerHour: 5,
  smsGatewayEnabled: true,
  pushServiceEnabled: true,
  branding: {
    appName: 'KimbAlert Africa',
    color: '#E8622A',
  },
  updatedAt: new Date().toISOString(),
  updatedBy: 'system',
};

const analyticsNumericKeys = [
  'alerts',
  'found',
  'falseReports',
  'open',
  'pushSent',
  'smsSent',
] as const;

type AnalyticsDelta = Partial<Record<(typeof analyticsNumericKeys)[number], number>>;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function toAge(dob: string) {
  const d = new Date(dob);
  const diff = Date.now() - d.getTime();
  return Math.max(0, Math.floor(diff / (365.25 * 24 * 3600000)));
}

function normalizePhone(value?: string) {
  if (!value) return '';
  const compact = value.replace(/[\s\-()]/g, '');
  if (!compact) return '';
  if (compact.startsWith('+')) return `+${compact.slice(1).replace(/\D/g, '')}`;

  const digits = compact.replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith('0')) {
    return `+27${digits.slice(1)}`;
  }

  if (digits.startsWith('27')) {
    return `+${digits}`;
  }

  return `+27${digits}`;
}

function mapSnapshot<T>(snapshot: QuerySnapshot<DocumentData>) {
  return snapshot.docs.map((item) => {
    const data = item.data() as Record<string, unknown>;
    return {
      ...data,
      id: typeof data.id === 'string' ? data.id : item.id,
    } as T;
  });
}

function dayKey(isoDate = new Date().toISOString()) {
  return isoDate.slice(0, 10);
}

function emptyAnalyticsDay(date: string): AnalyticsDay {
  return {
    date,
    alerts: 0,
    avgResponseMins: 0,
    found: 0,
    falseReports: 0,
    open: 0,
    pushSent: 0,
    smsSent: 0,
  };
}

const emptyGuardianPlaceholder: GuardianUser = {
  id: '',
  role: 'guardian',
  fullName: '',
  phone: '',
  email: '',
  joinedAt: new Date().toISOString(),
  childrenCount: 0,
  verified: false,
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [guardians, setGuardians] = useState(isFirebaseConfigured ? [] as GuardianUser[] : clone(guardiansSeed));
  const [admins, setAdmins] = useState(isFirebaseConfigured ? [] as AdminUser[] : clone(adminsSeed));
  const [childrenList, setChildrenList] = useState(isFirebaseConfigured ? [] as ChildProfile[] : clone(childrenSeed));
  const [reports, setReports] = useState(isFirebaseConfigured ? [] as MissingReport[] : clone(reportsSeed));
  const [communityAlerts, setCommunityAlerts] = useState(isFirebaseConfigured ? [] as CommunityAlert[] : clone(communityAlertsSeed));
  const [resources, setResources] = useState(isFirebaseConfigured ? [] as ResourceContact[] : clone(resourcesSeed));
  const [partners, setPartners] = useState(isFirebaseConfigured ? [] as PartnerNode[] : clone(partnersSeed));
  const [notifications, setNotifications] = useState(isFirebaseConfigured ? [] as NotificationItem[] : clone(notificationsSeed));
  const [analytics, setAnalytics] = useState(isFirebaseConfigured ? [] as AnalyticsDay[] : clone(analyticsSeed));
  const [tips, setTips] = useState(isFirebaseConfigured ? [] as CommunityTip[] : clone(tipsSeed));
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(defaultSystemConfig);
  const [adminInvites, setAdminInvites] = useState<AdminInvite[]>([]);
  const [adminActions, setAdminActions] = useState<AdminActionLog[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [currentUser, setCurrentUserState] = useState<GuardianUser | AdminUser>(
    isFirebaseConfigured ? emptyGuardianPlaceholder : guardiansSeed[0],
  );
  const [authUid, setAuthUid] = useState<string | null>(auth?.currentUser?.uid ?? null);

  const seededRef = useRef(false);

  const useCloud = Boolean(db && auth && isFirebaseConfigured);
  const enableSeedOnEmpty =
    (import.meta.env.VITE_FIREBASE_SEED_ON_EMPTY ?? 'false').toLowerCase() === 'true';
  const isCurrentAdminSession =
    Boolean(authUid) && currentUser.role === 'admin' && currentUser.id === authUid;

  const reportsRef = useRef(reports);
  const communityAlertsRef = useRef(communityAlerts);
  
  useEffect(() => {
    reportsRef.current = reports;
    communityAlertsRef.current = communityAlerts;
  }, [reports, communityAlerts]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (!useCloud) {
        setReports((prev) =>
          prev.map((report) => {
            if (report.status !== 'active') return report;
            const inc = Math.floor(Math.random() * 41) + 10;
            return {
              ...report,
              notifiedCount: report.notifiedCount + inc,
            };
          }),
        );

        setCommunityAlerts((prev) =>
          prev.map((alert) => {
            if (alert.status !== 'active') return alert;
            const inc = Math.floor(Math.random() * 41) + 10;
            return { ...alert, notifiedCount: alert.notifiedCount + inc };
          }),
        );
      } else if (db) {
        // Push demo increments to Firestore so live UI updates for all users
        reportsRef.current.forEach((report) => {
          if (report.status === 'active') {
            const inc = Math.floor(Math.random() * 41) + 10;
            updateDoc(doc(db, 'reports', report.id), {
              notifiedCount: increment(inc),
            }).catch(() => {});
          }
        });
        communityAlertsRef.current.forEach((alert) => {
          if (alert.status === 'active') {
            const inc = Math.floor(Math.random() * 41) + 10;
            updateDoc(doc(db, 'communityAlerts', alert.id), {
              notifiedCount: increment(inc),
            }).catch(() => {});
          }
        });
      }
    }, 30000);

    return () => window.clearInterval(interval);
  }, [useCloud]);

  useEffect(() => {
    setGuardians((prev) =>
      prev.map((guardian) => ({
        ...guardian,
        childrenCount: childrenList.filter((child) => child.guardianId === guardian.id).length,
      })),
    );
  }, [childrenList]);

  useEffect(() => {
    if (
      !useCloud ||
      !db ||
      !authUid ||
      seededRef.current ||
      !enableSeedOnEmpty ||
      !isCurrentAdminSession
    )
      return;
    seededRef.current = true;

    const seedCollection = async <T,>(
      name: string,
      list: T[],
      idResolver: (item: T, index: number) => string,
    ) => {
      const ref = collection(db, name);
      const existing = await getDocs(query(ref, limit(1)));
      if (!existing.empty) return;

      const batch = writeBatch(db);
      list.forEach((item, index) => {
        const id = idResolver(item, index);
        batch.set(doc(db, name, id), item as DocumentData);
      });
      await batch.commit();
    };

    void (async () => {
      try {
        await seedCollection('guardians', guardiansSeed, (item) => String(item.id));
        await seedCollection('admins', adminsSeed, (item) => String(item.id));
        await seedCollection('children', childrenSeed, (item) => String(item.id));
        await seedCollection('reports', reportsSeed, (item) => String(item.id));
        await seedCollection('communityAlerts', communityAlertsSeed, (item) => String(item.id));
        await seedCollection('resources', resourcesSeed, (item) => String(item.id));
        await seedCollection('partners', partnersSeed, (item) => String(item.id));
        await seedCollection('notifications', notificationsSeed, (item) => String(item.id));
        await seedCollection('analytics', analyticsSeed, (item) => String(item.date));
        await seedCollection('tips', tipsSeed, (item) => String(item.id));
      } catch (error) {
        console.error('Failed to seed Firestore collections', error);
      }
    })();
  }, [authUid, enableSeedOnEmpty, isCurrentAdminSession, useCloud]);

  useEffect(() => {
    if (!useCloud || !db || !authUid) return;

    const unsubscribers: Array<() => void> = [];
    const logError =
      (label: string) =>
        (error: unknown): void => {
          console.error(`Firestore listener failed: ${label}`, error);
        };

    if (!isCurrentAdminSession) {
      setSystemConfig(defaultSystemConfig);
      setAdminInvites([]);
      setAdminActions([]);
    }

    if (isCurrentAdminSession) {
      unsubscribers.push(
        onSnapshot(
          doc(db, 'settings', 'system'),
          (snapshot) => {
            if (!snapshot.exists()) {
              setSystemConfig(defaultSystemConfig);
              return;
            }
            const data = snapshot.data() as Partial<SystemConfig>;
            setSystemConfig({
              ...defaultSystemConfig,
              ...data,
              id: 'system',
              branding: {
                ...defaultSystemConfig.branding,
                ...(data.branding ?? {}),
              },
            });
          },
          logError('settings-system'),
        ),
      );
      unsubscribers.push(
        onSnapshot(
          collection(db, 'guardians'),
          (snapshot) => setGuardians(mapSnapshot<GuardianUser>(snapshot)),
          logError('guardians'),
        ),
      );
      unsubscribers.push(
        onSnapshot(
          collection(db, 'admins'),
          (snapshot) => setAdmins(mapSnapshot<AdminUser>(snapshot)),
          logError('admins'),
        ),
      );
      unsubscribers.push(
        onSnapshot(
          collection(db, 'children'),
          (snapshot) => setChildrenList(mapSnapshot<ChildProfile>(snapshot)),
          logError('children-admin'),
        ),
      );
      unsubscribers.push(
        onSnapshot(
          collection(db, 'reports'),
          (snapshot) => setReports(mapSnapshot<MissingReport>(snapshot)),
          logError('reports-admin'),
        ),
      );
      unsubscribers.push(
        onSnapshot(
          collection(db, 'notifications'),
          (snapshot) => setNotifications(mapSnapshot<NotificationItem>(snapshot)),
          logError('notifications-admin'),
        ),
      );
      unsubscribers.push(
        onSnapshot(
          query(collection(db, 'adminInvites'), orderBy('invitedAt', 'desc'), limit(50)),
          (snapshot) => setAdminInvites(mapSnapshot<AdminInvite>(snapshot)),
          logError('adminInvites'),
        ),
      );
      unsubscribers.push(
        onSnapshot(
          query(collection(db, 'adminActions'), orderBy('createdAt', 'desc'), limit(100)),
          (snapshot) => setAdminActions(mapSnapshot<AdminActionLog>(snapshot)),
          logError('adminActions'),
        ),
      );
    } else {
      unsubscribers.push(
        onSnapshot(
          query(collection(db, 'children'), where('guardianId', '==', authUid)),
          (snapshot) => setChildrenList(mapSnapshot<ChildProfile>(snapshot)),
          logError('children-guardian'),
        ),
      );
      unsubscribers.push(
        onSnapshot(
          query(collection(db, 'reports'), where('guardianId', '==', authUid)),
          (snapshot) => setReports(mapSnapshot<MissingReport>(snapshot)),
          logError('reports-guardian'),
        ),
      );
      unsubscribers.push(
        onSnapshot(
          query(collection(db, 'notifications'), where('userId', '==', authUid)),
          (snapshot) => setNotifications(mapSnapshot<NotificationItem>(snapshot)),
          logError('notifications-guardian'),
        ),
      );
      unsubscribers.push(
        onSnapshot(
          doc(db, 'guardians', authUid),
          (snapshot) => {
            if (!snapshot.exists()) return;
            const guardian = snapshot.data() as GuardianUser;
            setGuardians([guardian]);
            setCurrentUserState((prev) => (prev.id === authUid && prev.role === 'guardian' ? guardian : prev));
          },
          logError('guardian-self'),
        ),
      );
    }

    unsubscribers.push(
      onSnapshot(
        collection(db, 'communityAlerts'),
        (snapshot) => setCommunityAlerts(mapSnapshot<CommunityAlert>(snapshot)),
        logError('communityAlerts'),
      ),
    );
    unsubscribers.push(
      onSnapshot(
        collection(db, 'resources'),
        (snapshot) => setResources(mapSnapshot<ResourceContact>(snapshot)),
        logError('resources'),
      ),
    );
    unsubscribers.push(
      onSnapshot(
        collection(db, 'partners'),
        (snapshot) => setPartners(mapSnapshot<PartnerNode>(snapshot)),
        logError('partners'),
      ),
    );
    unsubscribers.push(
      onSnapshot(
        collection(db, 'analytics'),
        (snapshot) => {
          const next = mapSnapshot<typeof analyticsSeed[number]>(snapshot).sort((a, b) =>
            a.date.localeCompare(b.date),
          );
          setAnalytics(next);
        },
        logError('analytics'),
      ),
    );
    unsubscribers.push(
      onSnapshot(
        collection(db, 'tips'),
        (snapshot) => setTips(mapSnapshot<CommunityTip>(snapshot)),
        logError('tips'),
      ),
    );

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [authUid, isCurrentAdminSession, useCloud]);

  useEffect(() => {
    if (!useCloud || !auth || !db) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAuthUid(null);
        return;
      }

      setAuthUid(user.uid);

      const adminDoc = await getDoc(doc(db, 'admins', user.uid));
      if (adminDoc.exists()) {
        setCurrentUserState(adminDoc.data() as AdminUser);
        return;
      }

      const guardianDoc = await getDoc(doc(db, 'guardians', user.uid));
      if (guardianDoc.exists()) {
        setCurrentUserState(guardianDoc.data() as GuardianUser);
        return;
      }

      const pendingRaw = localStorage.getItem('pending_profile');
      const pending = pendingRaw
        ? (JSON.parse(pendingRaw) as {
          fullName?: string;
          phone?: string;
          email?: string;
          nationalId?: string;
          location?: string;
        })
        : null;

      const phoneNormalized = normalizePhone(pending?.phone || user.phoneNumber || '');

      if (phoneNormalized) {
        const byPhone = await getDocs(
          query(collection(db, 'guardians'), where('phoneNormalized', '==', phoneNormalized), limit(1)),
        );
        if (!byPhone.empty) {
          const existing = byPhone.docs[0].data() as GuardianUser;
          const merged: GuardianUser = {
            ...existing,
            id: user.uid,
            phone: pending?.phone || existing.phone || user.phoneNumber || '',
            phoneNormalized,
            email: pending?.email || existing.email || user.email || '',
            fullName: pending?.fullName || existing.fullName || user.displayName || 'Guardian User',
          };
          await setDoc(doc(db, 'guardians', user.uid), merged, { merge: true });
          setCurrentUserState(merged);
          return;
        }
      }

      if (pending?.email) {
        const byEmail = await getDocs(
          query(collection(db, 'guardians'), where('email', '==', pending.email), limit(1)),
        );
        if (!byEmail.empty) {
          const existing = byEmail.docs[0].data() as GuardianUser;
          const merged: GuardianUser = {
            ...existing,
            id: user.uid,
            phone: pending.phone || existing.phone || user.phoneNumber || '',
            phoneNormalized: normalizePhone(pending.phone || existing.phone || user.phoneNumber || ''),
          };
          await setDoc(doc(db, 'guardians', user.uid), merged, { merge: true });
          setCurrentUserState(merged);
          return;
        }
      }

      const profile: GuardianUser = {
        id: user.uid,
        role: 'guardian',
        fullName: pending?.fullName || user.displayName || 'Guardian User',
        phone: pending?.phone || user.phoneNumber || '',
        phoneNormalized,
        email: pending?.email || user.email || '',
        nationalId: pending?.nationalId,
        location: pending?.location || 'South Africa',
        avatarUrl: user.photoURL || undefined,
        joinedAt: new Date().toISOString(),
        childrenCount: 0,
        verified: true,
      };

      await setDoc(doc(db, 'guardians', user.uid), profile, { merge: true });
      setCurrentUserState(profile);
      localStorage.removeItem('pending_profile');
    });

    return () => unsubscribe();
  }, [useCloud]);

  const hasAnalyticsDelta = (delta: AnalyticsDelta) =>
    analyticsNumericKeys.some((key) => Number(delta[key] ?? 0) !== 0);

  const applyAnalyticsDelta = (
    date: string,
    delta: AnalyticsDelta,
    responseSampleMins?: number,
  ) => {
    if (!hasAnalyticsDelta(delta) && !responseSampleMins) return;

    setAnalytics((prev) => {
      const current = prev.find((item) => item.date === date) ?? emptyAnalyticsDay(date);
      const next: AnalyticsDay = { ...current };

      analyticsNumericKeys.forEach((key) => {
        const amount = Number(delta[key] ?? 0);
        if (!amount) return;
        next[key] = Math.max(0, next[key] + amount);
      });

      if (responseSampleMins && responseSampleMins > 0) {
        const resolvedBefore = Math.max(current.found + current.falseReports, 0);
        const resolvedAfter = Math.max(next.found + next.falseReports, 0);
        const samplesAdded = Math.max(1, resolvedAfter - resolvedBefore);
        const weightedTotal = current.avgResponseMins * resolvedBefore + responseSampleMins * samplesAdded;
        next.avgResponseMins = Math.max(
          1,
          Math.round(weightedTotal / Math.max(1, resolvedBefore + samplesAdded)),
        );
      }

      const merged = prev.some((item) => item.date === date)
        ? prev.map((item) => (item.date === date ? next : item))
        : [...prev, next];
      return merged.sort((a, b) => a.date.localeCompare(b.date));
    });

    if (!useCloud || !db) return;

    const analyticsRef = doc(db, 'analytics', date);
    const cloudPatch: Record<string, unknown> = { date };
    analyticsNumericKeys.forEach((key) => {
      const amount = Number(delta[key] ?? 0);
      if (!amount) return;
      cloudPatch[key] = increment(amount);
    });
    void setDoc(analyticsRef, cloudPatch, { merge: true });

    if (responseSampleMins && responseSampleMins > 0) {
      void (async () => {
        const snapshot = await getDoc(analyticsRef);
        const data = snapshot.exists() ? (snapshot.data() as Partial<AnalyticsDay>) : undefined;
        const found = Number(data?.found ?? 0);
        const falseReports = Number(data?.falseReports ?? 0);
        const avgResponse = Number(data?.avgResponseMins ?? 0);
        const resolvedCount = Math.max(found + falseReports, 0);
        const nextAvg =
          resolvedCount <= 1
            ? Math.max(1, Math.round(responseSampleMins))
            : Math.max(1, Math.round((avgResponse * (resolvedCount - 1) + responseSampleMins) / resolvedCount));
        await setDoc(analyticsRef, { date, avgResponseMins: nextAvg }, { merge: true });
      })();
    }
  };

  const applyOperationAnalytics = (type: string, meta?: Record<string, string | number | boolean | null>) => {
    const date = dayKey();
    if (type === 'gateway:test-sms') {
      applyAnalyticsDelta(date, { smsSent: 1 });
      return;
    }
    if (type === 'gateway:test-push') {
      applyAnalyticsDelta(date, { pushSent: 1 });
      return;
    }
    if (type === 'alerts:bulk-broadcast' || type === 'broadcast:create') {
      const recipientCountRaw = meta?.recipientCount ?? meta?.selectedCount ?? 0;
      const recipientCount = Math.max(1, Number(recipientCountRaw) || 1);
      applyAnalyticsDelta(date, { pushSent: recipientCount });
    }
  };

  const pushToast = (type: ToastMessage['type'], title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [{ id, type, title, message }, ...prev]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const addChild: AppContextState['addChild'] = (payload) => {
    const id = `child-${Date.now()}`;
    const now = new Date().toISOString();
    const next: ChildProfile = {
      ...payload,
      id,
      createdAt: now,
      lastUpdated: now,
      age: toAge(payload.dob),
    };

    setChildrenList((prev) => [next, ...prev]);
    pushToast('success', 'Child added to The Vault');

    if (useCloud && db) {
      void setDoc(doc(db, 'children', id), next, { merge: true });
    }
    return id;
  };

  const updateChild: AppContextState['updateChild'] = (id, updates) => {
    const patch = {
      ...updates,
      age: updates.dob ? toAge(updates.dob) : undefined,
      lastUpdated: new Date().toISOString(),
    };

    setChildrenList((prev) =>
      prev.map((child) =>
        child.id === id
          ? {
            ...child,
            ...updates,
            age: updates.dob ? toAge(updates.dob) : child.age,
            lastUpdated: new Date().toISOString(),
          }
          : child,
      ),
    );
    pushToast('success', 'Child profile updated');

    if (useCloud && db) {
      void setDoc(doc(db, 'children', id), patch, { merge: true });
    }
  };

  const deleteChild: AppContextState['deleteChild'] = (id) => {
    setChildrenList((prev) => prev.filter((child) => child.id !== id));
    setReports((prev) => prev.filter((report) => report.childId !== id));
    pushToast('warning', 'Child profile deleted');

    if (useCloud && db) {
      void (async () => {
        await deleteDoc(doc(db, 'children', id));
        const reportsForChild = await getDocs(
          query(collection(db, 'reports'), where('childId', '==', id)),
        );
        const batch = writeBatch(db);
        reportsForChild.docs.forEach((entry) => batch.delete(entry.ref));
        await batch.commit();
      })();
    }
  };

  const addReport: AppContextState['addReport'] = (report) => {
    const id = `report-${Date.now()}`;
    const now = new Date().toISOString();
    const communityId = `community-${Date.now()}`;

    const next: MissingReport = {
      ...report,
      id,
      startedAt: now,
      notifiedCount: 2800,
      tipsReceived: 0,
      timeline: [
        {
          id: `timeline-${Date.now()}`,
          timestamp: now,
          title: 'Report Submitted',
          detail: 'Awaiting command center verification.',
          severity: 'warning',
          actor: 'Guardian',
        },
      ],
    };

    const child = childrenList.find((item) => item.id === report.childId);

    const community: CommunityAlert = {
      id: communityId,
      reportId: id,
      firstName: child?.name.split(' ')[0] || 'Child',
      age: child?.age || 8,
      distanceKm: 2.2,
      location: report.lastSeenLocation.address,
      lastSeenAt: report.lastSeenAt,
      status: report.status,
      radiusKm: report.currentRadiusKm,
      notifiedCount: 2800,
      blurredPhotoUrl: child?.photoUrls?.[0],
    };

    setReports((prev) => [next, ...prev]);
    setCommunityAlerts((prev) => [community, ...prev]);
    applyAnalyticsDelta(dayKey(now), { alerts: 1, open: 1 });
    pushToast('info', 'Report submitted', 'Command center is verifying now.');

    if (useCloud && db) {
      void setDoc(doc(db, 'reports', id), next, { merge: true });
      void setDoc(doc(db, 'communityAlerts', communityId), community, { merge: true });
    }
    return id;
  };

  const updateReport: AppContextState['updateReport'] = (id, updates) => {
    const previousReport = reports.find((report) => report.id === id);
    const previousStatus = previousReport?.status;
    const nextStatus = updates.status ?? previousStatus;
    const analyticsDelta: AnalyticsDelta = {};
    let responseSampleMins: number | undefined;

    if (previousReport && previousStatus && nextStatus && previousStatus !== nextStatus) {
      const wasOpen = previousStatus === 'pending' || previousStatus === 'active';
      const isOpen = nextStatus === 'pending' || nextStatus === 'active';
      if (wasOpen && !isOpen) analyticsDelta.open = (analyticsDelta.open ?? 0) - 1;
      if (!wasOpen && isOpen) analyticsDelta.open = (analyticsDelta.open ?? 0) + 1;

      if (nextStatus === 'found') analyticsDelta.found = (analyticsDelta.found ?? 0) + 1;
      if (previousStatus === 'found' && nextStatus !== 'found') {
        analyticsDelta.found = (analyticsDelta.found ?? 0) - 1;
      }

      const prevFalseLike =
        previousStatus === 'retracted' ||
        (previousStatus === 'closed' &&
          (previousReport.resolutionType === 'false_report' ||
            previousReport.resolutionType === 'guardian_retracted'));
      const nextFalseLike =
        nextStatus === 'retracted' ||
        (nextStatus === 'closed' &&
          (updates.resolutionType === 'false_report' ||
            updates.resolutionType === 'guardian_retracted' ||
            previousReport.resolutionType === 'false_report' ||
            previousReport.resolutionType === 'guardian_retracted'));

      if (!prevFalseLike && nextFalseLike) {
        analyticsDelta.falseReports = (analyticsDelta.falseReports ?? 0) + 1;
      }
      if (prevFalseLike && !nextFalseLike) {
        analyticsDelta.falseReports = (analyticsDelta.falseReports ?? 0) - 1;
      }

      const becameResolved =
        nextStatus === 'found' ||
        nextFalseLike ||
        (nextStatus === 'closed' &&
          (updates.resolutionType === 'found_safe' || updates.resolutionType === 'found_medical'));
      if (becameResolved && previousReport.startedAt) {
        responseSampleMins = Math.max(
          1,
          Math.round((Date.now() - new Date(previousReport.startedAt).getTime()) / 60000),
        );
      }
    }

    setReports((prev) =>
      prev.map((report) => {
        if (report.id !== id) return report;
        return {
          ...report,
          ...updates,
        };
      }),
    );

    setCommunityAlerts((prev) =>
      prev.map((alert) =>
        alert.reportId === id
          ? {
            ...alert,
            status: updates.status ?? alert.status,
            radiusKm: updates.currentRadiusKm ?? alert.radiusKm,
            notifiedCount: updates.notifiedCount ?? alert.notifiedCount,
          }
          : alert,
      ),
    );

    if (previousReport && (hasAnalyticsDelta(analyticsDelta) || responseSampleMins)) {
      applyAnalyticsDelta(dayKey(previousReport.startedAt), analyticsDelta, responseSampleMins);
    }

    if (useCloud && db) {
      void setDoc(doc(db, 'reports', id), updates, { merge: true });
      void (async () => {
        const linkedAlerts = await getDocs(
          query(collection(db, 'communityAlerts'), where('reportId', '==', id)),
        );
        linkedAlerts.docs.forEach((item) => {
          void updateDoc(item.ref, {
            status: updates.status ?? item.get('status'),
            radiusKm: updates.currentRadiusKm ?? item.get('radiusKm'),
            notifiedCount: updates.notifiedCount ?? item.get('notifiedCount'),
          });
        });
      })();
    }
  };

  const addTip: AppContextState['addTip'] = (tip) => {
    const id = `tip-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const next: CommunityTip = {
      ...tip,
      id,
      createdAt,
      status: 'pending',
    };

    setTips((prev) => [next, ...prev]);
    setReports((prev) =>
      prev.map((report) =>
        report.id === tip.reportId ? { ...report, tipsReceived: report.tipsReceived + 1 } : report,
      ),
    );

    if (useCloud && db) {
      void setDoc(doc(db, 'tips', id), next, { merge: true });
      void (async () => {
        const reportRef = doc(db, 'reports', tip.reportId);
        const reportSnap = await getDoc(reportRef);
        if (!reportSnap.exists()) return;
        const count = Number(reportSnap.data().tipsReceived || 0);
        await updateDoc(reportRef, { tipsReceived: count + 1 });
      })();
    }
  };

  const updateTipStatus: AppContextState['updateTipStatus'] = (id, status, dismissReason) => {
    setTips((prev) =>
      prev.map((tip) =>
        tip.id === id
          ? {
            ...tip,
            status,
            dismissReason,
          }
          : tip,
      ),
    );

    if (useCloud && db) {
      void setDoc(
        doc(db, 'tips', id),
        {
          status,
          dismissReason,
        },
        { merge: true },
      );
    }
  };

  const addNotification: AppContextState['addNotification'] = (item) => {
    const next: NotificationItem = {
      ...item,
      id: `notification-${Date.now()}`,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [next, ...prev]);

    if (useCloud && db) {
      void setDoc(doc(db, 'notifications', next.id), next, { merge: true });
    }
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));

    if (useCloud && db) {
      void setDoc(doc(db, 'notifications', id), { read: true }, { merge: true });
    }
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) =>
      prev.map((item) => (item.userId === currentUser.id ? { ...item, read: true } : item)),
    );

    if (useCloud && db) {
      void (async () => {
        const unread = await getDocs(
          query(
            collection(db, 'notifications'),
            where('userId', '==', currentUser.id),
            where('read', '==', false),
          ),
        );
        const batch = writeBatch(db);
        unread.docs.forEach((item) => batch.update(item.ref, { read: true }));
        await batch.commit();
      })();
    }
  };

  const addPartner: AppContextState['addPartner'] = (payload) => {
    const id = `pn-${Date.now()}`;
    const next: PartnerNode = {
      ...payload,
      id,
      notificationHistory: payload.notificationHistory ?? [],
    };

    setPartners((prev) => [next, ...prev]);
    if (useCloud && db) {
      void setDoc(doc(db, 'partners', id), next, { merge: true });
    }
    return id;
  };

  const updatePartner: AppContextState['updatePartner'] = (id, updates) => {
    setPartners((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
    if (useCloud && db) {
      void setDoc(doc(db, 'partners', id), updates, { merge: true });
    }
  };

  const updateGuardian: AppContextState['updateGuardian'] = (id, updates) => {
    setGuardians((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
    if (currentUser.role === 'guardian' && currentUser.id === id) {
      setCurrentUserState((prev) =>
        prev.role === 'guardian' && prev.id === id
          ? ({ ...prev, ...updates } as GuardianUser)
          : prev,
      );
    }
    if (useCloud && db) {
      void setDoc(doc(db, 'guardians', id), updates, { merge: true });
    }
  };

  const addResource: AppContextState['addResource'] = (payload) => {
    const id = `rc-${Date.now()}`;
    const next: ResourceContact = {
      ...payload,
      id,
      createdBy: payload.createdBy || currentUser.id,
    };

    setResources((prev) => [next, ...prev]);
    if (useCloud && db) {
      void setDoc(doc(db, 'resources', id), next, { merge: true });
    }
    return id;
  };

  const updateResource: AppContextState['updateResource'] = (id, updates) => {
    setResources((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
    if (useCloud && db) {
      void setDoc(doc(db, 'resources', id), updates, { merge: true });
    }
  };

  const saveSystemConfig: AppContextState['saveSystemConfig'] = (updates) => {
    const now = new Date().toISOString();
    const next: SystemConfig = {
      ...systemConfig,
      ...updates,
      id: 'system',
      branding: {
        ...systemConfig.branding,
        ...(updates.branding ?? {}),
      },
      updatedAt: now,
      updatedBy: currentUser.id,
    };

    setSystemConfig(next);
    if (useCloud && db && currentUser.role === 'admin') {
      void setDoc(doc(db, 'settings', 'system'), next, { merge: true });
    }
  };

  const createAdminInvite: AppContextState['createAdminInvite'] = (email) => {
    const id = `invite-${Date.now()}`;
    const invite: AdminInvite = {
      id,
      email: email.trim().toLowerCase(),
      status: 'pending',
      invitedBy: currentUser.id,
      invitedAt: new Date().toISOString(),
    };

    setAdminInvites((prev) => [invite, ...prev]);
    if (useCloud && db && currentUser.role === 'admin') {
      void setDoc(doc(db, 'adminInvites', id), invite, { merge: true });
    }
    return id;
  };

  const logAdminAction: AppContextState['logAdminAction'] = (type, summary, meta) => {
    const id = `action-${Date.now()}`;
    const action: AdminActionLog = {
      id,
      type,
      summary,
      meta,
      actorId: currentUser.id,
      createdAt: new Date().toISOString(),
    };

    setAdminActions((prev) => [action, ...prev].slice(0, 100));
    applyOperationAnalytics(type, meta);
    if (useCloud && db && currentUser.role === 'admin') {
      void setDoc(doc(db, 'adminActions', id), action, { merge: true });
    }
    return id;
  };

  const setCurrentUser: AppContextState['setCurrentUser'] = (user) => {
    setCurrentUserState(user);

    if (user.role === 'guardian') {
      setGuardians((prev) =>
        prev.some((item) => item.id === user.id)
          ? prev.map((item) => (item.id === user.id ? user : item))
          : [user, ...prev],
      );
    } else {
      setAdmins((prev) =>
        prev.some((item) => item.id === user.id)
          ? prev.map((item) => (item.id === user.id ? user : item))
          : [user, ...prev],
      );
    }

    if (!useCloud || !db) return;

    const collectionName = user.role === 'admin' ? 'admins' : 'guardians';
    const payload = {
      ...user,
      phoneNormalized: normalizePhone(user.phone),
    };
    void setDoc(doc(db, collectionName, user.id), payload, { merge: true });
  };

  const updateCurrentUserProfile: AppContextState['updateCurrentUserProfile'] = (updates) => {
    const next = {
      ...currentUser,
      ...updates,
    } as GuardianUser | AdminUser;

    setCurrentUserState(next);

    if (next.role === 'guardian') {
      setGuardians((prev) =>
        prev.some((item) => item.id === next.id)
          ? prev.map((item) => (item.id === next.id ? (next as GuardianUser) : item))
          : [next as GuardianUser, ...prev],
      );
    } else {
      setAdmins((prev) =>
        prev.some((item) => item.id === next.id)
          ? prev.map((item) => (item.id === next.id ? (next as AdminUser) : item))
          : [next as AdminUser, ...prev],
      );
    }

    if (useCloud && db) {
      const collectionName = next.role === 'admin' ? 'admins' : 'guardians';
      void setDoc(
        doc(db, collectionName, next.id),
        {
          ...updates,
          ...(typeof updates.phone === 'string' ? { phoneNormalized: normalizePhone(updates.phone) } : {}),
        },
        { merge: true },
      );
    }
  };

  const signOutUser: AppContextState['signOutUser'] = async () => {
    if (useCloud && auth) {
      await signOut(auth);
    }
    setAuthUid(null);
    setCurrentUserState(isFirebaseConfigured ? emptyGuardianPlaceholder : (guardians[0] ?? guardiansSeed[0]));
    if (isFirebaseConfigured) {
      setGuardians([]);
      setAdmins([]);
      setChildrenList([]);
      setReports([]);
      setCommunityAlerts([]);
      setResources([]);
      setPartners([]);
      setNotifications([]);
      setAnalytics([]);
      setTips([]);
      setAdminInvites([]);
      setAdminActions([]);
    }
    localStorage.removeItem('pending_phone');
    localStorage.removeItem('pending_role');
    localStorage.removeItem('pending_profile');
  };

  const value = useMemo<AppContextState>(
    () => ({
      currentUser,
      guardians,
      admins,
      children: childrenList,
      reports,
      communityAlerts,
      resources,
      partners,
      notifications,
      analytics,
      tips,
      systemConfig,
      adminInvites,
      adminActions,
      toasts,
      addChild,
      updateChild,
      deleteChild,
      addReport,
      updateReport,
      addTip,
      updateTipStatus,
      addNotification,
      markNotificationRead,
      markAllNotificationsRead,
      addPartner,
      updatePartner,
      updateGuardian,
      addResource,
      updateResource,
      saveSystemConfig,
      createAdminInvite,
      logAdminAction,
      pushToast,
      dismissToast,
      setCurrentUser,
      updateCurrentUserProfile,
      signOutUser,
    }),
    [
      currentUser,
      guardians,
      admins,
      childrenList,
      reports,
      communityAlerts,
      resources,
      partners,
      notifications,
      analytics,
      tips,
      systemConfig,
      adminInvites,
      adminActions,
      toasts,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}

