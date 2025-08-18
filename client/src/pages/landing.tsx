import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, Users, BarChart3, Clock } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-light">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <GraduationCap className="w-8 h-8 text-google-blue" />
              <div className="text-2xl font-bold text-google-blue">QuizMaster</div>
            </div>
            <Button onClick={handleLogin} className="bg-google-blue hover:bg-blue-600">
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-text-dark mb-6">
            Modern Quiz Management Platform
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Create engaging quizzes, track student progress, and analyze performance with our 
            comprehensive educational platform inspired by Google Forms and Khan Academy.
          </p>
          <Button 
            onClick={handleLogin} 
            size="lg" 
            className="bg-google-blue hover:bg-blue-600 text-lg px-8 py-4"
          >
            Get Started
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20">
          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-google-blue bg-opacity-10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-google-blue" />
              </div>
              <CardTitle>Timed Quizzes</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Create multiple-choice quizzes with customizable time limits and automatic submission.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-success-green bg-opacity-10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-success-green" />
              </div>
              <CardTitle>Student Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Role-based access control for teachers and students with comprehensive user management.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-accent-yellow bg-opacity-10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-accent-yellow" />
              </div>
              <CardTitle>Detailed Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Track performance with comprehensive dashboards showing scores, completion rates, and insights.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-warning-red bg-opacity-10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-6 h-6 text-warning-red" />
              </div>
              <CardTitle>Easy Quiz Creation</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Intuitive quiz builder with drag-and-drop functionality and question management.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
