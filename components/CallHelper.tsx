import { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import {
  Sparkles,
  Copy,
  CheckCircle2,
  MessageCircle,
  RefreshCcw,
  Sliders,
  ThumbsUp,
  Wand2,
  HelpCircle,
  Send,
  Bot,
  Zap,
  ArrowRight,
  Info,
  AlertTriangle,
  ListFilter,
} from "lucide-react";
import { 
  calculateConfidence, 
  suggestProblemType,
  PROBLEM_TYPES 
} from "../utils/mockConfidenceData";

// ============ NEW: Import Real Confidence API ============
import { analyzeConfidenceDebounced, cancelDebouncedAnalysis } from "../services/confidenceService";

// ============ NEW: Import Description Matching Functions ============
import {
  getResponseForProblem,
  type RegisteredProblem
} from "../services/mockData";

// ============ NEW: Import Real Database Search ============
import { 
  searchWithFallback, 
  getFormattedResponse,
  type KnowledgeSearchResult 
} from "../services/knowledgeService";

// ============ NEW: Import Advanced Settings Context ============
import { useAdvancedSettings } from "../contexts/AdvancedSettingsContext";
import type { Route, Step, SubCondition } from "../contexts/AdvancedSettingsContext";

// ============ NEW: Import Debug Panel (Admin Only) ============
import { DebugPanel } from "./DebugPanel";

// ============ NEW: Import Auth Context (to check if user is admin) ============
import { useAuth } from "../contexts/AuthContext";

// ============ NEW: Import Advanced Flow Panel ============
import { AdvancedFlowPanelV2 } from "./AdvancedFlowPanelV2Simple";

// ============ NEW: Import AI Response Generator ============
import { generateAIResponse, simulateAIProcessing } from "../utils/mockAIResponses";

// ============ NEW: Import Gray Area Wizard ============
import { GrayAreaWizard, type FlowPath } from "./GrayAreaWizard";

export function CallHelper({ isDarkMode }: { isDarkMode: boolean }) {
  const ENABLE_AI = import.meta.env.VITE_ENABLE_AI === "true";
  const USER_TYPE_OPTIONS = [
    'وكيل خارجي',
    'شركة عمرة',
    'مقدم خدمة سكن',
    'مكتب شؤون',
    'منظم تابع',
  ] as const;

  // =========================
  // Real call logging (for analytics)
  // =========================
  const logCallToBackend = async (params: {
    generatedResponse: string;
    status: "pending" | "resolved" | "escalated" | "closed";
    flowResult?: unknown;
  }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token || token === "local-auth-token") return;

      // Only log when we have the minimum required fields for CallLog
      if (!customerName || !entityType || !problemSummary) return;

      await fetch("/api/calls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerName,
          entityType,
          problemType: selectedProblemType || "general",
          problemSummary,
          flowResult: params.flowResult,
          generatedResponse: params.generatedResponse,
          status: params.status,
        }),
      });
    } catch (error) {
      // Don't block the UX for logging failures
      console.warn("⚠️ Failed to log call for analytics", error);
    }
  };
  const [customerName, setCustomerName] = useState("");
  const [entityType, setEntityType] = useState("");
  const [problemDescription, setProblemDescription] = useState("");
  const [problemSummary, setProblemSummary] = useState("");
  const [generatedText, setGeneratedText] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [onTeachPage, setOnTeachPage] = useState(false);
  const [showWhyPopup, setShowWhyPopup] = useState(false);
  const [isAlternativeFormat, setIsAlternativeFormat] = useState(false);
  const [showRafeeqChat, setShowRafeeqChat] = useState(false);
  const [isRafeeqActive, setIsRafeeqActive] = useState(false);
  const [chatMessage, setChatMessage] = useState("");

  // ============ NEW: Gray Area & Advanced Mode States ============
  /**
   * Confidence score (0-100) calculated from problem description
   * TODO: Replace with backend API response
   */
  const [confidenceScore, setConfidenceScore] = useState<number>(100);

  /**
   * Shows Gray Area dialog when confidence < 40%
   */
  const [showGrayAreaDialog, setShowGrayAreaDialog] = useState(false);

  /**
   * Selected problem type from Gray Area
   */
  const [selectedProblemType, setSelectedProblemType] = useState<string>("");

  /**
   * Whether advanced mode is enabled (auto-enabled after Gray Area selection)
   */
  const [isAdvancedModeEnabled, setIsAdvancedModeEnabled] = useState(false);

  /**
   * Track if user resolved Gray Area by selecting problem type
   * This overrides the direct answer route logic
   */
  const [wasGrayAreaResolved, setWasGrayAreaResolved] = useState(false);

  /**
   * Advanced mode options (will be populated based on problem type)
   * TODO: Connect to decision tree backend
   */
  const [advancedOptions, setAdvancedOptions] = useState<any>(null);

  // ============ NEW: Description Matching States ============
  /**
   * Match percentage from description matching (0-100)
   */
  const [descriptionMatchPercentage, setDescriptionMatchPercentage] = useState<number>(0);

  /**
   * Matched problem from registered problems database
   */
  const [matchedProblem, setMatchedProblem] = useState<RegisteredProblem | null>(null);

  /**
   * Whether the generated text is from a matched problem (not AI generated)
   */
  const [isMatchedResponse, setIsMatchedResponse] = useState(false);

  // ============ NEW: Advanced Settings Context ============
  const { routes, steps, grayAreaSettings, scoringSettings, getStepsByRoute } = useAdvancedSettings();

  // ============ NEW: Auth Context ============
  const { user } = useAuth();

  // ============ NEW: Get enabled questions only for Gray Area Dialog ============
  const enabledQuestions = grayAreaSettings.questions.filter(q => q.isEnabled);

  // ============ NEW: Selected question's linked routes ============
  const [selectedQuestionLinkedRoutes, setSelectedQuestionLinkedRoutes] = useState<string[]>([]);

  // ============ NEW: Score Thresholds from Settings ============
  const directAnswerThreshold = scoringSettings.scoreThresholds.directAnswer;
  const showAdvancedThreshold = scoringSettings.scoreThresholds.showAdvanced;
  const grayAreaThreshold = scoringSettings.scoreThresholds.grayArea;

  // ============ NEW: Debug Panel States (Admin Only) ============
  /**
   * Active route in advanced mode flow
   */
  const [debugActiveRoute, setDebugActiveRoute] = useState<string | null>(null);

  /**
   * Current step in flow
   */
  const [debugCurrentStep, setDebugCurrentStep] = useState<{ name: string; order: number } | null>(null);

  /**
   * Selected sub-condition
   */
  const [debugSubCondition, setDebugSubCondition] = useState<string | null>(null);

  /**
   * Action taken
   */
  const [debugAction, setDebugAction] = useState<'continue' | 'force_solution' | 'escalation' | null>(null);

  /**
   * Flow log for debugging
   */
  const [debugFlowLog, setDebugFlowLog] = useState<Array<{
    step: string;
    subCondition: string;
    action: string;
    timestamp: Date;
  }>>([]);

  /**
   * Calculate confidence score whenever problem description changes
   * Uses real backend API with debouncing (500ms delay after user stops typing)
   */
  useEffect(() => {
    if (problemSummary.trim()) {
      // Use debounced API call to backend
      analyzeConfidenceDebounced(problemSummary, (result) => {
        if (result.success && result.data) {
          setConfidenceScore(result.data.confidenceScore);
          
          // Log provider for debugging (optional)
          if (result.metadata?.provider === 'fallback') {
            console.log('ℹ️ Using fallback confidence calculation:', result.metadata.reason);
          } else if (result.metadata?.provider === 'openai') {
            console.log('✅ OpenAI confidence analysis:', result.data.confidenceScore + '%');
          }
        } else {
          // Fallback to local calculation on error
          console.warn('⚠️ Confidence API failed, using local fallback');
          const score = calculateConfidence(problemSummary);
          setConfidenceScore(score);
        }
      });
    } else {
      setConfidenceScore(100); // Reset when empty
      cancelDebouncedAnalysis(); // Cancel pending analysis
    }
    
    // Cleanup: cancel pending analysis when component unmounts
    return () => {
      cancelDebouncedAnalysis();
    };
  }, [problemSummary]);

  const handleGenerate = async () => {
    if (!customerName || !entityType || !problemSummary) {
      return;
    }

    setIsGenerating(true);
    setIsAlternativeFormat(false);

    // ✅ Reset Gray Area states when generating new response
    setWasGrayAreaResolved(false);
    setSelectedProblemType("");
    setIsAdvancedModeEnabled(false);
    setActiveButton(null);

    try {
      // ============ NEW: Search real database only (no mock fallback) ============
      console.log('🔍 Searching knowledge base for:', problemSummary);
      
      const searchResult = await searchWithFallback(problemSummary, false);

      // If we found a match with good percentage (> 40%), use it
      if (searchResult.isMatched && searchResult.problem) {
        console.log('✅ Match found:', searchResult.matchPercentage + '%');
        
        const formattedText = getFormattedResponse(
          searchResult.problem,
          customerName,
          entityType
        );
        
        setGeneratedText(formattedText);
        void logCallToBackend({
          generatedResponse: formattedText,
          status: "pending",
        });
        setDescriptionMatchPercentage(searchResult.matchPercentage);
        // Update confidence score to match percentage to prevent gray area warning
        setConfidenceScore(searchResult.matchPercentage);
        setMatchedProblem({
          id: searchResult.problem.id,
          title: searchResult.problem.title,
          description: searchResult.problem.description,
          response: searchResult.problem.solution,
          keywords: searchResult.problem.keywords,
          category: searchResult.problem.category,
          confidence: searchResult.problem.confidence,
        } as RegisteredProblem);
        setIsMatchedResponse(true);
      } else {
        // No match found - generate generic response
        console.log('❌ No match found, using generic response');
        
      const entityTypeArabic = entityType;

        const generated = `السلام عليكم ورحمة الله وبركاته،\n\nتم استقبال بلاغ من العميل: ${customerName}\nنوع الجهة: ${entityTypeArabic}\n\nوصف المشكلة:\n${problemSummary}\n\nتم تسجيل البلاغ في النظام وسيتم المتابعة مع الفريق المختص.\n\nشكراً لتواصلكم معنا.`;

        setGeneratedText(generated);
        void logCallToBackend({
          generatedResponse: generated,
          status: "pending",
        });
        setDescriptionMatchPercentage(searchResult.matchPercentage);
        setMatchedProblem(null);
        setIsMatchedResponse(false);
      }
    } catch (error) {
      console.error('❌ Error during knowledge base search:', error);
      
      // Fallback to generic response on error
      const entityTypeArabic = entityType;

      const generated = `السلام عليكم ورحمة الله وبركاته،\n\nتم استقبال بلاغ من العميل: ${customerName}\nنوع الجهة: ${entityTypeArabic}\n\nوصف المشكلة:\n${problemSummary}\n\nتم تسجيل البلاغ في النظام وسيتم المتابعة مع الفريق المختص.\n\nشكراً لتواصلكم معنا.`;

      setGeneratedText(generated);
      void logCallToBackend({
        generatedResponse: generated,
        status: "pending",
      });
      setDescriptionMatchPercentage(0);
      setMatchedProblem(null);
      setIsMatchedResponse(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateAlternative = () => {
    setIsGenerating(true);
    setIsAlternativeFormat(true);

    setTimeout(() => {
      const entityTypeArabic = entityType;

      const alternativeGenerated = `مرحباً،\n\nنفيدكم باستلام بلاغكم بخصوص:\nاسم المبلغ: ${customerName}\nطبيعة الجهة: ${entityTypeArabic}\n\nتفاصيل البلاغ:\n${problemSummary}\n\nسيتم دراسة الموضوع والرد عليكم في أقرب وقت.\n\nمع التقدير،`;

      setGeneratedText(alternativeGenerated);
      void logCallToBackend({
        generatedResponse: alternativeGenerated,
        status: "pending",
      });
      setIsGenerating(false);
    }, 500);
  };

  const handleCopy = () => {
    const textarea = document.createElement("textarea");
    textarea.value = generatedText;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand("copy");
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    } finally {
      document.body.removeChild(textarea);
    }
  };

  /**
   * Handle Gray Area problem type selection
   * Activates advanced mode and passes problem type
   * 
   * UPDATED: Don't generate response or update confidence here
   * Wait until user completes the advanced flow (escalation or force_solution)
   */
  const handleProblemTypeSelect = (typeId: string) => {
    setSelectedProblemType(typeId);
    
    // Get linked routes for the selected question
    const selectedQuestion = grayAreaSettings.questions.find(q => q.id === typeId);
    if (selectedQuestion) {
      setSelectedQuestionLinkedRoutes(selectedQuestion.linkedRouteIds);
    }
    
    // Auto-enable advanced mode
    setIsAdvancedModeEnabled(true);
    setActiveButton("advanced");

    // ❌ DON'T update confidence score here - wait for flow completion
    // setConfidenceScore(100); 

    // Mark Gray Area as resolved (to show buttons and hide warning)
    setWasGrayAreaResolved(true);

    // TODO: Fetch advanced options from backend based on selected problem type
    // For now, using mock structure
    const mockAdvancedOptions = {
      problemType: typeId,
      availableActions: [
        "إجراء فوري",
        "تصعيد للإدارة",
        "متابعة لاحقة"
      ],
      suggestedPriority: "عالية"
    };
    setAdvancedOptions(mockAdvancedOptions);

    // Close Gray Area dialog
    setShowGrayAreaDialog(false);

    // ❌ DON'T re-generate here - wait for advanced flow completion
    // Just keep the existing generated text (if any) or show placeholder
  };

  /**
   * Determine if we should show Gray Area (low confidence)
   * Uses grayAreaThreshold from settings instead of hardcoded value
   * IMPORTANT: Hide Gray Area if wasGrayAreaResolved is true (user already selected problem type)
   */
  const isLowConfidence = !wasGrayAreaResolved && confidenceScore < grayAreaThreshold && generatedText;

  /**
   * Calculate the actual displayed score (for consistency)
   * Use descriptionMatchPercentage if > 40, otherwise use confidenceScore
   * This ensures button logic matches what user sees
   */
  const displayedScore = descriptionMatchPercentage > 40 ? descriptionMatchPercentage : confidenceScore;

  /**
   * NEW: Determine button visibility based on DISPLAYED score and settings thresholds
   * Uses directAnswerThreshold and showAdvancedThreshold from settings
   * >= directAnswerThreshold: Direct Answer route - Only show "أفدتك؟" button
   * >= showAdvancedThreshold and < directAnswerThreshold: Show Advanced + other solution - Show all buttons
   * < grayAreaThreshold: Gray Area - Show "حدد نوع المشكلة" warning
   * EXCEPTION: If wasGrayAreaResolved is true, always show all buttons
   */
  const isDirectAnswerRoute = !wasGrayAreaResolved && displayedScore >= directAnswerThreshold;
  const showAllButtons = wasGrayAreaResolved || (displayedScore >= showAdvancedThreshold && displayedScore < directAnswerThreshold);

  /**
   * Handle Advanced Mode toggle
   * TODO: Connect to decision tree backend when enabled
   */
  const handleAdvancedModeToggle = () => {
    const newState = activeButton === "advanced" ? null : "advanced";
    setActiveButton(newState);
    
    if (newState === "advanced" && !isAdvancedModeEnabled) {
      // First time enabling advanced mode
      // TODO: Fetch decision tree options from backend
      setIsAdvancedModeEnabled(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 text-center shadow-lg border-2 border-border">
        <h1 className="text-2xl sm:text-4xl font-black gradient-text">Smart Call Helper</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Left Panel - Input Form */}
        <Card className="glass-card border-0 rounded-3xl overflow-hidden shadow-lg">
          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 dark:from-cyan-500/5 dark:to-blue-500/5 p-4 sm:p-6 border-b">
            <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <MessageCircle className="size-5 sm:size-6 text-primary" />
              بيانات البلاغ
            </h2>
          </div>
          <CardContent className="p-4 sm:p-6 lg:p-8 space-y-5">
            {/* Customer Name */}
            <div className="space-y-2">
              <Label htmlFor="customerName" className="text-right block text-foreground font-semibold text-sm">
                اسم العميل
              </Label>
              <Input
                id="customerName"
                type="text"
                placeholder="أدخل اسم العميل..."
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="text-right glass-panel border focus:border-primary rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground transition-all"
              />
            </div>

            {/* Entity Type */}
            <div className="space-y-2">
              <Label htmlFor="entityType" className="text-right block text-foreground font-semibold text-sm">
                مقدم الخدمة
              </Label>
              <Select value={entityType} onValueChange={setEntityType} dir="rtl">
                <SelectTrigger
                  id="entityType"
                  className="text-right glass-panel border focus:border-primary rounded-xl px-4 py-3 [&>span]:text-right text-foreground"
                >
                  <SelectValue placeholder="اختر نوع المستخدم..." />
                </SelectTrigger>
                <SelectContent className="glass-card" dir="rtl">
                  {USER_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option} className="text-right cursor-pointer rounded-lg">
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Problem Summary */}
            <div className="space-y-2">
              <Label htmlFor="problemSummary" className="text-right block text-foreground font-semibold text-sm">
                وصف المشكلة
              </Label>
              <Textarea
                id="problemSummary"
                placeholder="اكتب وصف تفصيلي للمشكلة..."
                value={problemSummary}
                onChange={(e) => setProblemSummary(e.target.value)}
                className="text-right glass-panel border focus:border-primary rounded-xl px-4 py-3 min-h-[100px] text-foreground placeholder:text-muted-foreground resize-none transition-all"
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!customerName || !entityType || !problemSummary}
              className={`w-full group relative overflow-hidden rounded-xl py-3.5 transition-all duration-300 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed ${
                isGenerating
                  ? "bg-gradient-to-r from-cyan-400 to-blue-400"
                  : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 active:scale-[0.98]"
              }`}
            >
              {isGenerating && (
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-300/50 to-blue-300/50 animate-pulse" />
              )}
              <div className="relative flex items-center justify-center gap-2.5 text-white font-bold text-sm">
                <Wand2 className={`size-4 ${isGenerating ? "animate-spin" : ""}`} />
                <span>{isGenerating ? "جاري التوليد..." : "توليد الصيغة"}</span>
              </div>
            </button>
          </CardContent>
        </Card>

        {/* Right Panel - Generated Output */}
        <Card className="glass-card border-0 rounded-3xl overflow-hidden shadow-lg">
          <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-blue-500/5 dark:to-indigo-500/5 p-4 sm:p-6 border-b">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-foreground">الصيغة المولدة</h2>
                {generatedText && !isLowConfidence && (
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className="p-2 hover:bg-accent/50 rounded-lg transition-all"
                        >
                          <HelpCircle className="size-4 text-primary" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent 
                        side="bottom" 
                        className="glass-card border p-3 max-w-xs"
                        dir="rtl"
                      >
                        <div className="space-y-2 text-right">
                          <p className="text-xs font-semibold text-foreground">
                            سبب اختيار هذه الصيغة
                          </p>
                          <button
                            onClick={() => {
                              if (ENABLE_AI) {
                                setShowWhyPopup(false);
                                setShowRafeeqChat(true);
                              } else {
                                setShowRafeeqChat(false);
                                setShowWhyPopup(true);
                              }
                            }}
                            className="w-full px-3 py-2 text-xs bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all font-medium shadow-md flex items-center justify-center gap-1.5"
                          >
                            <Info className="size-3" />
                            المزيد من التفاصيل
                          </button>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              {isAlternativeFormat && (
                <Badge className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0 shadow-md text-xs">
                  صيغة بديلة
                </Badge>
              )}
            </div>
          </div>
          <CardContent className="p-4 sm:p-6 lg:p-8 space-y-4">
            {/* ============ GRAY AREA WARNING (shows when confidence < 40%) ============ */}
            {isLowConfidence && (
              <div className="glass-panel border-2 border-orange-500/50 dark:border-orange-400/50 rounded-xl p-4 space-y-3 bg-orange-50/50 dark:bg-orange-950/20">
                <div className="flex items-start gap-3 text-right">
                  <AlertTriangle className="size-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-semibold text-orange-900 dark:text-orange-300">
                      الوصف غير واضح بما يكفي
                    </p>
                    <p className="text-xs text-orange-800 dark:text-orange-400">
                      ساعدنا بتحديد نوع المشكلة للحصول على نتائج أفضل وأكثر دقة
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGrayAreaDialog(true)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold flex items-center justify-center gap-2 shadow-lg transition-all"
                >
                  <ListFilter className="size-4" />
                  <span>حدد نوع المشكلة</span>
                </button>
              </div>
            )}

            {/* ============ DESCRIPTION MATCH INDICATOR (shows above generated text box) ============ */}
            {/* Shows either descriptionMatchPercentage OR confidenceScore */}
            {generatedText && !isLowConfidence && (
              <div className={`glass-panel rounded-xl p-3 border-2 ${
                // If we have description match, use it; otherwise use confidence score
                descriptionMatchPercentage > 40 ? (
                  descriptionMatchPercentage >= 90 
                    ? 'border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20' 
                    : descriptionMatchPercentage >= 80 
                    ? 'border-cyan-500/50 bg-cyan-50/50 dark:bg-cyan-950/20'
                    : 'border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20'
                ) : (
                  // Use confidence score colors
                  confidenceScore >= 90
                    ? 'border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : confidenceScore >= 80
                    ? 'border-cyan-500/50 bg-cyan-50/50 dark:bg-cyan-950/20'
                    : 'border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20'
                )
              }`}>
                <div className="flex items-center justify-between text-right">
                  <div className="flex items-center gap-2">
                    <div className={`size-2 rounded-full animate-pulse ${
                      descriptionMatchPercentage > 40 ? (
                        descriptionMatchPercentage >= 90 
                          ? 'bg-emerald-500' 
                          : descriptionMatchPercentage >= 80 
                          ? 'bg-cyan-500'
                          : 'bg-yellow-500'
                      ) : (
                        confidenceScore >= 90
                          ? 'bg-emerald-500'
                          : confidenceScore >= 80
                          ? 'bg-cyan-500'
                          : 'bg-yellow-500'
                      )
                    }`} />
                    <span className={`text-xs font-semibold ${
                      descriptionMatchPercentage > 40 ? (
                        descriptionMatchPercentage >= 90 
                          ? 'text-emerald-700 dark:text-emerald-400' 
                          : descriptionMatchPercentage >= 80 
                          ? 'text-cyan-700 dark:text-cyan-400'
                          : 'text-yellow-700 dark:text-yellow-400'
                      ) : (
                        confidenceScore >= 90
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : confidenceScore >= 80
                          ? 'text-cyan-700 dark:text-cyan-400'
                          : 'text-yellow-700 dark:text-yellow-400'
                      )
                    }`}>
                      {descriptionMatchPercentage > 40 ? (
                        descriptionMatchPercentage >= 90 
                          ? 'تطابق ممتاز' 
                          : descriptionMatchPercentage >= 80 
                          ? 'تطابق جيد'
                          : 'تطابق متوسط'
                      ) : (
                        confidenceScore >= 90
                          ? 'دقة ممتازة'
                          : confidenceScore >= 80
                          ? 'دقة جيدة'
                          : 'دقة متوسطة'
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isMatchedResponse && descriptionMatchPercentage > 40 && (
                      <Badge className="bg-primary/10 text-primary border-0 text-[10px]">
                        رد جاهز
                      </Badge>
                    )}
                    <span className={`font-bold text-sm ${
                      descriptionMatchPercentage > 40 ? (
                        descriptionMatchPercentage >= 90 
                          ? 'text-emerald-600 dark:text-emerald-400' 
                          : descriptionMatchPercentage >= 80 
                          ? 'text-cyan-600 dark:text-cyan-400'
                          : 'text-yellow-600 dark:text-yellow-400'
                      ) : (
                        confidenceScore >= 90
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : confidenceScore >= 80
                          ? 'text-cyan-600 dark:text-cyan-400'
                          : 'text-yellow-600 dark:text-yellow-400'
                      )
                    }`}>
                      {descriptionMatchPercentage > 40 ? descriptionMatchPercentage : confidenceScore}%
                    </span>
                  </div>
                </div>
                {matchedProblem && descriptionMatchPercentage > 40 && (
                  <div className="mt-2 pt-2 border-t border-current/10">
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-[10px] text-muted-foreground text-right cursor-help truncate">
                            مطابق مع: {matchedProblem.description}
                          </p>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="glass-card border max-w-sm" dir="rtl">
                          <div className="space-y-1 text-right">
                            <p className="text-xs font-semibold text-foreground">المشكلة المسجلة:</p>
                            <p className="text-xs text-muted-foreground">{matchedProblem.description}</p>
                            <div className="flex items-center gap-2 pt-1">
                              <Badge className="bg-primary/10 text-primary border-0 text-[10px]">
                                {matchedProblem.category}
                              </Badge>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                matchedProblem.priority === 'high' 
                                  ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                                  : matchedProblem.priority === 'medium'
                                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400'
                                  : 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                              }`}>
                                {matchedProblem.priority === 'high' ? 'أولوية عالية' : matchedProblem.priority === 'medium' ? 'أولوية متوسطة' : 'أولوية منخفضة'}
                              </span>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
              </div>
            )}

            {/* Generated Text with Blur Effect for Low Confidence */}
            <div className={`relative ${isLowConfidence ? 'pointer-events-none' : ''}`}>
              <Textarea
                value={generatedText}
                readOnly
                placeholder="سيتم عرض الصيغة المولدة هنا..."
                className={`text-right glass-panel border rounded-xl px-4 py-3 min-h-[240px] resize-none text-foreground placeholder:text-muted-foreground transition-all ${
                  isLowConfidence ? 'blur-sm select-none' : ''
                }`}
              />
              {isLowConfidence && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/5 rounded-xl">
                  <div className="text-center space-y-2">
                    <AlertTriangle className="size-8 text-orange-500 mx-auto" />
                    <p className="text-sm font-semibold text-muted-foreground">حدد نوع المشكلة أولاً</p>
                  </div>
                </div>
              )}
            </div>

            {generatedText && !isLowConfidence && (
              <>
                {/* Copy Button */}
                <button
                  onClick={handleCopy}
                  className={`w-full py-3 rounded-xl transition-all duration-300 font-semibold flex items-center justify-center gap-2 shadow-md text-sm ${
                    isCopied
                      ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white"
                      : "glass-panel hover:bg-accent/50 text-foreground border"
                  }`}
                >
                  {isCopied ? (
                    <>
                      <CheckCircle2 className="size-4" />
                      <span>تم النسخ بنجاح!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-4" />
                      <span>نسخ النص</span>
                    </>
                  )}
                </button>

                {/* Action Buttons */}
                {/* 
                  NEW LOGIC based on scoring thresholds:
                  - >= 80%: Direct Answer - Show ONLY "أفدتك؟" button
                  - >= 50% and < 80%: Show Advanced + other solution - Show ALL 3 buttons
                  - < 50%: Gray Area - handled above with warning
                */}
                {isDirectAnswerRoute ? (
                  /* ============ DIRECT ANSWER ROUTE (>= 80%) ============ */
                  /* Only show "أفدتك؟" button */
                  <div className="flex justify-center">
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => {
                              setActiveButton(activeButton === "helpful" ? null : "helpful");
                            }}
                            className={`w-full max-w-xs py-3 rounded-xl transition-all duration-300 font-semibold flex items-center justify-center gap-2 shadow-md ${
                              activeButton === "helpful"
                                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                                : "glass-panel hover:bg-accent/50 border"
                            }`}
                          >
                            <ThumbsUp className={`size-5 ${activeButton === "helpful" ? "scale-125" : ""} transition-transform ${activeButton === "helpful" ? "" : "text-emerald-600 dark:text-emerald-400"}`} />
                            <span className={`text-sm ${activeButton === "helpful" ? "" : "text-emerald-700 dark:text-emerald-300"}`}>أفدتك؟</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="border-2 border-border bg-gray-900 dark:bg-gray-100 shadow-xl">
                          <p className="text-xs text-gray-100 dark:text-gray-900 font-medium">ما كانت دقيقة! علمني الصح</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                ) : showAllButtons ? (
                  /* ============ SHOW ADVANCED + OTHER SOLUTION (>= 50% and < 80%) ============ */
                  /* Show all 3 buttons */
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <button
                      onClick={() => {
                        setActiveButton(activeButton === "retry" ? null : "retry");
                        handleGenerateAlternative();
                      }}
                      className={`py-2.5 sm:py-3 rounded-xl transition-all duration-300 font-semibold flex flex-col items-center justify-center gap-1 shadow-md ${
                        activeButton === "retry"
                          ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                          : "glass-panel hover:bg-accent/50 border"
                      }`}
                    >
                      <RefreshCcw className={`size-4 ${activeButton === "retry" ? "rotate-180" : ""} transition-transform ${activeButton === "retry" ? "" : "text-cyan-600 dark:text-cyan-400"}`} />
                      <span className={`text-[10px] sm:text-xs ${activeButton === "retry" ? "" : "text-cyan-700 dark:text-cyan-300"}`}>صيغة أخرى</span>
                    </button>

                    {/* ============ ADVANCED MODE BUTTON ============ */}
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={handleAdvancedModeToggle}
                            className={`py-2.5 sm:py-3 rounded-xl transition-all duration-300 font-semibold flex flex-col items-center justify-center gap-1 shadow-md relative ${
                                activeButton === "advanced"
                                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                                  : "glass-panel hover:bg-accent/50 border"
                            }`}
                          >
                            {isAdvancedModeEnabled && (
                              <div className="absolute -top-1 -right-1 size-3 bg-cyan-500 rounded-full border-2 border-background" />
                            )}
                            <Sliders className={`size-4 ${activeButton === "advanced" ? "rotate-12" : ""} transition-transform ${activeButton === "advanced" ? "" : "text-blue-600 dark:text-blue-400"}`} />
                            <span className={`text-[10px] sm:text-xs ${activeButton === "advanced" ? "" : "text-blue-700 dark:text-blue-300"}`}>وضع متقدم</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="border-2 border-border bg-gray-900 dark:bg-gray-100 max-w-xs shadow-xl" dir="rtl">
                          <div className="text-right space-y-1">
                            <p className="text-xs font-semibold text-gray-100 dark:text-gray-900">الوضع المتقدم</p>
                            <p className="text-[10px] text-gray-300 dark:text-gray-700">
                              {isAdvancedModeEnabled 
                                ? "يتم عرض خيارات متقدمة بناءً على نوع المشكلة المحدد"
                                : "سيتم تفعيله تلقائياً عند تحديد نوع المشكلة أو يمكنك تفعيله يدوياً"
                              }
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => {
                              setActiveButton(activeButton === "helpful" ? null : "helpful");
                            }}
                            className={`py-2.5 sm:py-3 rounded-xl transition-all duration-300 font-semibold flex flex-col items-center justify-center gap-1 shadow-md ${
                              activeButton === "helpful"
                                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                                : "glass-panel hover:bg-accent/50 border"
                            }`}
                          >
                            <ThumbsUp className={`size-4 ${activeButton === "helpful" ? "scale-125" : ""} transition-transform ${activeButton === "helpful" ? "" : "text-emerald-600 dark:text-emerald-400"}`} />
                            <span className={`text-[10px] sm:text-xs ${activeButton === "helpful" ? "" : "text-emerald-700 dark:text-emerald-300"}`}>أفدتك؟</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="border-2 border-border bg-gray-900 dark:bg-gray-100 shadow-xl">
                          <p className="text-xs text-gray-100 dark:text-gray-900 font-medium">ما كانت دقيقة! علمني الصح</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                ) : null}

                {/* ============ ADVANCED MODE PANEL ============ */}
                {/* Shows when advanced mode is active */}
                {activeButton === "advanced" && isAdvancedModeEnabled && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    {selectedProblemType && (
                      <div className="flex items-center justify-between text-xs glass-panel rounded-lg p-3 border">
                        <span className="text-muted-foreground">نوع المشكلة المحدد:</span>
                        <Badge className="bg-primary/10 text-primary border-0">
                          {grayAreaSettings.questions.find(q => q.id === selectedProblemType)?.title || PROBLEM_TYPES.find(t => t.id === selectedProblemType)?.name || 'عام'}
                        </Badge>
                      </div>
                    )}

                    {/* Advanced Flow Panel */}
                    <AdvancedFlowPanelV2
                      routes={routes}
                      steps={steps}
                      problemDescription={problemSummary}
                      isGrayAreaMode={wasGrayAreaResolved} // true = Gray Area (< 50%), false = Advanced Mode (50-79%)
                      initialFilteredRouteIds={selectedQuestionLinkedRoutes} // Pass linked routes from Gray Area selection
                      onFlowComplete={async (result) => {
                        console.log('🏁 Advanced Flow Complete:', result);
                        
                        // ✅ NOW update confidence score to 100% (flow completed successfully)
                        setConfidenceScore(100);
                        
                        // Get the last SubCondition to generate the response
                        const lastStep = result.completedSteps[result.completedSteps.length - 1];
                        const lastSubCondition = lastStep.selectedSubCondition;
                        
                        console.log('📝 Generating response based on last SubCondition:', {
                          name: lastSubCondition.name,
                          action: lastSubCondition.action,
                          actionDetails: lastSubCondition.actionDetails,
                        });
                        
                        // Generate response based on final action
                        // Common variables
                        const entityTypeArabic = entityType;
                        const problemTypeName = selectedProblemType 
                          ? (PROBLEM_TYPES.find(t => t.id === selectedProblemType)?.name || '')
                          : '';
                        
                        if (result.finalAction === 'escalation') {
                          const escalationText = lastSubCondition.actionDetails || 'يرجى تصعيد المشكلة للقسم المختص';
                          const newGeneratedText = `السلام عليكم ورحمة الله وبركاته،\n\nتم استقبال بلاغ من العميل: ${customerName}\nنوع الجهة: ${entityTypeArabic}\nنوع المشكلة: ${problemTypeName}\n\nالحالة: ${lastSubCondition.name}\n\n⚠️ تصعيد:\\n${escalationText}\\n\nشكراً لتواصلكم معنا.`;
                          setGeneratedText(newGeneratedText);
                          void logCallToBackend({
                            generatedResponse: newGeneratedText,
                            status: "escalated",
                            flowResult: result,
                          });
                        } else if (result.finalAction === 'force_solution') {
                          const solutionText = lastSubCondition.actionDetails || 'الحل المقترح';
                          const newGeneratedText = `السلام عليكم ورحمة الله وبركاته،\n\nتم استقبال بلاغ من العميل: ${customerName}\nنوع الجهة: ${entityTypeArabic}\nنوع المشكلة: ${problemTypeName}\n\nالحالة: ${lastSubCondition.name}\n\n💡 الحل:\\n${solutionText}\\n\nشكراً لتواصلكم معنا.`;
                          setGeneratedText(newGeneratedText);
                          void logCallToBackend({
                            generatedResponse: newGeneratedText,
                            status: "resolved",
                            flowResult: result,
                          });
                        } else {
                          // Continue action - generate success message
                          const entityTypeArabic = entityType;
                          const problemTypeName = selectedProblemType 
                            ? (PROBLEM_TYPES.find(t => t.id === selectedProblemType)?.name || '')
                            : '';
                          
                          const continueMessage = `السلام عليكم ورحمة الله وبركاته،\n\nتم استقبال بلاغ من العميل: ${customerName}\nنوع الجهة: ${entityTypeArabic}\nنوع المشكلة: ${problemTypeName}\n\nالحالة: ${lastSubCondition.name}\n\n✅ تمت معالجة جميع الخطوات بنجاح.\n\nشكراً لتواصلكم معنا.`;
                          
                          setGeneratedText(continueMessage);
                          void logCallToBackend({
                            generatedResponse: continueMessage,
                            status: "pending",
                            flowResult: result,
                          });
                        }

                        // Add to flow log
                        result.completedSteps.forEach((step) => {
                          setDebugFlowLog(prev => [
                            ...prev,
                            {
                              step: step.stepName,
                              subCondition: step.selectedSubCondition.name,
                              action: step.selectedSubCondition.action,
                              timestamp: new Date(),
                            },
                          ]);
                        });
                      }}
                      onDebugUpdate={(data) => {
                        setDebugActiveRoute(data.activeRoute);
                        setDebugCurrentStep(data.currentStep);
                        setDebugSubCondition(data.subCondition);
                        setDebugAction(data.action);
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ============ GRAY AREA WIZARD (Problem Type & Route Selection) ============ */}
      <GrayAreaWizard
        isOpen={showGrayAreaDialog}
        onClose={() => setShowGrayAreaDialog(false)}
        isDarkMode={isDarkMode}
        onComplete={async (flowPath: FlowPath) => {
          console.log('🎯 Gray Area Wizard Complete:', flowPath);
          
          // Update states
          setSelectedProblemType(flowPath.questionId);
          setWasGrayAreaResolved(true);
          setConfidenceScore(100);
          setShowGrayAreaDialog(false);
          
          // Show loading state
          setIsGenerating(true);
          
          // Optional AI simulation (can be disabled)
          if (ENABLE_AI) {
            await simulateAIProcessing();
          }
          
          // Generate response based on flow path
          const entityTypeArabic = entityType;
          const problemTypeName = flowPath.questionTitle;
          
          // Build flow path description
          const flowPathText = flowPath.selectedSteps
            .map(s => `${s.route.name} > ${s.step.name} > ${s.subCondition.name}`)
            .join('\\n');
          
          let generatedResponse = '';
          
          if (flowPath.finalAction === 'force_solution') {
            generatedResponse = `السلام عليكم ورحمة الله وبركاته،\\n\\nعزيزي/عزيزتي ${customerName}،\\n\\nتم استلام بلاغكم بخصوص: ${problemTypeName}\\nنوع الجهة: ${entityTypeArabic}\\n\\n`;
            
            if (flowPath.finalStepDescription) {
              generatedResponse += `✅ ${flowPath.finalStepDescription}\\n\\n`;
            }
            
            generatedResponse += `تفاصيل المشكلة:\\n${problemSummary}\\n\\nتم معالجة طلبكم بنجاح. في حال وجود أي استفسار، لا تترددوا بالتواصل معنا.\\n\\nمع تحياتنا،`;
            
          } else if (flowPath.finalAction === 'escalation') {
            generatedResponse = `السلام عليكم ورحمة الله وبركاته،\\n\\nعزيزي/عزيزتي ${customerName}،\\n\\nتم استلام بلاغكم بخصوص: ${problemTypeName}\\nنوع الجهة: ${entityTypeArabic}\\n\\n`;
            
            if (flowPath.finalStepDescription) {
              generatedResponse += `⚠️ ${flowPath.finalStepDescription}\\n\\n`;
            }
            
            generatedResponse += `تفاصيل المشكلة:\\n${problemSummary}\\n\\nتم تصعيد طلبكم للإدارة المختصة وسيتم التواصل معكم في أقرب وقت ممكن.\\n\\nنعتذر عن أي إزعاج، ونقدر تفهمكم.\\n\\nمع تحياتنا،`;
            
          } else {
            // continue action
            generatedResponse = `السلام عليكم ورحمة الله وبركاته،\\n\\nعزيزي/عزيزتي ${customerName}،\\n\\nتم استلام بلاغكم بخصوص: ${problemTypeName}\\nنوع الجهة: ${entityTypeArabic}\\n\\n`;
            
            if (flowPath.finalStepDescription) {
              generatedResponse += `${flowPath.finalStepDescription}\\n\\n`;
            }
            
            generatedResponse += `تفاصيل المشكلة:\\n${problemSummary}\\n\\nتمت المعالجة بنجاح.\\n\\nمع تحياتنا،`;
          }
          
          setGeneratedText(generatedResponse);
          void logCallToBackend({
            generatedResponse,
            status:
              flowPath.finalAction === "force_solution"
                ? "resolved"
                : flowPath.finalAction === "escalation"
                  ? "escalated"
                  : "pending",
            flowResult: flowPath,
          });
          setIsGenerating(false);
          
          // Add to flow log
          flowPath.selectedSteps.forEach((item) => {
            setDebugFlowLog(prev => [
              ...prev,
              {
                step: item.step.name,
                subCondition: item.subCondition.name,
                action: item.subCondition.action,
                timestamp: new Date(),
              },
            ]);
          });
        }}
      />

      {/* Why Popup */}
      <Dialog open={showWhyPopup} onOpenChange={setShowWhyPopup}>
        <div className={isDarkMode ? 'dark' : ''}>
          <DialogContent className="glass-card max-w-md shadow-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-right text-foreground flex items-center gap-2 text-lg">
                <HelpCircle className="size-6 text-primary" />
                لماذا هذه اليغة؟
              </DialogTitle>
              <DialogDescription className="text-right text-muted-foreground text-sm">
                تم اختيار هذه الصيغة بناءً على معايير احترافية
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-right pt-2">
              <ul className="space-y-3 text-foreground">
                <li className="flex items-start gap-2">
                  <ArrowRight className="size-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">السياق المهني والرسمي المناسب</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="size-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">وضوح المعلومات وتنظيمها</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="size-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">استخدام تحية مناسبة وختام لائق</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="size-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">الأسلوب المباشر والاحترافي</span>
                </li>
              </ul>
              <div className="glass-panel p-4 rounded-xl border">
                <p className="text-xs text-muted-foreground">
                  يمكنك تجربة صيغة بديلة من خلال زر "صيغة أخرى"
                </p>
              </div>
            </div>
          </DialogContent>
        </div>
      </Dialog>

      {/* Rafeeq Chat */}
      <Dialog open={showRafeeqChat} onOpenChange={setShowRafeeqChat}>
        <div className={isDarkMode ? 'dark' : ''}>
          <DialogContent className="border-2 border-border max-w-2xl h-[600px] flex flex-col shadow-2xl bg-background dark:bg-gray-900" dir="rtl">
            <DialogHeader className="border-b border-border pb-4 bg-background dark:bg-gray-900">
              <DialogTitle className="text-right flex items-center gap-3 justify-end text-lg">
                <span className="text-foreground">محادثة رفيق</span>
                <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg border-2 border-cyan-300 dark:border-cyan-400">
                  <Bot className="size-6 text-white" />
                </div>
              </DialogTitle>
              <DialogDescription className="text-right text-muted-foreground text-sm">
                مساعدك الذكي للإجابة على استفساراتك
              </DialogDescription>
            </DialogHeader>

            {!isRafeeqActive ? (
              <div className="flex-1 flex items-center justify-center p-8 bg-background dark:bg-gray-900">
                <div className="text-center space-y-6">
                  <div className="mx-auto w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center shadow-2xl floating">
                    <Bot className="size-10 text-white" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-foreground">مرحباً بك!</h3>
                    <p className="text-sm text-muted-foreground">اضغط للبدء في المحادثة مع رفيق</p>
                  </div>
                  <button
                    onClick={() => setIsRafeeqActive(true)}
                    className="px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold hover:from-cyan-600 hover:to-blue-700 transition-all flex items-center gap-3 mx-auto shadow-lg"
                  >
                    <Bot className="size-5" />
                    <span>تشغيل رفيق</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0 bg-background dark:bg-gray-900">
                <div className="flex-1 overflow-y-auto p-4 space-y-4 rounded-2xl mb-4 bg-gray-50 dark:bg-gray-800 border border-border">
                  <div className="flex items-start gap-3 justify-end">
                    <div className="p-4 rounded-2xl max-w-[80%] shadow-md bg-white dark:bg-gray-700 border border-border">
                      <p className="text-sm text-foreground">
                        مرحباً! أنا رفيق، مساعدك الذكي. كيف يمكنني مساعدتك؟
                      </p>
                    </div>
                    <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex-shrink-0 shadow-lg">
                      <Bot className="size-5 text-white" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-border bg-background dark:bg-gray-900">
                  <button
                    onClick={() => {
                      if (chatMessage.trim()) {
                        setChatMessage("");
                      }
                    }}
                    disabled={!chatMessage.trim()}
                    className="p-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-lg"
                  >
                    <Send className="size-5" />
                  </button>
                  <Input
                    type="text"
                    placeholder="اكتب رسالتك هنا..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && chatMessage.trim()) {
                        setChatMessage("");
                      }
                    }}
                    className="flex-1 border rounded-xl px-4 py-3 text-right text-foreground placeholder:text-muted-foreground bg-white dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </div>
            )}
          </DialogContent>
        </div>
      </Dialog>

      {/* ============ DEBUG PANEL (Admin Only) ============ */}
      {user?.isAdmin && (
        <DebugPanel
          activeRoute={debugActiveRoute}
          currentStep={debugCurrentStep}
          subCondition={debugSubCondition}
          action={debugAction}
          finalScore={descriptionMatchPercentage}
          flowLog={debugFlowLog}
        />
      )}
    </div>
  );
}