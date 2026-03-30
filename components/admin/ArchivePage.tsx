import { Archive, Download, Trash2, Search, FileText, Clock, HardDrive } from 'lucide-react';
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

interface ArchiveItem {
  id: string;
  name: string;
  type: 'backup' | 'log' | 'report' | 'data';
  size: string;
  date: string;
  retention: string;
}

export function ArchivePage() {
  const mockArchiveItems: ArchiveItem[] = [
    { 
      id: '1', 
      name: 'نسخة احتياطية كاملة - يناير 2026', 
      type: 'backup', 
      size: '2.4 GB', 
      date: '2026-01-07',
      retention: '30 يوم'
    },
    { 
      id: '2', 
      name: 'سجلات النظام - ديسمبر 2025', 
      type: 'log', 
      size: '156 MB', 
      date: '2026-01-01',
      retention: '90 يوم'
    },
    { 
      id: '3', 
      name: 'تقرير الأداء الشهري', 
      type: 'report', 
      size: '5.2 MB', 
      date: '2025-12-31',
      retention: '365 يوم'
    },
    { 
      id: '4', 
      name: 'بيانات المستخدمين المحذوفة', 
      type: 'data', 
      size: '89 MB', 
      date: '2025-12-28',
      retention: '60 يوم'
    },
    { 
      id: '5', 
      name: 'نسخة احتياطية أسبوعية', 
      type: 'backup', 
      size: '1.8 GB', 
      date: '2025-12-25',
      retention: '30 يوم'
    },
  ];

  const getTypeBadge = (type: string) => {
    const variants = {
      'backup': { label: 'نسخة احتياطية', color: 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900' },
      'log': { label: 'سجل', color: 'bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900' },
      'report': { label: 'تقرير', color: 'bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400 border-green-200 dark:border-green-900' },
      'data': { label: 'بيانات', color: 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900' },
    };
    const variant = variants[type as keyof typeof variants] || variants.data;
    return <Badge className={`${variant.color} border`}>{variant.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Archive</h2>
          <p className="text-muted-foreground">إدارة النسخ الاحتياطية والأرشيف</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white">
          <Archive className="size-4 ml-2" />
          إنشاء نسخة احتياطية
        </Button>
      </div>

      {/* Storage Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-panel border-2 border-border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg">
              <HardDrive className="size-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">4.7 GB</p>
              <p className="text-xs text-muted-foreground">إجمالي المساحة المستخدمة</p>
            </div>
          </div>
        </Card>
        <Card className="glass-panel border-2 border-border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
              <Archive className="size-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">45</p>
              <p className="text-xs text-muted-foreground">عدد العناصر المؤرشفة</p>
            </div>
          </div>
        </Card>
        <Card className="glass-panel border-2 border-border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
              <FileText className="size-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">12</p>
              <p className="text-xs text-muted-foreground">نسخ احتياطية</p>
            </div>
          </div>
        </Card>
        <Card className="glass-panel border-2 border-border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <Clock className="size-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">30</p>
              <p className="text-xs text-muted-foreground">متوسط مدة الاحتفاظ (يوم)</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Storage Usage */}
      <Card className="glass-panel border-2 border-border p-6">
        <h3 className="text-lg font-bold text-foreground mb-4">استخدام المساحة التخزينية</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">النسخ الاحتياطية</span>
              <span className="text-foreground font-semibold">4.2 GB (89%)</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full w-[89%] bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">السجلات</span>
              <span className="text-foreground font-semibold">312 MB (7%)</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full w-[7%] bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">التقارير والبيانات</span>
              <span className="text-foreground font-semibold">194 MB (4%)</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full w-[4%] bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" />
            </div>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card className="glass-panel border-2 border-border p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input 
                placeholder="ابحث في الأرشيف..." 
                className="glass-card border-2 border-border pr-10"
              />
            </div>
          </div>
          <Select defaultValue="all-types">
            <SelectTrigger className="glass-card border-2 border-border w-full sm:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-types">جميع الأنواع</SelectItem>
              <SelectItem value="backup">نسخ احتياطية</SelectItem>
              <SelectItem value="log">سجلات</SelectItem>
              <SelectItem value="report">تقارير</SelectItem>
              <SelectItem value="data">بيانات</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="newest">
            <SelectTrigger className="glass-card border-2 border-border w-full sm:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">الأحدث أولاً</SelectItem>
              <SelectItem value="oldest">الأقدم أولاً</SelectItem>
              <SelectItem value="largest">الأكبر حجماً</SelectItem>
              <SelectItem value="smallest">الأصغر حجماً</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Archive Table */}
      <Card className="glass-panel border-2 border-border p-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="text-right text-foreground">الاسم</TableHead>
                <TableHead className="text-right text-foreground">النوع</TableHead>
                <TableHead className="text-right text-foreground">الحجم</TableHead>
                <TableHead className="text-right text-foreground">التاريخ</TableHead>
                <TableHead className="text-right text-foreground">مدة الاحتفاظ</TableHead>
                <TableHead className="text-right text-foreground">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockArchiveItems.map((item) => (
                <TableRow key={item.id} className="border-b border-border hover:bg-accent/50">
                  <TableCell className="font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <FileText className="size-4 text-muted-foreground" />
                      {item.name}
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(item.type)}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">{item.size}</TableCell>
                  <TableCell className="text-muted-foreground">{item.date}</TableCell>
                  <TableCell className="text-muted-foreground">{item.retention}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                        <Download className="size-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600">
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground">
            عرض 1-5 من 45 عنصر
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>السابق</Button>
            <Button variant="outline" size="sm">التالي</Button>
          </div>
        </div>
      </Card>

      {/* Retention Policy */}
      <Card className="glass-panel border-2 border-border p-6">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Clock className="size-5 text-primary" />
          سياسة الاحتفاظ
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 glass-card rounded-xl border border-border">
            <p className="text-foreground font-medium mb-2">النسخ الاحتياطية</p>
            <p className="text-sm text-muted-foreground">الاحتفاظ لمدة 30 يوم ثم الحذف التلقائي</p>
          </div>
          <div className="p-4 glass-card rounded-xl border border-border">
            <p className="text-foreground font-medium mb-2">السجلات</p>
            <p className="text-sm text-muted-foreground">الاحتفاظ لمدة 90 يوم للامتثال</p>
          </div>
          <div className="p-4 glass-card rounded-xl border border-border">
            <p className="text-foreground font-medium mb-2">التقارير</p>
            <p className="text-sm text-muted-foreground">الاحتفاظ لمدة 365 يوم</p>
          </div>
          <div className="p-4 glass-card rounded-xl border border-border">
            <p className="text-foreground font-medium mb-2">البيانات المحذوفة</p>
            <p className="text-sm text-muted-foreground">الاحتفاظ لمدة 60 يوم للاسترجاع</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
