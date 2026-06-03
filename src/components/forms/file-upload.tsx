"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/file-validations";
import { useFileUpload, type UseFileUploadOptions, type UploadFile } from "@/hooks/useFileUpload";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Loader2,
  Trash2,
  Eye,
  Plus,
  FileWarning,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────

export interface FileUploadProps extends UseFileUploadOptions {
  /** Controlled value (URL strings for already-uploaded files) */
  value?: string[];
  /** Controlled onChange handler */
  onChange?: (urls: string[]) => void;
  className?: string;
  label?: string;
  description?: string;
  disabled?: boolean;
  showUploadButton?: boolean;
  uploadButtonText?: string;
  showPreviews?: boolean;
  /** Maximum number of files (shown in UI) */
  maxFilesDisplay?: number;
  /** Called when a file preview is clicked */
  onPreviewClick?: (file: UploadFile) => void;
}

// ── File Preview Card ──────────────────────────────────────────────────

function FilePreviewCard({
  file,
  onRemove,
  onDelete,
  onView,
}: {
  file: UploadFile;
  onRemove: () => void;
  onDelete?: () => void;
  onView?: () => void;
}) {
  const isImage = file.file.type.startsWith("image/");
  const isPending = file.status === "pending" || file.status === "uploading";
  const isSuccess = file.status === "success";
  const isError = file.status === "error";

  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const url = file.previewUrl;
    if (url && url.startsWith("blob:")) {
      previewUrlRef.current = url;
    }
    return () => {
      if (previewUrlRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, [file.previewUrl]);

  const previewSrc = isSuccess && file.serverFile?.url
    ? file.serverFile.url
    : file.previewUrl;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group relative flex items-start gap-3 rounded-xl border p-4 bg-card transition-all duration-200",
        isError && "border-destructive/40 bg-destructive/[0.03]",
        isSuccess && "border-success/30 bg-success/[0.03]",
        isPending && "border-primary/30 bg-primary/[0.03]",
        "hover:shadow-sm"
      )}
    >
      {/* Thumbnail */}
      <div
        className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted border border-border/50"
      >
        {isImage && previewSrc ? (
          <img
            src={previewSrc}
            alt={file.file.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : file.file.type.includes("pdf") ? (
          <div className="flex h-full w-full items-center justify-center">
            <FileText className="h-7 w-7 text-red-400" />
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <FileText className="h-7 w-7 text-muted-foreground/50" />
          </div>
        )}

        {/* Upload status overlay */}
        {file.status === "uploading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          </div>
        )}
        {isSuccess && (
          <div className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 dark:bg-black/60 shadow-sm">
            <CheckCircle className="h-3.5 w-3.5 text-success" />
          </div>
        )}
        {isError && (
          <div className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 dark:bg-black/60 shadow-sm">
            <AlertCircle className="h-3.5 w-3.5 text-destructive" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="truncate text-sm font-medium text-foreground" title={file.file.name}>
          {file.file.name}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatFileSize(file.file.size)}
        </p>

        {/* Progress bar */}
        {isPending && file.progress > 0 && (
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${file.progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
        )}

        {/* Error message */}
        {isError && file.error && (
          <p className="mt-1 text-xs text-destructive flex items-center gap-1">
            <FileWarning className="h-3 w-3 flex-shrink-0" />
            {file.error}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-shrink-0 items-center gap-0.5">
        {isSuccess && onView && (
          <button
            type="button"
            onClick={onView}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label={`Preview ${file.file.name}`}
          >
            <Eye className="h-4 w-4" />
          </button>
        )}
        {isSuccess && onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            aria-label={`Delete ${file.file.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label={`Remove ${file.file.name}`}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ── File Preview Grid ──────────────────────────────────────────────────

function FilePreviewGrid({
  files,
  onRemove,
  onDelete,
  onView,
}: {
  files: UploadFile[];
  onRemove: (id: string) => void;
  onDelete?: (id: string, serverFileId: string) => void;
  onView?: (file: UploadFile) => void;
}) {
  return (
    <AnimatePresence mode="popLayout">
      <div className="grid gap-3 sm:grid-cols-2">
        {files.map((file) => (
          <FilePreviewCard
            key={file.id}
            file={file}
            onRemove={() => onRemove(file.id)}
            onDelete={
              onDelete && file.serverFile?.id
                ? () => onDelete(file.id, file.serverFile!.id)
                : undefined
            }
            onView={onView ? () => onView(file) : undefined}
          />
        ))}
      </div>
    </AnimatePresence>
  );
}

// ── Drop Zone ──────────────────────────────────────────────────────────

function DropZone({
  isDragging,
  isDisabled,
  maxFilesDisplay,
  currentCount,
  onClick,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  label,
  description,
  context,
}: {
  isDragging: boolean;
  isDisabled: boolean;
  maxFilesDisplay: number;
  currentCount: number;
  onClick: () => void;
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  label: string;
  description: string;
  context?: string;
}) {
  return (
    <div
      onClick={isDisabled ? undefined : onClick}
      onDragEnter={isDisabled ? undefined : onDragEnter}
      onDragLeave={isDisabled ? undefined : onDragLeave}
      onDragOver={isDisabled ? undefined : onDragOver}
      onDrop={isDisabled ? undefined : onDrop}
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      aria-label={label}
      onKeyDown={(e) => {
        if (!isDisabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "relative cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isDragging
          ? "border-primary bg-primary/[0.06] scale-[1.01] shadow-sm"
          : "border-muted-foreground/25 bg-muted/20 hover:border-primary/40 hover:bg-muted/40",
        isDisabled && "cursor-not-allowed opacity-50"
      )}
    >
      <motion.div
        animate={isDragging ? { scale: 1.05 } : { scale: 1 }}
        className="flex flex-col items-center gap-3"
      >
        <div
          className={cn(
            "rounded-full p-4 transition-colors duration-200",
            isDragging
              ? "bg-primary/15 text-primary"
              : "bg-muted text-muted-foreground"
          )}
        >
          {isDragging ? (
            <Plus className="h-8 w-8" />
          ) : (
            <Upload className="h-8 w-8" />
          )}
        </div>
        <div>
          <p className="text-base font-semibold text-foreground">
            {isDragging ? "Drop files here" : label}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          <p className="mt-2 text-xs text-muted-foreground/60">
            {currentCount}/{maxFilesDisplay} files
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isDisabled}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          tabIndex={-1}
        >
          <ImageIcon className="mr-2 h-3.5 w-3.5" />
          Browse Files
        </Button>
      </motion.div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────

export function FileUpload({
  value: _value,
  onChange: _onChange,
  className,
  label = "Upload Files",
  description = "Drag & drop files here, or click to browse",
  disabled = false,
  showUploadButton = true,
  uploadButtonText = "Upload Files",
  showPreviews = true,
  maxFilesDisplay = 10,
  onPreviewClick,
  ...options
}: FileUploadProps) {
  const {
    files,
    uploadedFiles,
    pendingFiles,
    errorFiles,
    isDragging,
    isUploading,
    fileInputRef,
    removeFile,
    clearFiles,
    openFileDialog,
    handleFileChange,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    uploadFiles,
    deleteServerFile,
  } = useFileUpload({
    ...options,
    onUploadComplete: (uploaded) => {
      options.onUploadComplete?.(uploaded);
      _onChange?.(uploaded.map((f) => f.serverFile?.url ?? f.previewUrl).filter(Boolean));
    },
  });

  const hasFiles = files.length > 0;
  const hasPending = pendingFiles.length > 0;
  const maxFiles = options.maxFiles ?? maxFilesDisplay;

  return (
    <div className={cn("space-y-5", className)}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={
          options.context === "tenant-documents"
            ? ".jpg,.jpeg,.png,.webp,.avif,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
            : ".jpg,.jpeg,.png,.webp,.avif,.gif,.svg"
        }
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isUploading}
        aria-hidden="true"
      />

      {/* Drop Zone */}
      <DropZone
        isDragging={isDragging}
        isDisabled={disabled || isUploading}
        maxFilesDisplay={maxFiles}
        currentCount={files.length}
        onClick={openFileDialog}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        label={label}
        description={description}
        context={options.context}
      />

      {/* Uploading state indicator */}
      <AnimatePresence>
        {isUploading && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/[0.04] px-4 py-3"
          >
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <p className="text-sm font-medium text-primary">
              Uploading files...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File Previews */}
      {showPreviews && hasFiles && (
        <div className="space-y-4">
          {/* Summary bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm">
              <span className="font-medium text-foreground">
                {files.length} file{files.length !== 1 ? "s" : ""} selected
              </span>
              {uploadedFiles.length > 0 && (
                <span className="flex items-center gap-1 text-success text-xs font-medium">
                  <CheckCircle className="h-3.5 w-3.5" />
                  {uploadedFiles.length} uploaded
                </span>
              )}
              {errorFiles.length > 0 && (
                <span className="flex items-center gap-1 text-destructive text-xs font-medium">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errorFiles.length} failed
                </span>
              )}
            </div>
            {hasFiles && !isUploading && (
              <button
                type="button"
                onClick={clearFiles}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline"
              >
                Clear all
              </button>
            )}
          </div>

          <FilePreviewGrid
            files={files}
            onRemove={removeFile}
            onDelete={deleteServerFile}
            onView={onPreviewClick}
          />
        </div>
      )}

      {/* Upload Button */}
      {showUploadButton && hasPending && (
        <div className="flex items-center justify-end gap-3">
          {uploadedFiles.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearFiles}
              disabled={isUploading}
            >
              Clear Completed
            </Button>
          )}
          <Button
            type="button"
            onClick={uploadFiles}
            disabled={isUploading || disabled}
            loading={isUploading}
          >
            {isUploading ? "Uploading..." : uploadButtonText}
          </Button>
        </div>
      )}
    </div>
  );
}

export type { UploadFile };