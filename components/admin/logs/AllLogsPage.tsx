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
} from "lucide-react";
import { Card } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";

interface LogEntry {
  id: string;
  time: string;
  type: "system" | "user-behavior" | "learning" | "ux";
  caseId: string;
  message: string;
  fullMessage: string;
  success: boolean;
  warning?: boolean;
  responseTime: number;
  tags: string[];
  confidence?: "high" | "medium" | "low";
  input?: string;
  output?: string;
  decision?: string;
}

const mockLogs: LogEntry[] = [
  {
    id: "1",
    time: "14:23:45",
    type: "system",
    caseId: "CS-2024-001",
    message: "تم إنشاء حالة جديدة بنجاح",
    fullMessage:
      "تم إنشاء حالة جديدة CS-2024-001 بواسطة المستخدم أحمد محمد. تم تطبيق جميع القواعد الافتراضية بنجاح.",
    success: true,
    responseTime: 145,
    tags: ["إنشاء", "نجاح"],
    confidence: "high",
    input: "اسم العميل: أحمد محمد، نوع الحالة: صيانة",
    output: "تم إنشاء الحالة CS-2024-001 بنجاح",
    decision: "تطبيق المسار الافتراضي للصيانة",
  },
  {
    id: "2",
    time: "14:21:12",
    type: "user-behavior",
    caseId: "CS-2024-002",
    message: "المستخدم قام بتعديل خطوة في المسار",
    fullMessage:
      'المستخدم محمد علي قام بتعديل الخطوة "فحص أولي" في الحالة CS-2024-002. تم تسجيل السلوك للتعلم.',
    success: true,
    responseTime: 89,
    tags: ["تعديل", "سلوك المستخدم"],
    confidence: "medium",
    input: "تعديل خطوة: فحص أولي",
    output: "تم حفظ التعديل وتسجيل السلوك",
    decision: "إرسال للتحليل السلوكي",
  },
  {
    id: "3",
    time: "14:18:33",
    type: "learning",
    caseId: "CS-2024-003",
    message: "تم اكتشاف نمط متكرر في الأخطاء",
    fullMessage:
      'النظام اكتشف نمطاً متكرراً: خطأ في "تحديد قطع الغيار" يحدث في 78% من حالات الصيانة المعقدة.',
    success: true,
    responseTime: 234,
    tags: ["تعلم", "نمط", "اكتشاف"],
    confidence: "high",
    input: "تحليل 150 حالة صيانة",
    output: "نمط متكرر: خطأ في تحديد قطع الغيار (78%)",
    decision: "اقتراح تحديث القاعدة المعرفية",
  },
  {
    id: "4",
    time: "14:15:08",
    type: "ux",
    caseId: "CS-2024-004",
    message: "المستخدم قضى وقتاً طويلاً في صفحة الفلاتر",
    fullMessage:
      "المستخدم سارة أحمد قضت 45 ثانية في صفحة الفلاتر دون اختيار. قد تحتاج الواجهة لتحسين.",
    success: true,
    warning: true,
    responseTime: 0,
    tags: ["UX", "تحذير", "بطء"],
    confidence: "medium",
    input: "مدة التفاعل: 45 ثانية",
    output: "تم تسجيل سلوك UX غير اعتيادي",
    decision: "اقتراح مراجعة واجهة الفلاتر",
  },
  {
    id: "5",
    time: "14:12:55",
    type: "system",
    caseId: "CS-2024-005",
    message: "فشل في الاتصال بقاعدة البيانات",
    fullMessage:
      "فشل الاتصال بقاعدة البيانات الثانوية أثناء محاولة حفظ الحالة CS-2024-005. تم التبديل للقاعدة الاحتياطية.",
    success: false,
    responseTime: 5230,
    tags: ["خطأ", "قاعدة بيانات", "فشل"],
    confidence: "low",
    input: "محاولة حفظ ��لبيانات",
    output: "خطأ: انتهت مهلة الاتصال",
    decision: "التبديل للقاعدة الاحتياطية",
  },
  {
    id: "6",
    time: "14:10:22",
    type: "learning",
    caseId: "CS-2024-006",
    message: "اقتراح تحديث تلقائي للمسار",
    fullMessage:
      'بناءً على تحليل 200 حالة، النظام يقترح إضافة خطوة "التحقق المزدوج" في مسار الصيانة المعقدة.',
    success: true,
    responseTime: 156,
    tags: ["اقتراح", "تحديث", "ذكاء اصطناعي"],
    confidence: "high",
    input: "تحليل 200 حالة صيانة معقدة",
    output: 'اقتراح: إضافة خطوة "التحقق المزدوج"',
    decision: "إرسال للمراجعة البشرية",
  },
  {
    id: "7",
    time: "14:08:11",
    type: "user-behavior",
    caseId: "CS-2024-007",
    message: "المستخدم تخطى خطوات موصى بها",
    fullMessage:
      "المستخدم خالد سعيد تخطى 3 خطوات موصى بها في مسار التشخيص. قد يشير لمشكلة في التصميم.",
    success: true,
    warning: true,
    responseTime: 67,
    tags: ["سلوك", "تخطي", "تحذير"],
    confidence: "medium",
    input: "تخطي خطوات: 3",
    output: "تم تسجيل سلوك غير معتاد",
    decision: "تحليل سبب التخطي",
  },
  {
    id: "8",
    time: "14:05:44",
    type: "ux",
    caseId: "CS-2024-008",
    message: "تفاعل سريع مع الواجهة الجديدة",
    fullMessage:
      "المستخدم منى علي أتمت العملية بنجاح في 30 ثانية فقط باستخدام الواجهة الجديدة. تحسن بنسبة 60%.",
    success: true,
    responseTime: 0,
    tags: ["نجاح", "تحسين", "UX"],
    confidence: "high",
    input: "زمن الإتمام: 30 ثانية",
    output: "تحسن 60% عن الواجهة القديمة",
    decision: "تسجيل كنجاح UX",
  },
];

export function AllLogsPage() {
  const [selectedTab, setSelectedTab] = useState<
    "all" | "system" | "user-behavior" | "learning" | "ux"
  >("all");
  const [selectedLog, setSelectedLog] =
    useState<LogEntry | null>(null);
  const [filters, setFilters] = useState({
    date: "اليوم",
    case: "الكل",
    userType: "الكل",
    status: "الكل",
    confidence: "الكل",
  });

  const tabs = [
    {
      id: "all" as const,
      label: "جميع السجلات",
      icon: FileText,
      count: mockLogs.length,
    },
    {
      id: "system" as const,
      label: "النظام",
      icon: Server,
      count: mockLogs.filter((l) => l.type === "system").length,
    },
    {
      id: "user-behavior" as const,
      label: "سلوك المستخدم",
      icon: MousePointer,
      count: mockLogs.filter((l) => l.type === "user-behavior")
        .length,
    },
    {
      id: "learning" as const,
      label: "التعلم",
      icon: Brain,
      count: mockLogs.filter((l) => l.type === "learning")
        .length,
    },
    {
      id: "ux" as const,
      label: "تجربة المستخدم",
      icon: Palette,
      count: mockLogs.filter((l) => l.type === "ux").length,
    },
  ];

  const filteredLogs = mockLogs.filter((log) =>
    selectedTab === "all" ? true : log.type === selectedTab,
  );

  const getTypeColor = (type: string) => {
    switch (type) {
      case "system":
        return "from-blue-500 to-indigo-500";
      case "user-behavior":
        return "from-purple-500 to-pink-500";
      case "learning":
        return "from-teal-500 to-cyan-500";
      case "ux":
        return "from-amber-500 to-orange-500";
      default:
        return "from-gray-500 to-slate-500";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "system":
        return "نظام";
      case "user-behavior":
        return "سلوك";
      case "learning":
        return "تعلم";
      case "ux":
        return "UX";
      default:
        return type;
    }
  };

  const getConfidenceBadge = (confidence?: string) => {
    switch (confidence) {
      case "high":
        return (
          <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
            عالي
          </Badge>
        );
      case "medium":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20">
            متوسط
          </Badge>
        );
      case "low":
        return (
          <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">
            منخفض
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-slate-500 to-gray-500 rounded-xl">
          <FileText className="size-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            جميع السجلات
          </h2>
          <p className="text-muted-foreground">
            عرض جميع سجلات النظام والمستخدمين والتعلم وتجربة
            المستخدم للمراقبة والتحليل
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Card className="glass-panel border-2 border-border p-2">
        <div className="flex gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = selectedTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex-1 relative overflow-hidden rounded-lg transition-all duration-300 ${
                  isActive
                    ? "scale-[1.02]"
                    : "hover:scale-[1.01]"
                }`}
              >
                {isActive && (
                  <div
                    className={`absolute inset-0 bg-gradient-to-r ${
                      tab.id === "all"
                        ? "from-slate-500 to-gray-500"
                        : tab.id === "system"
                          ? "from-blue-500 to-indigo-500"
                          : tab.id === "user-behavior"
                            ? "from-purple-500 to-pink-500"
                            : tab.id === "learning"
                              ? "from-teal-500 to-cyan-500"
                              : "from-amber-500 to-orange-500"
                    }`}
                  />
                )}
                <div
                  className={`relative flex items-center justify-center gap-2 px-4 py-3 ${
                    isActive ? "text-white" : "text-foreground"
                  }`}
                >
                  <Icon className="size-4" />
                  <span className="font-medium text-sm">
                    {tab.label}
                  </span>
                  <Badge
                    className={`${isActive ? "bg-white/20 text-white" : "bg-primary/10"} border-0`}
                  >
                    {tab.count}
                  </Badge>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Filters Bar */}
      <Card className="glass-panel border-2 border-border p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              فلترة:
            </span>
          </div>

          <select
            value={filters.date}
            onChange={(e) =>
              setFilters({ ...filters, date: e.target.value })
            }
            className="px-3 py-1.5 text-sm glass-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option>اليوم</option>
            <option>آخر 7 أيام</option>
            <option>آخر 30 يوم</option>
            <option>مخصص</option>
          </select>

          <select
            value={filters.case}
            onChange={(e) =>
              setFilters({ ...filters, case: e.target.value })
            }
            className="px-3 py-1.5 text-sm glass-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option>الكل</option>
            <option>حالات نشطة</option>
            <option>حالات مغلقة</option>
          </select>

          <select
            value={filters.userType}
            onChange={(e) =>
              setFilters({
                ...filters,
                userType: e.target.value,
              })
            }
            className="px-3 py-1.5 text-sm glass-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option>الكل</option>
            <option>مستخدم</option>
            <option>موظف</option>
            <option>نظام</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) =>
              setFilters({ ...filters, status: e.target.value })
            }
            className="px-3 py-1.5 text-sm glass-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option>الكل</option>
            <option>نجاح</option>
            <option>فشل</option>
            <option>تحذير</option>
          </select>

          <select
            value={filters.confidence}
            onChange={(e) =>
              setFilters({
                ...filters,
                confidence: e.target.value,
              })
            }
            className="px-3 py-1.5 text-sm glass-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option>الكل</option>
            <option>عالي</option>
            <option>متوسط</option>
            <option>منخفض</option>
          </select>

          <Button variant="ghost" size="sm" className="mr-auto">
            <X className="size-4 ml-1" />
            إعادة تعيين
          </Button>
        </div>
      </Card>

      {/* Logs Table */}
      <Card className="glass-panel border-2 border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">
                  الوقت
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">
                  النوع
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">
                  رقم الحالة
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">
                  الرسالة
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">
                  الحالة
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">
                  وقت الاستجابة
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">
                  الثقة
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">
                  الوسوم
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className="border-b border-border hover:bg-primary/5 transition-colors cursor-pointer group"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Clock className="size-3.5 text-muted-foreground" />
                      {log.time}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      className={`bg-gradient-to-r ${getTypeColor(log.type)} text-white border-0`}
                    >
                      {getTypeLabel(log.type)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-mono text-muted-foreground">
                      {log.caseId}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-foreground line-clamp-1 max-w-md">
                      {log.message}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    {log.success ? (
                      log.warning ? (
                        <AlertTriangle className="size-5 text-yellow-500" />
                      ) : (
                        <CheckCircle2 className="size-5 text-green-500" />
                      )
                    ) : (
                      <XCircle className="size-5 text-red-500" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-sm font-mono ${
                        log.responseTime > 1000
                          ? "text-red-500"
                          : log.responseTime > 500
                            ? "text-yellow-500"
                            : "text-green-500"
                      }`}
                    >
                      {log.responseTime === 0
                        ? "-"
                        : `${log.responseTime}ms`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {getConfidenceBadge(log.confidence)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap max-w-xs">
                      {log.tags.slice(0, 2).map((tag, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {log.tags.length > 2 && (
                        <Badge
                          variant="outline"
                          className="text-xs"
                        >
                          +{log.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Side Panel */}
      {selectedLog && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-end"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="w-full max-w-2xl h-full bg-background border-r-2 border-border shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border p-6 z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-foreground">
                  تفاصيل السجل
                </h3>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="size-5 text-muted-foreground" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  className={`bg-gradient-to-r ${getTypeColor(selectedLog.type)} text-white border-0`}
                >
                  {getTypeLabel(selectedLog.type)}
                </Badge>
                <span className="text-sm font-mono text-muted-foreground">
                  {selectedLog.caseId}
                </span>
                <span className="text-sm text-muted-foreground">
                  {selectedLog.time}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Status */}
              <div className="glass-card p-4 rounded-xl border border-border">
                <div className="flex items-center gap-3 mb-2">
                  {selectedLog.success ? (
                    selectedLog.warning ? (
                      <>
                        <AlertTriangle className="size-6 text-yellow-500" />
                        <span className="font-medium text-foreground">
                          تحذير
                        </span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="size-6 text-green-500" />
                        <span className="font-medium text-foreground">
                          نجاح
                        </span>
                      </>
                    )
                  ) : (
                    <>
                      <XCircle className="size-6 text-red-500" />
                      <span className="font-medium text-foreground">
                        فشل
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Full Message */}
              <div className="glass-card p-4 rounded-xl border border-border">
                <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                  <FileText className="size-4 text-primary" />
                  الرسالة الكاملة
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedLog.fullMessage}
                </p>
              </div>

              {/* Input/Output */}
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-card p-4 rounded-xl border border-border">
                  <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                    <ChevronLeft className="size-4 text-primary rotate-180" />
                    المدخلات
                  </h4>
                  <p className="text-xs text-muted-foreground font-mono bg-muted/30 p-2 rounded">
                    {selectedLog.input}
                  </p>
                </div>
                <div className="glass-card p-4 rounded-xl border border-border">
                  <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                    <ChevronLeft className="size-4 text-primary" />
                    المخرجات
                  </h4>
                  <p className="text-xs text-muted-foreground font-mono bg-muted/30 p-2 rounded">
                    {selectedLog.output}
                  </p>
                </div>
              </div>

              {/* System Decision */}
              <div className="glass-card p-4 rounded-xl border border-border">
                <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                  <Brain className="size-4 text-primary" />
                  قرار النظام
                </h4>
                <p className="text-sm text-muted-foreground">
                  {selectedLog.decision}
                </p>
              </div>

              {/* Confidence Level */}
              {selectedLog.confidence && (
                <div className="glass-card p-4 rounded-xl border border-border">
                  <h4 className="font-medium text-foreground mb-2">
                    مستوى الثقة
                  </h4>
                  <div>
                    {getConfidenceBadge(selectedLog.confidence)}
                  </div>
                </div>
              )}

              {/* Response Time */}
              {selectedLog.responseTime > 0 && (
                <div className="glass-card p-4 rounded-xl border border-border">
                  <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                    <Clock className="size-4 text-primary" />
                    وقت الاستجابة
                  </h4>
                  <p
                    className={`text-2xl font-bold ${
                      selectedLog.responseTime > 1000
                        ? "text-red-500"
                        : selectedLog.responseTime > 500
                          ? "text-yellow-500"
                          : "text-green-500"
                    }`}
                  >
                    {selectedLog.responseTime}ms
                  </p>
                </div>
              )}

              {/* Tags */}
              <div className="glass-card p-4 rounded-xl border border-border">
                <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                  <Tag className="size-4 text-primary" />
                  الوسوم
                </h4>
                <div className="flex gap-2 flex-wrap">
                  {selectedLog.tags.map((tag, idx) => (
                    <Badge key={idx} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="glass-card p-4 rounded-xl border border-border">
                <h4 className="font-medium text-foreground mb-3">
                  الإجراءات
                </h4>
                <div className="space-y-2">
                  <Button className="w-full justify-start bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white">
                    <GraduationCap className="size-4 ml-2" />
                    إضافة إلى مراجعة التعلم
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/10"
                  >
                    <AlertCircle className="size-4 ml-2" />
                    تحديد كمشكلة
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                  >
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