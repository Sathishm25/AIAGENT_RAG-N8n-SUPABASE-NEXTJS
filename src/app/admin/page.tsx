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
  Loader2,
  Search,
  Filter
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
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <div className="w-64 bg-gray-100 border-r border-gray-200">
        <div className="p-6">
          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 rounded-full bg-gray-200 p-1">
              <div className="w-full h-full rounded-full bg-gray-700 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">SM</span>
              </div>
            </div>
            <h2 className="mt-4 text-lg font-bold text-gray-800">Sathish Mohan</h2>
            <p className="text-sm text-gray-600">Admin User</p>
          </div>

          <nav className="space-y-2">
            <button className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-black bg-white rounded-xl transition-all duration-200 cursor-pointer">
              <div className="bg-blue-100 p-1 rounded-lg">
                <Building className="h-5 w-5 text-blue-600" />
              </div>
              <span className="font-medium">Dashboard</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-black rounded-xl transition-all duration-200 cursor-pointer">
              <div className="bg-purple-100 p-1 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <span className="font-medium">Calendar</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-black rounded-xl transition-all duration-200 cursor-pointer">
              <div className="bg-emerald-100 p-1 rounded-lg">
                <Settings className="h-5 w-5 text-emerald-600" />
              </div>
              <span className="font-medium">Settings</span>
            </button>
          </nav>
        </div>
      </div>

      <div className="flex-1">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Document Management System
                </h1>
                <p className="text-gray-600 font-medium">Manage and organize your documents</p>
              </div>
              <div className="flex items-center space-x-4">
                <button className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200">
                  <Users className="h-5 w-5" />
                  <span className="font-medium">Profile</span>
                </button>
              </div>
            </div>
          </div>
        </header>

      {/* Main Content */}
      <main className="p-8">
        {/* Content Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Stats and Upload */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            {/* Stats Cards */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:bg-gray-50 transition-all duration-300 group">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-semibold text-gray-700">Total Documents</p>
                    <p className="text-3xl font-bold text-gray-800">{documents.length}</p>
                  </div>
                </div>
              </div>
          
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:bg-gray-50 transition-all duration-300 group">
                <div className="flex items-center">
                  <div className="bg-green-100 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-semibold text-gray-700">Active Files</p>
                    <p className="text-3xl font-bold text-gray-800">{documents.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:bg-gray-50 transition-all duration-300 group">
                <div className="flex items-center">
                  <div className="bg-indigo-100 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300">
                    <Upload className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-semibold text-gray-700">Uploads Today</p>
                    <p className="text-3xl font-bold text-gray-800">
                      {documents.filter(doc => 
                        new Date(doc.uploadDate).toDateString() === new Date().toDateString()
                      ).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Upload Section */}
            <div className="bg-gray-50 rounded-2xl shadow-lg border border-gray-200 p-4">
              <div className="flex flex-col space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Quick Upload</h2>
                <p className="text-gray-600">Upload and manage your documents with ease</p>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Secure integration</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Local backup</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center justify-center space-x-3 bg-gray-800 hover:bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 cursor-pointer"
                >
                  <Plus className="h-5 w-5" />
                  <span>Add Documents</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Documents */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {/* Search and Filter Bar */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:border-gray-800 focus:outline-none transition-all duration-200 text-gray-700 placeholder-gray-400"
                  />
                </div>
                <button className="flex items-center space-x-2 px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200">
                  <Filter className="h-5 w-5" />
                  <span className="font-medium">Filter</span>
                </button>
              </div>
            </div>

            {/* Documents List */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-xl font-bold text-gray-800">Uploaded Documents</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {filteredDocuments.length} of {documents.length} documents
                </p>
              </div>
          
              {isLoading ? (
                <div className="p-16 text-center">
                  <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Loading documents...</p>
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="p-16 text-center">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                  <h3 className="text-xl font-bold text-gray-800 mb-3">No documents found</h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    {searchTerm ? 'No documents match your search criteria.' : 'Get started by uploading your first document to the HR portal.'}
                  </p>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="inline-flex items-center space-x-3 bg-gray-800 hover:bg-gray-900 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <Upload className="h-5 w-5" />
                    <span>Upload Documents</span>
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {filteredDocuments.map((document) => (
                    <div key={document.id} className="px-6 py-4 hover:bg-blue-50/50 transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="bg-blue-100 border border-blue-200 p-3 rounded-xl">
                            <FileText className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-800 mb-1">{document.name}</h4>
                            <p className="text-sm text-gray-400">
                              {formatFileSize(document.size)} • Uploaded {formatDate(document.uploadDate)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                            PDF
                          </span>
                          <button
                            onClick={() => removeDocument(document.id)}
                            className="p-3 text-gray-400 text-red-400 bg-red-500/10 rounded-lg transition-all duration-200 cursor-pointer"
                            title="Remove document"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 border border-gray-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">Upload Documents</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" style={{cursor: 'pointer'}}/>
              </button>
            </div>
            
            <div className="p-6">
              {uploadError && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <p className="text-sm text-red-300 font-medium">{uploadError}</p>
                  </div>
                </div>
              )}
              
              {uploadSuccess && (
                <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <p className="text-sm text-green-300 font-medium">{uploadSuccess}</p>
                  </div>
                </div>
              )}

              <div
                {...getRootProps()}
                className={clsx(
                  "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200",
                  isDragActive
                    ? "border-gray-600 bg-gray-50"
                    : "border-gray-300 hover:border-gray-600 hover:bg-gray-50"
                )}
              >
                <input {...getInputProps()} />
                {isUploading ? (
                  <div>
                    <Loader2 className="h-16 w-16 text-gray-600 animate-spin mx-auto mb-6" />
                    <p className="text-gray-700 font-semibold text-lg">Uploading files to webhook...</p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                    {isDragActive ? (
                      <p className="text-gray-700 font-semibold text-lg">Drop the PDF files here...</p>
                    ) : (
                      <div>
                        <p className="text-gray-800 font-bold text-lg mb-3">Drop PDF files here, or click to select</p>
                        <p className="text-gray-600 mb-4">Only PDF files are supported!</p>
                        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4" />
                          <span>Files will be uploaded to webhook API</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
              
              <div className="mt-6 text-sm text-gray-500 text-center space-y-1">
                <p>Supported format: PDF only</p>
                <p>Maximum file size: 10MB per file</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
