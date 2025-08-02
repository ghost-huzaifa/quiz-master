import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QuestionBuilder } from "@/components/question-builder";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { ArrowLeft, Save, Eye, Files } from "lucide-react";
import { Link } from "wouter";
import type { InsertQuestion } from "@shared/schema";

interface QuizFormData {
  title: string;
  description: string;
  subject: string;
  timeLimit: number;
  totalQuestions: number;
}

interface QuestionData {
  questionText: string;
  options: [string, string, string, string];
  correctAnswer: number;
  questionNumber: number;
}

export default function CreateQuiz() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [quizData, setQuizData] = useState<QuizFormData>({
    title: "",
    description: "",
    subject: "",
    timeLimit: 30,
    totalQuestions: 10,
  });

  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [currentStep, setCurrentStep] = useState<'settings' | 'questions'>('settings');

  const createQuizMutation = useMutation({
    mutationFn: async (data: QuizFormData) => {
      const response = await apiRequest("POST", "/api/quizzes", data);
      return response.json();
    },
    onSuccess: async (quiz) => {
      // Create questions for the quiz
      for (let i = 0; i < questions.length; i++) {
        const questionData: InsertQuestion = {
          ...questions[i],
          quizId: quiz.id,
        };
        await apiRequest("POST", `/api/quizzes/${quiz.id}/questions`, questionData);
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      toast({
        title: "Success",
        description: "Quiz created successfully!",
      });
      setLocation("/");
    },
    onError: (error) => {
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
        description: "Failed to create quiz. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleQuizSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (questions.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one question.",
        variant: "destructive",
      });
      return;
    }

    if (questions.length !== quizData.totalQuestions) {
      toast({
        title: "Error",
        description: `Please add exactly ${quizData.totalQuestions} questions.`,
        variant: "destructive",
      });
      return;
    }

    createQuizMutation.mutate(quizData);
  };

  const addQuestion = () => {
    if (questions.length >= quizData.totalQuestions) {
      toast({
        title: "Maximum questions reached",
        description: `You can only add ${quizData.totalQuestions} questions to this quiz.`,
        variant: "destructive",
      });
      return;
    }

    const newQuestion: QuestionData = {
      questionText: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      questionNumber: questions.length + 1,
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, updatedQuestion: QuestionData) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = updatedQuestion;
    setQuestions(updatedQuestions);
  };

  const removeQuestion = (index: number) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    // Renumber remaining questions
    const renumbered = updatedQuestions.map((q, i) => ({
      ...q,
      questionNumber: i + 1,
    }));
    setQuestions(renumbered);
  };

  if (user?.role !== 'teacher') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-4">Only teachers can create quizzes.</p>
            <Link href="/">
              <Button>Go to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-text-dark">Create New Quiz</h1>
                <p className="text-gray-600">Build an engaging multiple-choice quiz for your students</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentStep === 'settings' ? (
          <Card>
            <CardHeader>
              <CardTitle>Quiz Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                setCurrentStep('questions');
              }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="title">Quiz Title</Label>
                    <Input
                      id="title"
                      value={quizData.title}
                      onChange={(e) => setQuizData({ ...quizData, title: e.target.value })}
                      placeholder="Enter quiz title"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Select
                      value={quizData.subject}
                      onValueChange={(value) => setQuizData({ ...quizData, subject: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mathematics">Mathematics</SelectItem>
                        <SelectItem value="Science">Science</SelectItem>
                        <SelectItem value="Computer Science">Computer Science</SelectItem>
                        <SelectItem value="History">History</SelectItem>
                        <SelectItem value="Literature">Literature</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                    <Input
                      id="timeLimit"
                      type="number"
                      value={quizData.timeLimit}
                      onChange={(e) => setQuizData({ ...quizData, timeLimit: parseInt(e.target.value) })}
                      min="1"
                      max="180"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="totalQuestions">Total Questions</Label>
                    <Input
                      id="totalQuestions"
                      type="number"
                      value={quizData.totalQuestions}
                      onChange={(e) => setQuizData({ ...quizData, totalQuestions: parseInt(e.target.value) })}
                      min="1"
                      max="50"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={quizData.description}
                    onChange={(e) => setQuizData({ ...quizData, description: e.target.value })}
                    placeholder="Brief description of the quiz content"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" className="bg-google-blue hover:bg-blue-600">
                    Next: Add Questions
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Questions Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Questions ({questions.length}/{quizData.totalQuestions})</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{quizData.title}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep('settings')}
                    >
                      Back to Settings
                    </Button>
                    <Button
                      onClick={addQuestion}
                      disabled={questions.length >= quizData.totalQuestions}
                      className="bg-google-blue hover:bg-blue-600"
                    >
                      Add Question
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Questions List */}
            {questions.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <p className="text-gray-600 mb-4">No questions added yet.</p>
                  <Button onClick={addQuestion} className="bg-google-blue hover:bg-blue-600">
                    Add Your First Question
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {questions.map((question, index) => (
                  <QuestionBuilder
                    key={index}
                    question={question}
                    questionNumber={index + 1}
                    onUpdate={(updatedQuestion) => updateQuestion(index, updatedQuestion)}
                    onRemove={() => removeQuestion(index)}
                  />
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {questions.length} of {quizData.totalQuestions} questions added
                  </div>
                  <div className="flex space-x-4">
                    <Button variant="outline" disabled>
                      <Eye className="w-4 h-4 mr-2" />
                      Preview Quiz
                    </Button>
                    <Button
                      onClick={handleQuizSubmit}
                      disabled={createQuizMutation.isPending || questions.length !== quizData.totalQuestions}
                      className="bg-google-blue hover:bg-blue-600"
                    >
                      {createQuizMutation.isPending ? (
                        <>Saving...</>
                      ) : (
                        <>
                          <Files className="w-4 h-4 mr-2" />
                          Files Quiz
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
