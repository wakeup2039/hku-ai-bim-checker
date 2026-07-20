import { useState, useCallback } from 'react';
import { BuildingModel } from '@/lib/types';
import { SAMPLE_MODEL, CLEAN_MODEL } from '@/lib/sampleData';
import { UploadCloud, FileJson, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export function UploadZone({ onModelLoaded }: { onModelLoaded: (m: BuildingModel) => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (!json.building || !Array.isArray(json.floors)) {
          throw new Error("Invalid format: expected { building: { name }, floors: [...] }.");
        }
        onModelLoaded(json as BuildingModel);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Invalid JSON file");
      }
    };
    reader.readAsText(file);
  }, [onModelLoaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }, [parseFile]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto mt-20"
    >
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-3">Surgical Code Compliance</h2>
        <p className="text-slate-600">Instantly evaluate architectural floor plans against GB 50016-2014 fire code rules.</p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors relative
          ${isDragging ? 'border-slate-900 bg-slate-50' : 'border-slate-300 bg-white hover:border-slate-400'}`}
      >
        <input 
          type="file" 
          accept=".json" 
          onChange={handleFile} 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
          aria-label="Upload JSON model file"
        />
        <div className="flex flex-col items-center justify-center pointer-events-none">
          <UploadCloud className="w-10 h-10 text-slate-400 mb-4" />
          <p className="text-lg font-medium text-slate-900 mb-1">Upload JSON Model</p>
          <p className="text-sm text-slate-500">Drag & drop or click to browse</p>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="mt-12">
        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
          <div className="relative flex justify-center"><span className="bg-slate-50 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Or try a demo</span></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <button 
            onClick={() => onModelLoaded(SAMPLE_MODEL)} 
            className="flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-lg hover:border-slate-400 transition-colors text-left group"
          >
            <FileJson className="w-8 h-8 text-red-500 group-hover:scale-110 transition-transform" />
            <div>
              <div className="font-semibold text-slate-900 text-sm mb-0.5">Demo Model</div>
              <div className="text-xs text-slate-500">Contains expected violations</div>
            </div>
          </button>
          <button 
            onClick={() => onModelLoaded(CLEAN_MODEL)} 
            className="flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-lg hover:border-slate-400 transition-colors text-left group"
          >
            <FileJson className="w-8 h-8 text-green-500 group-hover:scale-110 transition-transform" />
            <div>
              <div className="font-semibold text-slate-900 text-sm mb-0.5">Clean Model</div>
              <div className="text-xs text-slate-500">100% compliant layout</div>
            </div>
          </button>
        </div>
      </div>
    </motion.div>
  );
}