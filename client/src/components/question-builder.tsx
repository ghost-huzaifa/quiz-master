import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Trash2, Upload, X, Image } from "lucide-react";
import { useState, useRef } from "react";

interface QuestionData {
  questionText: string;
  options: [string, string, string, string];
  correctAnswer: number;
  questionNumber: number;
  imageUrl?: string;
}

interface QuestionBuilderProps {
  question: QuestionData;
  questionNumber: number;
  onUpdate: (question: QuestionData) => void;
  onRemove: () => void;
}

export function QuestionBuilder({ question, questionNumber, onUpdate, onRemove }: QuestionBuilderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateQuestion = (field: keyof QuestionData, value: any) => {
    onUpdate({ ...question, [field]: value });
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...question.options] as [string, string, string, string];
    newOptions[index] = value;
    updateQuestion('options', newOptions);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
        credentials: 'include', // Include cookies for authentication
      });

      if (!response.ok) {
        let errorMessage = 'Failed to upload image';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If response is not JSON, use default message
          errorMessage = `Upload failed: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      updateQuestion('imageUrl', result.url);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    updateQuestion('imageUrl', undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-text-dark">Question {questionNumber}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-warning-red hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor={`question-${questionNumber}`}>Question Text</Label>
            <Textarea
              id={`question-${questionNumber}`}
              value={question.questionText}
              onChange={(e) => updateQuestion('questionText', e.target.value)}
              placeholder="Enter your question here"
              rows={2}
              required
            />
          </div>

          <div>
            <Label>Question Image (Optional)</Label>
            <div className="mt-2 space-y-4">
              {question.imageUrl ? (
                <div className="relative inline-block">
                  <img
                    src={question.imageUrl}
                    alt="Question"
                    className="max-w-full h-48 object-contain border rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={removeImage}
                    className="absolute top-2 right-2"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 mb-2">
                    Add an image to help illustrate your question
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isUploading ? 'Uploading...' : 'Upload Image'}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Supported formats: JPG, PNG, GIF (Max 5MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <Label>Answer Options</Label>
            <RadioGroup
              value={question.correctAnswer.toString()}
              onValueChange={(value) => updateQuestion('correctAnswer', parseInt(value))}
              className="mt-2"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {question.options.map((option, index) => (
                  <div key={index} className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Option {String.fromCharCode(65 + index)}
                    </Label>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem
                        value={index.toString()}
                        id={`option-${questionNumber}-${index}`}
                        className="text-google-blue"
                      />
                      <Input
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + index)}`}
                        className="flex-1"
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
            <p className="text-sm text-gray-500 mt-2">
              Select the radio button next to the correct answer
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
