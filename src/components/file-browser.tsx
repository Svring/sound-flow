'use client';

import { useState, useEffect } from 'react';
import { useGsStore } from '@/store/gs-store/gs-store';
import { GsModel } from '@/models';
import { 
  Folder, File, ArrowUp, DownloadCloud, Upload, Trash2, 
  Loader2, Music, FileText, FileImage, Video, Package,
  FolderPlus, FilePlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FileBrowserProps {
  onFileSelect?: (filePath: string) => void;
  allowedExtensions?: string[];
  startDirectory?: string;
  showUploadButton?: boolean;
  showDeleteButton?: boolean;
  showDownloadButton?: boolean;
  showCreateButton?: boolean;
  allowDirectorySelection?: boolean;
}

export function FileBrowser({
  onFileSelect,
  allowedExtensions = [],
  startDirectory = '',
  showUploadButton = true,
  showDeleteButton = true,
  showDownloadButton = true,
  showCreateButton = true,
  allowDirectorySelection = false,
}: FileBrowserProps) {
  const { 
    currentFiles, 
    currentDirectory, 
    loadingFiles,
    listFiles,
    navigateToDirectory,
    navigateUp,
    uploadFile,
    downloadFile,
    deleteFile,
    createFolder,
    createFile
  } = useGsStore();

  const [error, setError] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
  const [createFileDialogOpen, setCreateFileDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [newFileContent, setNewFileContent] = useState('');

  // Initialize by loading the starting directory
  useEffect(() => {
    if (startDirectory) {
      navigateToDirectory(startDirectory).catch(err => {
        console.error('Failed to navigate to starting directory:', err);
        setError(`Failed to load directory: ${err.message}`);
      });
    } else {
      listFiles().catch(err => {
        console.error('Failed to list files:', err);
        setError(`Failed to load files: ${err.message}`);
      });
    }
  }, [startDirectory, navigateToDirectory, listFiles]);

  // Handle directory navigation
  const handleNavigateToDirectory = (directory: string) => {
    setError(null);
    navigateToDirectory(directory).catch(err => {
      console.error(`Failed to navigate to directory ${directory}:`, err);
      setError(`Failed to navigate to ${directory}: ${err.message}`);
    });
  };

  // Handle navigating up one level
  const handleNavigateUp = () => {
    setError(null);
    navigateUp().catch(err => {
      console.error('Failed to navigate up:', err);
      setError(`Failed to navigate up: ${err.message}`);
    });
  };

  // Handle file selection
  const handleFileSelect = (file: GsModel.GsFileItem) => {
    if (file.isDirectory) {
      handleNavigateToDirectory(file.path);
    } else if (onFileSelect) {
      onFileSelect(file.path);
    }
  };

  // Handle directory selection
  const handleDirectorySelect = (path: string) => {
    if (onFileSelect) {
      onFileSelect(path);
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    setError(null);
    
    try {
      await uploadFile(selectedFile, currentDirectory, overwriteExisting);
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setOverwriteExisting(false);
    } catch (err) {
      console.error('Failed to upload file:', err);
      setError(`Failed to upload file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file download
  const handleDownload = async (filePath: string) => {
    setError(null);
    try {
      const blob = await downloadFile(filePath);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filePath.split('/').pop() || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(`Failed to download file ${filePath}:`, err);
      setError(`Failed to download file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Handle file deletion
  const handleDelete = async (filePath: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete ${fileName}?`)) {
      return;
    }
    
    setError(null);
    try {
      await deleteFile(filePath);
    } catch (err) {
      console.error(`Failed to delete file ${filePath}:`, err);
      setError(`Failed to delete file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Handle folder creation
  const handleCreateFolder = async () => {
    if (!newFolderName) return;
    
    setError(null);
    try {
      const folderPath = `${currentDirectory}/${newFolderName}`.replace(/^\/+/, '');
      await createFolder(folderPath);
      setCreateFolderDialogOpen(false);
      setNewFolderName('');
    } catch (err) {
      console.error('Failed to create folder:', err);
      setError(`Failed to create folder: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Handle file creation
  const handleCreateFile = async () => {
    if (!newFileName) return;
    
    setError(null);
    try {
      const filePath = `${currentDirectory}/${newFileName}`.replace(/^\/+/, '');
      await createFile(filePath, newFileContent);
      setCreateFileDialogOpen(false);
      setNewFileName('');
      setNewFileContent('');
    } catch (err) {
      console.error('Failed to create file:', err);
      setError(`Failed to create file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Function to get appropriate icon for file type
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (!ext) return <File className="h-4 w-4" />;
    
    switch (ext) {
      case 'wav':
      case 'mp3':
      case 'ogg':
      case 'flac':
      case 'm4a':
        return <Music className="h-4 w-4" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return <FileImage className="h-4 w-4" />;
      case 'mp4':
      case 'mov':
      case 'webm':
        return <Video className="h-4 w-4" />;
      case 'txt':
      case 'md':
      case 'json':
        return <FileText className="h-4 w-4" />;
      case 'zip':
      case 'rar':
      case 'tar':
      case 'gz':
        return <Package className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  // Function to format file size
  const formatFileSize = (bytes?: number) => {
    if (bytes === undefined) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  // Filter files based on allowed extensions
  const filteredFiles = currentFiles.filter(file => {
    if (file.isDirectory) return true;
    if (allowedExtensions.length === 0) return true;
    
    const ext = file.name.split('.').pop()?.toLowerCase();
    return ext ? allowedExtensions.includes(`.${ext}`) || allowedExtensions.includes(ext) : false;
  });

  return (
    <div className="w-full space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex items-center space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleNavigateUp}
          disabled={loadingFiles}
        >
          <ArrowUp className="h-4 w-4 mr-2" />
          Up
        </Button>
        
        <div className="flex-1 px-3 py-1 border rounded-md bg-muted">
          {currentDirectory || '/'}
        </div>
        
        {showCreateButton && (
          <>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setCreateFolderDialogOpen(true)}
              disabled={loadingFiles}
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              New Folder
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setCreateFileDialogOpen(true)}
              disabled={loadingFiles}
            >
              <FilePlus className="h-4 w-4 mr-2" />
              New File
            </Button>
          </>
        )}
        
        {showUploadButton && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setUploadDialogOpen(true)}
            disabled={loadingFiles}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
        )}
      </div>
      
      <div className="border rounded-md">
        <ScrollArea className="h-[400px] w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Modified</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingFiles ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin inline-block mr-2" />
                    Loading files...
                  </TableCell>
                </TableRow>
              ) : filteredFiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    No files found
                  </TableCell>
                </TableRow>
              ) : (
                filteredFiles.map((file) => (
                  <TableRow key={file.path}>
                    <TableCell>
                      <button
                        className="flex items-center text-left hover:underline"
                        onClick={() => handleFileSelect(file)}
                      >
                        {file.isDirectory ? (
                          <Folder className="h-4 w-4 mr-2" />
                        ) : (
                          getFileIcon(file.name)
                        )}
                        <span>{file.name}</span>
                      </button>
                    </TableCell>
                    <TableCell>{formatFileSize(file.size)}</TableCell>
                    <TableCell>
                      {file.lastModified ? new Date(file.lastModified).toLocaleString() : ''}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      {allowDirectorySelection && file.isDirectory && (
                        <Button
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDirectorySelect(file.path)}
                          title="Select Directory"
                        >
                          Select Folder
                        </Button>
                      )}
                      {!file.isDirectory && showDownloadButton && (
                        <Button
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDownload(file.path)}
                          title="Download"
                        >
                          <DownloadCloud className="h-4 w-4" />
                        </Button>
                      )}
                      {!file.isDirectory && showDeleteButton && (
                        <Button
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDelete(file.path, file.name)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
      
      {/* Create Folder Dialog */}
      <Dialog open={createFolderDialogOpen} onOpenChange={setCreateFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Input
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
            />
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setCreateFolderDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateFolder}
              disabled={!newFolderName}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Create File Dialog */}
      <Dialog open={createFileDialogOpen} onOpenChange={setCreateFileDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New File</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Input
              placeholder="File name"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
            />
            
            <Textarea
              placeholder="File content (optional)"
              value={newFileContent}
              onChange={(e) => setNewFileContent(e.target.value)}
              rows={5}
            />
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setCreateFileDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateFile}
              disabled={!newFileName}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="overwrite"
                checked={overwriteExisting}
                onChange={() => setOverwriteExisting(!overwriteExisting)}
              />
              <label htmlFor="overwrite">Overwrite existing file</label>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setUploadDialogOpen(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 