import React from 'react';
import { CheckCircle } from 'lucide-react';
import { renderTextWithLatex } from '../../../utils/latex';

interface ChoiceQuestionProps {
  question: any;
  value: number | undefined;
  onChange: (value: number) => void;
  disabled?: boolean;
  showResult?: boolean;
}

export const ChoiceQuestion: React.FC<ChoiceQuestionProps> = ({
  question,
  value,
  onChange,
  disabled,
  showResult
}) => {
  return (
    <div className="space-y-2">
      {question.options?.map((option: any, optionIndex: number) => {
        const isSelected = value === optionIndex;
        const isCorrectOption = optionIndex === question.correct_answer;
        
        let buttonClass = "w-full text-left p-3 rounded-lg border-2 transition-all duration-200";
        
        if (showResult) {
          if (isCorrectOption) {
            buttonClass += " bg-green-50 border-green-400";
          } else if (isSelected) {
            buttonClass += " bg-red-50 border-red-400";
          } else {
            buttonClass += " bg-gray-50 border-gray-200";
          }
        } else {
          if (isSelected) {
            buttonClass += " bg-blue-50 border-blue-400";
          } else {
            buttonClass += " bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300";
          }
        }
        
        return (
          <button
            key={option.id}
            onClick={() => onChange(optionIndex)}
            disabled={disabled}
            className={buttonClass}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                showResult
                  ? isCorrectOption
                    ? "bg-green-500 border-green-500"
                    : isSelected
                      ? "bg-red-500 border-red-500"
                      : "border-gray-300 bg-white"
                  : isSelected
                    ? "bg-blue-500 border-blue-500"
                    : "border-gray-300 bg-white"
              }`}>
                {showResult ? (
                  isCorrectOption ? (
                    <CheckCircle className="w-3 h-3 text-white" />
                  ) : isSelected ? (
                    <div className="text-white text-xs font-bold">✗</div>
                  ) : null
                ) : (
                  isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </div>
              
              <span className={`text-base font-bold ${
                showResult
                  ? isCorrectOption ? "text-green-700" : isSelected ? "text-red-700" : "text-gray-600"
                  : isSelected ? "text-blue-700" : "text-gray-600"
              }`}>
                {option.letter}.
              </span>
              
              <span className={`text-base flex-1 ${
                showResult
                  ? isCorrectOption ? "text-green-800" : isSelected ? "text-red-800" : "text-gray-700"
                  : isSelected ? "text-gray-900" : "text-gray-700"
              }`} dangerouslySetInnerHTML={{ __html: renderTextWithLatex(option.text) }} />
            </div>
          </button>
        );
      })}
    </div>
  );
};
