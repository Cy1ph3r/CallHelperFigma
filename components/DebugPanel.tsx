/**
 * ====================================================================
 * Debug Panel - للأدمن فقط
 * ====================================================================
 * 
 * يعرض معلومات تفصيلية عن Advanced Mode Flow للمساعدة في الاختبار
 * 
 * ⚠️ هذا Component للتطوير فقط - يمكن إخفاءه أو حذفه في الإنتاج
 * 
 * يعرض:
 * - Active Route
 * - Current Step
 * - Sub-condition المختار
 * - Action المنفذ
 * - Final Score
 * - Flow Log
 * 
 * ====================================================================
 */

import { Bug, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Badge } from './ui/badge';

interface DebugPanelProps {
  activeRoute: string | null;
  currentStep: {
    name: string;
    order: number;
  } | null;
  subCondition: string | null;
  action: 'continue' | 'force_solution' | 'escalation' | null;
  finalScore: number;
  flowLog: Array<{
    step: string;
    subCondition: string;
    action: string;
    timestamp: Date;
  }>;
  scoringBreakdown?: {
    caseDbId: string;
    caseId: string;
    keyword: {
      rawScore: number;
      boundedScore: number;
      weight: number;
      contribution: number;
    };
    usageFrequency: {
      score: number;
      weight: number;
      contribution: number;
    };
    freshness?: {
      score: number;
      weight: number;
      contribution: number;
      createdAt: string | null;
    };
    metadata: {
      overallScore: number;
      weight: number;
      contribution: number;
      userTypeScore: number | null;
      categoryScore: number | null;
      subCategoryScore: number | null;
    };
    finalScore: number;
  } | null;
}

export function DebugPanel({
  activeRoute,
  currentStep,
  subCondition,
  action,
  finalScore,
  flowLog,
  scoringBreakdown,
}: DebugPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="fixed bottom-4 left-4 z-50 w-96 glass-card border-2 border-amber-500/50 rounded-xl shadow-2xl overflow-hidden" dir="rtl">
      {/* Header */}
      <div 
        className="bg-gradient-to-r from-amber-500 to-orange-500 p-3 flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Bug className="size-5 text-white" />
          <span className="font-bold text-white text-sm">Debug Panel (Admin Only)</span>
        </div>
        {isExpanded ? (
          <ChevronDown className="size-4 text-white" />
        ) : (
          <ChevronUp className="size-4 text-white" />
        )}
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
          {/* Active Route */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-semibold">Active Route:</p>
            {activeRoute ? (
              <Badge className="bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400 border-0">
                {activeRoute}
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground">لا يوجد</span>
            )}
          </div>

          {/* Current Step */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-semibold">Current Step:</p>
            {currentStep ? (
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 border-0">
                  {currentStep.name}
                </Badge>
                <span className="text-xs text-muted-foreground">({currentStep.order}/n)</span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">لا يوجد</span>
            )}
          </div>

          {/* Sub-condition */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-semibold">Sub-condition:</p>
            {subCondition ? (
              <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400 border-0">
                {subCondition}
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground">لا يوجد</span>
            )}
          </div>

          {/* Action */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-semibold">Action:</p>
            {action ? (
              <Badge className={`border-0 ${
                action === 'continue' 
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                  : action === 'force_solution'
                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
              }`}>
                {action === 'continue' ? 'Continue' : action === 'force_solution' ? 'Force Solution' : 'Escalation'}
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground">لا يوجد</span>
            )}
          </div>

          {/* Final Score */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-semibold">Final Score:</p>
            <span className={`text-lg font-bold ${
              finalScore >= 90 
                ? 'text-emerald-600 dark:text-emerald-400'
                : finalScore >= 80
                ? 'text-cyan-600 dark:text-cyan-400'
                : finalScore >= 41
                ? 'text-yellow-600 dark:text-yellow-400'
                : 'text-orange-600 dark:text-orange-400'
            }`}>
              {finalScore}%
            </span>
          </div>

          {/* Matcher Scoring Breakdown */}
          <div className="space-y-2 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground font-semibold">Matcher Factors:</p>
            {!scoringBreakdown ? (
              <p className="text-xs text-muted-foreground">لا توجد بيانات بعد</p>
            ) : (
              <div className="text-xs glass-panel p-2 rounded-lg space-y-1">
                <p className="font-semibold text-foreground">
                  Case: {scoringBreakdown.caseId || scoringBreakdown.caseDbId}
                </p>
                <p className="text-muted-foreground">
                  Keyword: {scoringBreakdown.keyword.contribution.toFixed(2)} (w:{scoringBreakdown.keyword.weight})
                </p>
                <p className="text-muted-foreground">
                  Usage: {scoringBreakdown.usageFrequency.contribution.toFixed(2)} (w:{scoringBreakdown.usageFrequency.weight})
                </p>
                <p className="text-muted-foreground">
                  Freshness: {Number(scoringBreakdown.freshness?.contribution || 0).toFixed(2)} (w:{Number(scoringBreakdown.freshness?.weight || 0)})
                </p>
                <p className="text-muted-foreground">
                  Metadata: {scoringBreakdown.metadata.contribution.toFixed(2)} (w:{scoringBreakdown.metadata.weight})
                </p>
                <p className="font-semibold text-primary mt-1">Final: {scoringBreakdown.finalScore}%</p>
              </div>
            )}
          </div>

          {/* Flow Log */}
          <div className="space-y-2 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground font-semibold">Flow Log:</p>
            {flowLog.length === 0 ? (
              <p className="text-xs text-muted-foreground">لا توجد سجلات بعد</p>
            ) : (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {flowLog.map((log, index) => (
                  <div key={index} className="text-xs glass-panel p-2 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{log.step}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="text-primary">{log.subCondition}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {log.action === 'continue' ? '✓' : log.action === 'force_solution' ? '🛑' : '⚠️'} {log.action}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Console Message */}
          <div className="pt-2 border-t border-border">
            <p className="text-[10px] text-muted-foreground text-center">
              Check browser console for detailed logs
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
