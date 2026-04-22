import { useState, useEffect } from 'react';
import { RefreshCw, Plus, Edit, Trash2, AlertTriangle, CheckCircle, Clock, Wrench } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { OperationalUpdate, UpdateFormData } from '../types';

export function OperationalUpdates() {
  // ========================
  // State Management
  // ========================
  const [updates, setUpdates] = useState<OperationalUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState<OperationalUpdate | null>(null);

  // Form state
  const [formData, setFormData] = useState<UpdateFormData>({
    title: '',
    description: '',
    type: 'announcement',
    priority: 'medium',
    startDate: new Date(),
    affectedServices: [],
  });

  // ========================
  // Data Fetching
  // ========================
  useEffect(() => {
    loadUpdates();
  }, []);

  const loadUpdates = async () => {
    setIsLoading(true);
    try {
      // Not implemented yet (real backend endpoints not wired).
      // Keep UI, but do not show mock data.
      setUpdates([]);
    } catch (error) {
      console.error('Error loading updates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ========================
  // CRUD Operations
  // ========================
  const handleCreateUpdate = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await updatesApi.createUpdate(formData);
      // if (response.success) {
      //   await loadUpdates();
      //   setIsCreateDialogOpen(false);
      //   resetForm();
      // }

      console.log('Creating update:', formData);
      await simulateDelay(500);
      setIsCreateDialogOpen(false);
      resetForm();
      await loadUpdates();
    } catch (error) {
      console.error('Error creating update:', error);
    }
  };

  const handleUpdateUpdate = async () => {
    if (!selectedUpdate) return;

    try {
      // TODO: Replace with actual API call
      // const response = await updatesApi.updateUpdate(selectedUpdate.id, formData);
      // if (response.success) {
      //   await loadUpdates();
      //   setIsEditDialogOpen(false);
      //   setSelectedUpdate(null);
      //   resetForm();
      // }

      console.log('Updating update:', selectedUpdate.id, formData);
      await simulateDelay(500);
      setIsEditDialogOpen(false);
      setSelectedUpdate(null);
      resetForm();
      await loadUpdates();
    } catch (error) {
      console.error('Error updating update:', error);
    }
  };

  const handleDeleteUpdate = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التحديث؟')) return;

    try {
      // TODO: Replace with actual API call
      // const response = await updatesApi.deleteUpdate(id);
      // if (response.success) {
      //   await loadUpdates();
      // }

      console.log('Deleting update:', id);
      await simulateDelay(300);
      await loadUpdates();
    } catch (error) {
      console.error('Error deleting update:', error);
    }
  };

  const handleUpdateStatus = async (id: string, status: OperationalUpdate['status']) => {
    try {
      // TODO: Replace with actual API call
      // const response = await updatesApi.updateStatus(id, status);
      // if (response.success) {
      //   await loadUpdates();
      // }

      console.log('Updating status:', id, status);
      await simulateDelay(300);
      await loadUpdates();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // ========================
  // Helper Functions
  // ========================
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'announcement',
      priority: 'medium',
      startDate: new Date(),
      affectedServices: [],
    });
  };

  const openEditDialog = (update: OperationalUpdate) => {
    setSelectedUpdate(update);
    setFormData({
      title: update.title,
      description: update.description,
      type: update.type,
      priority: update.priority,
      startDate: update.startDate,
      endDate: update.endDate,
      affectedServices: update.affectedServices,
    });
    setIsEditDialogOpen(true);
  };

  const getTypeIcon = (type: OperationalUpdate['type']) => {
    switch (type) {
      case 'maintenance':
        return <Wrench className="size-5 text-blue-600" />;
      case 'incident':
        return <AlertTriangle className="size-5 text-red-600" />;
      case 'enhancement':
        return <CheckCircle className="size-5 text-green-600" />;
      default:
        return <RefreshCw className="size-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: OperationalUpdate['status']) => {
    const variants = {
      scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      ongoing: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    };

    const labels = {
      scheduled: 'مجدول',
      ongoing: 'جاري التنفيذ',
      completed: 'مكتمل',
      cancelled: 'ملغى',
    };

    return (
      <Badge className={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const getTypeBadge = (type: OperationalUpdate['type']) => {
    const labels = {
      maintenance: 'صيانة',
      incident: 'حادثة',
      enhancement: 'تحسين',
      announcement: 'إعلان',
    };

    return <Badge variant="outline">{labels[type]}</Badge>;
  };

  const getPriorityBadge = (priority: OperationalUpdate['priority']) => {
    const variants = {
      high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      low: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    };

    const labels = {
      high: 'عالية',
      medium: 'متوسطة',
      low: 'منخفضة',
    };

    return (
      <Badge className={variants[priority]}>
        {labels[priority]}
      </Badge>
    );
  };

  // ========================
  // Render
  // ========================
  return (
    <div className="space-y-6">
      <Card className="border-2 border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/20">
        <CardContent className="p-4 text-right text-sm text-amber-800 dark:text-amber-200">
          هذه الصفحة غير مربوطة بالباك إند حالياً (تم إيقاف البيانات الوهمية). سيتم تفعيلها لاحقاً.
        </CardContent>
      </Card>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl">
            <RefreshCw className="size-8 text-primary" />
          </div>
          <div>
            <h1 className="text-foreground">التحديثات التشغيلية</h1>
            <p className="text-sm text-muted-foreground">آخر التحديثات والصيانة والإعلانات</p>
          </div>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="size-4 ml-2" />
          تحديث جديد
        </Button>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">جاري التحميل...</p>
            </CardContent>
          </Card>
        ) : updates.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <RefreshCw className="size-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد تحديثات</p>
            </CardContent>
          </Card>
        ) : (
          updates.map((update, index) => (
            <Card key={update.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getTypeIcon(update.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 text-right">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h3 className="font-bold text-foreground mb-2">{update.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{update.description}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {getStatusBadge(update.status)}
                          {getTypeBadge(update.type)}
                          {getPriorityBadge(update.priority)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(update)}
                        >
                          <Edit className="size-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUpdate(update.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-muted/30 rounded-lg">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">تاريخ البدء</p>
                        <p className="text-sm font-medium">{new Date(update.startDate).toLocaleString('ar-SA')}</p>
                      </div>
                      {update.endDate && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">تاريخ الانتهاء</p>
                          <p className="text-sm font-medium">{new Date(update.endDate).toLocaleString('ar-SA')}</p>
                        </div>
                      )}
                      <div className="md:col-span-2">
                        <p className="text-xs text-muted-foreground mb-2">الخدمات المتأثرة</p>
                        <div className="flex flex-wrap gap-2">
                          {update.affectedServices.map((service, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">{service}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-muted-foreground">
                      <span>بواسطة {update.createdBy}</span>
                      <span className="mx-2">•</span>
                      <span>{new Date(update.createdAt).toLocaleDateString('ar-SA')}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">تحديث تشغيلي جديد</DialogTitle>
            <DialogDescription className="text-right">
              أضف تحديثاً تشغيلياً جديداً
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-right block">العنوان</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="text-right"
                placeholder="عنوان التحديث..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-right block">الوصف</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="text-right min-h-[100px]"
                placeholder="وصف تفصيلي..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-right block">النوع</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger className="text-right">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="maintenance">صيانة</SelectItem>
                    <SelectItem value="incident">حادثة</SelectItem>
                    <SelectItem value="enhancement">تحسين</SelectItem>
                    <SelectItem value="announcement">إعلان</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-right block">الأولوية</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger className="text-right">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="high">عالية</SelectItem>
                    <SelectItem value="medium">متوسطة</SelectItem>
                    <SelectItem value="low">منخفضة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="services" className="text-right block">الخدمات المتأثرة (مفصولة بفواصل)</Label>
              <Input
                id="services"
                value={formData.affectedServices.join(', ')}
                onChange={e => setFormData({ ...formData, affectedServices: e.target.value.split(/[،,]/).map(s => s.trim()) })}
                className="text-right"
                placeholder="مثال: نظام الحجز, البوابة الإلكترونية"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleCreateUpdate} className="bg-blue-600 hover:bg-blue-700">
              إضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">تعديل التحديث</DialogTitle>
            <DialogDescription className="text-right">
              تعديل بيانات التحديث التشغيلي
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title" className="text-right block">العنوان</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description" className="text-right block">الوصف</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="text-right min-h-[100px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-right block">النوع</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger className="text-right">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="maintenance">صيانة</SelectItem>
                    <SelectItem value="incident">حادثة</SelectItem>
                    <SelectItem value="enhancement">تحسين</SelectItem>
                    <SelectItem value="announcement">إعلان</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-right block">الأولوية</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger className="text-right">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="high">عالية</SelectItem>
                    <SelectItem value="medium">متوسطة</SelectItem>
                    <SelectItem value="low">منخفضة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleUpdateUpdate} className="bg-blue-600 hover:bg-blue-700">
              حفظ التعديلات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}