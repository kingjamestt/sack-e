'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import imageCompression from 'browser-image-compression';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { Image as ImageIcon, UploadCloud, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  className?: string;
}

export default function ImageUpload({ value, onChange, className = '' }: ImageUploadProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file || !user) return;

      setIsUploading(true);
      setError('');
      setProgress(0);

      try {
        // 1. Compress Image
        const options = {
          maxSizeMB: 0.3, // Max 300KB for much faster web loading
          maxWidthOrHeight: 1200,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);

        // 2. Upload to Firebase Storage
        const storageRef = ref(storage, `events/${user.uid}/${Date.now()}_${compressedFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, compressedFile);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setProgress(Math.round(progress));
          },
          (err) => {
            console.error('Upload failed:', err);
            setError('Failed to upload image. Please try again.');
            setIsUploading(false);
          },
          async () => {
            // Upload completed successfully
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            onChange(downloadURL);
            setIsUploading(false);
          }
        );
      } catch (err) {
        console.error('Compression or upload failed:', err);
        setError('An error occurred during upload.');
        setIsUploading(false);
      }
    },
    [user, onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  if (value) {
    return (
      <div className={`relative rounded-xl overflow-hidden group border border-black/10 bg-surface-container-high ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={value} alt="Event Cover" className="w-full h-64 object-cover" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button
            type="button"
            onClick={removeImage}
            className="bg-error text-on-error p-3 rounded-full hover:scale-105 transition-transform shadow-lg"
            title="Remove Image"
          >
            <X size={24} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-on-surface-variant/30 hover:border-primary/50 hover:bg-surface-container-high'
        } ${isUploading ? 'opacity-75 pointer-events-none' : ''}`}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center justify-center space-y-4">
          {isUploading ? (
            <>
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <div className="space-y-2 w-full max-w-xs">
                <p className="text-sm font-medium text-on-surface">Uploading... {progress}%</p>
                <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary h-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
                <UploadCloud size={32} />
              </div>
              <div>
                <p className="text-base font-medium text-on-surface">
                  {isDragActive ? 'Drop your image here' : 'Drag & drop an event banner'}
                </p>
                <p className="text-sm text-on-surface-variant mt-1">
                  or click to browse files
                </p>
              </div>
              <p className="text-xs text-on-surface-variant/70">
                Supports JPG, PNG, WEBP (Max 10MB before compression)
              </p>
            </>
          )}
        </div>
      </div>
      {error && <p className="text-error text-sm mt-2 font-medium">{error}</p>}
    </div>
  );
}
