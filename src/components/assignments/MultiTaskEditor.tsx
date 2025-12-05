
import { useState, useEffect } from 'react';
import { Trash2, GripVertical, BookOpen, FileText, MessageSquare, Link as LinkIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import CourseUnitTaskEditor from './CourseUnitTaskEditor';
import TextTaskEditor from './TextTaskEditor';
import LinkTaskEditor from './LinkTaskEditor';
import FileUploadEditor from './FileUploadEditor';

interface Task {
  id: string;
  task_type: 'course_unit' | 'file_task' | 'text_task' | 'link_task';
  title: string;
  description?: string;
  order_index: number;
  points: number;
  content: any;
}

interface MultiTaskEditorProps {
  content: any;
  onContentChange: (content: any) => void;
}

const TASK_TYPES = [
  { value: 'course_unit', label: 'Course Units', icon: BookOpen, description: 'Complete specific course lessons' },
  { value: 'file_task', label: 'File Upload', icon: FileText, description: 'Upload a file (PDF, image, etc.)' },
  { value: 'text_task', label: 'Text Response', icon: MessageSquare, description: 'Written answer' },
  { value: 'link_task', label: 'External Link', icon: LinkIcon, description: 'Visit external resource' }
];

export default function MultiTaskEditor({ content, onContentChange }: MultiTaskEditorProps) {
  const [tasks, setTasks] = useState<Task[]>(content.tasks || []);
  const [instructions, setInstructions] = useState(content.instructions || '');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (content.tasks && content.tasks.length > 0 && tasks.length === 0) {
      setTasks(content.tasks);
    }
    if (content.instructions && !instructions) {
      setInstructions(content.instructions);
    }
  }, [content.tasks, content.instructions]);

  useEffect(() => {
    // Calculate total points
    const totalPoints = tasks.reduce((sum, task) => sum + (task.points || 0), 0);
    
    onContentChange({
      tasks,
      total_points: totalPoints,
      instructions
    });
  }, [tasks, instructions]);

  const addTask = (taskType: string) => {
    const newTask: Task = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      task_type: taskType as any,
      title: '',
      description: '',
      order_index: tasks.length,
      points: 10,
      content: {}
    };
    
    setTasks([...tasks, newTask]);
  };

  const removeTask = (index: number) => {
    const newTasks = tasks.filter((_, i) => i !== index);
    // Update order indices
    newTasks.forEach((task, i) => {
      task.order_index = i;
    });
    setTasks(newTasks);
  };

  const updateTask = (index: number, updates: Partial<Task>) => {
    const newTasks = [...tasks];
    newTasks[index] = { ...newTasks[index], ...updates };
    setTasks(newTasks);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newTasks = [...tasks];
    const draggedTask = newTasks[draggedIndex];
    newTasks.splice(draggedIndex, 1);
    newTasks.splice(index, 0, draggedTask);
    
    // Update order indices
    newTasks.forEach((task, i) => {
      task.order_index = i;
    });
    
    setTasks(newTasks);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const renderTaskEditor = (task: Task, index: number) => {
    switch (task.task_type) {
      case 'course_unit':
        return (
          <CourseUnitTaskEditor
            content={task.content}
            onContentChange={(content) => updateTask(index, { content })}
          />
        );
      case 'file_task':
        return (
          <FileUploadEditor
            content={task.content}
            onContentChange={(content) => updateTask(index, { content })}
          />
        );
      case 'text_task':
        return (
          <TextTaskEditor
            content={task.content}
            onContentChange={(content) => updateTask(index, { content })}
          />
        );
      case 'link_task':
        return (
          <LinkTaskEditor
            content={task.content}
            onContentChange={(content) => updateTask(index, { content })}
          />
        );
      default:
        return <div>Unknown task type</div>;
    }
  };

  const getTaskTypeInfo = (taskType: string) => {
    return TASK_TYPES.find(t => t.value === taskType);
  };

  return (
    <div className="space-y-6">
      {/* Overall Instructions */}
      <div>
        <Label htmlFor="instructions">Overall Instructions (Optional)</Label>
        <Textarea
          id="instructions"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Provide general instructions for this homework assignment..."
          rows={3}
        />
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Tasks ({tasks.length})</h3>
          <div className="text-sm text-gray-600">
            Total Points: <span className="font-semibold">{tasks.reduce((sum, t) => sum + t.points, 0)}</span>
          </div>
        </div>

        {tasks.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="pt-6 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No tasks yet. Add your first task below.</p>
            </CardContent>
          </Card>
        )}

        {tasks.map((task, index) => {
          const taskTypeInfo = getTaskTypeInfo(task.task_type);
          const Icon = taskTypeInfo?.icon || FileText;

          return (
            <Card
              key={task.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`${draggedIndex === index ? 'opacity-50' : ''} cursor-move`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2 flex-1">
                    <GripVertical className="w-5 h-5 text-gray-400" />
                    <Icon className="w-5 h-5 text-blue-600" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-600">Task {index + 1}</span>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                          {taskTypeInfo?.label}
                        </span>
                      </div>
                      <input
                        type="text"
                        value={task.title}
                        onChange={(e) => updateTask(index, { title: e.target.value })}
                        placeholder="Task title..."
                        className="mt-1 w-full text-base font-semibold border-none focus:outline-none focus:ring-0 p-0"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={task.points}
                        onChange={(e) => updateTask(index, { points: parseInt(e.target.value) || 0 })}
                        className="w-16 px-2 py-1 text-sm border rounded"
                        min="0"
                      />
                      <span className="text-sm text-gray-600">pts</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTask(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {renderTaskEditor(task, index)}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Task Buttons */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <Label className="mb-3 block">Add New Task</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {TASK_TYPES.map(taskType => {
              const Icon = taskType.icon;
              return (
                <Button
                  key={taskType.value}
                  type="button"
                  variant="outline"
                  onClick={() => addTask(taskType.value)}
                  className="flex flex-col items-center justify-center h-auto py-4 space-y-2 text-center whitespace-normal"
                >
                  <Icon className="w-6 h-6 flex-shrink-0" />
                  <span className="text-sm font-medium break-words w-full">{taskType.label}</span>
                  <span className="text-xs text-gray-500 break-words w-full">{taskType.description}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
