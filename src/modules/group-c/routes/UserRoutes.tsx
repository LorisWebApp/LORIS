import { Navigate, Route, Routes } from "react-router-dom";

import { OfflineActionsProvider } from "../components/user/OfflineActionsContext";
import { UserLayout } from "../components/user/UserLayout";
import { USER_ROUTES } from "../config/userRoutes";

import Dashboard from "../pages/user/Dashboard";
import Favourites from "../pages/user/Favourites";
import NotesAndBookmarks from "../pages/user/NotesAndBookmarks";
import OfflineLibrary from "../pages/user/OfflineLibrary";
import Profile from "../pages/user/Profile";
import Reader from "../pages/user/Reader";
import Settings from "../pages/user/Settings";
import Support from "../pages/user/Support";

export default function UserRoutes() {
  return (
    <Routes>
      {/* Redirect the application root to the user dashboard. */}
      <Route
        path="/"
        element={<Navigate to={USER_ROUTES.dashboard} replace />}
      />

      {/* Reader uses its own full-screen layout. */}
      <Route
        path="/user/reader/:id"
        element={
          <OfflineActionsProvider>
            <Reader />
          </OfflineActionsProvider>
        }
      />

      {/* Shared navigation layout for the other Group C pages. */}
      <Route path="/user" element={<UserLayout />}>
        <Route
          index
          element={<Navigate to={USER_ROUTES.dashboard} replace />}
        />

        <Route path="dashboard" element={<Dashboard />} />
        <Route path="my-library" element={<Favourites />} />
        <Route path="notes-bookmarks" element={<NotesAndBookmarks />} />
        <Route path="offline-library" element={<OfflineLibrary />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="support" element={<Support />} />
      </Route>

      {/* Unknown routes return users to the dashboard. */}
      <Route
        path="*"
        element={<Navigate to={USER_ROUTES.dashboard} replace />}
      />
    </Routes>
  );
}
