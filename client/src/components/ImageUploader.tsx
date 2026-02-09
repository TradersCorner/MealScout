import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageUploaderProps {
  uploadType: 'restaurant-logo' | 'restaurant-cover' | 'deal-image' | 'user-profile';
  entityId?: string; // restaurantId or dealId
  currentImageUrl?: string;
  onUploadComplete: (url: string) => void;
  aspectRatio?: string;
  maxSizeMB?: number;
}

export default function ImageUploader({
  uploadType,
  entityId,
  currentImageUrl,
  onUploadComplete,
  aspectRatio = 'aspect-square',
  maxSizeMB = 5,
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file (JPG, PNG, WebP)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size
    const sizeMB = selectedFile.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      toast({
        title: 'File too large',
        description: `Maximum file size is ${maxSizeMB}MB`,
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);
      
      if (entityId) {
        if (uploadType === 'restaurant-logo' || uploadType === 'restaurant-cover') {
          formData.append('restaurantId', entityId);
        } else if (uploadType === 'deal-image') {
          formData.append('dealId', entityId);
        }
      }

      const response = await fetch(`/api/upload/${uploadType}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      toast({
        title: 'Upload successful',
        description: 'Your image has been uploaded',
      });

      setPreview(data.url);
      onUploadComplete(data.url);
      setFile(null);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        {preview ? (
          <div className="relative">
            <div className={`${aspectRatio} w-full overflow-hidden rounded-lg`}>
              <img
                src={preview}
                alt="Preview"
                className="h-full w-full object-cover"
              />
            </div>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div
            className={`${aspectRatio} w-full flex flex-col items-center justify-center border-2 border-dashed border-[var(--border-subtle)] rounded-lg cursor-pointer hover:border-primary transition-colors`}
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="h-12 w-12 text-[color:var(--text-muted)] mb-2" />
            <p className="text-sm text-[color:var(--text-muted)]">Click to upload image</p>
            <p className="text-xs text-[color:var(--text-muted)] mt-1">Max {maxSizeMB}MB</p>
          </div>
        )}
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {file && !preview?.startsWith('http') && (
        <Button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <Upload className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Image
            </>
          )}
        </Button>
      )}
    </div>
  );
}

