import { useState, useEffect } from 'react';
import { FileText, Trash2 } from 'lucide-react';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

interface FileUploadEditorProps {
  content: any;
  onContentChange: (content: any) => void;
}

export default function FileUploadEditor({ content, onContentChange }: FileUploadEditorProps) {
  const [question, setQuestion] = useState(content.question || '');
  const [allowedTypes, setAllowedTypes] = useState(content.allowed_file_types || ['pdf', 'docx']);
  const [maxSize, setMaxSize] = useState(content.max_file_size_mb || 10);
  const [teacherFile, setTeacherFile] = useState<File | null>(content.teacher_file || null);
  const [teacherFileName, setTeacherFileName] = useState(content.teacher_file_name || '');

  useEffect(() => {
    if (content.question && !question) setQuestion(content.question);
    if (content.allowed_file_types && content.allowed_file_types.length > 0 && allowedTypes.length === 2 && allowedTypes.includes('pdf')) {
       // Only update if current is default
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

  const uniqueId = `teacher-file-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="file-question">Question/Instructions *</Label>
        <Textarea
          id="file-question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Enter instructions for the file upload..."
          rows={3}
        />
      </div>

      <div>
        <Label className="mb-2">Teacher's Reference File (Optional)</Label>
        <div className="space-y-2">
          {content.teacher_file_url ? (
            // Display existing uploaded file
            <div className="flex items-center justify-between p-3 border rounded-lg bg-blue-50 border-blue-200">
              <div className="flex items-center space-x-2 flex-1">
                <FileText className="w-4 h-4 text-blue-600" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-blue-900">{content.teacher_file_name || 'Reference File'}</span>
                  <a 
                    href={(import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000') + content.teacher_file_url} 
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
            // Display newly selected file (not yet uploaded)
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
            // No file selected - show upload area
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
                      Click to upload reference file
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
        <Label htmlFor="file-max-size">Maximum File Size (MB)</Label>
        <Input
          id="file-max-size"
          type="number"
          value={maxSize}
          onChange={(e) => setMaxSize(parseInt(e.target.value) || 10)}
          min="1"
          max="100"
        />
      </div>
    </div>
  );
}
