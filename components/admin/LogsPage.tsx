import { ScrollText, Filter, Download, Search, AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  user?: string;
  ip?: string;
}

export function LogsPage() {
  const mockLogs: LogEntry[] = [
    { 
      id: '1', 
      timestamp: '2026-01-07 14:23:45', 
      level: 'success', 
      message: 'تم تسجيل دخول المستخدم بنجاح',
      user: 'admin@rafeeq.sa',
      ip: '192.168.1.100'
    },
    { 
      id: '2', 
      timestamp: '2026-01-07 14:20:12', 
      level: 'error', 
      message: 'فشل في الاتصال بقاعدة البيانات',
      user: 'system',
      ip: 'localhost'
    },
    { 
      id: '3', 
      timestamp: '2026-01-07 14:15:33', 
      level: 'warning', 
      message: 'محاولة وصول غير مصرح بها من IP مشبوه',
      user: 'unknown',
      ip: '45.123.45.67'
    },
    { 
      id: '4', 
      timestamp: '2026-01-07 14:10:05', 
      level: 'info', 
      message: 'تم تحديث إعدادات النظام',
      user: 'admin@rafeeq.sa',
      ip: '192.168.1.100'
    },
    { 
      id: '5', 
      timestamp: '2026-01-07 14:05:22', 
      level: 'success', 
      message: 'تم إنشاء نسخة احتياطية بنجاح',
      user: 'system',
      ip: 'localhost'
    },
    { 
      id: '6', 
      timestamp: '2026-01-07 14:00:00', 
      level: 'info', 
      message: 'بدء المهام المجدولة',
      user: 'system',
      ip: 'localhost'
    },
    { 
      id: '7', 
      timestamp: '2026-01-07 13:55:41', 
      level: 'warning', 
      message: 'استخدام الذاكرة أعلى من الحد الطبيعي (85%)',
      user: 'system',
      ip: 'localhost'
    },
    { 
      id: '8', 
      timestamp: '2026-01-07 13:50:18', 
      level: 'success', 
      message: 'تم حل المشكلة #123 بنجاح',
      user: 'user@rafeeq.sa',
      ip: '192.168.1.105'
    },
  ];

  const getLevelBadge = (level: string) => {
    const variants = {
      'success': { 
        label: 'نجاح', 
        color: 'bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400 border-green-200 dark:border-green-900',
        icon: CheckCircle
      },
      'error': { 
        label: 'خطأ', 
        color: 'bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900',
        icon: XCircle
      },
      'warning': { 
        label: 'تحذير', 
        color: 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900',
        icon: AlertCircle
      },
      'info': { 
        label: 'معلومات', 
        color: 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900',
        icon: Info
      },
    };
    const variant = variants[level as keyof typeof variants] || variants.info;
    const Icon = variant.icon;
    return (
      <Badge className={`${variant.color} border flex items-center gap-1 w-fit`}>
        <Icon className="size-3" />
        {variant.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Logs</h2>
          <p className="text-muted-foreground">سجلات النظام والأحداث</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white">
          <Download className="size-4 ml-2" />
          تصدير السجلات
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-panel border-2 border-border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-950 rounded-lg">
              <CheckCircle className="size-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">1,245</p>
              <p className="text-xs text-muted-foreground">عمليات ناجحة</p>
            </div>
          </div>
        </Card>
        <Card className="glass-panel border-2 border-border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-950 rounded-lg">
              <XCircle className="size-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">23</p>
              <p className="text-xs text-muted-foreground">أخطاء</p>
            </div>
          </div>
        </Card>
        <Card className="glass-panel border-2 border-border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-950 rounded-lg">
              <AlertCircle className="size-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">156</p>
              <p className="text-xs text-muted-foreground">تحذيرات</p>
            </div>
          </div>
        </Card>
        <Card className="glass-panel border-2 border-border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-950 rounded-lg">
              <Info className="size-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">847</p>
              <p className="text-xs text-muted-foreground">معلومات</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-panel border-2 border-border p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input 
                placeholder="ابحث في السجلات..." 
                className="glass-card border-2 border-border pr-10"
              />
            </div>
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="glass-card border-2 border-border w-full sm:w-[180px]">
              <Filter className="size-4 ml-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المستويات</SelectItem>
              <SelectItem value="success">نجاح</SelectItem>
              <SelectItem value="error">خطأ</SelectItem>
              <SelectItem value="warning">تحذير</SelectItem>
              <SelectItem value="info">معلومات</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="today">
            <SelectTrigger className="glass-card border-2 border-border w-full sm:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">اليوم</SelectItem>
              <SelectItem value="week">آخر أسبوع</SelectItem>
              <SelectItem value="month">آخر شهر</SelectItem>
              <SelectItem value="all">الكل</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Logs Table */}
      <Card className="glass-panel border-2 border-border p-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="text-right text-foreground">الوقت</TableHead>
                <TableHead className="text-right text-foreground">المستوى</TableHead>
                <TableHead className="text-right text-foreground">الرسالة</TableHead>
                <TableHead className="text-right text-foreground">المستخدم</TableHead>
                <TableHead className="text-right text-foreground">IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockLogs.map((log) => (
                <TableRow key={log.id} className="border-b border-border hover:bg-accent/50">
                  <TableCell className="text-muted-foreground font-mono text-xs whitespace-nowrap">
                    {log.timestamp}
                  </TableCell>
                  <TableCell>
                    {getLevelBadge(log.level)}
                  </TableCell>
                  <TableCell className="text-foreground max-w-md">
                    {log.message}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {log.user}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {log.ip}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground">
            عرض 1-8 من 2,271 سجل
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>السابق</Button>
            <Button variant="outline" size="sm">التالي</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
