import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import StudentDashboard from "@/pages/student-dashboard";
import CreateQuiz from "@/pages/create-quiz";
import TakeQuiz from "@/pages/take-quiz";
import QuizResults from "@/pages/quiz-results";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-google-blue"></div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <Route path="/" component={AuthPage} />
      ) : (
        <>
          <Route path="/" component={user?.role === 'teacher' ? Dashboard : StudentDashboard} />
          <Route path="/create-quiz" component={CreateQuiz} />
          <Route path="/quiz/:id/take" component={TakeQuiz} />
          <Route path="/quiz/:id/results" component={QuizResults} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
