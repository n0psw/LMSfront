import { useState, useEffect } from 'react';
import { BookOpen, CheckCircle } from 'lucide-react';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import apiClient from '../../services/api';

interface CourseUnitTaskEditorProps {
  content: any;
  onContentChange: (content: any) => void;
}

export default function CourseUnitTaskEditor({ content, onContentChange }: CourseUnitTaskEditorProps) {
  const [courses, setCourses] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState(content.course_id || '');
  const [selectedLessonIds, setSelectedLessonIds] = useState<number[]>(content.lesson_ids || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      loadLessons(selectedCourseId);
    }
  }, [selectedCourseId]);

  useEffect(() => {
    onContentChange({
      course_id: selectedCourseId ? parseInt(selectedCourseId) : null,
      lesson_ids: selectedLessonIds
    });
  }, [selectedCourseId, selectedLessonIds]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const coursesData = await apiClient.getCourses({ is_active: true });
      setCourses(coursesData);
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLessons = async (courseId: string) => {
    try {
      setLoading(true);
      const lessonsData = await apiClient.getCourseLessons(courseId);
      setLessons(lessonsData);
    } catch (error) {
      console.error('Failed to load lessons:', error);
      setLessons([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleLesson = (lessonId: number) => {
    if (selectedLessonIds.includes(lessonId)) {
      setSelectedLessonIds(selectedLessonIds.filter(id => id !== lessonId));
    } else {
      setSelectedLessonIds([...selectedLessonIds, lessonId]);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="course-select">Select Course *</Label>
        <Select
          value={selectedCourseId}
          onValueChange={(value) => {
            setSelectedCourseId(value);
            setSelectedLessonIds([]); // Reset lesson selection when course changes
          }}
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue placeholder={loading ? "Loading courses..." : "Select a course"} />
          </SelectTrigger>
          <SelectContent>
            {courses.map(course => (
              <SelectItem key={course.id} value={course.id.toString()}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedCourseId && (
        <div>
          <Label className="mb-2">Select Lessons/Units to Complete *</Label>
          {loading ? (
            <div className="text-sm text-gray-500">Loading lessons...</div>
          ) : lessons.length === 0 ? (
            <div className="text-sm text-gray-500">No lessons found in this course</div>
          ) : (
            <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
              {lessons.map(lesson => (
                <div
                  key={lesson.id}
                  onClick={() => toggleLesson(lesson.id)}
                  className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedLessonIds.includes(lesson.id) ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                        selectedLessonIds.includes(lesson.id)
                          ? 'bg-blue-600 border-blue-600'
                          : 'border-gray-300'
                      }`}>
                        {selectedLessonIds.includes(lesson.id) && (
                          <CheckCircle className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <BookOpen className="w-4 h-4 text-gray-600" />
                      <div>
                        <div className="font-medium text-sm">{lesson.title}</div>
                        {lesson.description && (
                          <div className="text-xs text-gray-500 line-clamp-1">{lesson.description}</div>
                        )}
                      </div>
                    </div>
                    {lesson.duration_minutes > 0 && (
                      <span className="text-xs text-gray-500">{lesson.duration_minutes} min</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {selectedLessonIds.length > 0 && (
            <div className="mt-2 text-sm text-gray-600">
              Selected: {selectedLessonIds.length} lesson{selectedLessonIds.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
