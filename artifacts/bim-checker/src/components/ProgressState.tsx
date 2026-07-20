import { motion } from 'framer-motion';
import { Terminal } from 'lucide-react';
import { useEffect, useState } from 'react';

const logs = [
  "Loading building geometry...",
  "Parsing 2D floor plans...",
  "Identifying rooms, doors, and exits...",
  "Evaluating GB 50016-2014 §5.5.18 (Evacuation Door Width)...",
  "Measuring room-to-exit travel distances...",
  "Evaluating GB 50016-2014 §5.5.17 (Max Travel Distance)...",
  "Generating compliance report..."
];

export function ProgressState() {
  const [logIndex, setLogIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLogIndex(i => Math.min(i + 1, logs.length - 1));
    }, 110);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-md mx-auto mt-32 flex flex-col items-center">
      <div className="relative mb-8">
        <div className="w-16 h-16 bg-slate-900 rounded-xl flex items-center justify-center shadow-md z-10 relative">
          <Terminal className="w-8 h-8 text-white" />
        </div>
        <motion.div
          className="absolute inset-0 border-2 border-slate-900 rounded-xl z-0"
          initial={{ scale: 1, opacity: 1 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ repeat: Infinity, duration: 1, ease: "easeOut" }}
        />
      </div>

      <div className="w-full bg-slate-900 rounded-md p-5 shadow-lg font-mono text-xs text-green-400 overflow-hidden h-40 flex flex-col justify-end border border-slate-800">
        {logs.slice(0, logIndex + 1).map((log, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="whitespace-nowrap mb-1.5"
          >
            <span className="text-slate-500 mr-2">{'>'}</span> {log}
          </motion.div>
        ))}
        <div className="animate-pulse mt-1 ml-4 text-green-500">_</div>
      </div>
    </div>
  );
}