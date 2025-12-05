import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import { toast } from '../components/Toast';
import { 
  BookOpen, 
  Users, 
  ClipboardCheck, 
  TrendingUp, 
  Clock,
  CheckCircle,
  Eye,
  Filter
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

interface TeacherStats {
  total_courses: number;
  total_students: number;
  active_students: number;
  avg_student_progress: number;
  pending_submissions: number;
  recent_enrollments: number;
  avg_completion_rate: number;
  avg_student_score: number;
  total_submissions: number;
  graded_submissions: number;
  grading_progress: number;
}

interface StudentProgress {
  student_id: number;
  student_name: string;
  student_email: string;
  student_avatar: string | null;
  group_name?: string | null;
  course_id: number;
  course_title: string;
  current_lesson_id: number | null;
  current_lesson_title: string;
  lesson_progress: number;
  overall_progress: number;
  last_activity: string | null;
}

interface Submission {
  id: number;
  assignment_id: number;
  user_id: number; // student_id
  assignment_title?: string;
  course_title?: string;
  student_name?: string;
  student_email?: string;
  submitted_at: string;
  score?: number;
  max_score?: number;
  is_graded: boolean;
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [pendingSubmissions, setPendingSubmissions] = useState<Submission[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([]);
  const [studentsProgress, setStudentsProgress] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState('all');
  const [activeGroup, setActiveGroup] = useState('all');

  useEffect(() => {
    loadTeacherData();
  }, []);

  const loadTeacherData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load teacher dashboard stats
      const dashboardData = await apiClient.getDashboardStats();
      const statsAny = (dashboardData as any)?.stats || {};
      
      const teacherStats: TeacherStats = {
        total_courses: statsAny.total_courses ?? 0,
        total_students: statsAny.total_students ?? 0,
        active_students: statsAny.active_students ?? 0,
        avg_student_progress: statsAny.avg_student_progress ?? 0,
        pending_submissions: 0,
        recent_enrollments: statsAny.recent_enrollments ?? 0,
        avg_completion_rate: statsAny.avg_completion_rate ?? 0,
        avg_student_score: statsAny.avg_student_score ?? 0,
        total_submissions: statsAny.total_submissions ?? 0,
        graded_submissions: statsAny.graded_submissions ?? 0,
        grading_progress: statsAny.grading_progress ?? 0
      };

      setStats(teacherStats);

      // Load pending submissions
      try {
        const pending = await apiClient.getPendingSubmissions();
        setPendingSubmissions(pending);
        setStats(prev => prev ? { ...prev, pending_submissions: pending.length } : null);
      } catch (submissionError) {
        console.warn('Failed to load submissions:', submissionError);
        setPendingSubmissions([]);
      }

      // Load recent submissions (fetch more to build history)
      try {
        const recent = await apiClient.getRecentSubmissions(20);
        setRecentSubmissions(recent);
      } catch (recentError) {
        console.warn('Failed to load recent submissions:', recentError);
        setRecentSubmissions([]);
      }

      // Load students progress
      try {
        const studentsData = await apiClient.getTeacherStudentsProgress();
        setStudentsProgress(studentsData);
      } catch (progressError) {
        console.warn('Failed to load students progress:', progressError);
        setStudentsProgress([]);
      }

    } catch (err) {
      setError('Failed to load teacher dashboard data');
      console.error('Teacher dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmission = (assignmentId: number) => {
    navigate(`/assignment/${assignmentId}/grade`);
  };

  const handleAllowResubmission = async (submissionId: number) => {
    try {
      await apiClient.allowResubmission(String(submissionId));
      toast('Resubmission allowed', 'info');
      loadTeacherData();
    } catch (error) {
      toast('Failed to allow resubmission', 'error');
      console.error('Resubmission error:', error);
    }
  };

  // Merge and filter submissions
  const unifiedSubmissions = useMemo(() => {
    // Start with all pending submissions
    const all = [...pendingSubmissions];
    
    // Add recent submissions that are NOT in the pending list (i.e., graded ones)
    // We use a Set of IDs to avoid duplicates if any overlap occurs
    const pendingIds = new Set(pendingSubmissions.map(s => s.id));
    
    recentSubmissions.forEach(sub => {
      if (!pendingIds.has(sub.id)) {
        all.push(sub);
      }
    });

    // Sort by date desc
    return all.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
  }, [pendingSubmissions, recentSubmissions]);

  const filteredSubmissions = useMemo(() => {
    if (activeTab === 'pending') {
      return unifiedSubmissions.filter(s => !s.is_graded);
    }
    if (activeTab === 'graded') {
      return unifiedSubmissions.filter(s => s.is_graded);
    }
    return unifiedSubmissions;
  }, [unifiedSubmissions, activeTab]);

  // Group filtering
  const uniqueGroups = useMemo(() => {
    const groups = new Set<string>();
    studentsProgress.forEach(s => {
      if (s.group_name) groups.add(s.group_name);
    });
    return Array.from(groups).sort();
  }, [studentsProgress]);

  const filteredStudents = useMemo(() => {
    if (activeGroup === 'all') return studentsProgress;
    return studentsProgress.filter(s => s.group_name === activeGroup);
  }, [studentsProgress, activeGroup]);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <h3 className="font-bold">Error loading dashboard</h3>
          <p>{error}</p>
          <Button onClick={loadTeacherData} variant="outline" className="mt-2 text-red-800 border-red-200 hover:bg-red-100">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
        <Button
          onClick={() => navigate('/teacher/courses')}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <BookOpen className="w-4 h-4 mr-2" />
          Manage Courses
        </Button>
      </div>

      {/* Key Stats - Simplified */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Reviews</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats?.pending_submissions || 0}</h3>
              </div>
              <div className="p-3 bg-orange-50 rounded-full">
                <ClipboardCheck className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Students</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats?.active_students || 0}</h3>
              </div>
              <div className="p-3 bg-purple-50 rounded-full">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Students</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats?.total_students || 0}</h3>
              </div>
              <div className="p-3 bg-green-50 rounded-full">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Avg Progress</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats?.avg_student_progress || 0}%</h3>
              </div>
              <div className="p-3 bg-blue-50 rounded-full">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unified Submissions Table */}
      <Card className="shadow-sm">
        <CardHeader className="px-6 py-4 border-b border-gray-100 bg-white rounded-t-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <div>
                <CardTitle className="text-lg font-bold text-gray-900">Submissions</CardTitle>
                <p className="text-sm text-gray-500">Manage student assignments and grading</p>
              </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
              <TabsList className="grid w-full grid-cols-3 sm:w-[300px]">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="graded">Graded</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredSubmissions.length === 0 ? (
            <div className="p-12 text-center bg-gray-50/50">
              <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No submissions found</h3>
              <p className="text-gray-500">
                {activeTab === 'pending' 
                  ? "You're all caught up! No pending reviews." 
                  : "No submissions match the current filter."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50/80 text-gray-600 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-3 font-semibold">Student</th>
                    <th className="text-left px-6 py-3 font-semibold">Assignment</th>
                    <th className="text-left px-6 py-3 font-semibold">Status</th>
                    <th className="text-left px-6 py-3 font-semibold">Submitted</th>
                    <th className="text-left px-6 py-3 font-semibold">Score</th>
                    <th className="text-right px-6 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSubmissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3 text-gray-600 font-medium text-xs">
                            {submission.student_name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{submission.student_name || 'Unknown'}</div>
                            <div className="text-xs text-gray-500">{submission.student_email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{submission.assignment_title}</div>
                        <div className="text-xs text-gray-500">{submission.course_title}</div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge 
                          variant={submission.is_graded ? "outline" : "default"}
                          className={submission.is_graded 
                            ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" 
                            : "bg-orange-100 text-orange-800 hover:bg-orange-200 border-transparent"}
                        >
                          {submission.is_graded ? 'Graded' : 'Needs Grading'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1.5 text-gray-400" />
                          {new Date(submission.submitted_at).toLocaleDateString(undefined, {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {submission.is_graded ? (
                          <span className={
                            (submission.score || 0) >= (submission.max_score || 100) * 0.8 
                              ? "text-green-600" 
                              : (submission.score || 0) >= (submission.max_score || 100) * 0.5 
                                ? "text-yellow-600" 
                                : "text-red-600"
                          }>
                            {submission.score} / {submission.max_score}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant={submission.is_graded ? "ghost" : "default"}
                            className={submission.is_graded ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50" : "bg-blue-600 hover:bg-blue-700"}
                            onClick={() => handleGradeSubmission(submission.assignment_id)}
                          >
                            {submission.is_graded ? <Eye className="w-4 h-4 mr-1" /> : <ClipboardCheck className="w-4 h-4 mr-1" />}
                            {submission.is_graded ? 'View' : 'Grade'}
                          </Button>
                          {!submission.is_graded && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-gray-500 hover:text-gray-700"
                              onClick={() => handleAllowResubmission(submission.id)}
                            >
                              Resubmit
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Students Progress Table */}
      <Card className="shadow-sm">
        <CardHeader className="px-6 py-4 border-b border-gray-100 bg-white rounded-t-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-gray-900">Student Progress</CardTitle>
              <p className="text-sm text-gray-500">Overview of all students across your courses</p>
            </div>
            
            {uniqueGroups.length > 0 && (
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <Select value={activeGroup} onValueChange={setActiveGroup}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Students" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Students</SelectItem>
                    {uniqueGroups.map(group => (
                      <SelectItem key={group} value={group}>{group}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredStudents.length === 0 ? (
            <div className="p-12 text-center bg-gray-50/50">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No students found</h3>
              <p className="text-gray-500">Try adjusting the group filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50/80 text-gray-600 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-3 font-semibold">Student</th>
                    <th className="text-left px-6 py-3 font-semibold">Group</th>
                    <th className="text-left px-6 py-3 font-semibold">Course</th>
                    <th className="text-left px-6 py-3 font-semibold">Current Lesson</th>
                    <th className="text-left px-6 py-3 font-semibold">Progress</th>
                    <th className="text-left px-6 py-3 font-semibold">Last Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStudents.map((student, index) => (
                    <tr key={`${student.student_id}-${student.course_id}-${index}`} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {student.student_avatar ? (
                            <img 
                              src={student.student_avatar} 
                              alt={student.student_name}
                              className="w-8 h-8 rounded-full mr-3 object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-3 text-purple-600 font-medium text-xs">
                              {student.student_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900">{student.student_name}</div>
                            <div className="text-xs text-gray-500">{student.student_email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {student.group_name ? (
                          <Badge variant="outline" className="bg-gray-50 inline-flex items-center whitespace-nowrap">
                            {student.group_name.split("-")[1]}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{student.course_title}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-sm font-medium truncate max-w-[150px]" title={student.current_lesson_title}>
                            {student.current_lesson_title}
                          </div>
                          {student.current_lesson_id && (
                            <div className="flex items-center space-x-2">
                              <Progress value={student.lesson_progress} className="w-16 h-2" />
                              <span className="text-xs text-gray-500">
                                {student.lesson_progress}%
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center max-w-[160px]">
                          <div className="flex-1 mr-3">
                            <Progress value={student.overall_progress} className="h-2.5 w-24" />
                          </div>
                          <span className="text-sm font-medium text-gray-700 w-8">
                            {student.overall_progress}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {student.last_activity 
                          ? new Date(student.last_activity).toLocaleDateString(undefined, {
                            month: 'short', day: 'numeric'
                          })
                          : <span className="text-gray-400">Never</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
