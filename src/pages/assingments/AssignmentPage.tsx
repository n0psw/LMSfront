import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.tsx';
import apiClient from '../../services/api.ts';
import { toast } from '../../components/Toast.tsx';
import {
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Upload,
  Download,
  Award,
  Star,
  File,
  XCircle,
} from 'lucide-react';
import type { Assignment, AssignmentStatus, Submission } from '../../types/index.ts';
import { Button } from '../../components/ui/button.tsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card.tsx';
import { Badge } from '../../components/ui/badge.tsx';
import { Textarea } from '../../components/ui/textarea.tsx';
import { Label } from '../../components/ui/label.tsx';
import MultiTaskSubmission from '../../components/assignments/MultiTaskSubmission.tsx';

export default function AssignmentPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [status, setStatus] = useState<AssignmentStatus | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  
  // View mode: 'status' shows grading panel, 'details' shows actual submission
  const [viewMode, setViewMode] = useState<'status' | 'details'>('status');
  
  // State for legacy file upload and text submission
  const [text, setText] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');


  const loadAssignment = async (assignmentId: string) => {
    try {
      const assignmentData = await apiClient.getAssignment(assignmentId);
      setAssignment(assignmentData);
    } catch (err) {
      console.error('Failed to load assignment:', err);
      toast('Failed to load assignment', 'error');
      setError('Failed to load assignment.');
    }
  };

  const loadSubmission = async (assignmentId: string) => {
    try {
      const statusResult = await apiClient.getAssignmentStatusForStudent(assignmentId);
      setStatus(statusResult as AssignmentStatus);

      
      if (statusResult.submission_id) {
        try {
           console.log('Loading submission answers:', statusResult.answers);
           setSubmission({
             id: statusResult.submission_id,
             assignment_id: assignmentId,
             user_id: user?.id || '0',
             status: statusResult.status,
             score: statusResult.score || 0,
             submitted_at: statusResult.submitted_at || new Date().toISOString(),
             file_url: statusResult.file_url,
             submitted_file_name: statusResult.submitted_file_name,
             answers: statusResult.answers,
             is_graded: statusResult.status === 'graded',
             max_score: assignment?.max_score || 100,
             feedback: statusResult.feedback
           } as any);
        } catch (e) {
          console.warn('Could not fetch full submission details', e);
        }
      } else {
        setSubmission(null);
      }
    } catch (err) {
      console.error('Failed to load submission status:', err);
    }
  };

  useEffect(() => {
    if (!id) return;
    loadAssignment(id);
    loadSubmission(id);
  }, [id]);


  const isOverdue = assignment?.due_date && new Date(assignment.due_date) < new Date();

  const getStatusBadgeVariant = () => {
    if (!status) return 'secondary';
    if (status.status === 'submitted') return 'default';
    if (status.status === 'graded') return 'outline';
    return 'secondary';
  };

  const getAssignmentTypeIcon = () => {
    switch (assignment?.assignment_type) {
      case 'file_upload':
        return <Upload className="w-4 h-4" />;
      case 'free_text':
      case 'essay':
        return <FileText className="w-4 h-4" />;
      case 'multi_task':
        return <FileText className="w-4 h-4" />;
      default:
        return <File className="w-4 h-4" />;
    }
  };

  const getAssignmentTypeLabel = () => {
    switch (assignment?.assignment_type) {
      case 'file_upload':
        return 'File Upload';
      case 'free_text':
        return 'Free Text';
      case 'essay':
        return 'Essay';
      case 'multi_task':
        return 'Multi-Task';
      default:
        return 'Assignment';
    }
  };

  const handleSubmit = async () => {
    if (!id) return;
    
    // Validation
    if (assignment?.assignment_type === 'file_upload' && !file) return;
    if ((assignment?.assignment_type === 'free_text' || assignment?.assignment_type === 'essay') && !text) return;
    
    setSubmitting(true);
    try {
      let fileUrl = null;
      let fileName = null;

      // Upload file if exists
      if (file) {
        const result = await apiClient.uploadSubmissionFile(id, file);
        fileUrl = result.file_url;
        fileName = result.filename;
      }
      
      // Submit assignment
      await apiClient.submitAssignment(id, { 
        answers: { text },
        file_url: fileUrl,
        submitted_file_name: fileName
      });
      
      toast('Assignment submitted successfully!', 'success');
      
      // Redirect to assignments page
      setTimeout(() => {
        navigate('/assignments');
      }, 1000);
    } catch (err) {
      console.error('Assignment submission error:', err);
      toast('Failed to submit assignment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleMultiTaskSubmit = async (answers: any) => {
    if (!assignment) return;
    
    setSubmitting(true);
    setError('');

    try {
      await apiClient.submitAssignment(assignment.id, {
        answers: answers.tasks,
        file_url: null,
        submitted_file_name: null
      });
      
      toast('✅ Assignment submitted successfully! Redirecting...', 'success');
      
      // Redirect to assignments page after brief delay
      setTimeout(() => {
        navigate('/assignments');
      }, 1500);
    } catch (err) {
      console.error('Failed to submit assignment:', err);
      toast('Failed to submit assignment', 'error');
      setError('Failed to submit assignment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderContent = () => {
    if (!assignment) return null;

    // If student has submitted, show status panel first
    if (submission && (submission.status === 'submitted' || submission.status === 'graded')) {
      if (viewMode === 'status') {
        return (
          <div className="space-y-6">
            {/* Grading Status Panel */}
            <Card className={submission.status === 'graded' ? 'border-green-200 bg-green-50/30' : 'border-blue-200 bg-blue-50/30'}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {submission.status === 'graded' ? (
                    <>
                      <Award className="w-5 h-5 text-green-600" />
                      <span className="text-green-800">Graded</span>
                    </>
                  ) : (
                    <>
                      <span className="text-blue-800">Submitted - Awaiting Grade</span>
                    </>
                  )}
                </CardTitle>
                <CardDescription>
                  Submitted on {new Date(submission.submitted_at).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Score Display */}
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                  <div>
                    <div className="text-sm text-gray-600">Your Score</div>
                    <div className="text-3xl font-bold">
                      {submission.status === 'graded' ? (
                        <span className={(submission.score || 0) >= (assignment.max_score * 0.6) ? 'text-green-600' : 'text-red-600'}>
                          {submission.score || 0}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                      <span className="text-lg text-gray-500 font-normal"> / {assignment.max_score}</span>
                    </div>
                  </div>
                  {submission.status === 'graded' && (
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Percentage</div>
                      <div className={`text-2xl font-bold ${(submission.score || 0) >= (assignment.max_score * 0.6) ? 'text-green-600' : 'text-red-600'}`}>
                        {Math.round(((submission.score || 0) / assignment.max_score) * 100)}%
                      </div>
                    </div>
                  )}
                </div>

                {/* Teacher Feedback */}
                <div className="p-4 bg-white rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-gray-900">Teacher Feedback</span>
                  </div>
                  {submission.feedback ? (
                    <p className="text-gray-700 whitespace-pre-wrap">{submission.feedback}</p>
                  ) : (
                    <p className="text-gray-500 italic">No feedback provided yet</p>
                  )}
                </div>

                {/* Action Button */}
                <Button 
                  onClick={() => setViewMode('details')} 
                  variant="outline" 
                  className="w-full"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  View My Submission
                </Button>
              </CardContent>
            </Card>
          </div>
        );
      }

      // viewMode === 'details' - Show actual submission
      return (
        <div className="space-y-4">
          <Button 
            onClick={() => setViewMode('status')} 
            variant="ghost" 
            size="sm"
            className="mb-2"
          >
            ← Back to Results
          </Button>
          
          {assignment.assignment_type === 'multi_task' ? (
            <MultiTaskSubmission
              assignment={assignment}
              onSubmit={handleMultiTaskSubmit}
              initialAnswers={submission?.answers}
              readOnly={true}
              isSubmitting={submitting}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Your Submission</CardTitle>
              </CardHeader>
              <CardContent>
                {submission.file_url && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-gray-500 mr-3" />
                      <span>{submission.submitted_file_name}</span>
                    </div>
                    <a
                      href={submission.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Download
                    </a>
                  </div>
                )}
                {submission.answers?.text && (
                  <div className="p-4 bg-gray-50 rounded border whitespace-pre-wrap">
                    {submission.answers.text}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      );
    }

    // Not submitted yet - show submission form
    // Handle Multi-Task Assignments
    if (assignment.assignment_type === 'multi_task') {
      return (
        <MultiTaskSubmission
          assignment={assignment}
          onSubmit={handleMultiTaskSubmit}
          initialAnswers={submission?.answers}
          readOnly={false}
          isSubmitting={submitting}
        />
      );
    }

    // Handle File Upload Assignments (Legacy)
    if (assignment.assignment_type === 'file_upload') {
      return (
        <div className="space-y-6">
          <div className="prose max-w-none">
            <h3 className="text-lg font-medium mb-2">Instructions</h3>
            <p className="text-gray-700 whitespace-pre-wrap">
              {assignment.content?.question || assignment.description}
            </p>

            {assignment.content?.teacher_file_url && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Reference Material</h4>
                <a
                  href={(import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000') + assignment.content.teacher_file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-700 hover:underline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {assignment.content.teacher_file_name || 'Download File'}
                </a>
              </div>
            )}
          </div>

          {submission ? (
            <Card className="bg-gray-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  Submission Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white rounded border">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-gray-500 mr-3" />
                    <div>
                      <div className="font-medium">{submission.submitted_file_name}</div>
                      <div className="text-xs text-gray-500">
                        Submitted on {new Date(submission.submitted_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <a
                    href={submission.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Download
                  </a>
                </div>

                {submission.status === 'graded' && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Grade</span>
                      <Badge variant={(submission.score || 0) >= (assignment.max_score * 0.6) ? "default" : "destructive"}>
                        {submission.score} / {assignment.max_score}
                      </Badge>
                    </div>
                    {submission.feedback && (
                      <div className="bg-white p-3 rounded border mt-2">
                        <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Feedback</div>
                        <p className="text-sm text-gray-700">{submission.feedback}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Your Submission</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <input
                    type="file"
                    id="file-upload"
                    onChange={handleFileChange}
                    className="hidden"
                    accept={assignment.allowed_file_types?.map((t: string) => `.${t}`).join(',')}
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center justify-center"
                  >
                    <Upload className="w-12 h-12 text-gray-400 mb-3" />
                    <span className="text-lg font-medium text-gray-900 mb-1">
                      {file ? file.name : 'Drop your file here or click to upload'}
                    </span>
                    <span className="text-sm text-gray-500">
                      Allowed types: {assignment.allowed_file_types?.join(', ') || 'All files'}
                    </span>
                    <span className="text-sm text-gray-500 mt-1">
                      Max size: {assignment.max_file_size_mb}MB
                    </span>
                  </label>
                </div>

                {file && (
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded border border-blue-100">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-blue-600 mr-3" />
                      <span className="font-medium text-blue-900">{file.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFile(null)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </Button>
                  </div>
                )}

                <Button
                  onClick={handleSubmit}
                  disabled={!file || submitting}
                  className="w-full"
                >
                  {submitting ? 'Submitting...' : 'Submit Assignment'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      );
    }

    // Default for free_text, essay, etc.
    return (
      <Card>
        <CardHeader>
          <CardTitle>Submit Your Work</CardTitle>
          <CardDescription>
            Type your answer below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="answer">Your Answer</Label>
              <Textarea
                id="answer"
                placeholder="Type your answer here..."
                className="min-h-[200px]"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
            <Button onClick={handleSubmit} disabled={submitting || !text}>
              {submitting ? 'Submitting...' : 'Submit Assignment'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };




  if (!assignment) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-gray-500 text-lg">Loading assignment...</div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      {/* Header Card */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center text-red-800">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <CardTitle className="text-3xl font-bold text-gray-900">
                <div className="flex items-center justify-between w-full">
                  <span className="pr-3 truncate">{assignment.title}</span>
                  {submission && submission.status === 'graded' && (
                    <div className="flex items-center space-x-2 ">
                      <Award className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                        Score: {submission.score}/{assignment.max_score}
                      </span>
                    </div>
                  )}
                </div>
              </CardTitle>
              <CardDescription className="text-base text-gray-600">
                {assignment.description}
              </CardDescription>
            </div>
            <div className="flex flex-col items-end space-y-2">
              {status && (
                status.status.charAt(0) === 'not_started' ? (
                <Badge variant="outline" className="text-sm">
                  Not started
                </Badge>
                ) : (
                <Badge variant={getStatusBadgeVariant()} className="text-sm">
                  {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
                </Badge>
                )
               
              )}
              {status?.late && (
                <Badge variant="destructive" className="text-sm">
                  Late Submission
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            {assignment.due_date && (
              <div className={`flex items-center space-x-2 ${isOverdue ? 'text-red-600' : ''}`}>
                <Calendar className="w-4 h-4" />
                <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
                {isOverdue && <AlertCircle className="w-4 h-4" />}
              </div>
            )}
            {assignment.time_limit_minutes && (
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Time Limit: {assignment.time_limit_minutes} minutes</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <span>Created: {new Date(assignment.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignment Content & Submission */}
      {renderContent()}

      {/* Assignment File Card (Legacy - if not handled in renderContent) */}
      {assignment.file_url && assignment.assignment_type !== 'file_upload' && assignment.assignment_type !== 'multi_task' && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Download className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Assignment File</p>
                  <p className="text-xs text-gray-600">Download the assignment file to get started</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a
                  href={apiClient.getFileUrl('assignments', assignment.file_url.split('/').pop() || '')}
                  download
                  target="_blank"
                  className="flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Teacher Actions Section */}
      {(user?.role === 'teacher' || user?.role === 'admin') && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center space-x-2">
              <Award className="w-5 h-5" />
              <span>Teacher Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate(`/assignment/${id}/grade`)}
              className="flex items-center space-x-2"
            >
              <Star className="w-4 h-4" />
              <span>Grade Submissions</span>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


