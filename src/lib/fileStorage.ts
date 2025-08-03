import { writeFile, readFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export interface StoredFile {
  id: string;
  name: string;
  size: number;
  uploadDate: string;
  type: string;
  path: string;
}

class FileStorage {
  private uploadDir: string;
  private metadataFile: string;

  constructor() {
    this.uploadDir = join(process.cwd(), 'uploads');
    this.metadataFile = join(this.uploadDir, 'metadata.json');
  }

  async initialize() {
    if (!existsSync(this.uploadDir)) {
      await mkdir(this.uploadDir, { recursive: true });
    }
    
    if (!existsSync(this.metadataFile)) {
      await this.saveMetadata([]);
    }
  }

  private async loadMetadata(): Promise<StoredFile[]> {
    try {
      const data = await readFile(this.metadataFile, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  private async saveMetadata(files: StoredFile[]): Promise<void> {
    await writeFile(this.metadataFile, JSON.stringify(files, null, 2));
  }

  async saveFile(file: File): Promise<StoredFile> {
    await this.initialize();

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${originalName}`;
    const filePath = join(this.uploadDir, fileName);

    // Save file to disk
    await writeFile(filePath, buffer);

    // Create file metadata
    const fileMetadata: StoredFile = {
      id: timestamp.toString(),
      name: file.name,
      size: file.size,
      uploadDate: new Date().toISOString(),
      type: file.type,
      path: fileName
    };

    // Update metadata
    const metadata = await this.loadMetadata();
    metadata.push(fileMetadata);
    await this.saveMetadata(metadata);

    return fileMetadata;
  }

  async getAllFiles(): Promise<StoredFile[]> {
    await this.initialize();
    return await this.loadMetadata();
  }

  async deleteFile(fileId: string): Promise<boolean> {
    await this.initialize();
    
    const metadata = await this.loadMetadata();
    const fileIndex = metadata.findIndex(file => file.id === fileId);
    
    if (fileIndex === -1) {
      return false;
    }

    const file = metadata[fileIndex];
    const filePath = join(this.uploadDir, file.path);

    try {
      // Delete file from disk
      if (existsSync(filePath)) {
        await unlink(filePath);
      }

      // Remove from metadata
      metadata.splice(fileIndex, 1);
      await this.saveMetadata(metadata);

      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  async getFileById(fileId: string): Promise<StoredFile | null> {
    await this.initialize();
    
    const metadata = await this.loadMetadata();
    return metadata.find(file => file.id === fileId) || null;
  }
}

export const fileStorage = new FileStorage(); 