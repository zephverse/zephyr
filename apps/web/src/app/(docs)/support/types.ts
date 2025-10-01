import type React from "react";

export type FormData = {
  email: string;
  type: string;
  category: string;
  priority: string;
  subject: string;
  message: string;
  os: string;
  browser: string;
};

export type StepProps = {
  formData: FormData;
  setFormData: (data: FormData) => void;
  onNext?: () => void;
  onBack?: () => void;
  loading?: boolean;
};

export type Attachment = {
  name: string;
  file: File;
  url: string;
  key: string;
  originalName: string;
  size: number;
  type: string;
  isUploading: boolean;
  previewUrl?: string;
};

export type StepThreeProps = {
  formData: FormData;
  setFormData: (data: FormData) => void;
  onBack?: () => void;
  loading: boolean;
  attachments: Attachment[];
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileUpload: (files: FileList) => Promise<void>;
  setAttachments: React.Dispatch<React.SetStateAction<Attachment[]>>;
};
