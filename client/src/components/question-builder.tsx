import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Trash2 } from "lucide-react";

interface QuestionData {
  questionText: string;
  options: [string, string, string, string];
  correctAnswer: number;
  questionNumber: number;
}

interface QuestionBuilderProps {
  question: QuestionData;
  questionNumber: number;
  onUpdate: (question: QuestionData) => void;
  onRemove: () => void;
}

export function QuestionBuilder({ question, questionNumber, onUpdate, onRemove }: QuestionBuilderProps) {
  const updateQuestion = (field: keyof QuestionData, value: any) => {
    onUpdate({ ...question, [field]: value });
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...question.options] as [string, string, string, string];
    newOptions[index] = value;
    updateQuestion('options', newOptions);
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
