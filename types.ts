export type AspectRatio = '1:1' | '9:16' | '16:9';

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  aspectRatio: AspectRatio;
  timestamp: number;
}

export enum GenerationMode {
  TEXT_TO_IMAGE = 'TEXT_TO_IMAGE',
  IMAGE_TO_IMAGE = 'IMAGE_TO_IMAGE'
}

export interface LoadingState {
  isLoading: boolean;
  message: string;
}

export interface UploadedImage {
  file: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
}