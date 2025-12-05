import { useState, useEffect } from 'react';
import { Progress } from '../ui/progress';
import { Card, CardContent } from '../ui/card';
import { CheckCircle, AlertCircle, Trophy, Target } from 'lucide-react';
import apiClient from '../../services/api';
import type { LessonQuizSummary } from '../../types';

interface SummaryStepRendererProps {
  lessonId: string;
  onLoad?: () => void;
}

const SummaryStepRenderer = ({ lessonId, onLoad }: SummaryStepRendererProps) => {
  const [summaryData, setSummaryData] = useState<LessonQuizSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getLessonQuizSummary(lessonId);
        setSummaryData(data);
        if (onLoad) {
          onLoad();
        }
      } catch (err) {
        console.error('Failed to load quiz summary:', err);
        setError('Failed to load quiz summary');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [lessonId, onLoad]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !summaryData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{error || 'No quiz data available'}</p>
        </div>
      </div>
    );
  }

  const { quizzes, overall_stats } = summaryData;

  // Get color class based on percentage
  const getProgressColor = (percentage: number): string => {
    if (percentage >= 70) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getPercentageLabel = (percentage: number): { text: string; color: string } => {
    if (percentage >= 70) return { text: 'Great!', color: 'text-green-600' };
    if (percentage >= 50) return { text: 'Good', color: 'text-yellow-600' };
    return { text: 'Needs improvement', color: 'text-red-600' };
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Trophy className="w-12 h-12 text-yellow-500" />
          <h1 className="text-3xl font-bold text-gray-900">Lesson Summary</h1>
        </div>
        <p className="text-gray-600 text-lg">Here's how you performed on the quizzes in this lesson</p>
      </div>

      {/* Overall Statistics Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Target className="w-7 h-7 text-blue-600" />
              Overall Performance
            </h2>
            <div className={`text-3xl font-bold ${getPercentageLabel(overall_stats.average_percentage).color}`}>
              {overall_stats.average_percentage.toFixed(1)}%
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className= "bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Total Questions</p>
              <p className="text-2xl font-bold text-gray-900">{overall_stats.total_questions}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Correct Answers</p>
              <p className="text-2xl font-bold text-green-600">{overall_stats.total_correct}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Status</p>
              <p className={`text-xl font-bold ${getPercentageLabel(overall_stats.average_percentage).color}`}>
                {getPercentageLabel(overall_stats.average_percentage).text}
              </p>
            </div>
          </div>

          {/* Overall Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-700">
              <span>Progress</span>
              <span>{overall_stats.average_percentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${getProgressColor(overall_stats.average_percentage)}`}
                style={{ width: `${overall_stats.average_percentage}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Quiz Results */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Quiz Results</h2>
        
        {quizzes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No quizzes found in this lesson</p>
            </CardContent>
          </Card>
        ) : (
          quizzes
            .sort((a, b) => a.order_index - b.order_index)
            .map((quiz, index) => {
              const attempt = quiz.last_attempt;
              
              return (
                <Card key={quiz.step_id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1 break-words">
                            {quiz.quiz_title}
                          </h3>
                          {attempt ? (
                            <p className="text-sm text-gray-600">
                              Completed on {new Date(attempt.completed_at).toLocaleString()}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-500 italic">Not attempted yet</p>
                          )}
                        </div>
                      </div>
                      
                      {attempt && (
                        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                          {attempt.percentage >= 50 ? (
                            <CheckCircle className="w-6 h-6 text-green-500" />
                          ) : (
                            <AlertCircle className="w-6 h-6 text-red-500" />
                          )}
                        </div>
                      )}
                    </div>

                    {attempt ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-700 font-medium">
                            {attempt.score} / {attempt.total} correct
                          </span>
                          <span className={`font-bold ${getPercentageLabel(attempt.percentage).color}`}>
                            {attempt.percentage.toFixed(1)}%
                          </span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${getProgressColor(attempt.percentage)}`}
                            style={{ width: `${attempt.percentage}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-4 text-center border-2 border-dashed border-gray-300">
                        <p className="text-gray-500">Complete this quiz to see your results here</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
        )}
      </div>

      {/* Encouragement Message */}
      {overall_stats.average_percentage >= 70 && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-green-700 mb-2">Excellent Work!</h3>
            <p className="text-green-600">
              You've mastered this lesson with an average score of{' '}
              <span className="font-bold">{overall_stats.average_percentage.toFixed(1)}%</span>. Keep up the great work!
            </p>
          </CardContent>
        </Card>
      )}

      {overall_stats.average_percentage < 70 && overall_stats.average_percentage >= 50 && (
        <Card className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200">
          <CardContent className="p-6 text-center">
            <Target className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-yellow-700 mb-2">Good Progress!</h3>
            <p className="text-yellow-600">
              You're doing well with an average score of{' '}
              <span className="font-bold">{overall_stats.average_percentage.toFixed(1)}%</span>. Consider reviewing the material for even better results!
            </p>
          </CardContent>
        </Card>
      )}

      {overall_stats.average_percentage < 50 && quizzes.some(q => q.last_attempt) && (
        <Card className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-red-700 mb-2">Keep Practicing!</h3>
            <p className="text-red-600">
              Your average score is{' '}
              <span className="font-bold">{overall_stats.average_percentage.toFixed(1)}%</span>. Review the lesson materials and try the quizzes again to improve your understanding!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SummaryStepRenderer;
