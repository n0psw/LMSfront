import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../services/api';
import { 
  Save, 
  Eye, 
  X, 
  Plus, 
  Trash2, 
  FileText, 
  Calendar,
  Clock,
  Award,
  BookOpen,
  Users
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Checkbox } from '../../components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import MultiTaskEditor from '../../components/assignments/MultiTaskEditor';

interface AssignmentFormData {
  title: string;
  description: string;
  assignment_type: string;
  content: any;
  correct_answers: any;
  max_score: number;
  due_date?: string;
  allowed_file_types?: string[];
  max_file_size_mb?: number;
  group_id?: number;
  group_ids?: number[];
}

const ASSIGNMENT_TYPES = [
  { value: 'multi_task', label: 'Multi-Task Homework', description: 'Домашнее задание с несколькими задачами' }
];

export default function AssignmentBuilderPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { groupId, assignmentId } = useParams();
  
  const [formData, setFormData] = useState<AssignmentFormData>({
    title: '',
    description: '',
    assignment_type: 'multi_task',
    content: {},
    correct_answers: {},
    max_score: 100,
    due_date: '',
    allowed_file_types: ['pdf', 'docx', 'doc', 'jpg', 'png'],
    max_file_size_mb: 10,
    group_ids: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadGroups();
    if (groupId) {
      setFormData(prev => ({ 
        ...prev, 
        group_id: parseInt(groupId),
        group_ids: [parseInt(groupId)]
      }));
    }
  }, [groupId]);

  useEffect(() => {
    if (assignmentId) {
      setIsEditing(true);
      loadAssignment(assignmentId);
    }
  }, [assignmentId]);

  const loadAssignment = async (id: string) => {
    try {
      setLoading(true);
      const assignment = await apiClient.getAssignment(id);
      console.log('Loaded assignment:', assignment);
      
      // Parse content if it's a string
      let content = assignment.content;
      if (typeof content === 'string') {
        try {
          content = JSON.parse(content);
        } catch (e) {
          console.error('Failed to parse content:', e);
        }
      }

      // Parse correct_answers if it's a string
      let correct_answers = assignment.correct_answers;
      if (typeof correct_answers === 'string') {
        try {
          correct_answers = JSON.parse(correct_answers);
        } catch (e) {
          console.error('Failed to parse correct_answers:', e);
        }
      }

      setFormData({
        title: assignment.title,
        description: assignment.description || '',
        assignment_type: assignment.assignment_type,
        content: content || {},
        correct_answers: correct_answers || {},
        max_score: assignment.max_score,
        due_date: assignment.due_date ? new Date(assignment.due_date).toISOString().slice(0, 16) : '',
        allowed_file_types: assignment.allowed_file_types || ['pdf', 'docx', 'doc', 'jpg', 'png'],
        max_file_size_mb: assignment.max_file_size_mb || 10,
        group_id: assignment.group_id,
        group_ids: assignment.group_id ? [assignment.group_id] : []
      });
    } catch (err) {
      console.error('Failed to load assignment:', err);
      setError('Failed to load assignment details.');
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      setGroupsLoading(true);
      console.log('Loading teacher groups...');
      
      const teacherGroups = await apiClient.getTeacherGroups();
      console.log('Loaded teacher groups:', teacherGroups);
      
      setGroups(teacherGroups || []);
    } catch (err) {
      console.error('Failed to load groups:', err);
      setError('Failed to load groups. Please try again.');
      setGroups([]);
    } finally {
      setGroupsLoading(false);
    }
  };

  const handleInputChange = (field: keyof AssignmentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGroupToggle = (groupId: number, checked: boolean) => {
    setFormData(prev => {
      const currentGroups = prev.group_ids || [];
      let newGroups;
      
      if (checked) {
        newGroups = [...currentGroups, groupId];
      } else {
        newGroups = currentGroups.filter(id => id !== groupId);
      }
      
      return {
        ...prev,
        group_ids: newGroups,
        // Keep group_id for backward compatibility if needed, or just use the first one
        group_id: newGroups.length > 0 ? newGroups[0] : undefined
      };
    });
  };

  const handleContentChange = (content: any) => {
    setFormData(prev => {
      const updates: any = { content };
      
      // If multi-task, update max_score from total_points
      if (prev.assignment_type === 'multi_task' && content.total_points !== undefined) {
        updates.max_score = content.total_points;
      }
      
      return { ...prev, ...updates };
    });
  };

  const handleCorrectAnswersChange = (correct_answers: any) => {
    setFormData(prev => ({ ...prev, correct_answers }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.group_ids || formData.group_ids.length === 0) {
      setError('Please select at least one group.');
      setLoading(false);
      return;
    }

    try {
      // Handle file uploads based on assignment type
      let finalContent = { ...formData.content };

      if (formData.assignment_type === 'multi_task' && formData.content.tasks) {
        // Handle multi-task file uploads
        const updatedTasks = await Promise.all(formData.content.tasks.map(async (task: any) => {
          if (task.task_type === 'file_task' && task.content.teacher_file instanceof File) {
            try {
              console.log(`Uploading teacher file for task ${task.id}:`, task.content.teacher_file.name);
              const uploadResult = await apiClient.uploadTeacherFile(task.content.teacher_file);
              
              return {
                ...task,
                content: {
                  ...task.content,
                  teacher_file_url: uploadResult.file_url || uploadResult.url,
                  teacher_file_name: task.content.teacher_file_name || task.content.teacher_file.name,
                  teacher_file: undefined // Remove File object
                }
              };
            } catch (err) {
              console.error(`Failed to upload file for task ${task.id}:`, err);
              // Keep the task as is, or maybe throw error? 
              // For now, we'll just log it and maybe the user will try again.
              // Ideally we should stop submission.
              throw new Error(`Failed to upload file for task: ${task.title}`);
            }
          } else if (task.task_type === 'file_task') {
             // Ensure teacher_file is removed if it's not a File object (e.g. null or empty object)
             // and preserve existing url
             const { teacher_file, ...restContent } = task.content;
             return {
               ...task,
               content: restContent
             };
          }
          return task;
        }));

        finalContent = {
          ...finalContent,
          tasks: updatedTasks
        };

      } else {
        // Handle single file upload (legacy or if switched back)
        let teacherFileUrl = formData.content.teacher_file_url;
        let teacherFileName = formData.content.teacher_file_name;
        
        if (formData.content.teacher_file instanceof File) {
          try {
            console.log('Uploading teacher file:', formData.content.teacher_file.name);
            const uploadResult = await apiClient.uploadTeacherFile(formData.content.teacher_file);
            teacherFileUrl = uploadResult.file_url || uploadResult.url;
            teacherFileName = formData.content.teacher_file_name || formData.content.teacher_file.name;
          } catch (fileError) {
            console.error('Failed to upload teacher file:', fileError);
            setError('Failed to upload teacher file. Please try again.');
            setLoading(false);
            return;
          }
        }

        finalContent = {
          ...finalContent,
          teacher_file_url: teacherFileUrl,
          teacher_file_name: teacherFileName,
          teacher_file: undefined
        };
      }

      // Create assignment data
      const assignmentData = {
        ...formData,
        content: finalContent
      };
      
      console.log('Submitting assignment with data:', assignmentData);
      
      if (isEditing && assignmentId) {
        await apiClient.updateAssignment(assignmentId, assignmentData);
      } else {
        await apiClient.createAssignment(assignmentData);
      }
      
      // Redirect to assignments list
      navigate('/assignments');
    } catch (err: any) {
      setError(err.message || `Failed to ${isEditing ? 'update' : 'create'} assignment. Please try again.`);
      console.error(`Failed to ${isEditing ? 'update' : 'create'} assignment:`, err);
    } finally {
      setLoading(false);
    }
  };

  const renderAssignmentTypeEditor = () => {
    if (formData.assignment_type === 'multi_task') {
      return <MultiTaskEditor 
        content={formData.content} 
        onContentChange={handleContentChange}
      />;
    }
    
    return <FileUploadEditor 
      content={formData.content} 
      correct_answers={formData.correct_answers}
      onContentChange={handleContentChange}
      onCorrectAnswersChange={handleCorrectAnswersChange}
    />;
  };

  const renderPreview = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium">{formData.title || 'Untitled Assignment'}</h4>
            <p className="text-gray-600">{formData.description || 'No description'}</p>
          </div>
          {renderAssignmentTypeEditor()}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            {isEditing ? 'Edit Assignment' : 'Create Assignment'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEditing ? 'Update existing assignment' : 'Create a new assignment for your students'}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => setPreviewMode(!previewMode)}
            variant={previewMode ? "default" : "outline"}
          >
            <Eye className="w-4 h-4 mr-2" />
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <X className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">
                    Assignment Title *
                  </Label>
                  <Input
                    id="title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter assignment title"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Enter assignment description"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Assignment Content */}
            {!previewMode && (
              <Card>
                <CardHeader>
                  <CardTitle>Assignment Content</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderAssignmentTypeEditor()}
                </CardContent>
              </Card>
            )}

            {/* Preview */}
            {previewMode && renderPreview()}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="max-score">
                    Max Score *
                  </Label>
                  <Input
                    id="max-score"
                    type="number"
                    value={formData.max_score}
                    onChange={(e) => handleInputChange('max_score', parseInt(e.target.value))}
                    min="1"
                    max="1000"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="due-date">
                    Due Date
                  </Label>
                  <Input
                    id="due-date"
                    type="datetime-local"
                    value={formData.due_date}
                    onChange={(e) => handleInputChange('due_date', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Assignment Context */}
            <Card>
              <CardHeader>
                <CardTitle>Assignment Context</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="mb-2 block">
                    Groups *
                  </Label>
                  {groupsLoading ? (
                    <div className="text-sm text-gray-500">Loading groups...</div>
                  ) : groups.length === 0 ? (
                    <p className="text-sm text-gray-500 mt-1">
                      No groups found. Please create a group first.
                    </p>
                  ) : (
                    <div className="space-y-2 border rounded-md p-4 max-h-60 overflow-y-auto bg-white">
                      {groups.map(group => (
                        <div key={group.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`group-${group.id}`}
                            checked={formData.group_ids?.includes(group.id)}
                            onCheckedChange={(checked) => handleGroupToggle(group.id, checked as boolean)}
                          />
                          <Label 
                            htmlFor={`group-${group.id}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {group.name} <span className="text-xs text-gray-500">({group.student_count || 0} students)</span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-2">
                    Selected: {formData.group_ids?.length || 0} groups
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6">
                <Button
                  type="submit"
                  disabled={loading || !formData.group_ids || formData.group_ids.length === 0}
                  className="w-full"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {isEditing ? 'Update Assignment' : 'Create Assignment'}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

// Editor Components
interface EditorProps {
  content: any;
  correct_answers: any;
  onContentChange: (content: any) => void;
  onCorrectAnswersChange: (correct_answers: any) => void;
}

function FileUploadEditor({ content, correct_answers, onContentChange, onCorrectAnswersChange }: EditorProps) {
  const [question, setQuestion] = useState(content.question || '');
  const [allowedTypes, setAllowedTypes] = useState(content.allowed_file_types || ['pdf', 'docx']);
  const [maxSize, setMaxSize] = useState(content.max_file_size_mb || 10);
  const [teacherFile, setTeacherFile] = useState<File | null>(content.teacher_file || null);
  const [teacherFileName, setTeacherFileName] = useState(content.teacher_file_name || '');

  // Sync state with props when content loads asynchronously
  useEffect(() => {
    if (content.question && !question) setQuestion(content.question);
    if (content.allowed_file_types && content.allowed_file_types.length > 0 && allowedTypes.length === 2 && allowedTypes.includes('pdf')) {
       setAllowedTypes(content.allowed_file_types);
    }
    if (content.max_file_size_mb && maxSize === 10) setMaxSize(content.max_file_size_mb);
    if (content.teacher_file_name && !teacherFileName) setTeacherFileName(content.teacher_file_name);
  }, [content]);

  useEffect(() => {
    onContentChange({ 
      question, 
      allowed_file_types: allowedTypes, 
      max_file_size_mb: maxSize,
      teacher_file: teacherFile,
      teacher_file_name: teacherFileName
    });
    onCorrectAnswersChange({ requires_file: true });
  }, [question, allowedTypes, maxSize, teacherFile, teacherFileName]);

  const fileTypes = [
    { value: 'pdf', label: 'PDF' },
    { value: 'docx', label: 'DOCX' },
    { value: 'doc', label: 'DOC' },
    { value: 'jpg', label: 'JPG' },
    { value: 'png', label: 'PNG' },
    { value: 'gif', label: 'GIF' },
    { value: 'txt', label: 'TXT' }
  ];

  const toggleFileType = (type: string) => {
    if (allowedTypes.includes(type)) {
      setAllowedTypes(allowedTypes.filter((t: string) => t !== type));
    } else {
      setAllowedTypes([...allowedTypes, type]);
    }
  };

  const handleTeacherFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setTeacherFile(file);
      setTeacherFileName(file.name);
    }
  };

  const removeTeacherFile = () => {
    setTeacherFile(null);
    setTeacherFileName('');
  };

  const uniqueId = `teacher-file-local-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="question-fu">Question *</Label>
        <Textarea
          id="question-fu"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Enter your question or instructions"
        />
      </div>

      <div>
        <Label className="mb-2">Teacher's File (Optional)</Label>
        <div className="space-y-2">
          {content.teacher_file_url ? (
            // Display existing uploaded file
            <div className="flex items-center justify-between p-3 border rounded-lg bg-blue-50 border-blue-200">
              <div className="flex items-center space-x-2 flex-1">
                <FileText className="w-4 h-4 text-blue-600" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-blue-900">{content.teacher_file_name || 'Reference File'}</span>
                  <a 
                    href={content.teacher_file_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-xs text-blue-600 hover:underline"
                  >
                    View/Download File
                  </a>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onContentChange({
                    ...content,
                    teacher_file_url: null,
                    teacher_file_name: null,
                    teacher_file: null
                  });
                }}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ) : teacherFile ? (
            <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">{teacherFileName}</span>
                <span className="text-xs text-gray-500">
                  ({(teacherFile.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={removeTeacherFile}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                id={uniqueId}
                onChange={handleTeacherFileUpload}
                className="hidden"
                accept={fileTypes.map(type => `.${type.value}`).join(',')}
              />
              <label htmlFor={uniqueId} className="cursor-pointer">
                <div className="flex flex-col items-center space-y-2">
                  <FileText className="w-8 h-8 text-gray-400" />
                  <div>
                    <span className="text-sm font-medium text-blue-600 hover:text-blue-800">
                      Click to upload teacher's file
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      Supported: {fileTypes.map(type => type.label).join(', ')}
                    </p>
                  </div>
                </div>
              </label>
            </div>
          )}
        </div>
      </div>

      <div>
        <Label className="mb-2">Allowed File Types for Students</Label>
        <div className="grid grid-cols-2 gap-2">
          {fileTypes.map(type => (
            <div key={type.value} className="flex items-center space-x-2">
              <Checkbox
                checked={allowedTypes.includes(type.value)}
                onCheckedChange={() => toggleFileType(type.value)}
              />
              <Label className="text-sm">{type.label}</Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="max-size">Maximum File Size (MB)</Label>
        <Input
          id="max-size"
          type="number"
          value={maxSize}
          onChange={(e) => setMaxSize(parseInt(e.target.value))}
          min="1"
          max="100"
        />
      </div>
    </div>
  );
}

