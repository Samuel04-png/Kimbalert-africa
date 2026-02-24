import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  AdminUser,
  AppContextState,
  ChildProfile,
  CommunityTip,
  GuardianUser,
  MissingReport,
  NotificationItem,
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

const AppContext = createContext<AppContextState | null>(null);

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function toAge(dob: string) {
  const d = new Date(dob);
  const diff = Date.now() - d.getTime();
  return Math.max(0, Math.floor(diff / (365.25 * 24 * 3600000)));
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [guardians, setGuardians] = useState(clone(guardiansSeed));
  const [admins] = useState(clone(adminsSeed));
  const [childrenList, setChildrenList] = useState(clone(childrenSeed));
  const [reports, setReports] = useState(clone(reportsSeed));
  const [communityAlerts, setCommunityAlerts] = useState(clone(communityAlertsSeed));
  const [resources, setResources] = useState(clone(resourcesSeed));
  const [partners, setPartners] = useState(clone(partnersSeed));
  const [notifications, setNotifications] = useState(clone(notificationsSeed));
  const [analytics] = useState(clone(analyticsSeed));
  const [tips, setTips] = useState(clone(tipsSeed));
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [currentUser, setCurrentUser] = useState<GuardianUser | AdminUser>(guardiansSeed[0]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setReports((prev) =>
        prev.map((report) => {
          if (report.status !== 'active') return report;
          const increment = Math.floor(Math.random() * 41) + 10;
          return {
            ...report,
            notifiedCount: report.notifiedCount + increment,
          };
        }),
      );

      setCommunityAlerts((prev) =>
        prev.map((alert) => {
          if (alert.status !== 'active') return alert;
          const increment = Math.floor(Math.random() * 41) + 10;
          return { ...alert, notifiedCount: alert.notifiedCount + increment };
        }),
      );
    }, 30000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    setGuardians((prev) =>
      prev.map((guardian) => ({
        ...guardian,
        childrenCount: childrenList.filter((child) => child.guardianId === guardian.id).length,
      })),
    );
  }, [childrenList]);

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
    return id;
  };

  const updateChild: AppContextState['updateChild'] = (id, updates) => {
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
  };

  const deleteChild: AppContextState['deleteChild'] = (id) => {
    setChildrenList((prev) => prev.filter((child) => child.id !== id));
    setReports((prev) => prev.filter((report) => report.childId !== id));
    pushToast('warning', 'Child profile deleted');
  };

  const addReport: AppContextState['addReport'] = (report) => {
    const id = `report-${Date.now()}`;
    const now = new Date().toISOString();

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

    setReports((prev) => [next, ...prev]);
    setCommunityAlerts((prev) => [
      {
        id: `community-${Date.now()}`,
        reportId: id,
        firstName: 'Child',
        age: 8,
        distanceKm: 2.2,
        location: report.lastSeenLocation.address,
        lastSeenAt: report.lastSeenAt,
        status: report.status,
        radiusKm: report.currentRadiusKm,
        notifiedCount: 2800,
      },
      ...prev,
    ]);

    pushToast('info', 'Report submitted', 'Command center is verifying now.');
    return id;
  };

  const updateReport: AppContextState['updateReport'] = (id, updates) => {
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
  };

  const addNotification: AppContextState['addNotification'] = (item) => {
    const next: NotificationItem = {
      ...item,
      id: `notification-${Date.now()}`,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [next, ...prev]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
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
      pushToast,
      dismissToast,
      setCurrentUser,
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
