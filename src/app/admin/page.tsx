'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { 
  Upload, 
  FileText, 
  Trash2, 
  Plus, 
  X, 
  AlertCircle, 
  CheckCircle,
  Users,
  Building,
  Calendar,
  Settings,
  Loader2
} from 'lucide-react';
import clsx from 'clsx';

interface Document {
  id: string;
  name: string;
  size: number;
  uploadDate: string;
  type: string;
  path: string;
}

const WEBHOOK_URL = 'http://localhost:5678/webhook/1e4c7759-09c6-4c70-af5e-017e631e9167';


export default function HRPortal() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch documents on component mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/upload');
      const data = await response.json();
      
      if (response.ok) {
        setDocuments(data.files || []);
      } else {
        console.error('Failed to fetch documents:', data.error);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploadError(null);
    setUploadSuccess(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      acceptedFiles.forEach(file => {
        formData.append('url', file);
        formData.append('source', 'fileupload');
      });

      // Upload to external webhook API
      const webhookResponse = await fetch(WEBHOOK_URL, {
        method: 'POST',
        body: formData,
      });

      if (!webhookResponse.ok) {
        throw new Error(`Webhook upload failed: ${webhookResponse.status}`);
      }

      // Webhook upload successful, try local storage (optional)
      try {
        const localFormData = new FormData();
        acceptedFiles.forEach(file => {
          localFormData.append('files', file);
        });

        const localResponse = await fetch('/api/upload', {
          method: 'POST',
          body: localFormData,
        });

        if (localResponse.ok) {
          setUploadSuccess(`${acceptedFiles.length} document(s) uploaded successfully to webhook and local storage!`);
          await fetchDocuments();
        } else {
          setUploadSuccess(`${acceptedFiles.length} document(s) uploaded to webhook successfully! (Local storage failed)`);
        }
      } catch (localError) {
        console.warn('Local storage failed:', localError);
        setUploadSuccess(`${acceptedFiles.length} document(s) uploaded to webhook successfully! (Local storage unavailable)`);
      }

      setShowUploadModal(false);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    onDropRejected: (rejectedFiles: FileRejection[]) => {
      setUploadError('Please upload only PDF files.');
    }
  });

  const removeDocument = async (id: string) => {
    try {
      const response = await fetch(`/api/upload?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        // Remove from local state
        setDocuments(prev => prev.filter(doc => doc.id !== id));
      } else {
        console.error('Failed to delete document:', data.error);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Building className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">HR Portal</h1>
                <p className="text-sm text-gray-500">Document Management System</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors">
                <Calendar className="h-5 w-5" />
                <span>Calendar</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors">
                <Users className="h-5 w-5" />
                <span>Employees</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors">
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Documents</p>
                <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Files</p>
                <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Upload className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Uploads Today</p>
                <p className="text-2xl font-bold text-gray-900">
                  {documents.filter(doc => 
                    new Date(doc.uploadDate).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-orange-100 p-3 rounded-lg">
                <Trash2 className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Storage Used</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatFileSize(documents.reduce((acc, doc) => acc + doc.size, 0))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Document Management</h2>
              <p className="text-sm text-gray-500 mt-1">Upload and manage your HR documents</p>
              <p className="text-xs text-blue-600 mt-1">Documents are uploaded to webhook API and local storage</p>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm"
            >
              <Plus className="h-5 w-5" />
              <span>Add Documents</span>
            </button>
          </div>
        </div>

        {/* Documents List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Uploaded Documents</h3>
          </div>
          
          {isLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Loading documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documents uploaded</h3>
              <p className="text-gray-500 mb-6">Get started by uploading your first document</p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <Upload className="h-5 w-5" />
                <span>Upload Documents</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {documents.map((document) => (
                <div key={document.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-red-100 p-2 rounded-lg">
                        <FileText className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{document.name}</h4>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(document.size)} • Uploaded {formatDate(document.uploadDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        PDF
                      </span>
                      <button
                        onClick={() => removeDocument(document.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Remove document"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Upload Documents</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              {uploadError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <p className="text-sm text-red-800">{uploadError}</p>
                  </div>
                </div>
              )}
              
              {uploadSuccess && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <p className="text-sm text-green-800">{uploadSuccess}</p>
                  </div>
                </div>
              )}

              <div
                {...getRootProps()}
                className={clsx(
                  "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                  isDragActive
                    ? "border-blue-400 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                )}
              >
                <input {...getInputProps()} />
                {isUploading ? (
                  <div>
                    <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-blue-600 font-medium">Uploading files to webhook...</p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    {isDragActive ? (
                      <p className="text-blue-600 font-medium">Drop the PDF files here...</p>
                    ) : (
                      <div>
                        <p className="text-gray-900 font-medium mb-2">Drop PDF files here, or click to select</p>
                        <p className="text-sm text-gray-500">Only PDF files are supported</p>
                        <p className="text-xs text-blue-600 mt-2">Files will be uploaded to webhook API</p>
                      </div>
                    )}
                  </>
                )}
              </div>
              
              <div className="mt-4 text-xs text-gray-500 text-center">
                <p>Supported format: PDF only</p>
                <p>Maximum file size: 10MB per file</p>
                <p className="text-blue-600">Uploads to: {WEBHOOK_URL}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
