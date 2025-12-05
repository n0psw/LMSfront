import { useState, useEffect } from 'react';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';

interface TextTaskEditorProps {
  content: any;
  onContentChange: (content: any) => void;
}

export default function TextTaskEditor({ content, onContentChange }: TextTaskEditorProps) {
  const [question, setQuestion] = useState(content.question || '');
  const [maxLength, setMaxLength] = useState(content.max_length || 1000);
  const [keywords, setKeywords] = useState(content.keywords?.join(', ') || '');

  useEffect(() => {
    onContentChange({
      question,
      max_length: maxLength,
      keywords: keywords ? keywords.split(',').map(k => k.trim()).filter(k => k) : []
    });
  }, [question, maxLength, keywords]);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="text-question">Question/Prompt *</Label>
        <Textarea
          id="text-question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Enter the question or prompt for the text response..."
          rows={4}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="max-length">Maximum Length (characters)</Label>
          <Input
            id="max-length"
            type="number"
            value={maxLength}
            onChange={(e) => setMaxLength(parseInt(e.target.value) || 1000)}
            min="100"
            max="10000"
          />
        </div>

        <div>
          <Label htmlFor="keywords">Keywords for Auto-Grading (Optional)</Label>
          <Input
            id="keywords"
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="keyword1, keyword2, keyword3"
          />
          <p className="text-xs text-gray-500 mt-1">Comma-separated keywords to check in the answer</p>
        </div>
      </div>
    </div>
  );
}
