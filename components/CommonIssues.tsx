import { useState, useEffect } from 'react';
import { AlertCircle, Search, Filter, Plus, Edit, Trash2, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import type { Issue, IssueFormData } from '../types';

export function CommonIssues() {
  // ========================
  // State Management
  // ========================
  const [issues, setIssues] = useState<Issue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Form state
  const [formData, setFormData] = useState<IssueFormData>({
    title: '',
    description: '',
    category: '',
    entityType: 'umrah',
    priority: 'medium',
    reportedBy: '',
    tags: [],
  });

  // ========================
  // Data Fetching (Ready for API)
  // ========================
  useEffect(() => {
    loadIssues();
  }, []);

  const loadIssues = async () => {
    setIsLoading(true);
    try {
      // Not implemented yet (real backend endpoints not wired).
      // Keep UI, but do not show mock data.
      setIssues([]);
    } catch (error) {
      console.error('Error loading issues:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ========================
  // Filtering Logic
  // ========================
  useEffect(() => {
    let filtered = [...issues];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        issue =>
          issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          issue.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(issue => issue.status === selectedStatus);
    }

    // Priority filter
    if (selectedPriority !== 'all') {
      filtered = filtered.filter(issue => issue.priority === selectedPriority);
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(issue => issue.category === selectedCategory);
    }

    setFilteredIssues(filtered);
  }, [issues, searchQuery, selectedStatus, selectedPriority, selectedCategory]);

  // ========================
  // CRUD Operations (Ready for API)
  // ========================
  const handleCreateIssue = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await issuesApi.createIssue(formData);
      // if (response.success) {
      //   await loadIssues();
      //   setIsCreateDialogOpen(false);
      //   resetForm();
      // }

      console.log('Creating issue:', formData);
      await simulateDelay(500);
      setIsCreateDialogOpen(false);
      resetForm();
      // Reload issues after creation
      await loadIssues();
    } catch (error) {
      console.error('Error creating issue:', error);
    }
  };

  const handleUpdateIssue = async () => {
    if (!selectedIssue) return;

    try {
      // TODO: Replace with actual API call
      // const response = await issuesApi.updateIssue(selectedIssue.id, formData);
      // if (response.success) {
      //   await loadIssues();
      //   setIsEditDialogOpen(false);
      //   setSelectedIssue(null);
      //   resetForm();
      // }

      console.log('Updating issue:', selectedIssue.id, formData);
      await simulateDelay(500);
      setIsEditDialogOpen(false);
      setSelectedIssue(null);
      resetForm();
      await loadIssues();
    } catch (error) {
      console.error('Error updating issue:', error);
    }
  };

  const handleDeleteIssue = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المشكلة؟')) return;

    try {
      // TODO: Replace with actual API call
      // const response = await issuesApi.deleteIssue(id);
      // if (response.success) {
      //   await loadIssues();
      // }

      console.log('Deleting issue:', id);
      await simulateDelay(300);
      await loadIssues();
    } catch (error) {
      console.error('Error deleting issue:', error);
    }
  };

  const handleUpdateStatus = async (id: string, status: Issue['status']) => {
    try {
      // TODO: Replace with actual API call
      // const response = await issuesApi.updateIssueStatus(id, status);
      // if (response.success) {
      //   await loadIssues();
      // }

      console.log('Updating status:', id, status);
      await simulateDelay(300);
      await loadIssues();
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
      category: '',
      entityType: 'umrah',
      priority: 'medium',
      reportedBy: '',
      tags: [],
    });
  };

  const openEditDialog = (issue: Issue) => {
    setSelectedIssue(issue);
    setFormData({
      title: issue.title,
      description: issue.description,
      category: issue.category,
      entityType: issue.entityType,
      priority: issue.priority,
      reportedBy: issue.reportedBy,
      tags: issue.tags,
    });
    setIsEditDialogOpen(true);
  };

  const getStatusIcon = (status: Issue['status']) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="size-4 text-green-500" />;
      case 'pending':
        return <Clock className="size-4 text-yellow-500" />;
      case 'active':
        return <AlertTriangle className="size-4 text-orange-500" />;
      default:
        return <AlertCircle className="size-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: Issue['status']) => {
    const variants = {
      active: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    };

    const labels = {
      active: 'نشطة',
      resolved: 'محلولة',
      pending: 'قيد الانتظار',
      closed: 'مغلقة',
    };

    return (
      <Badge className={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: Issue['priority']) => {
    const variants = {
      high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
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
  // Pagination
  // ========================
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredIssues.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredIssues.length / itemsPerPage);

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
            <AlertCircle className="size-8 text-primary" />
          </div>
          <div>
            <h1 className="text-foreground">المشاكل العامة</h1>
            <p className="text-sm text-muted-foreground">إدارة ومتابعة جميع المشاكل المسجلة</p>
          </div>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="size-4 ml-2" />
          إضافة مشكلة جديدة
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400" />
              <Input
                placeholder="بحث..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pr-10 text-right"
              />
            </div>

            {/* Status Filter */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="text-right">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="active">نشطة</SelectItem>
                <SelectItem value="pending">قيد الانتظار</SelectItem>
                <SelectItem value="resolved">محلولة</SelectItem>
                <SelectItem value="closed">مغلقة</SelectItem>
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger className="text-right">
                <SelectValue placeholder="الأولوية" />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="all">جميع الأولويات</SelectItem>
                <SelectItem value="high">عالية</SelectItem>
                <SelectItem value="medium">متوسطة</SelectItem>
                <SelectItem value="low">منخفضة</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="text-right">
                <SelectValue placeholder="الفئة" />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="all">جميع الفئات</SelectItem>
                <SelectItem value="تقني">تقني</SelectItem>
                <SelectItem value="مالي">مالي</SelectItem>
                <SelectItem value="حجوزات">حجوزات</SelectItem>
                <SelectItem value="خدمة عملاء">خدمة عملاء</SelectItem>
                <SelectItem value="سياسات">سياسات</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Issues List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">جاري التحميل...</p>
            </CardContent>
          </Card>
        ) : currentItems.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="size-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد مشاكل مسجلة</p>
            </CardContent>
          </Card>
        ) : (
          currentItems.map(issue => (
            <Card key={issue.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 text-right">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(issue.status)}
                      <h3 className="font-bold text-foreground">{issue.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{issue.description}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {getStatusBadge(issue.status)}
                      {getPriorityBadge(issue.priority)}
                      <Badge variant="outline" className="text-xs">{issue.category}</Badge>
                      <Badge variant="outline" className="text-xs">
                        {issue.entityType === 'umrah' ? 'شركة عمرة' : issue.entityType === 'external' ? 'وكيل خارجي' : 'مزود سكن'}
                      </Badge>
                    </div>
                    <div className="mt-4 text-xs text-muted-foreground">
                      <span>بواسطة: {issue.reportedBy}</span>
                      <span className="mx-2">•</span>
                      <span>{new Date(issue.reportedAt).toLocaleDateString('ar-SA')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(issue)}
                    >
                      <Edit className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteIssue(issue.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            السابق
          </Button>
          <span className="text-sm text-muted-foreground">
            صفحة {currentPage} من {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            التالي
          </Button>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">إضافة مشكلة جديدة</DialogTitle>
            <DialogDescription className="text-right">
              قم بتعبئة البيانات التالية لإضافة مشكلة جديدة
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
                placeholder="عنوان المشكلة..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-right block">الوصف</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="text-right min-h-[100px]"
                placeholder="وصف تفصيلي للمشكلة..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-right block">الفئة</Label>
                <Input
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="text-right"
                  placeholder="مثال: تقني"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-right block">المبلّغ</Label>
                <Input
                  value={formData.reportedBy}
                  onChange={e => setFormData({ ...formData, reportedBy: e.target.value })}
                  className="text-right"
                  placeholder="اسم المبلّغ"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-right block">نوع الجهة</Label>
                <Select
                  value={formData.entityType}
                  onValueChange={(value: any) => setFormData({ ...formData, entityType: value })}
                >
                  <SelectTrigger className="text-right">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="umrah">شركة عمرة</SelectItem>
                    <SelectItem value="external">وكيل خارجي</SelectItem>
                    <SelectItem value="accommodation">مزود سكن</SelectItem>
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
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleCreateIssue} className="bg-blue-600 hover:bg-blue-700">
              إضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">تعديل المشكلة</DialogTitle>
            <DialogDescription className="text-right">
              تعديل بيانات المشكلة
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
                <Label className="text-right block">نوع الجهة</Label>
                <Select
                  value={formData.entityType}
                  onValueChange={(value: any) => setFormData({ ...formData, entityType: value })}
                >
                  <SelectTrigger className="text-right">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="umrah">شركة عمرة</SelectItem>
                    <SelectItem value="external">وكيل خارجي</SelectItem>
                    <SelectItem value="accommodation">مزود سكن</SelectItem>
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
            <Button onClick={handleUpdateIssue} className="bg-blue-600 hover:bg-blue-700">
              حفظ التعديلات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
