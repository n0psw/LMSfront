  import { useEffect, useState } from 'react';
  import { useParams, useNavigate, Link } from 'react-router-dom';
  import apiClient from '../../services/api';
  import { 
    Users, 
    Clock, 
    CheckCircle, 
    AlertCircle, 
    FileText, 
    Calendar,
    ArrowLeft,
    Eye,
    EyeOff,
    Award,
    Pencil,
    Download
  } from 'lucide-react';
  import { Button } from '../../components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
  import { Badge } from '../../components/ui/badge';
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
  import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
  import { Input } from '../../components/ui/input';
  import { Textarea } from '../../components/ui/textarea';
  import MultiTaskSubmission from '../../components/assignments/MultiTaskSubmission';

  // Import API_BASE_URL from api service
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  // Helper function to build full file URL
  const buildFileUrl = (relativeUrl: string): string => {
    if (!relativeUrl) return '';
    if (relativeUrl.startsWith('http')) return relativeUrl;
    return `${API_BASE_URL}${relativeUrl}`;
  };

  interface StudentProgress {
    id: number;
    name: string;
    email: string;
    status: 'not_submitted' | 'submitted' | 'graded' | 'overdue';
    submission_id: number | null;
    score: number | null;
    max_score: number;
    submitted_at: string | null;
    graded_at: string | null;
    is_overdue: boolean;
    is_hidden?: boolean;
    assignment_source: 'course' | 'group' | 'both' | 'unknown';
    source_display: string;
  }

  interface AssignmentData {
    id: number;
    title: string;
    description: string | null;
    due_date: string | null;
    max_score: number;
    lesson_id: number | null;
    group_id: number | null;
    assignment_type?: string;
    content?: any;
  }

  interface SummaryStats {
    total_students: number;
    not_submitted: number;
    submitted: number;
    graded: number;
    overdue: number;
  }

  interface SourceBreakdown {
    course?: number;
    group?: number;
    both?: number;
    unknown?: number;
  }

  interface AssignmentStudentProgress {
    assignment: AssignmentData;
    students: StudentProgress[];
    summary: SummaryStats;
    source_breakdown: SourceBreakdown;
  }

  export default function AssignmentStudentProgressPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [data, setData] = useState<AssignmentStudentProgress | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [filter, setFilter] = useState<'all' | 'not_submitted' | 'submitted' | 'graded' | 'overdue'>('all');
    const [gradingDialog, setGradingDialog] = useState<{ open: boolean; submissionId: number | null }>({
      open: false,
      submissionId: null
    });
    const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
    const [scoreInput, setScoreInput] = useState<string>('');
    const [feedbackInput, setFeedbackInput] = useState<string>('');
    const [loadingSubmission, setLoadingSubmission] = useState<boolean>(false);
    const [savingGrade, setSavingGrade] = useState<boolean>(false);

    useEffect(() => {
      if (id) {
        loadAssignmentProgress();
      }
    }, [id]);

    const loadAssignmentProgress = async () => {
      try {
        console.log('Loading assignment progress for ID:', id);
        setLoading(true);
        setError('');
        const progressData = await apiClient.getAssignmentStudentProgress(id!);
        console.log('Received progress data:', progressData);
        setData(progressData);
      } catch (err: any) {
        console.error('Failed to load assignment progress:', err);
        setError(err.message || 'Failed to load assignment progress');
      } finally {
        setLoading(false);
      }
    };

    const openGradeDialog = async (submissionId: number) => {
      try {
        setLoadingSubmission(true);
        setGradingDialog({ open: true, submissionId });
        // Fetch submissions and find the one we need
        const submissions = await apiClient.getAssignmentSubmissions(id!);
        const sub = submissions.find((s: any) => s.id === submissionId) || null;
        
        setSelectedSubmission(sub);
        setScoreInput(sub?.score != null ? String(sub.score) : '');
        setFeedbackInput(sub?.feedback || '');
      } catch (e) {
        console.error('Failed to load submission:', e);
      } finally {
        setLoadingSubmission(false);
      }
    };

    const submitGrade = async () => {
      if (!gradingDialog.submissionId) return;
      try {
        setSavingGrade(true);
        const parsedScore = Number(scoreInput);
        await apiClient.gradeSubmission(id!, String(gradingDialog.submissionId), parsedScore, feedbackInput);
        await loadAssignmentProgress();
        setGradingDialog({ open: false, submissionId: null });
        setSelectedSubmission(null);
      } catch (e: any) {
        console.error('Failed to save grade:', e);
        alert(e?.message || 'Failed to save grade');
      } finally {
        setSavingGrade(false);
      }
    };

    const toggleSubmissionVisibility = async (submissionId: number) => {
      try {
        await apiClient.toggleSubmissionVisibility(id!, String(submissionId));
        await loadAssignmentProgress();
      } catch (e: any) {
        console.error('Failed to toggle submission visibility:', e);
        alert(e?.message || 'Failed to toggle visibility');
      }
    };

    const downloadFile = async (fileUrl: string, fileName: string) => {
      try {
        const fullUrl = buildFileUrl(fileUrl);
        const response = await fetch(fullUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        console.error('Failed to download file:', error);
        alert('Failed to download file');
      }
    };

    const filteredStudents = data?.students.filter(student => {
      if (filter === 'all') return true;
      return student.status === filter;
    }) || [];

    const getStatusBadge = (status: string) => {
      switch (status) {
        case 'graded':
          return (
            <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
              <CheckCircle className="w-3 h-3 mr-1" />
              Graded
            </Badge>
          );
        case 'submitted':
          return (
            <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
              <Clock className="w-3 h-3 mr-1" />
              Submitted
            </Badge>
          );
        case 'overdue':
          return (
            <Badge variant="destructive">
              <AlertCircle className="w-3 h-3 mr-1" />
              Overdue
            </Badge>
          );
        default:
          return (
            <Badge variant="secondary">
              <FileText className="w-3 h-3 mr-1" />
              Not Submitted
            </Badge>
          );
      }
    };

    const isOverdue = (dueDate: string) => {
      return new Date(dueDate) < new Date();
    };

    // Removed unused handlers since actions use Link buttons now

    if (loading) {
      return (
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
            <div className="bg-white rounded-xl shadow p-6">
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/assignments')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Assignments
            </Button>
            <h1 className="text-3xl font-bold">Student Progress</h1>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <h3 className="font-semibold text-red-800">Error</h3>
              </div>
              <p className="text-red-600 mt-1">{error}</p>
              <Button onClick={loadAssignmentProgress} className="mt-3">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (!data) {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/assignments')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Assignments
            </Button>
            <h1 className="text-3xl font-bold">Student Progress</h1>
          </div>
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-600">No data available</p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/assignments')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Assignments
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{data.assignment.title}</h1>
            </div>
          </div>
        </div>

        {/* Assignment Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Assignment Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Due Date</p>
                <p className="font-medium">
                  {data.assignment.due_date ? (
                    <span className={`flex items-center ${isOverdue(data.assignment.due_date) ? 'text-red-600' : ''}`}>
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(data.assignment.due_date).toLocaleDateString()}
                      {isOverdue(data.assignment.due_date) && <AlertCircle className="w-4 h-4 ml-1" />}
                    </span>
                  ) : (
                    'No deadline'
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Max Score</p>
                <p className="font-medium">{data.assignment.max_score} points</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="font-medium">{data.summary.total_students} students</p>
              </div>
              <div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <FileText className="w-6 h-6 text-gray-600 mr-2" />
                <div>
                  <div className="text-sm text-gray-600">Not Submitted</div>
                  <div className="text-xl font-bold">{data.summary.not_submitted}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Clock className="w-6 h-6 text-blue-600 mr-2" />
                <div>
                  <div className="text-sm text-gray-600">Submitted</div>
                  <div className="text-xl font-bold">{data.summary.submitted}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                <div>
                  <div className="text-sm text-gray-600">Graded</div>
                  <div className="text-xl font-bold">{data.summary.graded}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <AlertCircle className="w-6 h-6 text-red-600 mr-2" />
                <div>
                  <div className="text-sm text-gray-600">Overdue</div>
                  <div className="text-xl font-bold">{data.summary.overdue}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assignment Source Breakdown */}
        {Object.keys(data.source_breakdown).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Assignment Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {data.source_breakdown.course && (
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <div className="text-sm text-blue-600">Course Students</div>
                      <div className="text-lg font-bold text-blue-800">{data.source_breakdown.course}</div>
                    </div>
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-sm font-medium">C</span>
                    </div>
                  </div>
                )}
                
                {data.source_breakdown.group && (
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <div className="text-sm text-green-600">Group Students</div>
                      <div className="text-lg font-bold text-green-800">{data.source_breakdown.group}</div>
                    </div>
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-sm font-medium">G</span>
                    </div>
                  </div>
                )}
                
                {data.source_breakdown.both && (
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div>
                      <div className="text-sm text-purple-600">Course & Group</div>
                      <div className="text-lg font-bold text-purple-800">{data.source_breakdown.both}</div>
                    </div>
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 text-sm font-medium">B</span>
                    </div>
                  </div>
                )}
                
                {data.source_breakdown.unknown && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-sm text-gray-600">Unknown Source</div>
                      <div className="text-lg font-bold text-gray-800">{data.source_breakdown.unknown}</div>
                    </div>
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 text-sm font-medium">?</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Student Progress Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Student Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={filter} onValueChange={(value) => setFilter(value as any)}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">All ({data.summary.total_students})</TabsTrigger>
                <TabsTrigger value="not_submitted">Not Submitted ({data.summary.not_submitted})</TabsTrigger>
                <TabsTrigger value="submitted">Submitted ({data.summary.submitted})</TabsTrigger>
                <TabsTrigger value="graded">Graded ({data.summary.graded})</TabsTrigger>
                <TabsTrigger value="overdue">Overdue ({data.summary.overdue})</TabsTrigger>
              </TabsList>
              
              <TabsContent value={filter} className="mt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          No students found with this status
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{student.name}</div>
                              <div className="text-sm text-gray-600">{student.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(student.status)}
                          </TableCell>
                          <TableCell>
                            {student.score !== null ? (
                              <div className="flex items-center gap-2">
                                <Award className="w-4 h-4 text-green-600" />
                                <span className="font-medium">
                                  {student.score}/{student.max_score}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {student.submitted_at ? (
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-1 text-gray-600" />
                                {new Date(student.submitted_at).toLocaleDateString()}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2 justify-end">
                             
                              {student.submission_id && (
                                <>
                              <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Grade submission"
                                  aria-label="Grade submission"
                                  onClick={() => openGradeDialog(student.submission_id!)}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                              </>
                                
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Grading Dialog */}
        <Dialog open={gradingDialog.open} onOpenChange={(open) => { if (!open) { setGradingDialog({ open, submissionId: null }); setSelectedSubmission(null);} }}>
          <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Grade Submission</DialogTitle>
            </DialogHeader>
            <div className="p-2 h-full overflow-y-auto">
              {loadingSubmission ? (
                <div className="text-sm text-gray-500">Loading submission...</div>
              ) : selectedSubmission ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                  {/* Left side - Student info and submission details */}
                  <div className="space-y-4 h-full overflow-auto">
                    {/* Multi-Task Submission View */}
                    {data?.assignment.assignment_type === 'multi_task' && (
                      <div className="mb-6">
                        <h3 className="text-sm font-medium text-gray-600 mb-2">Student's Work</h3>
                        <div className="border rounded-lg p-4 bg-white">
                          <MultiTaskSubmission 
                            assignment={data.assignment}
                            initialAnswers={selectedSubmission.answers}
                            readOnly={true}
                            onSubmit={() => {}}
                            studentId={String(selectedSubmission.user_id)}
                          />
                        </div>
                      </div>
                    )}

                    {/* File Upload View (Legacy or mixed) */}
                    {selectedSubmission.file_url && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-600">Submitted File</div>
                        <div className="bg-gray-50 p-3 rounded border">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm">
                              {selectedSubmission.submitted_file_name || 'Download file'}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadFile(selectedSubmission.file_url, selectedSubmission.submitted_file_name || 'submission_file')}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          </div>
                          
                          {/* PDF Viewer */}
                          {selectedSubmission.submitted_file_name?.toLowerCase().endsWith('.pdf') && (
                            <div className="mt-3">
                              <div className="text-xs text-gray-500 mb-2">PDF Preview:</div>
                              <div className="border rounded overflow-hidden h-[60vh]">
                                <iframe
                                  src={`${buildFileUrl(selectedSubmission.file_url)}#toolbar=0&navpanes=0&scrollbar=0`}
                                  width="100%"
                                  height="100%"
                                  style={{ border: 'none' }}
                                  title="PDF Preview"
                                />
                              </div>
                            </div>
                          )}
                          
                          {/* For non-PDF files, show a link */}
                          {!selectedSubmission.submitted_file_name?.toLowerCase().endsWith('.pdf') && (
                            <div className="mt-2">
                              <a 
                                href={buildFileUrl(selectedSubmission.file_url)} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm underline"
                              >
                                Open file in new tab
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right side - Grading form */}
                  <div className="space-y-4 h-full overflow-auto p-4">
                  <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-600">Student Information</div>
                      <div className="bg-gray-50 p-3 rounded border">
                        <div className="font-medium">{selectedSubmission.user_name || 'Student #' + selectedSubmission.user_id}</div>
                        {selectedSubmission.submitted_at && (
                          <div className="text-sm text-gray-600 mt-1">
                            Submitted: {new Date(selectedSubmission.submitted_at).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-gray-600">Score</label>
                        <Input
                          type="number"
                          min={0}
                          max={data?.assignment.max_score || 100}
                          value={scoreInput}
                          onChange={(e) => setScoreInput(e.target.value)}
                          className="mt-1"
                        />
                        <div className="text-xs text-gray-500 mt-1">Max score: {data?.assignment.max_score}</div>
                      </div>
                      
                      <div>
                        <label className="text-sm text-gray-600">Feedback</label>
                        <Textarea
                          rows={6}
                          value={feedbackInput}
                          onChange={(e) => setFeedbackInput(e.target.value)}
                          placeholder="Enter feedback for the student..."
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setGradingDialog({ open: false, submissionId: null })}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={submitGrade} 
                        disabled={savingGrade || !scoreInput}
                      >
                        {savingGrade ? 'Saving...' : 'Save Grade'}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">Select a submission to grade.</div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
