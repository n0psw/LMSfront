import React, { useState, useEffect } from 'react';
import YouTubeVideoPlayer from '../YouTubeVideoPlayer';
import RichTextEditor from '../RichTextEditor';
import FileUploadArea from '../FileUploadArea';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import apiClient from '../../services/api';
import type { StepAttachment } from '../../types';

export interface VideoLessonEditorProps {
  lessonTitle: string;
  videoUrl: string;
  videoError?: string | null;
  onVideoUrlChange: (url: string) => void;
  onClearUrl: () => void;
  onVideoError?: (error: string) => void;
  content: string;
  onContentChange: (content: string) => void;
  stepId?: number;
  attachments?: string; // JSON string of attachments
  onAttachmentsChange?: (attachments: string) => void;
  onTempFilesChange?: (files: File[]) => void; // For new steps without ID
}

export default function VideoLessonEditor({
  lessonTitle,
  videoUrl,
  videoError,
  onVideoUrlChange,
  onClearUrl,
  onVideoError,
  content,
  onContentChange,
  stepId,
  attachments,
  onAttachmentsChange,
  onTempFilesChange
}: VideoLessonEditorProps) {
  const [currentAttachments, setCurrentAttachments] = useState<StepAttachment[]>([]);
  const [tempFiles, setTempFiles] = useState<File[]>([]);

  // Parse attachments when they change
  useEffect(() => {
    if (attachments) {
      try {
        const parsed = JSON.parse(attachments);
        setCurrentAttachments(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        setCurrentAttachments([]);
      }
    } else {
      setCurrentAttachments([]);
    }
  }, [attachments]);

  const handleFileUpload = async (file: File) => {
    if (stepId) {
      // For existing steps, upload to server immediately
      const result = await apiClient.uploadStepAttachment(stepId.toString(), file);
      
      // Add the new attachment to the list
      const newAttachment: StepAttachment = {
        id: result.attachment_id,
        filename: result.filename,
        file_url: result.file_url,
        file_type: result.file_type,
        file_size: result.file_size,
        uploaded_at: new Date().toISOString()
      };

      const updatedAttachments = [...currentAttachments, newAttachment];
      setCurrentAttachments(updatedAttachments);
      
      // Notify parent component
      if (onAttachmentsChange) {
        onAttachmentsChange(JSON.stringify(updatedAttachments));
      }
    } else {
      // For new steps, store files temporarily
      const updatedTempFiles = [...tempFiles, file];
      setTempFiles(updatedTempFiles);
      
      // Notify parent component about temp files
      if (onTempFilesChange) {
        onTempFilesChange(updatedTempFiles);
      }
    }
  };

  const handleFileDelete = async (attachmentId: number | string) => {
    if (stepId && typeof attachmentId === 'number') {
      // Delete from server for existing steps
      await apiClient.deleteStepAttachment(stepId.toString(), attachmentId);
      
      // Remove the attachment from the list
      const updatedAttachments = currentAttachments.filter(att => att.id !== attachmentId);
      setCurrentAttachments(updatedAttachments);
      
      // Notify parent component
      if (onAttachmentsChange) {
        onAttachmentsChange(JSON.stringify(updatedAttachments));
      }
    } else if (!stepId && typeof attachmentId === 'string') {
      // Remove from temporary files for new steps (using filename as ID)
      const updatedTempFiles = tempFiles.filter(file => file.name !== attachmentId);
      setTempFiles(updatedTempFiles);
      
      // Notify parent component about temp files
      if (onTempFilesChange) {
        onTempFilesChange(updatedTempFiles);
      }
    }
  };

  return (
    <div className="space-y-6">
      {videoUrl && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Video Preview
          </label>
          <YouTubeVideoPlayer
            url={videoUrl}
            title={lessonTitle || 'Lesson Video'}
            className="w-full"
            onError={onVideoError}
          />
          {/* Browser compatibility warning */}
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-blue-700">
                <p className="font-medium">Совместимость браузеров</p>
                <p className="mt-1">
                  Некоторые браузеры (например, Zen) могут блокировать встраивание YouTube видео. 
                  В этом случае появится кнопка для открытия видео в новом окне.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Video URL (YouTube)
        </label>
        <div className="flex items-center space-x-2 mb-4">
          <Checkbox 
            id="explanation-mode" 
            checked={content.includes("Watch the explanations for the previous questions")}
            onCheckedChange={(checked) => {
              if (checked === true) {
                if (!content.includes("Watch the explanations for the previous questions")) {
                  onContentChange(`<p><strong>Watch the explanations for the previous questions</strong></p>${content}`);
                }
              } else {
                onContentChange(content.replace(/<p><strong>Watch the explanations for the previous questions<\/strong><\/p>/g, ''));
              }
            }}
          />
          <label 
            htmlFor="explanation-mode" 
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            Add "Watch explanations" text
          </label>
        </div>
        <div className="flex gap-2 p-1">
          <Input
            type="url"
            value={videoUrl}
            onChange={(e) => onVideoUrlChange(e.target.value)}
            className="flex-1"
            placeholder="https://www.youtube.com/watch?v=..."
          />
          <button
            onClick={onClearUrl}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
          >
            Clear
          </button>
        </div>
        {videoError && (
          <p className="text-sm text-red-600 mt-1">{videoError}</p>
        )}
        <p className="text-sm text-gray-500 mt-1">
          Paste a YouTube video URL to embed it in the lesson
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Video Lesson Content
        </label>
        <RichTextEditor
          value={content}
          onChange={onContentChange}
          placeholder="Add description, notes, or additional content for this video lesson..."
        />
        <p className="text-sm text-gray-500 mt-1">
          Add text content to accompany the video (optional)
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          File Attachments
        </label>
        <FileUploadArea
          attachments={stepId ? currentAttachments : tempFiles.map((file, index) => ({
            id: index, // Use index as temporary ID
            filename: file.name,
            file_url: '', // No URL for temp files
            file_type: file.name.split('.').pop() || '',
            file_size: file.size,
            uploaded_at: new Date().toISOString()
          }))}
          onFileUpload={handleFileUpload}
          onFileDelete={handleFileDelete}
          maxFileSize={10}
          allowedTypes={['pdf', 'docx', 'doc', 'jpg', 'png', 'gif', 'webp', 'txt', 'zip', 'xlsx', 'pptx']}
          disabled={false}
          tempMode={!stepId} // Pass temp mode flag
        />
      </div>
    </div>
  );
}


