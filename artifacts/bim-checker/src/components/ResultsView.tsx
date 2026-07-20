import React, { useState, useMemo } from 'react';
import { BuildingModel, ComplianceReport } from '@/lib/types';
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Map, Code2 } from 'lucide-react';
import { FloorPlanVis } from './FloorPlanVis';
import { RuleCard } from './RuleCard';
import { JsonViewer } from './JsonViewer';
import { buildAnnotationMap } from '@/lib/jsonAnnotate';
import { motion } from 'framer-motion';

type ViewTab = 'floorplan' | 'json';

export function ResultsView({ model, report }: { model: BuildingModel, report: ComplianceReport }) {
  const [activeTab, setActiveTab] = useState<ViewTab>('floorplan');
  const isPass = report.overallStatus === 'PASS';
  const isFail = report.overallStatus === 'FAIL';

  // Build annotation map once — maps JSON paths → violations
  const annotations = useMemo(
    () => buildAnnotationMap(model, report),
    [model, report]
  );

  const violationCount = report.totalFail + report.totalWarn;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6 pb-20"
    >
      {/* Summary Bar */}
      <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">{report.buildingName}</h2>
          <div className="text-sm text-slate-500 font-mono">
            Checked on {new Date(report.checkedAt).toLocaleString()}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 lg:gap-8">
          <div className="flex gap-6">
            <div className="flex flex-col">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Total Checks</span>
              <span className="text-2xl font-mono font-medium text-slate-900 leading-none">{report.totalChecks}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Passed</span>
              <span className="text-2xl font-mono font-medium text-green-600 leading-none">{report.totalPass}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Failed</span>
              <span className="text-2xl font-mono font-medium text-red-600 leading-none">{report.totalFail}</span>
            </div>
          </div>

          <div className="h-12 w-px bg-slate-200 hidden md:block" />

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className={`flex items-center gap-3 px-5 py-3 rounded-lg border-2 ${
              isPass ? 'bg-green-50 border-green-500 text-green-700' :
              isFail ? 'bg-red-50 border-red-500 text-red-700' :
              'bg-amber-50 border-amber-500 text-amber-700'
            }`}
          >
            {isPass ? <ShieldCheck className="w-6 h-6" /> : isFail ? <XCircle className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            <span className="text-lg font-bold tracking-wide">
              {report.overallStatus}
            </span>
          </motion.div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Rule Cards List */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          {report.rules.map((rule, idx) => (
            <RuleCard key={rule.ruleId} rule={rule} index={idx} />
          ))}
        </div>

        {/* Right Panel — Floor Plan or JSON Source */}
        <div className="lg:col-span-2 sticky top-24 flex flex-col gap-0">
          {/* Tab bar */}
          <div className="flex items-center border border-b-0 border-slate-200 rounded-t-xl bg-slate-50 overflow-hidden">
            <TabButton
              active={activeTab === 'floorplan'}
              onClick={() => setActiveTab('floorplan')}
              icon={<Map className="w-3.5 h-3.5" />}
              label="Floor Plan"
            />
            <TabButton
              active={activeTab === 'json'}
              onClick={() => setActiveTab('json')}
              icon={<Code2 className="w-3.5 h-3.5" />}
              label="JSON Source"
              badge={violationCount > 0 ? violationCount : undefined}
            />
          </div>

          {/* Tab content */}
          <div className="rounded-b-xl overflow-hidden">
            {activeTab === 'floorplan' && (
              <FloorPlanVis model={model} report={report} />
            )}
            {activeTab === 'json' && (
              <JsonViewer
                data={model}
                annotations={annotations}
                violationCount={violationCount}
              />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors border-r border-slate-200 last:border-r-0 focus:outline-none ${
        active
          ? 'bg-white text-slate-900 shadow-sm'
          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
      }`}
    >
      {icon}
      {label}
      {badge !== undefined && (
        <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold leading-none">
          {badge}
        </span>
      )}
    </button>
  );
}
