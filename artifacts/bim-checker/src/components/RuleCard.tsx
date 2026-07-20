import { RuleResult } from '@/lib/types';
import { ChevronDown, CheckCircle2, XCircle } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function RuleCard({ rule, index }: { rule: RuleResult, index: number }) {
  const [expanded, setExpanded] = useState(rule.failCount > 0);
  const isFail = rule.failCount > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`border rounded-xl bg-white overflow-hidden shadow-sm transition-colors ${
        isFail ? 'border-red-200' : 'border-slate-200'
      }`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 flex items-start gap-4 hover:bg-slate-50 text-left transition-colors focus:outline-none"
      >
        <div className={`mt-0.5 flex-shrink-0 ${isFail ? 'text-red-500' : 'text-green-500'}`}>
          {isFail ? <XCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <h3 className="font-semibold text-slate-900 truncate pr-2">{rule.ruleName}</h3>
            <span className="flex-shrink-0 text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">
              {rule.ruleCode}
            </span>
          </div>
          <p className="text-sm text-slate-500 mb-3">{rule.description}</p>
          <div className="flex gap-4 text-xs font-medium">
            <span className="text-green-600 bg-green-50 px-2 py-1 rounded">{rule.passCount} Pass</span>
            {rule.failCount > 0 && <span className="text-red-600 bg-red-50 px-2 py-1 rounded">{rule.failCount} Fail</span>}
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 mt-1 ${expanded ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden border-t border-slate-100 bg-slate-50"
          >
            <div className="p-4 flex flex-col gap-3">
              {rule.items.map((item, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={i} 
                  className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col xl:flex-row xl:items-center gap-3 text-sm shadow-sm"
                >
                  <div className="flex items-center gap-3 xl:w-48 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      item.severity === 'FAIL' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'
                    }`}>
                      {item.severity}
                    </span>
                    <span className="font-semibold text-slate-900 truncate" title={item.elementName}>{item.elementName}</span>
                  </div>
                  
                  <div className="flex-1 text-slate-600 text-sm leading-snug">
                    {item.message}
                  </div>
                  
                  {item.severity === 'FAIL' && item.actualValue !== undefined && item.thresholdValue !== undefined && (
                    <div className="font-mono text-xs flex gap-2 xl:ml-auto items-center bg-slate-50 px-3 py-1.5 rounded border border-slate-100">
                      <span className="text-red-600 font-semibold">{item.actualValue} {item.unit}</span>
                      <span className="text-slate-400">vs</span>
                      <span className="text-slate-900 font-medium">{item.thresholdValue} {item.unit}</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}