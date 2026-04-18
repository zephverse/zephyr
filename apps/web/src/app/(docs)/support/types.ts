import type React from "react";

export interface FormData {
  browser: string;
  category: string;
  email: string;
  message: string;
  os: string;
  priority: string;
  subject: string;
  type: string;
}

export interface StepProps {
  formData: FormData;
  loading?: boolean;
  onBack?: () => void;
  onNext?: () => void;
  setFormData: (data: FormData) => void;
}

export interface Attachment {
  file: File;
  isUploading: boolean;
  key: string;
  name: string;
  originalName: string;
  previewUrl?: string;
  size: number;
  type: string;
  url: string;
}

export interface StepThreeProps {
  attachments: Attachment[];
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  formData: FormData;
  handleFileUpload: (files: FileList) => Promise<void>;
  loading: boolean;
  onBack?: () => void;
  setAttachments: React.Dispatch<React.SetStateAction<Attachment[]>>;
  setFormData: (data: FormData) => void;
}
