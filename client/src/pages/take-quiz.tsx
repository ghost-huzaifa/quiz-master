import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { QuizTimer } from "@/components/quiz-timer";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { ChevronLeft, ChevronRight, Clock, AlertTriangle } from "lucide-react";
import type { Quiz, Question } from "@shared/schema";

export default function TakeQuiz() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, params] = useRoute("/quiz/:id/take");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [quizStartTime] = useState<number>(Date.now());
  const isSubmitting = useRef(false);

  const { data: quiz, isLoading: quizLoading } = useQuery({
    queryKey: ["/api/quizzes", params?.id],
    enabled: !!params?.id,
  });

  const { data: questions = [], isLoading: questionsLoading } = useQuery({
    queryKey: ["/api/quizzes", params?.id, "questions"],
    enabled: !!params?.id,
  });

  const submitQuizMutation = useMutation({
    mutationFn: async (data: { answers: Record<string, number>; timeTaken: number }) => {
      const response = await apiRequest("POST", `/api/quizzes/${params?.id}/attempts`, {
        answers: data.answers,
        score: calculateScore(data.answers),
        totalQuestions: questions.length,
        timeTaken: data.timeTaken,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students", user?.id, "attempts"] });
      toast({
        title: "Quiz Submitted",
        description: "Your quiz has been submitted successfully!",
      });
      isSubmitting.current = false;
      setLocation("/");
    },
    onError: (error) => {
      isSubmitting.current = false;
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to submit quiz. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (quiz) {
      setTimeRemaining(quiz.timeLimit * 60); // Convert minutes to seconds
    }
  }, [quiz]);

  const calculateScore = (submittedAnswers: Record<string, number>): number => {
    let score = 0;
    questions.forEach((question: Question) => {
      if (submittedAnswers[question.id] === question.correctAnswer) {
        score++;
      }
    });
    return score;
  };

  const handleAnswerSelect = (questionId: string, optionIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmitQuiz = useCallback(() => {
    if (isSubmitting.current) return;
    isSubmitting.current = true;

    const timeTaken = Math.floor((Date.now() - quizStartTime) / 1000);
    submitQuizMutation.mutate({ answers, timeTaken });
  }, [answers, quizStartTime, submitQuizMutation]);

  const handleTimeExpiry = useCallback(() => {
    if (isSubmitting.current) return;
    isSubmitting.current = true;

    const timeTaken = Math.floor((Date.now() - quizStartTime) / 1000);
    submitQuizMutation.mutate({ answers, timeTaken });
  }, [answers, quizStartTime, submitQuizMutation]);

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  if (user?.role !== 'student') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-4">Only students can take quizzes.</p>
            <Button onClick={() => setLocation("/")}>Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (quizLoading || questionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-google-blue"></div>
      </div>
    );
  }

  if (!quiz || !questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-12 h-12 text-warning-red mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Quiz Not Found</h1>
            <p className="text-gray-600 mb-4">The quiz you're looking for doesn't exist or has no questions.</p>
            <Button onClick={() => setLocation("/")}>Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-light">
      {/* Quiz Header with Timer */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-text-dark">{quiz.title}</h1>
              <p className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
            <div className="flex items-center space-x-6">
              <QuizTimer
                initialTime={timeRemaining}
                onTimeExpiry={handleTimeExpiry}
              />
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <Progress value={progressPercentage} className="w-full" />
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Question Card */}
        <Card className="mb-6">
          <CardContent className="p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-medium text-text-dark mb-4">
                {currentQuestion.questionText}
              </h2>
            </div>

            {/* Answer Options */}
            <div className="space-y-4">
              {currentQuestion.options.map((option, index) => (
                <label
                  key={index}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={index}
                    checked={answers[currentQuestion.id] === index}
                    onChange={() => handleAnswerSelect(currentQuestion.id, index)}
                    className="text-google-blue focus:ring-google-blue mr-4"
                  />
                  <span className="flex-1 text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={previousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex items-center space-x-2">
            {/* Question Navigation Dots */}
            <div className="flex space-x-2">
              {questions.map((_, index) => {
                const isAnswered = answers[questions[index].id] !== undefined;
                const isCurrent = index === currentQuestionIndex;

                return index >= currentQuestionIndex - 5 && index <= currentQuestionIndex + 5 ? (
                  <button
                    key={index}
                    onClick={() => goToQuestion(index)}
                    className={`w-8 h-8 rounded-full text-sm font-medium ${isCurrent
                        ? 'bg-google-blue text-white'
                        : isAnswered
                          ? 'bg-success-green text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                  >
                    {index + 1}
                  </button>
                ) : (
                  <>
                  </>);
              })}
            </div>
          </div>

          <Button
            onClick={nextQuestion}
            disabled={currentQuestionIndex === questions.length - 1}
            className="bg-google-blue hover:bg-blue-600"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Submit Quiz Button */}
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                {Object.keys(answers).length} of {questions.length} questions answered
              </p>
            </div>
            <Button
              onClick={handleSubmitQuiz}
              disabled={submitQuizMutation.isPending}
              className="bg-success-green hover:bg-green-600 px-8 py-3"
            >
              {submitQuizMutation.isPending ? "Submitting..." : "Submit Quiz"}
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              You can submit even if not all questions are answered
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
