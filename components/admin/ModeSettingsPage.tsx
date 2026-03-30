import { Palette, Sun, Moon, Monitor, Contrast, Eye } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

export function ModeSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Mode Settings</h2>
        <p className="text-muted-foreground">تخصيص مظهر النظام وألوانه</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Theme Mode */}
        <Card className="glass-panel border-2 border-border p-6">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Palette className="size-5 text-primary" />
            وضع المظهر
          </h3>
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-foreground">الوضع الافتراضي</Label>
              <div className="grid grid-cols-3 gap-3">
                <button className="p-4 glass-card rounded-xl border-2 border-cyan-500 bg-cyan-500/10 hover:bg-cyan-500/20 transition-all">
                  <Sun className="size-6 text-cyan-600 dark:text-cyan-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-foreground">نهاري</p>
                </button>
                <button className="p-4 glass-card rounded-xl border-2 border-border hover:bg-accent/50 transition-all">
                  <Moon className="size-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-semibold text-foreground">ليلي</p>
                </button>
                <button className="p-4 glass-card rounded-xl border-2 border-border hover:bg-accent/50 transition-all">
                  <Monitor className="size-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-semibold text-foreground">تلقائي</p>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 glass-card rounded-xl border border-border">
              <div>
                <p className="text-foreground font-medium">التبديل التلقائي</p>
                <p className="text-xs text-muted-foreground">حسب وقت اليوم</p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between p-4 glass-card rounded-xl border border-border">
              <div>
                <p className="text-foreground font-medium">حفظ تفضيلات المستخدم</p>
                <p className="text-xs text-muted-foreground">تذكر اختيار المستخدم</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </Card>

        {/* Color Scheme */}
        <Card className="glass-panel border-2 border-border p-6">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Contrast className="size-5 text-primary" />
            نظام الألوان
          </h3>
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-foreground">اللون الأساسي</Label>
              <div className="grid grid-cols-4 gap-3">
                <button className="h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 border-2 border-cyan-400 shadow-lg">
                  <span className="sr-only">Cyan/Blue</span>
                </button>
                <button className="h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 border-2 border-border hover:border-purple-400 transition-all">
                  <span className="sr-only">Purple/Pink</span>
                </button>
                <button className="h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 border-2 border-border hover:border-green-400 transition-all">
                  <span className="sr-only">Green/Emerald</span>
                </button>
                <button className="h-12 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 border-2 border-border hover:border-orange-400 transition-all">
                  <span className="sr-only">Orange/Red</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-foreground">نمط الواجهة</Label>
              <Select defaultValue="glass">
                <SelectTrigger className="glass-card border-2 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="glass">Glass/Soft UI</SelectItem>
                  <SelectItem value="solid">Solid</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-4 glass-card rounded-xl border border-border">
              <div>
                <p className="text-foreground font-medium">الخلفية المتحركة</p>
                <p className="text-xs text-muted-foreground">كرات متحركة في الخلفية</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between p-4 glass-card rounded-xl border border-border">
              <div>
                <p className="text-foreground font-medium">التدرجات اللونية</p>
                <p className="text-xs text-muted-foreground">استخدام الألوان المتدرجة</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </Card>

        {/* Accessibility */}
        <Card className="glass-panel border-2 border-border p-6">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Eye className="size-5 text-primary" />
            إمكانية الوصول
          </h3>
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-foreground">حجم الخط</Label>
              <Select defaultValue="medium">
                <SelectTrigger className="glass-card border-2 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">صغير</SelectItem>
                  <SelectItem value="medium">متوسط</SelectItem>
                  <SelectItem value="large">كبير</SelectItem>
                  <SelectItem value="xlarge">كبير جداً</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-4 glass-card rounded-xl border border-border">
              <div>
                <p className="text-foreground font-medium">التباين العالي</p>
                <p className="text-xs text-muted-foreground">لتحسين القراءة</p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between p-4 glass-card rounded-xl border border-border">
              <div>
                <p className="text-foreground font-medium">تقليل الحركة</p>
                <p className="text-xs text-muted-foreground">إيقاف التأثيرات المتحركة</p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between p-4 glass-card rounded-xl border border-border">
              <div>
                <p className="text-foreground font-medium">قارئ الشاشة</p>
                <p className="text-xs text-muted-foreground">دعم ARIA</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </Card>

        {/* Preview */}
        <Card className="glass-panel border-2 border-border p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">معاينة المظهر</h3>
          <div className="space-y-4">
            <div className="p-6 glass-card rounded-xl border-2 border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl">
                  <Palette className="size-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">عنوان تجريبي</h4>
                  <p className="text-sm text-muted-foreground">نص تجريبي للمعاينة</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white">
                  زر رئيسي
                </Button>
                <Button size="sm" variant="outline">
                  زر ثانوي
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 glass-card rounded-lg border border-border text-center">
                <p className="text-2xl font-bold text-foreground">1,234</p>
                <p className="text-xs text-muted-foreground">إحصائية</p>
              </div>
              <div className="p-3 glass-card rounded-lg border border-border text-center">
                <p className="text-2xl font-bold text-foreground">94.2%</p>
                <p className="text-xs text-muted-foreground">نسبة</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
