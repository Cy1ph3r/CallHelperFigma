import { useState, useEffect } from 'react';
import { BookOpen, Search, Plus, Edit, Trash2, Eye, ThumbsUp, ThumbsDown, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import type { KnowledgeArticle, KnowledgeFormData } from '../types';
import {
  createKnowledgeArticle,
  deleteKnowledgeArticle,
  listKnowledgeArticles,
  recordKnowledgeFeedback,
  recordKnowledgeView,
  updateKnowledgeArticle,
} from '../services/knowledgeBaseService';

export function KnowledgeBase() {
  // ========================
  // State Management
  // ========================
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<KnowledgeArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<KnowledgeFormData>({
    title: '',
    content: '',
    category: '',
    tags: [],
    relatedIssues: [],
  });

  // ========================
  // Data Fetching
  // ========================
  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    setIsLoading(true);
    try {
      const backendArticles = await listKnowledgeArticles({
        search: searchQuery || undefined,
        category: selectedCategory,
      });

      const mapped: KnowledgeArticle[] = backendArticles.map((a) => {
        const createdAt = a.createdAt ? new Date(a.createdAt) : new Date();
        const updatedAt = a.updatedAt ? new Date(a.updatedAt) : createdAt;
        const content = `${a.description}\n\n---\n\nالحل:\n${a.solution}`;

        return {
          id: a._id,
          title: a.title,
          content,
          category: a.category,
          tags: a.keywords ?? [],
          author: a.createdBy?.name || a.createdBy?.username || '—',
          createdAt,
          updatedAt,
          views: a.viewCount ?? 0,
          helpful: a.helpfulCount ?? 0,
          notHelpful: a.notHelpfulCount ?? 0,
          relatedIssues: [],
          status: a.isPublished ? 'published' : 'draft',
        };
      });

      setArticles(mapped);
    } catch (error) {
      console.error('Error loading articles:', error);
      setArticles([]);
    } finally {
      setIsLoading(false);
    }
  };

  // ========================
  // Filtering
  // ========================
  useEffect(() => {
    let filtered = [...articles];

    if (searchQuery) {
      filtered = filtered.filter(
        article =>
          article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(article => article.category === selectedCategory);
    }

    setFilteredArticles(filtered);
  }, [articles, searchQuery, selectedCategory]);

  // ========================
  // CRUD Operations
  // ========================
  const handleCreateArticle = async () => {
    try {
      await createKnowledgeArticle({
        title: formData.title,
        description: formData.content,
        solution: formData.content,
        category: formData.category,
        keywords: formData.tags,
        confidence: 80,
        isPublished: true,
      });

      setIsCreateDialogOpen(false);
      resetForm();
      await loadArticles();
    } catch (error) {
      console.error('Error creating article:', error);
    }
  };

  const handleUpdateArticle = async () => {
    if (!selectedArticle) return;

    try {
      await updateKnowledgeArticle(selectedArticle.id, {
        title: formData.title,
        description: formData.content,
        solution: formData.content,
        category: formData.category,
        keywords: formData.tags,
      });

      setIsEditDialogOpen(false);
      setSelectedArticle(null);
      resetForm();
      await loadArticles();
    } catch (error) {
      console.error('Error updating article:', error);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المقال؟')) return;

    try {
      await deleteKnowledgeArticle(id);
      await loadArticles();
    } catch (error) {
      console.error('Error deleting article:', error);
    }
  };

  const handleViewArticle = async (article: KnowledgeArticle) => {
    setSelectedArticle(article);
    setIsViewDialogOpen(true);

    try {
      const updated = await recordKnowledgeView(article.id);
      setArticles((prev) =>
        prev.map((a) => (a.id === article.id ? { ...a, views: updated.viewCount ?? a.views } : a))
      );
    } catch (error) {
      console.warn('Failed to record view', error);
    }
  };

  const handleFeedback = async (articleId: string, helpful: boolean) => {
    try {
      const updated = await recordKnowledgeFeedback(articleId, helpful);
      setArticles((prev) =>
        prev.map((a) => {
          if (a.id !== articleId) return a;
          return {
            ...a,
            helpful: updated.helpfulCount ?? a.helpful,
            notHelpful: updated.notHelpfulCount ?? a.notHelpful,
          };
        })
      );
    } catch (error) {
      console.error('Error recording feedback:', error);
    }
  };

  // ========================
  // Helper Functions
  // ========================
  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      category: '',
      tags: [],
      relatedIssues: [],
    });
  };

  const openEditDialog = (article: KnowledgeArticle) => {
    setSelectedArticle(article);
    setFormData({
      title: article.title,
      content: article.content,
      category: article.category,
      tags: article.tags,
      relatedIssues: article.relatedIssues,
    });
    setIsEditDialogOpen(true);
  };

  const getUniqueCategories = () => {
    const categories = articles.map(a => a.category);
    return Array.from(new Set(categories));
  };

  // ========================
  // Render
  // ========================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl">
            <BookOpen className="size-8 text-primary" />
          </div>
          <div>
            <h1 className="text-foreground">سجل المعرفة</h1>
            <p className="text-sm text-muted-foreground">قاعدة معرفية شاملة لحل المشاكل الشائعة</p>
          </div>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="size-4 ml-2" />
          مقال جديد
        </Button>
      </div>

      {/* Search & Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400" />
              <Input
                placeholder="بحث في المقالات..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pr-10 text-right"
              />
            </div>
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} dir="rtl">
              <TabsList className="w-full">
                <TabsTrigger value="all" className="flex-1">الكل</TabsTrigger>
                {getUniqueCategories().map(cat => (
                  <TabsTrigger key={cat} value={cat} className="flex-1">{cat}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">جاري التحميل...</p>
            </CardContent>
          </Card>
        ) : filteredArticles.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center">
              <BookOpen className="size-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد مقالات</p>
            </CardContent>
          </Card>
        ) : (
          filteredArticles.map(article => (
            <Card key={article.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleViewArticle(article)}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <CardTitle className="text-right text-lg line-clamp-2">{article.title}</CardTitle>
                  <FileText className="size-5 text-primary flex-shrink-0" />
                </div>
                <Badge variant="outline" className="w-fit">{article.category}</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3 text-right mb-4">
                  {article.content.substring(0, 150)}...
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Eye className="size-3" />
                      <span>{article.views}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="size-3" />
                      <span>{article.helpful}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(article);
                      }}
                      className="h-8 px-2"
                    >
                      <Edit className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteArticle(article.id);
                      }}
                      className="h-8 px-2 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-3">
                  {article.tags.slice(0, 3).map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" dir="rtl">
          {selectedArticle && (
            <>
              <DialogHeader>
                <DialogTitle className="text-right text-2xl mb-2">{selectedArticle.title}</DialogTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline">{selectedArticle.category}</Badge>
                  <span>•</span>
                  <span>بواسطة {selectedArticle.author}</span>
                  <span>•</span>
                  <span>{new Date(selectedArticle.createdAt).toLocaleDateString('ar-SA')}</span>
                </div>
              </DialogHeader>
              <div className="py-6 text-right prose prose-slate dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap">{selectedArticle.content}</div>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-3 text-right">هل كانت هذه المقالة مفيدة؟</p>
                <div className="flex items-center gap-3 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFeedback(selectedArticle.id, true)}
                    className="flex items-center gap-2"
                  >
                    <ThumbsUp className="size-4" />
                    نعم ({selectedArticle.helpful})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFeedback(selectedArticle.id, false)}
                    className="flex items-center gap-2"
                  >
                    <ThumbsDown className="size-4" />
                    لا ({selectedArticle.notHelpful})
                  </Button>
                </div>
              </div>
              {selectedArticle.tags.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-2 text-right">الوسوم:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedArticle.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">مقال جديد</DialogTitle>
            <DialogDescription className="text-right">
              أضف مقالاً جديداً إلى قاعدة المعرفة
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
                placeholder="عنوان المقال..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category" className="text-right block">الفئة</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="text-right"
                placeholder="مثال: تقني، خدمة عملاء..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content" className="text-right block">المحتوى</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={e => setFormData({ ...formData, content: e.target.value })}
                className="text-right min-h-[300px]"
                placeholder="محتوى المقال..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags" className="text-right block">الوسوم (مفصولة بفواصل)</Label>
              <Input
                id="tags"
                value={formData.tags.join(', ')}
                onChange={e => setFormData({ ...formData, tags: e.target.value.split(',').map(t => t.trim()) })}
                className="text-right"
                placeholder="مثال: حجز, دفع, استفسار"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleCreateArticle} className="bg-blue-600 hover:bg-blue-700">
              نشر المقال
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">تعديل المقال</DialogTitle>
            <DialogDescription className="text-right">
              تعديل محتوى المقال
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
              <Label htmlFor="edit-category" className="text-right block">الفئة</Label>
              <Input
                id="edit-category"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-content" className="text-right block">المحتوى</Label>
              <Textarea
                id="edit-content"
                value={formData.content}
                onChange={e => setFormData({ ...formData, content: e.target.value })}
                className="text-right min-h-[300px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-tags" className="text-right block">الوسوم</Label>
              <Input
                id="edit-tags"
                value={formData.tags.join(', ')}
                onChange={e => setFormData({ ...formData, tags: e.target.value.split(',').map(t => t.trim()) })}
                className="text-right"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleUpdateArticle} className="bg-blue-600 hover:bg-blue-700">
              حفظ التعديلات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}