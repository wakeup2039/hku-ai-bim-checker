import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import React, { useState } from 'react';
import { BuildingModel, ComplianceReport } from '@/lib/types';
import { runCompliance } from '@/lib/compliance';
import { UploadZone } from '@/components/UploadZone';
import { ProgressState } from '@/components/ProgressState';
import { ResultsView } from '@/components/ResultsView';

const queryClient = new QueryClient();

function BimChecker() {
  const [appState, setAppState] = useState<'upload' | 'running' | 'results'>('upload');
  const [model, setModel] = useState<BuildingModel | null>(null);
  const [report, setReport] = useState<ComplianceReport | null>(null);

  const handleRun = (m: BuildingModel) => {
    setModel(m);
    setAppState('running');
    // Simulate complex calculation time for UX
    setTimeout(() => {
      const rep = runCompliance(m);
      setReport(rep);
      setAppState('results');
    }, 850);
  };

  const handleReset = () => {
    setModel(null);
    setReport(null);
    setAppState('upload');
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50 text-slate-900 font-sans selection:bg-slate-200">
      <header className="border-b border-slate-200 bg-white px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-900 rounded-md flex items-center justify-center shadow-sm">
            <div className="w-3.5 h-3.5 border-2 border-white rounded-sm" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 leading-tight">BIM Compliance Checker</h1>
            <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mt-0.5">GB 50016-2014 Validation</p>
          </div>
        </div>
        {appState === 'results' && (
          <button 
            onClick={handleReset} 
            className="text-sm font-semibold hover:bg-slate-100 border border-transparent hover:border-slate-200 px-4 py-2 rounded-md transition-all text-slate-700"
          >
            Check Another Model
          </button>
        )}
      </header>

      <main className="max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8">
        {appState === 'upload' && <UploadZone onModelLoaded={handleRun} />}
        {appState === 'running' && <ProgressState />}
        {appState === 'results' && model && report && <ResultsView model={model} report={report} />}
      </main>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={BimChecker} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;