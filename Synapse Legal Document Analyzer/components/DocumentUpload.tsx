import React, { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Alert, AlertDescription } from "./ui/alert";
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { projectId } from "../utils/supabase/info";

interface DocumentUploadProps {
  accessToken: string;
  onUploadComplete: () => void;
  onCancel: () => void;
}

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "complete" | "error";
  error?: string;
}

export default function DocumentUpload({
  accessToken,
  onUploadComplete,
  onCancel,
}: DocumentUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFileInput = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (fileList: FileList) => {
    const newFiles: UploadFile[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];

      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
      ];

      if (!allowedTypes.includes(file.type)) {
        continue; // Skip invalid files
      }

      // Validate file size (50MB max)
      if (file.size > 50 * 1024 * 1024) {
        continue; // Skip files that are too large
      }

      newFiles.push({
        id: crypto.randomUUID(),
        file,
        progress: 0,
        status: "pending",
      });
    }

    setFiles((prevFiles) => [...prevFiles, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setFiles((prevFiles) =>
      prevFiles.filter((file) => file.id !== id),
    );
  };

  const uploadFile = async (uploadFile: UploadFile) => {
    const formData = new FormData();
    formData.append("file", uploadFile.file);
    formData.append("fileName", uploadFile.file.name);

    try {
      setFiles((prevFiles) =>
        prevFiles.map((file) =>
          file.id === uploadFile.id
            ? { ...file, status: "uploading", progress: 10 }
            : file,
        ),
      );

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setFiles((prevFiles) =>
          prevFiles.map((file) =>
            file.id === uploadFile.id && file.progress < 90
              ? { ...file, progress: file.progress + 10 }
              : file,
          ),
        );
      }, 200);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0cfdab42/documents/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        },
      );

      clearInterval(progressInterval);

      if (response.ok) {
        setFiles((prevFiles) =>
          prevFiles.map((file) =>
            file.id === uploadFile.id
              ? { ...file, status: "complete", progress: 100 }
              : file,
          ),
        );
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }
    } catch (error: any) {
      setFiles((prevFiles) =>
        prevFiles.map((file) =>
          file.id === uploadFile.id
            ? { ...file, status: "error", error: error.message }
            : file,
        ),
      );
    }
  };

  const uploadAllFiles = async () => {
    setIsUploading(true);
    const pendingFiles = files.filter(
      (file) => file.status === "pending",
    );

    // Upload files sequentially to avoid overwhelming the server
    for (const file of pendingFiles) {
      await uploadFile(file);
    }

    setIsUploading(false);

    // Check if all uploads are complete
    const allComplete = files.every(
      (file) =>
        file.status === "complete" || file.status === "error",
    );
    if (allComplete) {
      setTimeout(() => {
        onUploadComplete();
      }, 1000);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      parseFloat((bytes / Math.pow(k, i)).toFixed(2)) +
      " " +
      sizes[i]
    );
  };

  const getFileIcon = (file: File) => {
    if (file.type === "application/pdf") {
      return <FileText className="w-8 h-8 text-red-500" />;
    }
    return <FileText className="w-8 h-8 text-blue-500" />;
  };

  const pendingFiles = files.filter(
    (file) => file.status === "pending",
  );
  const completedFiles = files.filter(
    (file) => file.status === "complete",
  );
  const errorFiles = files.filter(
    (file) => file.status === "error",
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Upload Legal Documents
          </h1>
          <p className="text-gray-600">
            Upload PDF or Word documents for AI-powered legal
            analysis
          </p>
        </div>

        {/* Upload Area */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? "border-blue-400 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="file-upload"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileInput}
                multiple
                accept=".pdf,.doc,.docx"
                disabled={isUploading}
              />

              <div className="space-y-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>

                <div>
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Drop files here or click to browse
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports PDF, DOC, and DOCX files up to 50MB
                    each
                  </p>
                </div>

                <Button
                  variant="outline"
                  disabled={isUploading}
                >
                  Select Files
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* File List */}
        {files.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                Selected Files ({files.length})
              </CardTitle>
              <CardDescription>
                Review your files before uploading for analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {files.map((uploadFile) => (
                  <div
                    key={uploadFile.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      {getFileIcon(uploadFile.file)}

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {uploadFile.file.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(uploadFile.file.size)}
                        </p>

                        {uploadFile.status === "uploading" && (
                          <div className="mt-2">
                            <Progress
                              value={uploadFile.progress}
                              className="h-2"
                            />
                          </div>
                        )}

                        {uploadFile.status === "error" &&
                          uploadFile.error && (
                            <p className="text-sm text-red-600 mt-1">
                              {uploadFile.error}
                            </p>
                          )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {uploadFile.status === "complete" && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                      {uploadFile.status === "error" && (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                      {uploadFile.status === "uploading" && (
                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      )}

                      {uploadFile.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            removeFile(uploadFile.id)
                          }
                          disabled={isUploading}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Upload Actions */}
              {pendingFiles.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      {pendingFiles.length} file(s) ready to
                      upload
                    </div>
                    <Button
                      onClick={uploadAllFiles}
                      disabled={isUploading}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      {isUploading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Files
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Results Summary */}
              {(completedFiles.length > 0 ||
                errorFiles.length > 0) && (
                <div className="mt-6 pt-6 border-t space-y-4">
                  {completedFiles.length > 0 && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        {completedFiles.length} file(s) uploaded
                        successfully. Analysis will begin
                        automatically.
                      </AlertDescription>
                    </Alert>
                  )}

                  {errorFiles.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {errorFiles.length} file(s) failed to
                        upload. Please try again.
                      </AlertDescription>
                    </Alert>
                  )}

                  {files.every(
                    (file) =>
                      file.status === "complete" ||
                      file.status === "error",
                  ) && (
                    <div className="text-center">
                      <Button onClick={onUploadComplete}>
                        Return to Dashboard
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Upload Guidelines */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Upload Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Supported Formats
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• PDF documents (.pdf)</li>
                  <li>• Microsoft Word (.doc, .docx)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  File Requirements
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Maximum file size: 50MB</li>
                  <li>• Text-based documents only</li>
                  <li>• No password-protected files</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Analysis Features
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Automatic clause extraction</li>
                  <li>• Risk assessment scoring</li>
                  <li>• Missing clause detection</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Processing Time
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Small documents: 1-2 minutes</li>
                  <li>• Medium documents: 3-5 minutes</li>
                  <li>• Large documents: 5-10 minutes</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}