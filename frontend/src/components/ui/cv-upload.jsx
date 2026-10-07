import React, { useState } from 'react';
import { FileText, Loader2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';
import { API_URL } from '@/config';

const CVUpload = ({ value, onChange, token }) => {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.oasis.opendocument.text',
      'application/rtf',
      'text/plain'
    ];
    
    const allowedExtensions = ['pdf', 'doc', 'docx', 'odt', 'rtf', 'txt'];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      toast.error('Please upload a valid document (PDF, DOC, DOCX, ODT, RTF, TXT)');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${API_URL}/upload/cv`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      onChange({
        url: response.data.url,
        public_id: response.data.public_id
      });
      toast.success('CV uploaded successfully!');
    } catch (error) {
      console.error('Error uploading CV:', error);
      toast.error('Failed to upload CV');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange({ url: '', public_id: '' });
  };

  return (
    <div className="space-y-2">
      <Label>CV (PDF)</Label>
      <div className="flex items-center gap-2">
        <Input
          type="text"
          value={value?.url || ''}
          placeholder="CV URL or upload a file"
          onChange={(e) => onChange({ url: e.target.value, public_id: '' })}
        />
        <div className="flex-shrink-0">
          <Label htmlFor="cv-upload" className="cursor-pointer">
            <div className="flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-accent">
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
            </div>
            <input
              id="cv-upload"
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </Label>
        </div>
        {value?.url && (
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0"
            onClick={handleRemove}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      {value?.url && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="w-4 h-4" />
          <a
            href={value.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Preview CV
          </a>
        </div>
      )}
    </div>
  );
};

export default CVUpload;