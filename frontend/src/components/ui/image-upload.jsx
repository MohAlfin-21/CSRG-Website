import React, { useState } from 'react';
import { Loader2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';
import { API_URL, resolveMediaUrl } from '@/config';

const ImageUpload = ({ 
  value, 
  onChange, 
  token,
  label = "Image",
  preview = true,
  accept = "image/*"
}) => {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size exceeds 10MB limit');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${API_URL}/upload/image`,
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
        filename: response.data.filename
      });
      toast.success('Image uploaded successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(
        error.response?.data?.detail || 
        'Failed to upload image'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange({ url: '', filename: '' });
  };

  const getFullImageUrl = (url) => {
    return resolveMediaUrl(url);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          type="text"
          value={value?.url || ''}
          placeholder="Image URL or upload a file"
          onChange={(e) => onChange({ url: e.target.value, filename: '' })}
          className="flex-1"
        />
        <div className="flex-shrink-0">
          <Label htmlFor={`image-upload-${Math.random()}`} className="cursor-pointer">
            <div className="flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-accent">
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
            </div>
            <input
              id={`image-upload-${Math.random()}`}
              type="file"
              accept={accept}
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </Label>
        </div>
        {value?.url && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="flex-shrink-0"
            onClick={handleRemove}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      {value?.url && preview && (
        <div className="mt-2">
          <img
            src={getFullImageUrl(value.url)}
            alt="Preview"
            className="w-32 h-32 object-cover rounded-lg"
          />
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
