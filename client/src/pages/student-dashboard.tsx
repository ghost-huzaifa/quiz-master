import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/stats-card";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Play, BarChart3, Clock, CheckCircle, AlertCircle, Trophy } from "lucide-react";
import type { Quiz, QuizAttempt } from "@shared/schema";

export default function StudentDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user, logoutMutation } = useAuth();

  // Redirect if not authenticated or not a student
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'student')) {
      toast({
        title: "Unauthorized",
        description: "You need to be logged in as a student. Redirecting...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  const { data: quizzes = [], isLoading: quizzesLoading } = useQuery({
    queryKey: ["/api/quizzes"],
    enabled: isAuthenticated && user?.role === 'student',
    retry: false,
  });

  const { data: attempts = [], isLoading: attemptsLoading } = useQuery({
    queryKey: ["/api/students", user?.id, "attempts"],
    enabled: isAuthenticated && user?.role === 'student' && !!user?.id,
    retry: false,
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (isLoading || !user) return null;

  // Calculate statistics
  const totalQuizzes = quizzes.length;
  const completedQuizzes = attempts.length;
  const averageScore = attempts.length > 0
    ? Math.round(attempts.reduce((sum: number, attempt: any) => sum + (attempt.score / attempt.totalQuestions) * 100, 0) / attempts.length)
    : 0;

  return (
    <div className="min-h-screen bg-light">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="text-2xl font-bold text-google-blue">QuizMaster</div>
              <div className="hidden md:flex space-x-8">
                <span className="text-gray-700 font-medium">Dashboard</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="bg-success-green text-white px-3 py-1 rounded-full text-sm font-medium">
                Student
              </span>
              {user.profileImageUrl && (
                <img
                  src={user.profileImageUrl}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}
              <span className="hidden sm:block font-medium">
                {user.firstName} {user.lastName}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-dark mb-2">Student Dashboard</h1>
          <p className="text-gray-600">Track your quiz performance and take new quizzes.</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Available Quizzes"
            value={totalQuizzes.toString()}
            change="Ready to take"
            icon={Play}
            iconColor="text-google-blue"
            iconBgColor="bg-google-blue bg-opacity-10"
          />
          <StatsCard
            title="Completed Quizzes"
            value={completedQuizzes.toString()}
            change="Keep it up!"
            icon={CheckCircle}
            iconColor="text-success-green"
            iconBgColor="bg-success-green bg-opacity-10"
          />
          <StatsCard
            title="Average Score"
            value={`${averageScore}%`}
            change={averageScore >= 80 ? "Excellent!" : "Keep improving!"}
            icon={Trophy}
            iconColor="text-accent-yellow"
            iconBgColor="bg-accent-yellow bg-opacity-10"
          />
          <StatsCard
            title="Best Score"
            value={attempts.length > 0
              ? `${Math.max(...attempts.map((a: any) => Math.round((a.score / a.totalQuestions) * 100)))}%`
              : "0%"}
            change="Personal best"
            icon={BarChart3}
            iconColor="text-warning-red"
            iconBgColor="bg-warning-red bg-opacity-10"
          />
        </div>

        {/* Available Quizzes and Recent Results */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Available Quizzes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-text-dark">Available Quizzes</CardTitle>
            </CardHeader>
            <CardContent>
              {quizzesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gray-300 rounded-lg"></div>
                        <div>
                          <div className="h-4 bg-gray-300 rounded w-32 mb-2"></div>
                          <div className="h-3 bg-gray-300 rounded w-24"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : quizzes.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No quizzes available at the moment.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {quizzes.map((quiz: Quiz) => {
                    const hasAttempted = attempts.some((attempt: any) => attempt.quizId === quiz.id);
                    return (
                      <div key={quiz.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-google-blue bg-opacity-10 rounded-lg flex items-center justify-center">
                            <Play className="w-5 h-5 text-google-blue" />
                          </div>
                          <div>
                            <h4 className="font-medium text-text-dark">{quiz.title}</h4>
                            <p className="text-sm text-gray-600">
                              {quiz.subject} • {quiz.timeLimit} minutes • {quiz.totalQuestions} questions
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {hasAttempted ? (
                            <span className="bg-gray-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                              Completed
                            </span>
                          ) : (
                            <Link href={`/quiz/${quiz.id}/take`}>
                              <Button size="sm" className="bg-google-blue hover:bg-blue-600">
                                Take Quiz
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Results */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-text-dark">Recent Results</CardTitle>
            </CardHeader>
            <CardContent>
              {attemptsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gray-300 rounded-lg"></div>
                        <div>
                          <div className="h-4 bg-gray-300 rounded w-32 mb-2"></div>
                          <div className="h-3 bg-gray-300 rounded w-24"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : attempts.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No quiz attempts yet. Take your first quiz!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {attempts.slice(0, 5).map((attempt: any) => {
                    const scorePercentage = Math.round((attempt.score / attempt.totalQuestions) * 100);
                    return (
                      <div key={attempt.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            scorePercentage >= 80
                              ? 'bg-success-green bg-opacity-10'
                              : scorePercentage >= 60
                              ? 'bg-accent-yellow bg-opacity-10'
                              : 'bg-warning-red bg-opacity-10'
                          }`}>
                            <Trophy className={`w-5 h-5 ${
                              scorePercentage >= 80
                                ? 'text-success-green'
                                : scorePercentage >= 60
                                ? 'text-accent-yellow'
                                : 'text-warning-red'
                            }`} />
                          </div>
                          <div>
                            <h4 className="font-medium text-text-dark">{attempt.quiz.title}</h4>
                            <p className="text-sm text-gray-600">
                              {attempt.score}/{attempt.totalQuestions} ({scorePercentage}%)
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-text-dark">{scorePercentage}%</div>
                          <div className="text-xs text-gray-600">
                            {new Date(attempt.completedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
