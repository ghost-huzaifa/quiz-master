import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatsCard } from "@/components/stats-card";
import { isUnauthorizedError } from "@/lib/authUtils";
import { ArrowLeft, Users, BarChart3, Trophy, TrendingUp, Search, Filter } from "lucide-react";
import type { Quiz, QuizAttempt, User } from "@shared/schema";

export default function QuizResults() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, params] = useRoute("/quiz/:id/results");

  const { data: quiz, isLoading: quizLoading } = useQuery({
    queryKey: ["/api/quizzes", params?.id],
    enabled: !!params?.id,
  });

  const { data: attempts = [], isLoading: attemptsLoading } = useQuery({
    queryKey: ["/api/quizzes", params?.id, "attempts"],
    enabled: !!params?.id && user?.role === 'teacher',
    retry: false,
  });

  const { data: questions = [] } = useQuery({
    queryKey: ["/api/quizzes", params?.id, "questions"],
    enabled: !!params?.id,
  });

  if (user?.role !== 'teacher') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-4">Only teachers can view quiz results.</p>
            <Link href="/">
              <Button>Go to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (quizLoading || attemptsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-google-blue"></div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Quiz Not Found</h1>
            <Link href="/">
              <Button>Go to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate statistics
  const totalSubmissions = attempts.length;
  const averageScore = totalSubmissions > 0 
    ? Math.round(attempts.reduce((sum: number, attempt: any) => sum + (attempt.score / attempt.totalQuestions) * 100, 0) / totalSubmissions * 10) / 10
    : 0;
  const highestScore = totalSubmissions > 0 
    ? Math.max(...attempts.map((attempt: any) => Math.round((attempt.score / attempt.totalQuestions) * 100)))
    : 0;
  const passRate = totalSubmissions > 0
    ? Math.round((attempts.filter((attempt: any) => (attempt.score / attempt.totalQuestions) * 100 >= 60).length / totalSubmissions) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-light">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-text-dark">Quiz Results</h1>
                <p className="text-gray-600">
                  Detailed performance analysis for <span className="font-medium">{quiz.title}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overall Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Submissions"
            value={totalSubmissions.toString()}
            change={`${quiz.totalQuestions} questions`}
            icon={Users}
            iconColor="text-google-blue"
            iconBgColor="bg-google-blue bg-opacity-10"
          />
          <StatsCard
            title="Average Score"
            value={`${averageScore}%`}
            change={averageScore >= 80 ? "Excellent!" : averageScore >= 60 ? "Good" : "Needs improvement"}
            icon={BarChart3}
            iconColor="text-success-green"
            iconBgColor="bg-success-green bg-opacity-10"
          />
          <StatsCard
            title="Highest Score"
            value={`${highestScore}%`}
            change="Best performance"
            icon={Trophy}
            iconColor="text-accent-yellow"
            iconBgColor="bg-accent-yellow bg-opacity-10"
          />
          <StatsCard
            title="Pass Rate"
            value={`${passRate}%`}
            change="(≥60% score)"
            icon={TrendingUp}
            iconColor="text-warning-red"
            iconBgColor="bg-warning-red bg-opacity-10"
          />
        </div>

        {/* Student Results Table */}
        {totalSubmissions === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Submissions Yet</h3>
              <p className="text-gray-600">Students haven't taken this quiz yet. Check back later!</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-text-dark">Student Performance</CardTitle>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input placeholder="Search students..." className="pl-10 w-64" />
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time Taken
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Completion
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {attempts.map((attempt: any) => {
                      const scorePercentage = Math.round((attempt.score / attempt.totalQuestions) * 100);
                      const minutes = Math.floor(attempt.timeTaken / 60);
                      const seconds = attempt.timeTaken % 60;
                      const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                      
                      return (
                        <tr key={attempt.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {attempt.student.profileImageUrl && (
                                <img 
                                  src={attempt.student.profileImageUrl} 
                                  alt="Student" 
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              )}
                              <div className="ml-4">
                                <div className="text-sm font-medium text-text-dark">
                                  {attempt.student.firstName} {attempt.student.lastName}
                                </div>
                                <div className="text-sm text-gray-500">{attempt.student.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="text-sm font-medium text-text-dark mr-2">
                                {attempt.score}/{attempt.totalQuestions} ({scorePercentage}%)
                              </span>
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    scorePercentage >= 80 
                                      ? 'bg-success-green'
                                      : scorePercentage >= 60
                                      ? 'bg-accent-yellow'
                                      : 'bg-warning-red'
                                  }`}
                                  style={{ width: `${scorePercentage}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {timeDisplay}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(attempt.completedAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              scorePercentage >= 60
                                ? 'bg-success-green bg-opacity-20 text-success-green'
                                : 'bg-warning-red bg-opacity-20 text-warning-red'
                            }`}>
                              {scorePercentage >= 60 ? 'Passed' : 'Failed'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Question Analysis */}
        {questions.length > 0 && attempts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-text-dark">Question Performance Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {questions.map((question: any, questionIndex: number) => {
                  // Calculate option statistics
                  const optionCounts = [0, 0, 0, 0];
                  attempts.forEach((attempt: any) => {
                    const answer = attempt.answers[question.id];
                    if (answer !== undefined && answer >= 0 && answer < 4) {
                      optionCounts[answer]++;
                    }
                  });
                  
                  const correctPercentage = Math.round((optionCounts[question.correctAnswer] / totalSubmissions) * 100);
                  
                  return (
                    <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-text-dark">
                          Question {questionIndex + 1}: {question.questionText}
                        </h4>
                        <span className="text-sm font-medium text-success-green">
                          {correctPercentage}% correct
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {question.options.map((option: string, optionIndex: number) => {
                          const percentage = totalSubmissions > 0 ? Math.round((optionCounts[optionIndex] / totalSubmissions) * 100) : 0;
                          const isCorrect = optionIndex === question.correctAnswer;
                          
                          return (
                            <div key={optionIndex} className="text-center">
                              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    isCorrect ? 'bg-success-green' : 'bg-gray-400'
                                  }`}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-600">
                                {String.fromCharCode(65 + optionIndex)}: {percentage}%
                                {isCorrect && ' ✓'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
