import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { PublicOnly, RequireAdmin, RequireMember } from './auth/guards';
import { AppShell } from './components/AppShell';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Landing } from './routes/Landing';
import { Apply } from './routes/Apply';
import { Status } from './routes/Status';
import { Signup } from './routes/Signup';
import { Login } from './routes/Login';
import { Legal } from './routes/Legal';
import { Home } from './routes/Home';
import { Explore } from './routes/Explore';
import { Feed } from './routes/Feed';
import { PostNew } from './routes/PostNew';
import { PostDetail } from './routes/PostDetail';
import { Inbox } from './routes/Inbox';
import { Profile } from './routes/Profile';
import { Me } from './routes/Me';
import { MeEdit } from './routes/MeEdit';
import { MePreferences } from './routes/MePreferences';
import { MePhotos } from './routes/MePhotos';
import { Settings } from './routes/Settings';
import { SettingsSection } from './routes/SettingsSection';
import { AdminShell } from './routes/admin/AdminShell';
import { AdminApplications } from './routes/admin/Applications';
import { AdminMembers } from './routes/admin/Members';
import { AdminReports } from './routes/admin/Reports';

function MemberLayout({ allowAdmin = false, fullHeight = false }: { allowAdmin?: boolean; fullHeight?: boolean }) {
  return (
    <RequireMember allowAdmin={allowAdmin}>
      <AppShell fullHeight={fullHeight}>
        <Outlet />
      </AppShell>
    </RequireMember>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/apply" element={<Apply />} />
            <Route path="/status/:token" element={<Status />} />
            <Route path="/signup/:token" element={<Signup />} />
            <Route
              path="/login"
              element={
                <PublicOnly>
                  <Login />
                </PublicOnly>
              }
            />
            <Route path="/privacy" element={<Legal doc="privacy" />} />
            <Route path="/terms" element={<Legal doc="terms" />} />

            <Route element={<MemberLayout />}>
              <Route path="/home" element={<Home />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/post/new" element={<PostNew />} />
              <Route path="/post/:id" element={<PostDetail />} />
              <Route path="/profile/:id" element={<Profile />} />
            </Route>
            <Route element={<MemberLayout fullHeight />}>
              <Route path="/inbox" element={<Inbox />} />
              <Route path="/chat/:matchId" element={<Inbox />} />
            </Route>
            <Route element={<MemberLayout allowAdmin />}>
              <Route path="/me" element={<Me />} />
              <Route path="/me/edit" element={<MeEdit />} />
              <Route path="/me/preferences" element={<MePreferences />} />
              <Route path="/me/photos" element={<MePhotos />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/settings/:section" element={<SettingsSection />} />
            </Route>

            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <AdminShell />
                </RequireAdmin>
              }
            >
              <Route index element={<AdminApplications />} />
              <Route path="members" element={<AdminMembers />} />
              <Route path="reports" element={<AdminReports />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
