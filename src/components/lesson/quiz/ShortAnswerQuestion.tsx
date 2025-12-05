import React from 'react';

interface ShortAnswerQuestionProps {
  question: any;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  showResult?: boolean;
}

export const ShortAnswerQuestion: React.FC<ShortAnswerQuestionProps> = ({
  question,
  value,
  onChange,
  disabled,
  showResult
}) => {
  return (
    <div className="space-y-4">
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter your answer..."
        className="w-full p-4 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
        disabled={disabled}
      />
      {showResult && (
        <div className="mt-2 text-sm">
          {(value || '').toString().trim().toLowerCase() === (question.correct_answer || '').toString().trim().toLowerCase() ? (
            <span className="text-green-700">Correct answer! ✓</span>
          ) : (
            <div className="text-red-700">
              <div>Incorrect answer.</div>
              <div className="mt-1">
                <strong>Correct answer:</strong> {question.correct_answer}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
