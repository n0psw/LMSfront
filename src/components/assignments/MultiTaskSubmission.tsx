import { useState, useEffect } from 'react';
import { BookOpen, FileText, MessageSquare, Link as LinkIcon, CheckCircle, ExternalLink, Upload, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import apiClient from '../../services/api';

interface Task {
  id: string;
  task_type: 'course_unit' | 'file_task' | 'text_task' | 'link_task';
  title: string;
  description?: string;
  order_index: number;
  points: number;
  content: any;
}

interface MultiTaskSubmissionProps {
  assignment: any;
  onSubmit: (answers: any) => void;
  initialAnswers?: any;
  readOnly?: boolean;
  isSubmitting?: boolean;
  studentId?: string;
}

// Course Unit Task Display Component
interface CourseUnitTaskDisplayProps {
  task: Task;
  isCompleted: boolean;
  onCompletion: (completed: boolean) => void;
  readOnly: boolean;
  studentId?: string;
}

function CourseUnitTaskDisplay({ task, isCompleted, onCompletion, readOnly, studentId }: CourseUnitTaskDisplayProps) {
  const [courseData, setCourseData] = useState<any>(null);
  const [lessonsData, setLessonsData] = useState<any[]>([]);
  const [lessonProgress, setLessonProgress] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourseAndLessons = async () => {
      try {
        setLoading(true);
        
        // Fetch course details
        const course = await apiClient.getCourse(task.content.course_id);
        setCourseData(course);
        
        // Fetch all lessons for the course
        const modules = await apiClient.getCourseModules(task.content.course_id, true, studentId);
        const allLessons: any[] = [];
        
        modules.forEach((module: any) => {
          if (module.lessons) {
            allLessons.push(...module.lessons);
          }
        });
        
        // Filter to only the lessons in this task
        const taskLessons = allLessons.filter((lesson: any) => 
          task.content.lesson_ids?.includes(lesson.id)
        );
        setLessonsData(taskLessons);
        
        // Check completion status for each lesson
        const progressMap: Record<number, boolean> = {};
        for (const lessonId of task.content.lesson_ids || []) {
          const lesson = taskLessons.find((l: any) => l.id === lessonId);
          if (lesson) {
            progressMap[lessonId] = lesson.is_completed || false;
          }
        }
        setLessonProgress(progressMap);
        
        // Auto-complete if all lessons are completed
        const allCompleted = Object.values(progressMap).every(completed => completed);
        if (allCompleted && !isCompleted && task.content.lesson_ids?.length > 0) {
          onCompletion(true);
        }
        
      } catch (error) {
        console.error('Failed to fetch course data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (task.content.course_id && task.content.lesson_ids?.length > 0) {
      fetchCourseAndLessons();
    } else {
      setLoading(false);
    }
  }, [task.content.course_id, task.content.lesson_ids]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-gray-600">Loading course information...</div>
      </div>
    );
  }

  const completedCount = Object.values(lessonProgress).filter(c => c).length;
  const totalCount = task.content.lesson_ids?.length || 0;
  const allLessonsCompleted = completedCount === totalCount && totalCount > 0;

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-600">
        Complete the following lessons:
      </div>
      <div className="bg-gray-50 p-3 rounded-md">
        <div className="flex items-center space-x-2 mb-2">
          <BookOpen className="w-4 h-4 text-blue-600" />
          <span className="font-medium">{courseData?.title || `Course ${task.content.course_id}`}</span>
        </div>
        <div className="space-y-2 ml-6">
          {lessonsData.length > 0 ? (
            lessonsData.map((lesson: any) => {
              const lessonCompleted = lessonProgress[lesson.id] || false;
              return (
                <div key={lesson.id} className="text-sm flex items-center justify-between">
                  <div className="flex items-center space-x-2 flex-1">
                    {lessonCompleted ? (
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                    )}
                    <span className={lessonCompleted ? 'text-green-700 line-through' : ''}>
                      {lesson.title}
                    </span>
                  </div>
                  {!readOnly && (
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="h-auto p-0 ml-2" 
                      onClick={() => window.open(`/course/${task.content.course_id}/learn/lesson/${lesson.id}`, '_blank')}
                    >
                      Go to Lesson <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                </div>
              );
            })
          ) : (
            task.content.lesson_ids?.map((lessonId: number) => (
              <div key={lessonId} className="text-sm flex items-center justify-between">
                <span>Lesson #{lessonId}</span>
                {!readOnly && (
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="h-auto p-0" 
                    onClick={() => window.open(`/course/${task.content.course_id}/learn/lesson/${lessonId}`, '_blank')}
                  >
                    Go to Lesson <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
        {totalCount > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-600">
             Progress: {completedCount} / {totalCount} lessons completed
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all" 
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MultiTaskSubmission({ assignment, onSubmit, initialAnswers, readOnly = false, isSubmitting = false, studentId }: MultiTaskSubmissionProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  // Handle both formats: { tasks: {...} } or direct object {...}
  const [answers, setAnswers] = useState<Record<string, any>>(
    initialAnswers?.tasks || initialAnswers || {}
  );
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (assignment.content && assignment.content.tasks) {
      setTasks(assignment.content.tasks);
    }
  }, [assignment]);

  // Update answers when initialAnswers changes
  useEffect(() => {
    if (initialAnswers) {
      const parsedAnswers = initialAnswers?.tasks || initialAnswers || {};
      console.log('MultiTaskSubmission - Updating answers from initialAnswers:', parsedAnswers);
      setAnswers(parsedAnswers);
    }
  }, [initialAnswers]);

  const handleTaskCompletion = (taskId: string, data: any) => {
    if (readOnly) return;
    
    setAnswers(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        ...data,
        completed: true // Mark as interacted/completed
      }
    }));
  };

  const handleFileUpload = async (taskId: string, file: File) => {
    if (readOnly) return;
    
    try {
      setUploading(prev => ({ ...prev, [taskId]: true }));
      
      // Upload file using existing API
      // We'll use the uploadTeacherFile endpoint or similar, or maybe we need a student upload endpoint
      // For now using uploadTeacherFile as it returns a URL, but ideally should be a generic upload
      // In a real app, we might want a specific endpoint for assignment submissions
      // Let's assume we can use the same upload service
      const response = await apiClient.uploadTeacherFile(file);
      
      handleTaskCompletion(taskId, {
        file_url: response.file_url || response.url,
        file_name: file.name,
        file_size: file.size
      });
    } catch (error) {
      console.error('File upload failed:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploading(prev => ({ ...prev, [taskId]: false }));
    }
  };

  const handleSubmit = () => {
    onSubmit({ tasks: answers });
  };

  const renderTaskSubmission = (task: Task) => {
    const taskAnswer = answers[task.id] || {};
    const isCompleted = taskAnswer.completed || !!taskAnswer.file_url || !!taskAnswer.text_response;

    switch (task.task_type) {
      case 'course_unit':
        return (
          <CourseUnitTaskDisplay 
            task={task} 
            isCompleted={!!answers[task.id]} 
            onCompletion={(completed) => handleTaskCompletion(task.id, { completed })}
            readOnly={readOnly}
            studentId={studentId}
          />
        );

      case 'file_task':
        return (
          <div className="space-y-3">
            <div className="text-sm font-medium">{task.content.question}</div>
            {task.content.teacher_file_url && (
              <div className="flex items-center p-2 bg-blue-50 rounded-md text-sm">
                <FileText className="w-4 h-4 text-blue-600 mr-2" />
                <a href={(import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000') + task.content.teacher_file_url} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">
                  Download Reference File: {task.content.teacher_file_name || 'File'}
                </a>
              </div>
            )}
            
            {taskAnswer.file_url ? (
              <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50 border-green-200">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">{taskAnswer.file_name || 'Uploaded File'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const url = taskAnswer.file_url.startsWith('http') 
                        ? taskAnswer.file_url 
                        : (import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000') + taskAnswer.file_url;
                      window.open(url, '_blank');
                    }}
                    className="text-blue-600 hover:text-blue-800 h-8 px-2"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Open
                  </Button>
                  {!readOnly && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTaskCompletion(task.id, { file_url: null, file_name: null })}
                      className="text-red-600 hover:text-red-800 h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              !readOnly && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    id={`file-${task.id}`}
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(task.id, e.target.files[0])}
                    className="hidden"
                    accept={task.content.allowed_file_types?.map((t: string) => `.${t}`).join(',')}
                  />
                  <label htmlFor={`file-${task.id}`} className="cursor-pointer">
                    <div className="flex flex-col items-center space-y-2">
                      <Upload className="w-6 h-6 text-gray-400" />
                      <span className="text-sm text-blue-600 hover:text-blue-800">
                        {uploading[task.id] ? 'Uploading...' : 'Upload File'}
                      </span>
                      <span className="text-xs text-gray-500">
                        Max {task.content.max_file_size_mb}MB
                      </span>
                    </div>
                  </label>
                </div>
              )
            )}
          </div>
        );

      case 'text_task':
        return (
          <div className="space-y-3">
            <div className="text-sm font-medium">{task.content.question}</div>
            <Textarea
              value={taskAnswer.text_response || ''}
              onChange={(e) => handleTaskCompletion(task.id, { text_response: e.target.value })}
              placeholder="Type your answer here..."
              rows={4}
              disabled={readOnly}
              className={readOnly ? "bg-gray-50" : ""}
            />
            {!readOnly && task.content.max_length && (
              <div className="text-xs text-right text-gray-500">
                {(taskAnswer.text_response?.length || 0)} / {task.content.max_length} characters
              </div>
            )}
          </div>
        );

      case 'link_task':
        return (
          <div className="space-y-3">
            <div className="text-sm text-gray-600">{task.content.link_description}</div>
            <div className="flex items-center p-3 border rounded-lg bg-gray-50">
              <LinkIcon className="w-4 h-4 text-blue-600 mr-2" />
              <a href={task.content.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex-1 truncate">
                {task.content.url}
              </a>
              <ExternalLink className="w-3 h-3 text-gray-400 ml-2" />
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <Checkbox 
                id={`task-${task.id}`} 
                checked={isCompleted}
                onCheckedChange={(checked) => handleTaskCompletion(task.id, { completed: checked })}
                disabled={readOnly}
              />
              <Label htmlFor={`task-${task.id}`}>
                I have {task.content.completion_criteria === 'watch' ? 'watched' : 
                        task.content.completion_criteria === 'read' ? 'read' : 
                        task.content.completion_criteria === 'complete' ? 'completed' : 'visited'} this resource
              </Label>
            </div>
          </div>
        );

      default:
        return <div>Unknown task type</div>;
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'course_unit': return BookOpen;
      case 'file_task': return FileText;
      case 'text_task': return MessageSquare;
      case 'link_task': return LinkIcon;
      default: return FileText;
    }
  };

  return (
    <div className="space-y-6">
      {assignment.content.instructions && (
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="pt-6">
            <h4 className="font-medium text-blue-900 mb-2">Instructions</h4>
            <p className="text-blue-800 text-sm whitespace-pre-wrap">{assignment.content.instructions}</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {tasks.map((task, index) => {
          const Icon = getTaskIcon(task.task_type);
          const isCompleted = answers[task.id]?.completed || !!answers[task.id]?.file_url || !!answers[task.id]?.text_response;
          
          return (
            <Card key={task.id} className={isCompleted ? "border-green-200 bg-green-50/30" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${isCompleted ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{task.title}</h4>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>Task {index + 1}</span>
                        <span>•</span>
                        <span>{task.points} points</span>
                      </div>
                    </div>
                  </div>
                  {isCompleted && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {renderTaskSubmission(task)}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!readOnly && (
        <div className="flex justify-end pt-4">
          <Button onClick={handleSubmit} size="lg" className="w-full md:w-auto" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
          </Button>
        </div>
      )}
    </div>
  );
}
