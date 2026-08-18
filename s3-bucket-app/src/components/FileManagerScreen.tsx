import React from 'react';
import type { ReactNode } from 'react';
import { FileUpload } from './FileUpload';
import { FileTable } from './FileTable';

interface FileManagerScreenProps {
  children?: ReactNode;
}

export const FileManagerScreen: React.FC<FileManagerScreenProps> = () => {
  return (
    <main className="min-h-screen w-full bg-white flex flex-col items-center justify-center p-8">
      <div className="flex flex-col items-center gap-6 w-full max-w-4xl">
        <FileUpload />
        <FileTable />
      </div>
    </main>
  );
};

export default FileManagerScreen;