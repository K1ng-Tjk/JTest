import { Route, Switch, Redirect } from "wouter";
import { Provider } from "./components/provider";
import { AgentFeedback, RunableBadge } from "@runablehq/website-runtime";
import { Toaster } from "sonner";
import { useEffect } from "react";
import { useStore } from "./store/useStore";

import AuthPage from "./pages/auth";
import HomePage from "./pages/home";
import TrainingPage from "./pages/training";
import TestSessionPage from "./pages/testSession";
import CreateTestPage from "./pages/createTest";
import EditTestPage from "./pages/editTest";
import ImportTestPage from "./pages/importTest";
import RatingPage from "./pages/rating";
import RatingResultsPage from "./pages/ratingResults";
import ExamPage from "./pages/exam";
import ChatPage from "./pages/chat";
import ProfilePage from "./pages/profile";
import SettingsPage from "./pages/settings";
import AdminPage from "./pages/admin";
import Layout from "./components/Layout";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user } = useStore();
  if (!user) return <Redirect to="/auth" />;
  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function App() {
  const { theme, setOnline } = useStore();

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <Provider>
      <div data-theme={theme}>
        <Switch>
          <Route path="/auth" component={AuthPage} />
          <Route path="/" component={() => <ProtectedRoute component={HomePage} />} />
          <Route path="/training" component={() => <ProtectedRoute component={TrainingPage} />} />
          <Route path="/test/:id" component={() => <ProtectedRoute component={TestSessionPage} />} />
          <Route path="/tests/create" component={() => <ProtectedRoute component={CreateTestPage} />} />
          <Route path="/tests/edit/:id" component={() => <ProtectedRoute component={EditTestPage} />} />
          <Route path="/tests/import" component={() => <ProtectedRoute component={ImportTestPage} />} />
          <Route path="/rating" component={() => <ProtectedRoute component={RatingPage} />} />
          <Route path="/rating-results" component={() => <ProtectedRoute component={RatingResultsPage} />} />
          <Route path="/exam" component={() => <ProtectedRoute component={ExamPage} />} />
          <Route path="/chat" component={() => <ProtectedRoute component={ChatPage} />} />
          <Route path="/profile" component={() => <ProtectedRoute component={ProfilePage} />} />
          <Route path="/settings" component={() => <ProtectedRoute component={SettingsPage} />} />
          <Route path="/admin" component={() => <ProtectedRoute component={AdminPage} />} />
          <Route component={() => <Redirect to="/" />} />
        </Switch>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "var(--card)",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
            }
          }}
        />
        {import.meta.env.DEV && <AgentFeedback />}
        {/* RunableBadge removed */}
      </div>
    </Provider>
  );
}

export default App;
