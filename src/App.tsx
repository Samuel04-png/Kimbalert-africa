import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { AppProvider } from './app/AppContext';
import AdminLayout from './components/layout/AdminLayout';
import GuardianLayout from './components/layout/GuardianLayout';

import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import VerifyPage from './pages/auth/VerifyPage';
import AuthSuccessPage from './pages/auth/AuthSuccessPage';
import ProfileCompletionPage from './pages/auth/ProfileCompletionPage';

import LandingPage from './pages/public/LandingPage';
import OnboardingPage from './pages/public/OnboardingPage';

import GuardianHomePage from './pages/guardian/GuardianHomePage';
import GuardianChildrenPage from './pages/guardian/GuardianChildrenPage';
import AddChildPage from './pages/guardian/AddChildPage';
import ChildProfilePage from './pages/guardian/ChildProfilePage';
import EditChildPage from './pages/guardian/EditChildPage';
import ReportMissingPage from './pages/guardian/ReportMissingPage';
import AlertStatusPage from './pages/guardian/AlertStatusPage';
import AlertStatusDetailPage from './pages/guardian/AlertStatusDetailPage';
import QrBraceletPage from './pages/guardian/QrBraceletPage';
import ActivityFeedPage from './pages/guardian/ActivityFeedPage';
import CommunityAlertDetailPage from './pages/guardian/CommunityAlertDetailPage';
import AlertHistoryPage from './pages/guardian/AlertHistoryPage';
import TipSuccessPage from './pages/guardian/TipSuccessPage';
import GuardianProfilePage from './pages/guardian/GuardianProfilePage';
import EditProfilePage from './pages/guardian/EditProfilePage';
import CommunityResourcesPage from './pages/guardian/CommunityResourcesPage';
import GuardianNotificationsPage from './pages/guardian/GuardianNotificationsPage';
import GuardianSearchPage from './pages/guardian/GuardianSearchPage';

import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AlertQueuePage from './pages/admin/AlertQueuePage';
import AlertDetailPage from './pages/admin/AlertDetailPage';
import AlertResolutionPage from './pages/admin/AlertResolutionPage';
import TipVerificationPage from './pages/admin/TipVerificationPage';
import RegistryPage from './pages/admin/RegistryPage';
import PartnersPage from './pages/admin/PartnersPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminNotificationsPage from './pages/admin/AdminNotificationsPage';

import NotFoundPage from './pages/utility/NotFoundPage';
import OfflinePage from './pages/utility/OfflinePage';

export default function App() {
  return (
    <AppProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/auth/success" element={<AuthSuccessPage />} />
        <Route path="/auth/profile-completion" element={<ProfileCompletionPage />} />

        <Route path="/guardian" element={<GuardianLayout />}>
          <Route index element={<Navigate to="/guardian/home" replace />} />
          <Route path="home" element={<GuardianHomePage />} />
          <Route path="children" element={<GuardianChildrenPage />} />
          <Route path="children/add" element={<AddChildPage />} />
          <Route path="children/:id" element={<ChildProfilePage />} />
          <Route path="children/:id/edit" element={<EditChildPage />} />
          <Route path="alert" element={<ReportMissingPage />} />
          <Route path="alert/status" element={<AlertStatusPage />} />
          <Route path="alert/status/:id" element={<AlertStatusDetailPage />} />
          <Route path="alert/qr" element={<QrBraceletPage />} />
          <Route path="activity" element={<ActivityFeedPage />} />
          <Route path="activity/:id" element={<CommunityAlertDetailPage />} />
          <Route path="activity/history" element={<AlertHistoryPage />} />
          <Route path="activity/tip-success" element={<TipSuccessPage />} />
          <Route path="profile" element={<GuardianProfilePage />} />
          <Route path="profile/edit" element={<EditProfilePage />} />
          <Route path="resources" element={<CommunityResourcesPage />} />
          <Route path="notifications" element={<GuardianNotificationsPage />} />
          <Route path="search" element={<GuardianSearchPage />} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="alerts" element={<AlertQueuePage />} />
          <Route path="alerts/:id" element={<AlertDetailPage />} />
          <Route path="alerts/:id/resolve" element={<AlertResolutionPage />} />
          <Route path="alerts/:id/tip/:tipId" element={<TipVerificationPage />} />
          <Route path="registry" element={<RegistryPage />} />
          <Route path="partners" element={<PartnersPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="notifications" element={<AdminNotificationsPage />} />
        </Route>

        <Route path="/404" element={<NotFoundPage />} />
        <Route path="/offline" element={<OfflinePage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </AppProvider>
  );
}