/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Download, Cpu, Sparkles, RefreshCw, Gamepad2 } from 'lucide-react';
import { useI18n } from '../i18n';

const EXPORT_FORMAT_IDS = ['spritesheet', 'gif', 'json'] as const;
const FORMAT_EXT: Record<(typeof EXPORT_FORMAT_IDS)[number], string> = {
  spritesheet: '.png', gif: '.gif', json: '.json',
};
const PROMPT_IDS = ['0', '1', '2'] as const;

export function ExportAI() {
  const { t } = useI18n();
  const [activeFormat, setActiveFormat] = useState<string>('spritesheet');
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const [activePromptId, setActivePromptId] = useState<string>('0');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  const startExportDemo = () => {
    setIsExporting(true);
    setExportComplete(false);
    setTerminalLogs([t("export.logs.init"), t("export.logs.parsing"), t("export.logs.generating")]);

    const steps = [
      t("export.logs.mapping"),
      t("export.logs.dither"),
      t("export.logs.compress"),
      t("export.logs.done"),
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setTerminalLogs(prev => [...prev, step]);
        if (idx === steps.length - 1) {
          setIsExporting(false);
          setExportComplete(true);
        }
      }, (idx + 1) * 700);
    });
  };

  const runAiDemo = () => {
    setAiLoading(true);
    const prompt = t(`export.prompts.${activePromptId}`);
    setTerminalLogs(prev => [...prev, t("export.logs.aiAnalyzing", { prompt })]);
    
    setTimeout(() => {
      setTerminalLogs(prev => [
        ...prev, 
        t("export.logs.aiDone"),
        t("export.logs.aiPalette"),
        t("export.logs.aiShading"),
      ]);
      setAiLoading(false);
    }, 1500);
  };

  return (
    <div id="scene-export-ai" className="flex flex-col lg:flex-row gap-8 items-center max-w-6xl mx-auto px-4 md:px-8 py-4 w-full">
      
      {/* LEFT: Compiler Console & Format Options */}
      <div className="flex-1 w-full flex flex-col gap-4 relative">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#FF00AA]/5 rounded-full blur-3xl pointer-events-none" />
        
        <div id="scene-panel-4" data-scene-panel className="bg-[#07070A]/95 border-2 border-white/10 rounded-2xl p-5 shadow-[0_0_40px_rgba(255,0,170,0.05)] backdrop-blur-md relative overflow-visible">
          
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-mono text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-[#FF00AA]" /> {t("export.compiler")}
            </h3>
            <span className="text-[9px] font-mono text-[#FF00AA] border border-[#FF00AA]/30 px-1.5 py-0.5 rounded bg-[#FF00AA]/5 font-black uppercase">
              {t("export.atlasEngine")}
            </span>
          </div>
          <p className="text-[11px] font-mono text-gray-400 mb-4">
            {t("export.compilerDesc")}
          </p>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {EXPORT_FORMAT_IDS.map((formatId) => {
              const active = activeFormat === formatId;
              return (
                <button
                  id={`btn-format-${formatId}`}
                  key={formatId}
                  onClick={() => setActiveFormat(formatId)}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between gap-1.5 ${
                    active 
                      ? 'border-[#FF00AA] text-pink-400 bg-pink-500/10 shadow-[0_0_12px_rgba(255,0,170,0.15)] font-bold' 
                      : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="text-xs font-sans">{t(`export.formats.${formatId}.name`)}</span>
                  <span className={`text-[9px] font-mono px-1 py-0.5 rounded ${active ? 'bg-[#FF00AA] text-black font-semibold' : 'bg-white/5 text-gray-500'}`}>
                    {FORMAT_EXT[formatId]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Format description */}
          <p className="text-[10px] font-mono text-gray-500 bg-black/40 p-3 rounded-lg border border-white/5 mb-4">
            {t(`export.formats.${activeFormat}.desc`)}
          </p>

          {/* Export Action log typewriter dashboard */}
          <div className="h-32 bg-black border border-white/10 rounded-xl p-3 font-mono text-[9px] text-[#FF00AA]/80 mb-4 overflow-y-auto overflow-x-hidden flex flex-col gap-1 select-text scrollbar-thin">
            {terminalLogs.length === 0 ? (
              <span className="text-gray-600 italic">{t("export.ready")}</span>
            ) : (
              terminalLogs.map((log, idx) => (
                <div key={idx} className="flex gap-2 leading-relaxed">
                  <span className="text-gray-500 animate-pulse">❯</span>
                  <p>{log}</p>
                </div>
              ))
            )}
          </div>

          <button
            id="export-btn-compile"
            onClick={startExportDemo}
            disabled={isExporting}
            className="w-full py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-mono text-xs font-bold rounded-lg transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-[0_4px_15px_rgba(255,0,170,0.3)]"
          >
            {isExporting ? (
              <span className="flex items-center gap-1.5 animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin" /> {t("export.compiling")}
              </span>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>{t("export.buildPackage")}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* RIGHT: AI Prompt Optimizer & Launch CTA */}
      <div className="flex-1 w-full flex flex-col gap-3 justify-end">
        <h2 className="text-xl md:text-2xl font-sans tracking-tight text-white font-bold flex items-center gap-2">
          <Cpu className="w-6 h-6 text-pink-400 animate-pulse" /> {t("export.aiStudio")}
        </h2>
        <p className="text-xs font-mono text-gray-400 leading-relaxed max-w-lg mb-2">
          {t("export.aiStudioDesc")}
        </p>

        <div className="bg-[#09090C] border border-white/[0.05] p-4 rounded-xl flex flex-col gap-3 mb-2">
          <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block">{t("export.aiPrompts")}</span>
          
          <div className="flex flex-col gap-1.5">
            {PROMPT_IDS.map((promptId) => {
              const active = activePromptId === promptId;
              const prompt = t(`export.prompts.${promptId}`);
              return (
                <button
                  id={`btn-prompt-${promptId}`}
                  key={promptId}
                  onClick={() => setActivePromptId(promptId)}
                  className={`text-left p-2.5 text-xs font-mono rounded-lg border transition-all cursor-pointer flex items-center justify-between group ${
                    active 
                      ? 'border-[#00F5FF]/40 text-[#00F5FF] bg-cyan-900/10' 
                      : 'border-white/5 text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>{prompt}</span>
                  <Sparkles className={`w-3.5 h-3.5 ${active ? 'text-[#00F5FF] animate-pulse' : 'text-gray-500'} group-hover:scale-110 transition-transform`} />
                </button>
              );
            })}
          </div>

          <button
            id="export-btn-ai-optimize"
            onClick={runAiDemo}
            disabled={aiLoading}
            className="w-full py-1.5 bg-white/5 hover:bg-white/10 text-white text-[10px] font-mono font-bold rounded-lg transition-all border border-white/10 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {aiLoading ? t("export.synthesizing") : t("export.executeAi")}
          </button>
        </div>

        {/* BREATHTAKING BIG LAUNCH CTA */}
        <div className="relative mt-2 p-[2px] rounded-2xl bg-gradient-to-r from-[#00F5FF] via-[#FF00AA] to-[#39FF14] shadow-[0_0_40px_rgba(0,245,255,0.2)] hover:shadow-[0_0_50px_rgba(255,0,170,0.4)] transition-all group scale-100 active:scale-95 duration-200">
          <button
            id="btn-launch-tool"
            onClick={() => {
              alert(t("export.launchAlert"));
            }}
            className="w-full py-4 px-6 rounded-2xl bg-[#08080C] text-white flex flex-col sm:flex-row items-center justify-between gap-4 cursor-pointer relative overflow-hidden"
          >
            {/* Gloss shine effect overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
            
            <div className="text-left">
              <span className="text-[10px] font-mono text-[#00F5FF] font-black uppercase tracking-widest block mb-0.5 animate-pulse">
                {t("export.launchBadge")}
              </span>
              <h4 className="text-base font-sans font-extrabold tracking-tight group-hover:text-[#00F5FF] transition-colors flex items-center gap-1.5">
                <Gamepad2 className="w-5 h-5 text-cyan-400 group-hover:rotate-12 transition-transform" /> {t("export.launchTitle")}
              </h4>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#00F5FF] to-[#FF00AA] text-black font-mono text-xs font-bold shadow-[0_0_15px_rgba(0,245,255,0.4)] group-hover:scale-105 transition-transform">
              <span>{t("export.launchBtn")}</span>
              <ArrowIcon />
            </div>
          </button>
        </div>
      </div>

    </div>
  );
}

function ArrowIcon() {
  return (
    <svg className="w-4 h-4 fill-current stroke-[2.5]" viewBox="0 0 24 24">
      <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
