import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';
import { toast } from '../../components/Toast';
import { ArrowLeft, Download, FileText, Clock } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import type { Assignment, Submission } from '../../types/index';
import MultiTaskSubmission from '../../components/assignments/MultiTaskSubmission';

export default function AssignmentGradingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isGradingModalOpen, setIsGradingModalOpen] = useState(false);
  const [gradingScore, setGradingScore] = useState<number>(0);
  const [gradingFeedback, setGradingFeedback] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const assignmentData = await apiClient.getAssignment(id!);
      setAssignment(assignmentData);
      const submissionsData = await apiClient.getAssignmentSubmissions(id!);
      setSubmissions(submissionsData);
    } catch (error) {
      toast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmission = async () => {
    if (!selectedSubmission || !id) return;
    setIsSubmitting(true);
    try {
      await apiClient.gradeSubmission(id, selectedSubmission.id.toString(), gradingScore, gradingFeedback);
      toast('Submission graded successfully', 'success');
      setIsGradingModalOpen(false);
      await loadData();
    } catch (error) {
      toast('Failed to grade submission', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openGradingModal = (submission: Submission) => {
    setSelectedSubmission(submission);
    setGradingScore(submission.score || 0);
    setGradingFeedback(submission.feedback || '');
    setIsGradingModalOpen(true);
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => navigate('/assignments')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Grade Submissions</h1>
          <p className="text-gray-600">{assignment?.title}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Submissions ({submissions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No submissions yet.
            </div>
          ) : (
            submissions.map((submission) => (
              <div key={submission.id} className="border rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-lg">{submission.user_name || `User ${submission.user_id}`}</div>
                    <div className="text-sm text-gray-600 flex items-center mt-1">
                      <Clock className="w-3 h-3 mr-1" />
                      Submitted: {new Date(submission.submitted_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {submission.is_graded ? (
                      <Badge variant={(submission.score || 0) >= (submission.max_score * 0.6) ? "default" : "destructive"}>
                        Score: {submission.score || 0}/{submission.max_score}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Pending Grading</Badge>
                    )}
                    <Button onClick={() => openGradingModal(submission)}>
                      {submission.is_graded ? 'Update Grade' : 'Grade'}
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={isGradingModalOpen} onOpenChange={setIsGradingModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Grade Submission</DialogTitle>
            <DialogDescription>
              Review the student's work and provide a score and feedback.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 my-4">
            {/* Submission Content View */}
            <div className="bg-slate-50 p-6 rounded-lg border">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Student's Work
              </h3>
              
              {assignment?.assignment_type === 'multi_task' && selectedSubmission ? (
                <MultiTaskSubmission 
                  assignment={assignment} 
                  initialAnswers={selectedSubmission.answers} 
                  readOnly={true}
                  onSubmit={() => {}}
                />
              ) : (
                <div className="space-y-4">
                  {selectedSubmission?.file_url && (
                    <div className="flex items-center p-3 bg-white rounded border">
                      <FileText className="w-5 h-5 text-blue-600 mr-3" />
                      <div className="flex-1">
                        <div className="font-medium">{selectedSubmission.submitted_file_name || 'Attached File'}</div>
                      </div>
                      <a 
                        href={selectedSubmission.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm font-medium flex items-center"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </a>
                    </div>
                  )}
                  
                  {selectedSubmission?.answers?.text && (
                    <div className="bg-white p-4 rounded border whitespace-pre-wrap">
                      {selectedSubmission.answers.text}
                    </div>
                  )}
                  
                  {!selectedSubmission?.file_url && !selectedSubmission?.answers?.text && (
                    <div className="text-gray-500 italic">No content to display.</div>
                  )}
                </div>
              )}
            </div>

            {/* Grading Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg bg-white">
              <div className="space-y-2">
                <Label htmlFor="score">Score (Max: {assignment?.max_score})</Label>
                <Input
                  id="score"
                  type="number"
                  min="0"
                  max={assignment?.max_score || 100}
                  value={gradingScore}
                  onChange={(e) => setGradingScore(Math.min(parseInt(e.target.value) || 0, assignment?.max_score || 100))}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="feedback">Feedback</Label>
                <Textarea
                  id="feedback"
                  value={gradingFeedback}
                  onChange={(e) => setGradingFeedback(e.target.value)}
                  placeholder="Provide feedback to the student..."
                  className="min-h-[100px]"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGradingModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGradeSubmission} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Grade'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
