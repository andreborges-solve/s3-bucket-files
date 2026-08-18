import React from 'react';
import { FileUpload } from './FileUpload';

export const FileManagerScreen: React.FC = () => {
  return (
    <main className="min-h-screen w-full bg-white flex flex-col items-center justify-center p-8">
      <div className="flex flex-col items-center gap-6 w-full max-w-4xl">
        <FileUpload />
      </div>
    </main>
  );
};

export default FileManagerScreen;