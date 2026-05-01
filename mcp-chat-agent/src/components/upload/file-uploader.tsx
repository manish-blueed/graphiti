'use client';

import { useState, useCallback } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { Upload, File as FileIcon, X, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX_FILE_SIZES = {
  'application/pdf': 50 * 1024 * 1024, // 50MB
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 25 * 1024 * 1024, // 25MB
  'text/plain': 10 * 1024 * 1024, // 10MB
  'text/markdown': 10 * 1024 * 1024 // 10MB
};

interface FileItem {
  id: string;
  file: File;
}

export function FileUploader({ groupId }: { groupId: string }) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    if (rejectedFiles.length > 0) {
      setErrorMessage('Some files were rejected. Please check size limits.');
      setTimeout(() => setErrorMessage(null), 3000);
    }

    // Add size validation
    const validFiles = acceptedFiles.filter(file => {
      const maxSize = MAX_FILE_SIZES[file.type as keyof typeof MAX_FILE_SIZES] || 5 * 1024 * 1024;
      return file.size <= maxSize;
    });

    if (validFiles.length < acceptedFiles.length) {
      setErrorMessage('Some files exceeded size limits.');
    }

    const newItems = validFiles.map(file => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file,
    }));

    setFiles(prev => [...prev, ...newItems]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md']
    }
  });

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setStatus('uploading');
    setErrorMessage(null);
    setProgress(0);

    let firstError: string | null = null;
    const succeededIds = new Set<string>();

    for (let i = 0; i < files.length; i++) {
      const item = files[i];

      try {
        const formData = new FormData();
        formData.append('file', item.file);
        formData.append('groupId', groupId);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to upload ${item.file.name}`);
        }

        succeededIds.add(item.id);
        setProgress(Math.round(((i + 1) / files.length) * 100));
    } catch (error) {
      console.error('Upload error:', error);
      if (!firstError) {
        firstError = error instanceof Error ? error.message : `Failed to upload ${item.file.name}`;
      }
    }
    }

    if (firstError) {
      setStatus('error');
      setErrorMessage(firstError);
      // Remove successfully uploaded files so retry only re-attempts failures
      setFiles(prev => prev.filter(f => !succeededIds.has(f.id)));
    } else {
      setStatus('success');
      setFiles([]);
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <Upload size={20} className="text-blue-500" />
        </div>
        <h3 className="font-semibold text-zinc-100">Upload Knowledge</h3>
      </div>

      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer flex flex-col items-center justify-center text-center",
          isDragActive
            ? "border-blue-500 bg-blue-500/5"
            : "border-zinc-800 hover:border-zinc-700 bg-zinc-800/30"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="w-10 h-10 text-zinc-600 mb-4" />
        <p className="text-sm text-zinc-400">
          {isDragActive ? "Drop the files here" : "Drag & drop files here, or click to select"}
        </p>
        <p className="text-xs text-zinc-600 mt-2">
          PDF (50MB), DOCX (25MB), TXT/MD (10MB)
        </p>
      </div>

      {errorMessage && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
          <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-400">{errorMessage}</p>
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-6 space-y-3">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Selected Files ({files.length})
          </p>
          <div className="max-h-40 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
            {files.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-zinc-800/50 p-3 rounded-lg border border-zinc-700">
                <div className="flex items-center gap-3 min-w-0">
                  <FileIcon size={16} className="text-blue-400 flex-shrink-0" />
                  <span className="text-sm text-zinc-300 truncate">{item.file.name}</span>
                </div>
                <button
                  onClick={() => removeFile(item.id)}
                  className="text-zinc-500 hover:text-red-400 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleUpload}
            disabled={status === 'uploading'}
            className={cn(
              "w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2",
              status === 'uploading'
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                : status === 'success'
                ? "bg-green-600 text-white"
                : status === 'error'
                ? "bg-red-600 text-white"
                : "bg-blue-600 text-white hover:bg-blue-500"
            )}
          >
            {status === 'uploading' ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Processing {progress}%
              </>
            ) : status === 'success' ? (
              <>
                <CheckCircle size={18} />
                Uploaded Successfully!
              </>
            ) : status === 'error' ? (
              <>
                <AlertCircle size={18} />
                Retry Upload
              </>
            ) : (
              "Process Knowledge"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
