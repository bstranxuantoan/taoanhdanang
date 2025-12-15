import React, { useState, useRef, useCallback } from 'react';
import { Button } from './components/Button';
import { generateImageFromText, generateImageFromImage, fileToBase64 } from './services/geminiService';
import { GeneratedImage, GenerationMode, UploadedImage, LoadingState, AspectRatio } from './types';

// Icons as simple SVG components for better readability
const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
);
const ImageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
);
const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
);
const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
);
const SquareIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /></svg>
);
const PortraitIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="3" width="14" height="18" rx="2" ry="2" /></svg>
);
const LandscapeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" ry="2" /></svg>
);

const App: React.FC = () => {
  const [mode, setMode] = useState<GenerationMode>(GenerationMode.TEXT_TO_IMAGE);
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [loading, setLoading] = useState<LoadingState>({ isLoading: false, message: '' });
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Mode Switching
  const switchMode = (newMode: GenerationMode) => {
    setMode(newMode);
    setError(null);
  };

  // Handle File Upload
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      try {
        const base64 = await fileToBase64(file);
        setUploadedImage({
          file,
          previewUrl: URL.createObjectURL(file),
          base64,
          mimeType: file.type
        });
        setError(null);
      } catch (err) {
        setError("Không thể xử lý ảnh. Vui lòng thử ảnh khác.");
      }
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const removeUploadedImage = () => {
    if (uploadedImage) {
      URL.revokeObjectURL(uploadedImage.previewUrl);
    }
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Helper to get tailwind class for aspect ratio
  const getAspectRatioClass = (ratio: AspectRatio) => {
    switch (ratio) {
        case '1:1': return 'aspect-square';
        case '9:16': return 'aspect-[9/16]';
        case '16:9': return 'aspect-video'; // aspect-[16/9]
        default: return 'aspect-square';
    }
  };

  // Main Generation Logic
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      setError("Vui lòng nhập mô tả.");
      return;
    }

    if (mode === GenerationMode.IMAGE_TO_IMAGE && !uploadedImage) {
      setError("Vui lòng tải ảnh lên để biến đổi.");
      return;
    }

    setLoading({ isLoading: true, message: 'Đang tạo tác phẩm...' });
    setError(null);

    try {
      let imageUrl = '';
      if (mode === GenerationMode.TEXT_TO_IMAGE) {
        imageUrl = await generateImageFromText(prompt, aspectRatio);
      } else if (mode === GenerationMode.IMAGE_TO_IMAGE && uploadedImage) {
        imageUrl = await generateImageFromImage(uploadedImage, prompt, aspectRatio);
      }

      const newImage: GeneratedImage = {
        id: crypto.randomUUID(),
        url: imageUrl,
        prompt: prompt,
        aspectRatio: aspectRatio,
        timestamp: Date.now()
      };

      setGeneratedImages(prev => [newImage, ...prev]);
    } catch (err: any) {
      console.error(err);
      let errorMessage = "Đã xảy ra lỗi. Vui lòng thử lại.";
      if (err.message && err.message.includes("SAFETY")) {
        errorMessage = "Mô tả bị hệ thống an toàn chặn. Vui lòng thử mô tả khác.";
      }
      setError(errorMessage);
    } finally {
      setLoading({ isLoading: false, message: '' });
    }
  }, [mode, prompt, uploadedImage, aspectRatio]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      
      {/* Header */}
      <header className="w-full max-w-4xl mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
                <SparklesIcon />
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                Tạo Ảnh Đa Năng
            </h1>
        </div>
        <p className="text-slate-400 text-sm text-center md:text-right">
            Được hỗ trợ bởi Gemini 2.5 Flash
        </p>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Controls Column */}
        <section className="lg:col-span-2 space-y-6">
            {/* Mode Switcher */}
            <div className="bg-slate-800/50 p-1 rounded-xl flex">
                <button 
                    onClick={() => switchMode(GenerationMode.TEXT_TO_IMAGE)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${mode === GenerationMode.TEXT_TO_IMAGE ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <SparklesIcon /> Tạo mới
                </button>
                <button 
                    onClick={() => switchMode(GenerationMode.IMAGE_TO_IMAGE)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${mode === GenerationMode.IMAGE_TO_IMAGE ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <ImageIcon /> Biến đổi
                </button>
            </div>

            {/* Upload Area (Only for Image-to-Image) */}
            {mode === GenerationMode.IMAGE_TO_IMAGE && (
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-300">Ảnh mẫu</label>
                    {!uploadedImage ? (
                        <div 
                            onClick={triggerFileUpload}
                            className="border-2 border-dashed border-slate-700 hover:border-purple-500 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-800/20 hover:bg-slate-800/40"
                        >
                            <UploadIcon />
                            <span className="mt-2 text-sm text-slate-400">Nhấn để tải ảnh lên</span>
                        </div>
                    ) : (
                        <div className="relative group rounded-xl overflow-hidden border border-slate-700">
                            <img src={uploadedImage.previewUrl} alt="Upload preview" className="w-full h-48 object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                            <button 
                                onClick={removeUploadedImage}
                                className="absolute top-2 right-2 bg-black/60 hover:bg-red-600/80 text-white p-1.5 rounded-full transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                        </div>
                    )}
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept="image/png, image/jpeg, image/webp" 
                        className="hidden" 
                    />
                </div>
            )}

            {/* Prompt Input */}
            <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-300">
                    {mode === GenerationMode.TEXT_TO_IMAGE ? "Mô tả ý tưởng của bạn" : "Bạn muốn thay đổi ảnh này như thế nào?"}
                </label>
                <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={mode === GenerationMode.TEXT_TO_IMAGE ? "Một thành phố tương lai rực rỡ ánh đèn neon..." : "Biến nó thành tranh phong cách Van Gogh..."}
                    className="w-full bg-slate-800 border-slate-700 text-slate-100 rounded-xl p-4 min-h-[120px] focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none placeholder:text-slate-500"
                />
            </div>

            {/* Aspect Ratio Selector */}
            <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-300">Tỉ lệ khung hình</label>
                <div className="grid grid-cols-3 gap-2">
                    <button
                        onClick={() => setAspectRatio('1:1')}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                            aspectRatio === '1:1' 
                            ? 'bg-purple-600/20 border-purple-500 text-purple-200' 
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                        title="Vuông (1:1)"
                    >
                        <SquareIcon />
                        <span className="text-xs mt-1.5 font-medium">Vuông (1:1)</span>
                    </button>
                    <button
                        onClick={() => setAspectRatio('9:16')}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                            aspectRatio === '9:16' 
                            ? 'bg-purple-600/20 border-purple-500 text-purple-200' 
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                        title="Dọc (9:16)"
                    >
                        <PortraitIcon />
                        <span className="text-xs mt-1.5 font-medium">Dọc</span>
                    </button>
                    <button
                        onClick={() => setAspectRatio('16:9')}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                            aspectRatio === '16:9' 
                            ? 'bg-purple-600/20 border-purple-500 text-purple-200' 
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                        title="Ngang (16:9)"
                    >
                        <LandscapeIcon />
                        <span className="text-xs mt-1.5 font-medium">Ngang</span>
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-3 bg-red-900/20 border border-red-800/50 rounded-lg text-red-200 text-sm">
                    {error}
                </div>
            )}

            {/* Action Button */}
            <Button 
                onClick={handleGenerate} 
                isLoading={loading.isLoading}
                className="w-full text-lg shadow-purple-500/20"
            >
                {loading.isLoading ? loading.message : "Tạo ảnh"}
            </Button>
        </section>

        {/* Results Column */}
        <section className="lg:col-span-3">
            {generatedImages.length > 0 ? (
                <div className="space-y-6">
                    {/* Main (Latest) Image */}
                    <div className="relative group rounded-2xl overflow-hidden bg-black shadow-2xl shadow-purple-900/10 border border-slate-800 flex items-center justify-center bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiMwZjE3MmEiLz48cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMWUyOTNiIi8+PHJlY3QgeD0iNCIgeT0iNCIgd2lkdGg9IjQiIGhlaWdodD0iNCIgZmlsbD0iIzFlMjkzYiIvPjwvc3ZnPg==')]">
                         {/* Aspect ratio container */}
                         <div className={`w-full ${getAspectRatioClass(generatedImages[0].aspectRatio)} relative`}>
                            <img 
                                src={generatedImages[0].url} 
                                alt={generatedImages[0].prompt} 
                                className="absolute inset-0 w-full h-full object-contain"
                            />
                         </div>
                         
                         {/* Overlay info */}
                         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6 pointer-events-none">
                            <p className="text-white font-medium line-clamp-2 mb-4 drop-shadow-md">{generatedImages[0].prompt}</p>
                            <a 
                                href={generatedImages[0].url} 
                                download={`visionary-${generatedImages[0].id}.png`}
                                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-lg text-sm font-medium w-fit transition-colors pointer-events-auto"
                            >
                                <DownloadIcon /> Tải xuống
                            </a>
                         </div>
                    </div>

                    {/* History Strip */}
                    {generatedImages.length > 1 && (
                        <div>
                            <h3 className="text-slate-400 text-sm font-medium mb-3">Tác phẩm gần đây</h3>
                            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700">
                                {generatedImages.slice(1).map((img) => (
                                    <div key={img.id} className={`flex-shrink-0 w-24 rounded-lg overflow-hidden border border-slate-700 cursor-pointer hover:border-purple-500 transition-colors relative ${getAspectRatioClass(img.aspectRatio)}`}>
                                        <img src={img.url} alt="thumbnail" className="w-full h-full object-cover" />
                                        <a href={img.url} download className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                                             <DownloadIcon />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                // Empty State
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-800 rounded-2xl p-8 bg-slate-900/50">
                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 text-slate-600">
                        <SparklesIcon />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-200 mb-2">Sẵn sàng sáng tạo</h2>
                    <p className="text-slate-500 max-w-sm">
                        Nhập mô tả và chọn tỉ lệ để tạo ảnh mới, hoặc tải ảnh lên để biến đổi nó.
                    </p>
                </div>
            )}
        </section>

      </main>
    </div>
  );
};

export default App;