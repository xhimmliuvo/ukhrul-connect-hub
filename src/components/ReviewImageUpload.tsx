import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReviewImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  className?: string;
}

export function ReviewImageUpload({ 
  images, 
  onChange, 
  maxImages = 3, 
  className 
}: ReviewImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return null;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return null;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `reviews/${fileName}`;

    const { error } = await supabase.storage
      .from('images')
      .upload(filePath, file);

    if (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setIsUploading(true);

    const uploadedUrls: string[] = [];
    for (const file of filesToUpload) {
      const url = await uploadFile(file);
      if (url) uploadedUrls.push(url);
    }

    setIsUploading(false);
    if (uploadedUrls.length > 0) {
      onChange([...images, ...uploadedUrls]);
    }

    // Reset input
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Image previews */}
      {images.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {images.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`Review image ${index + 1}`}
                className="h-20 w-20 object-cover rounded-lg border border-border"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {images.length < maxImages && (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading}
            onClick={() => document.getElementById('review-image-input')?.click()}
            className="gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <ImagePlus className="h-4 w-4" />
                Add Photos
              </>
            )}
          </Button>
          <span className="text-xs text-muted-foreground">
            {images.length}/{maxImages} photos
          </span>
          <input
            id="review-image-input"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}
