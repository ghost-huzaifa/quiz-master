import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/stats-card";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Plus, BarChart3, Users, FileText, TrendingUp, Clock, CheckCircle, AlertCircle } from "lucide-react";
import type { Quiz, QuizAttempt, User } from "@shared/schema";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user, logoutMutation } = useAuth();

  // Redirect if not authenticated or not a teacher
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'teacher')) {
      toast({
        title: "Unauthorized",
        description: "You need to be logged in as a teacher. Redirecting...",
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
    enabled: isAuthenticated && user?.role === 'teacher',
    retry: false,
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (isLoading || !user) return null;

  // Calculate statistics
  const totalQuizzes = quizzes.length;
  const activeQuizzes = quizzes.filter((quiz: Quiz) => quiz.isActive).length;

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
                <Link href="/create-quiz" className="text-gray-700 hover:text-google-blue font-medium">
                  Create Quiz
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="bg-google-blue text-white px-3 py-1 rounded-full text-sm font-medium">
                Teacher
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
          <h1 className="text-3xl font-bold text-text-dark mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's an overview of your quiz activity.</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Quizzes"
            value={totalQuizzes.toString()}
            change="+3 this month"
            icon={FileText}
            iconColor="text-google-blue"
            iconBgColor="bg-google-blue bg-opacity-10"
          />
          <StatsCard
            title="Active Quizzes"
            value={activeQuizzes.toString()}
            change="Currently running"
            icon={Clock}
            iconColor="text-success-green"
            iconBgColor="bg-success-green bg-opacity-10"
          />
          <StatsCard
            title="Total Students"
            value="156"
            change="+12 this week"
            icon={Users}
            iconColor="text-accent-yellow"
            iconBgColor="bg-accent-yellow bg-opacity-10"
          />
          <StatsCard
            title="Completion Rate"
            value="92%"
            change="Excellent!"
            icon={CheckCircle}
            iconColor="text-warning-red"
            iconBgColor="bg-warning-red bg-opacity-10"
          />
        </div>

        {/* Recent Activity and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Recent Quizzes */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-text-dark">Recent Quizzes</CardTitle>
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
                    <p className="text-gray-600">No quizzes created yet. Create your first quiz to get started!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {quizzes.slice(0, 3).map((quiz: Quiz) => (
                      <div key={quiz.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-google-blue bg-opacity-10 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-google-blue" />
                          </div>
                          <div>
                            <h4 className="font-medium text-text-dark">{quiz.title}</h4>
                            <p className="text-sm text-gray-600">{quiz.subject}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            quiz.isActive
                              ? 'bg-success-green text-white'
                              : 'bg-gray-500 text-white'
                          }`}>
                            {quiz.isActive ? 'Active' : 'Closed'}
                          </span>
                          <Link href={`/quiz/${quiz.id}/results`}>
                            <Button variant="ghost" size="sm">
                              <BarChart3 className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-text-dark">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/create-quiz">
                  <Button className="w-full bg-google-blue hover:bg-blue-600 text-white">
                    <Plus className="w-5 h-5 mr-2" />
                    Create New Quiz
                  </Button>
                </Link>
                <Button variant="outline" className="w-full">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  View Analytics
                </Button>
                <Button variant="outline" className="w-full">
                  <Users className="w-5 h-5 mr-2" />
                  Manage Students
                </Button>
              </CardContent>
            </Card>

            {/* Upcoming Quizzes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-text-dark">Upcoming Deadlines</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-google-blue">
                    <h4 className="font-medium text-text-dark text-sm">Review Quiz Results</h4>
                    <p className="text-xs text-gray-600">Python Fundamentals - Due Tomorrow</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border-l-4 border-success-green">
                    <h4 className="font-medium text-text-dark text-sm">Create New Assignment</h4>
                    <p className="text-xs text-gray-600">JavaScript Basics - Due Friday</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
