import { useState } from "react";
import {
  FileText,
  Filter,
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  Clock,
  Server,
  MousePointer,
  Brain,
  Palette,
  Tag,
  Eye,
  GraduationCap,
  AlertCircle,
  EyeOff,
  Activity,
  Users,
  Code,
  FileWarning,
  Network,
  Database,
  TrendingUp,
  Sparkles,
  Wrench,
  ArrowUpCircle,
} from "lucide-react";
import { Card } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";

interface SystemLog {
  id: string;
  time: string;
  systemType: 'logic-bug' | 'flow-bug' | 'error' | 'crash';
  severity: 'low' | 'medium' | 'high' | 'critical';
  caseId: string;
  message: string;
  fullMessage: string;
  impact: number;
  status: 'open' | 'resolved' | 'ignored';
  tags: string[];
  triggeredFlow?: string;
  systemDecision?: string;
  confidence?: number;
  errorCode?: string;
  stackTrace?: string;
}

const mockSystemLogs: SystemLog[] = [
  {
    id: '1',
    time: '14:45:23',
    systemType: 'crash',
    severity: 'critical',
    caseId: 'CS-2024-145',
    message: 'فشل كامل في معالج توليد الصيغ - تعطل النظام',
    fullMessage: 'حدث تعطل كامل (Crash) في معالج توليد الصيغ أثناء معالجة الحالة CS-2024-145. تم الكشف عن Null Pointer Exception في السطر 234 من FormGenerator.tsx. النظام حاول الوصول إلى كائن غير محدد مما أدى لتوقف التطبيق بالكامل.',
    impact: 23,
    status: 'open',
    tags: ['crash', 'null-pointer', 'critical'],
    triggeredFlow: 'معالج توليد الصيغ → التحقق من البيانات → إنشاء النموذج',
    systemDecision: 'إيقاف المعالجة فوراً وإرجاع رسالة خطأ للمستخدم',
    confidence: 0,
    errorCode: 'ERR_NULL_POINTER_234',
    stackTrace: 'at FormGenerator.generate (FormGenerator.tsx:234)\nat CaseProcessor.process (CaseProcessor.tsx:89)\nat handleSubmit (CallHelper.tsx:156)'
  },
  {
    id: '2',
    time: '14:32:11',
    systemType: 'logic-bug',
    severity: 'high',
    caseId: 'CS-2024-143',
    message: 'خطأ منطقي في حساب نسبة التطابق - نتيجة سالبة',
    fullMessage: 'اكتشف النظام خطأ منطقياً في دالة حساب نسبة التطابق. النتيجة كانت -15% وهي قيمة غير منطقية. السبب: خطأ في معادلة الحساب عند مقارنة وصف المشكلة مع قاعدة البيانات. الخطأ حدث عند محاولة طرح قيم أكبر من المتوقع.',
    impact: 8,
    status: 'open',
    tags: ['logic', 'calculation', 'matching'],
    triggeredFlow: 'مطابقة الوصف → حساب النسبة → عرض النتيجة',
    systemDecision: 'إرجاع قيمة 0% كحل مؤقت ورفع التنبيه',
    confidence: 45,
    errorCode: 'ERR_LOGIC_CALC_NEG',
    stackTrace: 'at calculateMatch (MatchingEngine.tsx:67)\nat compareDescription (CallHelper.tsx:289)'
  },
  {
    id: '3',
    time: '14:18:47',
    systemType: 'flow-bug',
    severity: 'medium',
    caseId: 'CS-2024-140',
    message: 'تخطي خطوة إلزامية في مسار الصيانة المعقدة',
    fullMessage: 'اكتشف النظام أن المسار قام بتخطي خطوة "التحقق من قطع الغيار" رغم أنها معرّفة كخطوة إلزامية. السبب: شرط IF خاطئ في منطق التدفق يسمح بتجاوز الخطوة عند توفر شرط معين. هذا يخالف القواعد المحددة في النظام.',
    impact: 5,
    status: 'open',
    tags: ['flow', 'validation', 'skip-step'],
    triggeredFlow: 'مسار الصيانة المعقدة → تحقق من الشروط → تخطي خطوة',
    systemDecision: 'السماح بالمتابعة مع تسجيل التحذير',
    confidence: 70,
    errorCode: 'ERR_FLOW_SKIP_MANDATORY',
    stackTrace: 'at validateSteps (PathValidator.tsx:123)\nat processPath (PathManager.tsx:45)'
  },
  {
    id: '4',
    time: '14:05:33',
    systemType: 'error',
    severity: 'high',
    caseId: 'CS-2024-138',
    message: 'فشل الاتصال بقاعدة البيانات - انتهاء المهلة',
    fullMessage: 'فشل الاتصال بقاعدة البيانات الرئيسية بسبب انتهاء مهلة الاتصال (Timeout). محاولة الوصول لجلب بيانات المسارات استغرقت أكثر من 30 ثانية. النظام حاول 3 مرات ثم تحول للقاعدة الاحتياطية. قد يكون السبب حمل زائد على السيرفر أو مشكلة في الشبكة.',
    impact: 12,
    status: 'resolved',
    tags: ['database', 'timeout', 'connection'],
    triggeredFlow: 'جلب البيانات → محاولة الاتصال → فشل → تحويل للاحتياطي',
    systemDecision: 'التحويل التلقائي لقاعدة البيانات الاحتياطية',
    confidence: 90,
    errorCode: 'ERR_DB_TIMEOUT_30S',
    stackTrace: 'at DatabaseConnection.connect (db.tsx:89)\nat fetchPaths (PathService.tsx:34)'
  },
  {
    id: '5',
    time: '13:52:19',
    systemType: 'logic-bug',
    severity: 'critical',
    caseId: 'CS-2024-135',
    message: 'حلقة لانهائية في معالج التعلم الآلي',
    fullMessage: 'اكتشف النظام حلقة لانهائية (Infinite Loop) في معالج التعلم الآلي. المعالج دخل في حلقة while بدون شرط توقف صحيح عند محاولة تحليل نمط معقد. النظام استهلك 100% من CPU لمدة 45 ثانية قبل أن يتم إيقافه تلقائياً بواسطة مراقب الأداء.',
    impact: 34,
    status: 'open',
    tags: ['infinite-loop', 'performance', 'ml-processor'],
    triggeredFlow: 'معالج التعلم → تحليل النمط → حلقة بدون نهاية',
    systemDecision: 'إيقاف المعالج فوراً بعد 45 ثانية',
    confidence: 0,
    errorCode: 'ERR_INFINITE_LOOP_ML',
    stackTrace: 'at analyzePattern (MLProcessor.tsx:156)\nat processLearning (LearningEngine.tsx:78)'
  },
  {
    id: '6',
    time: '13:38:44',
    systemType: 'error',
    severity: 'low',
    caseId: 'CS-2024-132',
    message: 'فشل تحميل صورة من Unsplash API',
    fullMessage: 'فشل تحميل صورة من Unsplash API بسبب انتهاء حصة الـ API اليومية (Rate Limit). الخطأ حدث عند محاولة جلب صورة توضيحية لخطوة في المسار. النظام استخدم صورة افتراضية بدلاً من ذلك. لا يوجد تأثير على وظائف النظام الأساسية.',
    impact: 0,
    status: 'ignored',
    tags: ['api', 'rate-limit', 'image'],
    triggeredFlow: 'تحميل صورة → طلب API → رفض → استخدام افتراضي',
    systemDecision: 'استخدام الصورة الافتراضية',
    confidence: 100,
    errorCode: 'ERR_API_RATE_LIMIT',
    stackTrace: 'at fetchImage (UnsplashService.tsx:23)'
  },
  {
    id: '7',
    time: '13:21:07',
    systemType: 'flow-bug',
    severity: 'medium',
    caseId: 'CS-2024-128',
    message: 'تضارب في شروط التدفق - تنفيذ مساران متزامنان',
    fullMessage: 'حدث تضارب في منطق التدفق أدى لتنفيذ مسارين مختلفين في نفس الوقت. الشروط المعرفة في IF/ELSE كانت متداخلة بشكل خاطئ، مما سمح بتفعيل كلا المسارين معاً. هذا أدى لإنشاء بيانات مكررة ورسائل متضاربة للمستخدم.',
    impact: 3,
    status: 'resolved',
    tags: ['conflict', 'conditions', 'duplicate'],
    triggeredFlow: 'تقييم الشروط → تنفيذ مسار A و B معاً',
    systemDecision: 'إلغاء المسار الثانوي والاحتفاظ بالأساسي',
    confidence: 85,
    errorCode: 'ERR_FLOW_CONFLICT',
    stackTrace: 'at evaluateConditions (FlowEngine.tsx:234)\nat processPaths (PathManager.tsx:67)'
  },
  {
    id: '8',
    time: '13:05:52',
    systemType: 'crash',
    severity: 'high',
    caseId: 'CS-2024-124',
    message: 'Memory Leak في معالج البيانات الضخمة',
    fullMessage: 'اكتشف النظام تسرب ذاكرة (Memory Leak) في معالج البيانات الضخمة. عند معالجة أكثر من 1000 سجل، الذاكرة المستخدمة استمرت بالزيادة دون تحرير. وصلت الذاكرة المستخدمة إلى 2.5GB قبل أن يتوقف المعالج. السبب: عدم تحرير المراجع القديمة في نهاية كل دورة معالجة.',
    impact: 15,
    status: 'open',
    tags: ['memory-leak', 'performance', 'data-processor'],
    triggeredFlow: 'معالج البيانات → حلقة المعالجة → تسرب الذاكرة',
    systemDecision: 'إيقاف المعالج عند 2.5GB وإعادة التشغيل',
    confidence: 0,
    errorCode: 'ERR_MEMORY_LEAK_2.5GB',
    stackTrace: 'at processLargeData (DataProcessor.tsx:445)\nat handleBatch (BatchProcessor.tsx:123)'
  }
];

export function SystemLogsPage() {
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);
  const [filters, setFilters] = useState({
    systemType: 'الكل',
    severity: 'الكل',
    dateRange: 'اليوم',
    caseId: ''
  });

  // Calculate system health
  const openCritical = mockSystemLogs.filter(l => l.status === 'open' && l.severity === 'critical').length;
  const openHigh = mockSystemLogs.filter(l => l.status === 'open' && l.severity === 'high').length;
  
  const systemHealth: 'stable' | 'warning' | 'critical' = 
    openCritical > 0 ? 'critical' : 
    openHigh > 2 ? 'warning' : 
    'stable';

  const getSystemTypeIcon = (type: string) => {
    switch (type) {
      case 'logic-bug': return AlertTriangle;
      case 'flow-bug': return MousePointer;
      case 'error': return AlertCircle;
      case 'crash': return XCircle;
      default: return AlertTriangle;
    }
  };

  const getSystemTypeLabel = (type: string) => {
    switch (type) {
      case 'logic-bug': return 'خطأ منطقي';
      case 'flow-bug': return 'خطأ في التدفق';
      case 'error': return 'خطأ';
      case 'crash': return 'تعطل';
      default: return type;
    }
  };

  const getSystemTypeColor = (type: string) => {
    switch (type) {
      case 'logic-bug': return 'from-purple-500 to-violet-500';
      case 'flow-bug': return 'from-yellow-500 to-amber-500';
      case 'error': return 'from-orange-500 to-red-500';
      case 'crash': return 'from-red-600 to-rose-700';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-red-600 text-white border-0 font-bold animate-pulse">حرج</Badge>;
      case 'high':
        return <Badge className="bg-orange-500 text-white border-0 font-semibold">عالي</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500 text-white border-0">متوسط</Badge>;
      case 'low':
        return <Badge className="bg-blue-500 text-white border-0">منخفض</Badge>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">مفتوح</Badge>;
      case 'resolved':
        return <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">محلول</Badge>;
      case 'ignored':
        return <Badge className="bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20">متجاهل</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with System Health */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl">
            <Server className="size-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">سجلات النظام</h2>
            <p className="text-muted-foreground">سجلات تتعلق بسلوك النظام الداخلي، أخطاء منطقية، وأعطال تقنية</p>
          </div>
        </div>

        {/* System Health Indicator */}
        <Card className={`glass-panel border-2 p-4 ${
          systemHealth === 'critical' ? 'border-red-500 bg-red-500/5' :
          systemHealth === 'warning' ? 'border-yellow-500 bg-yellow-500/5' :
          'border-green-500 bg-green-500/5'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              systemHealth === 'critical' ? 'bg-red-500' :
              systemHealth === 'warning' ? 'bg-yellow-500' :
              'bg-green-500'
            }`}>
              <Activity className="size-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">صحة النظام</p>
              <p className={`text-lg font-bold ${
                systemHealth === 'critical' ? 'text-red-600 dark:text-red-400' :
                systemHealth === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                'text-green-600 dark:text-green-400'
              }`}>
                {systemHealth === 'critical' ? 'حرجة' : systemHealth === 'warning' ? 'تحذير' : 'مستقرة'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Diagnostic Filters */}
      <Card className="glass-panel border-2 border-border p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">تشخيص:</span>
          </div>

          <select 
            value={filters.systemType}
            onChange={(e) => setFilters({ ...filters, systemType: e.target.value })}
            className="px-3 py-1.5 text-sm glass-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
          >
            <option>الكل</option>
            <option>خطأ منطقي</option>
            <option>خطأ في التدفق</option>
            <option>خطأ</option>
            <option>تعطل</option>
          </select>

          <select 
            value={filters.severity}
            onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
            className="px-3 py-1.5 text-sm glass-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
          >
            <option>الكل</option>
            <option>حرج</option>
            <option>عالي</option>
            <option>متوسط</option>
            <option>منخفض</option>
          </select>

          <select 
            value={filters.dateRange}
            onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
            className="px-3 py-1.5 text-sm glass-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option>اليوم</option>
            <option>آخر 7 أيام</option>
            <option>آخر 30 يوم</option>
            <option>مخصص</option>
          </select>

          <input 
            type="text"
            placeholder="بحث برقم الحالة..."
            value={filters.caseId}
            onChange={(e) => setFilters({ ...filters, caseId: e.target.value })}
            className="px-3 py-1.5 text-sm glass-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
          />

          <Button variant="ghost" size="sm" className="mr-auto">
            <X className="size-4 ml-1" />
            إعادة تعيين
          </Button>
        </div>
      </Card>

      {/* System Logs Table */}
      <Card className="glass-panel border-2 border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">الوقت</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">نوع النظام</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">الخطورة</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">رقم الحالة</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">الرسالة</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">التأثير</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">الحالة</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">الوسوم</th>
              </tr>
            </thead>
            <tbody>
              {mockSystemLogs.map((log) => {
                const Icon = getSystemTypeIcon(log.systemType);
                const isHighPriority = log.severity === 'critical' || log.systemType === 'crash';
                
                return (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={`border-b border-border hover:bg-primary/5 transition-colors cursor-pointer group ${
                      isHighPriority ? 'bg-red-500/5' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-foreground font-mono">
                        <Clock className="size-3.5 text-muted-foreground" />
                        {log.time}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg bg-gradient-to-r ${getSystemTypeColor(log.systemType)}`}>
                          <Icon className="size-3.5 text-white" />
                        </div>
                        <span className="text-sm text-foreground">{getSystemTypeLabel(log.systemType)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getSeverityBadge(log.severity)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono text-muted-foreground">{log.caseId}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-foreground line-clamp-1 max-w-md">{log.message}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Users className="size-3.5 text-muted-foreground" />
                        <span className={`text-sm font-mono font-semibold ${
                          log.impact > 20 ? 'text-red-500' :
                          log.impact > 10 ? 'text-orange-500' :
                          log.impact > 0 ? 'text-yellow-500' :
                          'text-green-500'
                        }`}>
                          {log.impact === 0 ? '-' : `${log.impact} مستخدم`}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(log.status)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap max-w-xs">
                        {log.tags.slice(0, 2).map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs font-mono">
                            {tag}
                          </Badge>
                        ))}
                        {log.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{log.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Side Panel */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-end" onClick={() => setSelectedLog(null)}>
          <div 
            className="w-full max-w-3xl h-full bg-background border-r-2 border-border shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border p-6 z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-foreground">تفاصيل سجل النظام</h3>
                <button 
                  onClick={() => setSelectedLog(null)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="size-5 text-muted-foreground" />
                </button>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {(() => {
                  const Icon = getSystemTypeIcon(selectedLog.systemType);
                  return (
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg bg-gradient-to-r ${getSystemTypeColor(selectedLog.systemType)}`}>
                        <Icon className="size-4 text-white" />
                      </div>
                      <span className="text-sm font-medium">{getSystemTypeLabel(selectedLog.systemType)}</span>
                    </div>
                  );
                })()}
                {getSeverityBadge(selectedLog.severity)}
                <span className="text-sm font-mono text-muted-foreground">{selectedLog.caseId}</span>
                <span className="text-sm text-muted-foreground">{selectedLog.time}</span>
                {getStatusBadge(selectedLog.status)}
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Error Code */}
              {selectedLog.errorCode && (
                <div className="glass-card p-4 rounded-xl border-2 border-red-500/20 bg-red-500/5">
                  <div className="flex items-center gap-3">
                    <Code className="size-5 text-red-500" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">كود الخطأ</p>
                      <p className="text-lg font-mono font-bold text-red-600 dark:text-red-400">{selectedLog.errorCode}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Full Error Message */}
              <div className="glass-card p-4 rounded-xl border border-border">
                <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                  <FileWarning className="size-4 text-primary" />
                  رسالة الخطأ الكاملة
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 p-3 rounded-lg font-mono">
                  {selectedLog.fullMessage}
                </p>
              </div>

              {/* Triggered Flow */}
              {selectedLog.triggeredFlow && (
                <div className="glass-card p-4 rounded-xl border border-border">
                  <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                    <Network className="size-4 text-primary" />
                    التدفق المُفعَّل
                  </h4>
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground font-mono leading-relaxed">
                      {selectedLog.triggeredFlow}
                    </p>
                  </div>
                </div>
              )}

              {/* Stack Trace */}
              {selectedLog.stackTrace && (
                <div className="glass-card p-4 rounded-xl border border-border">
                  <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                    <Database className="size-4 text-primary" />
                    Stack Trace
                  </h4>
                  <div className="bg-black/80 p-3 rounded-lg overflow-x-auto">
                    <pre className="text-xs text-green-400 font-mono leading-relaxed">
                      {selectedLog.stackTrace}
                    </pre>
                  </div>
                </div>
              )}

              {/* System Decision */}
              {selectedLog.systemDecision && (
                <div className="glass-card p-4 rounded-xl border border-border">
                  <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                    <Server className="size-4 text-primary" />
                    قرار النظام
                  </h4>
                  <p className="text-sm text-muted-foreground">{selectedLog.systemDecision}</p>
                </div>
              )}

              {/* Impact & Confidence */}
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-card p-4 rounded-xl border border-border">
                  <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                    <Users className="size-4 text-primary" />
                    التأثير
                  </h4>
                  <p className={`text-3xl font-bold ${
                    selectedLog.impact > 20 ? 'text-red-500' :
                    selectedLog.impact > 10 ? 'text-orange-500' :
                    selectedLog.impact > 0 ? 'text-yellow-500' :
                    'text-green-500'
                  }`}>
                    {selectedLog.impact === 0 ? 'لا يوجد' : `${selectedLog.impact} مستخدم`}
                  </p>
                </div>

                {selectedLog.confidence !== undefined && (
                  <div className="glass-card p-4 rounded-xl border border-border">
                    <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                      <TrendingUp className="size-4 text-primary" />
                      مستوى الثقة
                    </h4>
                    <p className={`text-3xl font-bold ${
                      selectedLog.confidence > 70 ? 'text-green-500' :
                      selectedLog.confidence > 40 ? 'text-yellow-500' :
                      'text-red-500'
                    }`}>
                      {selectedLog.confidence}%
                    </p>
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="glass-card p-4 rounded-xl border border-border">
                <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                  <AlertTriangle className="size-4 text-primary" />
                  الوسوم التقنية
                </h4>
                <div className="flex gap-2 flex-wrap">
                  {selectedLog.tags.map((tag, idx) => (
                    <Badge key={idx} variant="outline" className="font-mono">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* AI Suggested Actions */}
              <div className="glass-card p-4 rounded-xl border-2 border-primary/20 bg-primary/5">
                <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />
                  إجراءات مقترحة من الذكاء الاصطناعي
                </h4>
                <div className="space-y-2">
                  <Button className="w-full justify-start bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white">
                    <GraduationCap className="size-4 ml-2" />
                    إضافة إلى مراجعة التعلم
                  </Button>
                  <Button variant="outline" className="w-full justify-start border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10">
                    <Wrench className="size-4 ml-2" />
                    إصلاح المنطق
                  </Button>
                  <Button variant="outline" className="w-full justify-start border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/10">
                    <ArrowUpCircle className="size-4 ml-2" />
                    تصعيد للفريق التقني
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <EyeOff className="size-4 ml-2" />
                    تجاهل
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}