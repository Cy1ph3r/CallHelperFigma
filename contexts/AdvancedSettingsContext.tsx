/**
 * ====================================================================
 * Advanced Settings Context
 * ====================================================================
 * 
 * هذا الـ Context يدير جميع إعدادات "الوضع المتقدم" في صفحة Call Helper
 * 
 * المكونات الرئيسية:
 * 1. Routes - المسارات الرئيسية (تسجيل، دفع، تأشيرة، إلخ)
 * 2. Steps - الخطوات التي تنعكس تلقائياً من Routes مع sub-conditions
 * 3. Gray Area Settings - إعدادات التحكم في Gray Area
 * 4. Scoring Settings - إعدادات النتائج والأوزان
 * 
 * ====================================================================
 * ⚠️ ملاحظات مهمة للربط مع الباكند:
 * ====================================================================
 * 
 * عند الربط بالباكند، ستحتاج إلى:
 * 
 * 1. API Endpoints:
 *    - GET  /api/admin/advanced-settings - جلب جميع الإعدادات
 *    - PUT  /api/admin/advanced-settings - تحديث الإعدادات
 *    - POST /api/admin/routes - إضافة route جديد
 *    - PUT  /api/admin/routes/:id - تحديث route
 *    - DELETE /api/admin/routes/:id - حذف route
 *    - POST /api/admin/steps/:routeId - إضافة step لـ route
 *    - PUT  /api/admin/steps/:id - تحديث step
 * 
 * 2. في CallHelper عند استخدام الوضع المتقدم:
 *    - POST /api/call-helper/apply-advanced-flow
 *      Body: { 
 *        description, 
 *        customerName, 
 *        entityType,
 *        selectedProblemType 
 *      }
 *      Response: {
 *        activeRoute,
 *        stepsFlow: [{ step, subCondition, action }],
 *        finalAction: "continue" | "force_solution" | "escalation",
 *        suggestedResponse
 *      }
 * 
 * 3. استبدال Mock Data:
 *    - حالياً: useState مع بيانات تجريبية
 *    - بعد الربط: useEffect + fetch من الباكند
 *    - حفظ التعديلات: onClick → POST/PUT للباكند
 * 
 * ====================================================================
 */

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';

// ====================================================================
// Types & Interfaces
// ====================================================================

/**
 * Route - المسار (يمكن ربطه بخطوة من Route آخر)
 */
export interface Route {
  id: string;
  name: string;
  description?: string; // وصف المسار (اختياري)
  order: number;
  isActive: boolean;
  parentSteps: string[]; // IDs للخطوات التي يرتبط بها هذا الـ Route (من Routes أخرى)
  createdAt: Date;
  updatedAt: Date;
}

/**
 * SubCondition - الشرط الفرعي داخل الـ Step
 * مثال: في خطوة "الدفع" → شروط: "تم الدفع" أو "لم يتم الدفع"
 */
export interface SubCondition {
  id: string;
  name: string;
  action: 'continue' | 'force_solution' | 'escalation';
  actionDetails?: string; // Details for force_solution or escalation
  childConditions?: SubCondition[]; // NEW: Nested conditions for 'continue' action
  linkedRouteIds?: string[]; // NEW: IDs of routes where this SubCondition is linked (for multi-route SubConditions)
}

/**
 * Step - الخطوة (تنعكس تلقائياً من Route)
 * 
 * ⚠️ مهم: Steps تُنشأ تلقائياً عند إضافة Route
 * الأدمن يستطيع فقط إضافة/تعديل SubConditions والـ Actions
 */
export interface Step {
  id: string;
  routeId: string; // ربط مع الـ Route
  name: string; // نفس اسم الـ Route
  order: number; // نفس ترتيب الـ Route
  subConditions: SubCondition[];
  linkedStepIds?: string[]; // NEW: IDs of steps in other routes that are linked to this step
  isLinkedStep?: boolean; // NEW: true if this step was created via multi-route linking
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Gray Area Settings - إعدادات نطاق Gray Area
 */

/**
 * GrayAreaQuestion - سؤال Gray Area (5 أسئلة ثابتة)
 */
export interface GrayAreaQuestion {
  id: string;
  title: string;
  isEnabled: boolean;
  linkedRouteIds: string[]; // IDs للمسارات المرتبطة بهذا السؤال
}

export interface GrayAreaSettings {
  /**
   * confidenceThreshold - العتبة التي تظهر عندها Gray Area
   * القيمة الافتراضية: 40%
   * إذا كان confidence <= threshold → يظهر Gray Area
   */
  confidenceThreshold: number;
  
  /**
   * isEnabled - تفعيل/تعطيل Gray Area
   */
  isEnabled: boolean;
  
  /**
   * autoSuggestType - اقتراح نوع المشكلة تلقائياً
   */
  autoSuggestType: boolean;
  
  /**
   * questions - 5 أسئلة ثابتة لـ Gray Area (لا يمكن إضافة أو حذف، فقط تعديل وتفعيل)
   */
  questions: GrayAreaQuestion[];
  
  /**
   * forceRoutingOnConflict - إجبار التوجيه عند حدوث تعارض
   */
  forceRoutingOnConflict: boolean;
  
  /**
   * showHintBeforeDecision - عرض تلميح قبل اتخاذ القرار
   */
  showHintBeforeDecision: boolean;
  
  /**
   * showActionTags - عرض/إخفاء TAG الإجراء في الخطوات
   */
  showActionTags: boolean;
  
  /**
   * showActionDetails - عرض/إخفاء ملاحظات (توجيهات الحل) و (ملاحظات التصعيد)
   */
  showActionDetails: boolean;
}

/**
 * Scoring Settings - إعدادات النتائج والأوزان
 */
export interface ScoringSettings {
  /**
   * scoreThresholds - عتبات النتيجة النهائية
   */
  scoreThresholds: {
    directAnswer: number;    // >= 80: مسار الإجابة المباشرة
    showAdvanced: number;    // >= 50 && < 80: عرض الوضع المتقدم + حل آخر
    grayArea: number;        // < 50: Gray Area (أسئلة توضيحية)
  };
  
  /**
   * weights - أوزان العوامل (قائمة ديناميكية قابلة للإضافة/التعديل/الحذف)
   */
  weights: Array<{
    name: string;
    value: number; // 0-100%
  }>;
  
  /**
   * decayRateDays - معدل التدهور بالأيام
   */
  decayRateDays: number;
}

/**
 * Advanced Settings - جميع الإعدادات المتقدمة
 */
export interface AdvancedSettings {
  routes: Route[];
  steps: Step[];
  grayAreaSettings: GrayAreaSettings;
  scoringSettings: ScoringSettings;
}

// ====================================================================
// Context Type
// ====================================================================

interface AdvancedSettingsContextType {
  // Data
  routes: Route[];
  steps: Step[];
  grayAreaSettings: GrayAreaSettings;
  scoringSettings: ScoringSettings;
  
  // Routes Management
  addRoute: (name: string, parentSteps?: string[]) => void;
  updateRoute: (id: string, updates: Partial<Pick<Route, 'name' | 'parentSteps'>>) => void;
  deleteRoute: (id: string) => void;
  toggleRouteActive: (id: string) => void;
  
  // Steps Management (SubConditions & Actions)
  addSubCondition: (stepId: string, subCondition: Omit<SubCondition, 'id'>, parentConditionId?: string) => void;
  updateSubCondition: (stepId: string, subConditionId: string, updates: Partial<SubCondition>) => void;
  deleteSubCondition: (stepId: string, subConditionId: string) => void;
  
  // NEW: Linked Steps Management
  addSubConditionToMultipleRoutes: (
    stepIds: string[], 
    subCondition: Omit<SubCondition, 'id'>, 
    copySubConditions?: boolean,
    sourceStepId?: string
  ) => void;
  updateLinkedSubCondition: (
    stepId: string,
    subConditionId: string,
    updates: Partial<SubCondition>,
    applyToLinked?: boolean
  ) => void;
  deleteLinkedSubCondition: (
    stepId: string,
    subConditionId: string,
    deleteFromAll?: boolean
  ) => void;
  
  // Gray Area Settings
  updateGrayAreaSettings: (updates: Partial<GrayAreaSettings>) => void;
  
  // Scoring Settings
  updateScoringSettings: (updates: Partial<ScoringSettings>) => void;
  
  // Utility
  getStepsByRoute: (routeId: string) => Step | undefined;
  getActiveRoutes: () => Route[];
  getLinkedSteps: (stepId: string) => Step[];
  
  // Get Steps by SubCondition Name (for auto-detection)
  getStepsBySubConditionName: (stepId: string, subConditionName: string) => string[];
  
  // Export/Import Settings
  exportSettings: () => any;
  importSettings: (settings: any) => boolean;
}

// ====================================================================
// Mock Data (سيتم استبداله بـ API calls)
// ====================================================================

/**
 * Mock Routes - مسارات تجريبية
 * 
 * TODO: Replace with API call
 * const { data } = await fetch('/api/admin/routes');
 */
const MOCK_ROUTES: Route[] = [
  {
    id: 'route-1',
    name: 'التسجيل',
    isActive: true,
    order: 1,
    parentSteps: [],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: 'route-2',
    name: 'الدفع',
    isActive: true,
    order: 2,
    parentSteps: [],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: 'route-3',
    name: 'التأشيرة',
    isActive: true,
    order: 3,
    parentSteps: [],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: 'route-4',
    name: 'العقد',
    isActive: false,
    order: 4,
    parentSteps: [],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
];

/**
 * Mock Steps - خطوات تنعكس من Routes
 * 
 * ⚠️ مهم: كل Route له Step واحد بنفس الاسم والترتيب
 * الأدمن يضيف فقط SubConditions للـ Step
 */
const MOCK_STEPS: Step[] = [
  {
    id: 'step-1',
    routeId: 'route-1',
    name: 'التسجيل',
    order: 1,
    subConditions: [
      {
        id: 'sub-1-1',
        name: 'مسجل مسبقاً',
        action: 'continue',
        // Nested conditions for "مسجل مسبقاً"
        childConditions: [
          {
            id: 'sub-1-1-1',
            name: 'حالة طلب التسجيل',
            action: 'continue',
          },
          {
            id: 'sub-1-1-2',
            name: 'تسجيل مكتمل',
            action: 'force_solution',
            actionDetails: 'التسجيل مكتمل ونشط في النظام',
          },
        ],
      },
      {
        id: 'sub-1-2',
        name: 'غير مسجل',
        action: 'force_solution',
        actionDetails: 'يجب التسجيل أولاً عبر البوابة الإلكترونية',
      },
      {
        id: 'sub-1-3',
        name: 'خطأ تقني عند التسجيل',
        action: 'escalation',
        actionDetails: 'الدعم الفني - فحص المشكلة التقنية',
      },
    ],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'step-2',
    routeId: 'route-2',
    name: 'الدفع',
    order: 2,
    subConditions: [
      {
        id: 'sub-2-1',
        name: 'تم الدفع',
        action: 'continue',
      },
      {
        id: 'sub-2-2',
        name: 'لم يتم الدفع',
        action: 'force_solution',
        actionDetails: 'يرجى إتمام عملية الدفع لمتابعة الطلب',
      },
      {
        id: 'sub-2-3',
        name: 'دفع معلق',
        action: 'escalation',
        actionDetails: 'قسم المالية - فحص حالة الدفع',
      },
    ],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'step-3',
    routeId: 'route-3',
    name: 'التأشيرة',
    order: 3,
    subConditions: [
      {
        id: 'sub-3-1',
        name: 'تم الحصول عليها',
        action: 'continue',
      },
      {
        id: 'sub-3-2',
        name: 'قيد المراجعة',
        action: 'force_solution',
        actionDetails: 'طلب التأشيرة قيد المراجعة، سيتم التواصل خلال 48 ساعة',
      },
      {
        id: 'sub-3-3',
        name: 'مرفوضة',
        action: 'escalation',
        actionDetails: 'قسم التأشيرات - مراجعة سبب الرفض',
      },
    ],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'step-4',
    routeId: 'route-4',
    name: 'العقد',
    order: 4,
    subConditions: [
      {
        id: 'sub-4-1',
        name: 'موقع',
        action: 'continue',
      },
      {
        id: 'sub-4-2',
        name: 'غير موقع',
        action: 'force_solution',
        actionDetails: 'يجب توقيع العقد لإتمام الإجراءات',
      },
    ],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
];

/**
 * Mock Gray Area Settings
 */
const MOCK_GRAY_AREA_SETTINGS: GrayAreaSettings = {
  confidenceThreshold: 50, // Changed from 40 to 50
  isEnabled: true,
  autoSuggestType: true,
  questions: [
    {
      id: 'technical',
      title: 'مشكلة تقنية',
      isEnabled: true,
      linkedRouteIds: [],
    },
    {
      id: 'operational',
      title: 'مشكلة تشغيلية',
      isEnabled: true,
      linkedRouteIds: [],
    },
    {
      id: 'financial',
      title: 'مشكلة مالية',
      isEnabled: true,
      linkedRouteIds: ['route-2'], // مربوط بمسار الدفع
    },
    {
      id: 'complaint',
      title: 'شكوى',
      isEnabled: true,
      linkedRouteIds: [],
    },
    {
      id: 'general_inquiry',
      title: 'استفسار عام',
      isEnabled: true,
      linkedRouteIds: [],
    },
  ],
  forceRoutingOnConflict: true,
  showHintBeforeDecision: true,
  showActionTags: true,
  showActionDetails: true,
};

/**
 * Mock Scoring Settings
 */
const MOCK_SCORING_SETTINGS: ScoringSettings = {
  scoreThresholds: {
    directAnswer: 80,  // >= 80: مسار الإجابة المباشرة
    showAdvanced: 50,  // >= 50 && < 80: عرض الوضع المتقدم + حل آخر
    grayArea: 50,      // < 50: Gray Area (أسئلة توضيحية)
  },
  weights: [
    { name: 'keywordMatch', value: 50 },
    { name: 'descriptionLength', value: 20 },
    { name: 'entityType', value: 15 },
    { name: 'problemType', value: 15 },
  ],
  decayRateDays: 30,
};

// ====================================================================
// Context Creation
// ====================================================================

const AdvancedSettingsContext = createContext<AdvancedSettingsContextType | undefined>(undefined);

// ====================================================================
// Provider Component
// ====================================================================

export function AdvancedSettingsProvider({ children }: { children: ReactNode }) {
  // State Management
  const [routes, setRoutes] = useState<Route[]>(MOCK_ROUTES);
  const [steps, setSteps] = useState<Step[]>(MOCK_STEPS);
  const [grayAreaSettings, setGrayAreaSettings] = useState<GrayAreaSettings>(MOCK_GRAY_AREA_SETTINGS);
  const [scoringSettings, setScoringSettings] = useState<ScoringSettings>(MOCK_SCORING_SETTINGS);

  /**
   * TODO: Replace with API call when backend is ready
   * 
   * useEffect(() => {
   *   async function fetchSettings() {
   *     const response = await fetch('/api/admin/advanced-settings');
   *     const data = await response.json();
   *     setRoutes(data.routes);
   *     setSteps(data.steps);
   *     setGrayAreaSettings(data.grayAreaSettings);
   *     setScoringSettings(data.scoringSettings);
   *   }
   *   fetchSettings();
   * }, []);
   */

  // ====================================================================
  // Routes Management Functions
  // ====================================================================

  /**
   * Add new Route
   * عند إضافة Route جديد، يتم إنشاء Step تلقائياً
   * 
   * TODO: Replace with API call
   * await fetch('/api/admin/routes', { method: 'POST', body: JSON.stringify({ name }) });
   */
  const addRoute = (name: string, parentSteps?: string[]) => {
    const newRoute: Route = {
      id: `route-${Date.now()}`,
      name,
      isActive: true,
      order: routes.length + 1,
      parentSteps: parentSteps || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // إضافة Route
    setRoutes(prev => [...prev, newRoute]);

    // إنشاء Step تلقائياً
    const newStep: Step = {
      id: `step-${Date.now()}`,
      routeId: newRoute.id,
      name: newRoute.name,
      order: newRoute.order,
      subConditions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setSteps(prev => [...prev, newStep]);

    console.log('✅ Route added:', newRoute.name);
    console.log('✅ Step auto-created:', newStep.name);
  };

  /**
   * Update a route's name and/or parent steps
   */
  const updateRoute = useCallback((id: string, updates: Partial<Pick<Route, 'name' | 'parentSteps'>>) => {
    setRoutes(prev => prev.map(route => {
      if (route.id === id) {
        return {
          ...route,
          ...updates,
          updatedAt: new Date(),
        };
      }
      return route;
    }));

    // If name is updated, also update the corresponding step's name
    if (updates.name) {
      setSteps(prev => prev.map(step => {
        if (step.routeId === id) {
          return {
            ...step,
            name: updates.name,
            updatedAt: new Date(),
          };
        }
        return step;
      }));
    }
  }, []);

  /**
   * Delete Route
   * عند حذف Route، يتم حذف Step المرتبط أيضاً
   * 
   * TODO: Replace with API call
   * await fetch(`/api/admin/routes/${id}`, { method: 'DELETE' });
   */
  const deleteRoute = (id: string) => {
    setRoutes(prev => prev.filter(route => route.id !== id));
    setSteps(prev => prev.filter(step => step.routeId !== id));

    console.log('✅ Route deleted:', id);
  };

  /**
   * Toggle Route Active Status
   */
  const toggleRouteActive = (id: string) => {
    setRoutes(prev =>
      prev.map(route =>
        route.id === id
          ? { ...route, isActive: !route.isActive, updatedAt: new Date() }
          : route
      )
    );

    console.log('✅ Route toggled:', id);
  };

  // ====================================================================
  // Steps Management Functions (SubConditions & Actions)
  // ====================================================================

  /**
   * Add SubCondition to Step or as child to another SubCondition
   * 
   * @param stepId - ID of the step
   * @param subCondition - SubCondition data without ID
   * @param parentConditionId - Optional: ID of parent SubCondition to nest under
   * 
   * TODO: Replace with API call
   * await fetch(`/api/admin/steps/${stepId}/subconditions`, { method: 'POST', body: JSON.stringify(subCondition) });
   */
  const addSubCondition = (stepId: string, subCondition: Omit<SubCondition, 'id'>, parentConditionId?: string) => {
    const newSubCondition: SubCondition = {
      id: `sub-${Date.now()}`,
      ...subCondition,
    };

    if (parentConditionId) {
      // Add as child to an existing SubCondition
      setSteps(prev =>
        prev.map(step => {
          if (step.id !== stepId) return step;

          // Recursive function to add child
          const addChildToCondition = (conditions: SubCondition[]): SubCondition[] => {
            return conditions.map(cond => {
              if (cond.id === parentConditionId) {
                return {
                  ...cond,
                  childConditions: [...(cond.childConditions || []), newSubCondition],
                };
              }
              if (cond.childConditions) {
                return {
                  ...cond,
                  childConditions: addChildToCondition(cond.childConditions),
                };
              }
              return cond;
            });
          };

          return {
            ...step,
            subConditions: addChildToCondition(step.subConditions),
            updatedAt: new Date(),
          };
        })
      );

      console.log('✅ SubCondition added as child:', {
        stepId,
        parentConditionId,
        newSubCondition,
      });
    } else {
      // Add as root-level SubCondition
      setSteps(prev =>
        prev.map(step =>
          step.id === stepId
            ? {
                ...step,
                subConditions: [...step.subConditions, newSubCondition],
                updatedAt: new Date(),
              }
            : step
        )
      );

      console.log('✅ SubCondition added to step (root level):', stepId, newSubCondition);
    }
  };

  /**
   * Update SubCondition
   * 
   * TODO: Replace with API call
   * await fetch(`/api/admin/subconditions/${subConditionId}`, { method: 'PATCH', body: JSON.stringify(updates) });
   */
  const updateSubCondition = (stepId: string, subConditionId: string, updates: Partial<SubCondition>) => {
    setSteps(prev =>
      prev.map(step => {
        if (step.id !== stepId) return step;

        // Recursive function to update nested subconditions
        const updateNestedCondition = (conditions: SubCondition[]): SubCondition[] => {
          return conditions.map(cond => {
            if (cond.id === subConditionId) {
              return { ...cond, ...updates };
            }
            if (cond.childConditions) {
              return {
                ...cond,
                childConditions: updateNestedCondition(cond.childConditions),
              };
            }
            return cond;
          });
        };

        return {
          ...step,
          subConditions: updateNestedCondition(step.subConditions),
          updatedAt: new Date(),
        };
      })
    );

    console.log('✅ SubCondition updated (recursive):', subConditionId, updates);
  };

  /**
   * Delete SubCondition
   * 
   * TODO: Replace with API call
   * await fetch(`/api/admin/subconditions/${subConditionId}`, { method: 'DELETE' });
   */
  const deleteSubCondition = (stepId: string, subConditionId: string) => {
    setSteps(prev =>
      prev.map(step => {
        if (step.id !== stepId) return step;

        // Recursive function to delete nested subconditions
        const deleteNestedCondition = (conditions: SubCondition[]): SubCondition[] => {
          return conditions
            .filter(cond => cond.id !== subConditionId)
            .map(cond => {
              if (cond.childConditions) {
                return {
                  ...cond,
                  childConditions: deleteNestedCondition(cond.childConditions),
                };
              }
              return cond;
            });
        };

        return {
          ...step,
          subConditions: deleteNestedCondition(step.subConditions),
          updatedAt: new Date(),
        };
      })
    );

    console.log('✅ SubCondition deleted (recursive):', subConditionId);
  };

  // ====================================================================
  // NEW: Linked Steps Management
  // ====================================================================

  /**
   * Add SubCondition to multiple routes
   * 
   * @param stepIds - IDs of the steps to add the subcondition to
   * @param subCondition - SubCondition data without ID
   * @param copySubConditions - Optional: If true, copy existing subconditions from sourceStepId
   * @param sourceStepId - Optional: ID of the step to copy subconditions from
   * 
   * TODO: Replace with API call
   * await fetch(`/api/admin/steps/${stepId}/subconditions`, { method: 'POST', body: JSON.stringify(subCondition) });
   */
  const addSubConditionToMultipleRoutes = (
    stepIds: string[], 
    subCondition: Omit<SubCondition, 'id'>, 
    copySubConditions?: boolean,
    sourceStepId?: string
  ) => {
    const newSubCondition: SubCondition = {
      id: `sub-${Date.now()}`,
      ...subCondition,
    };

    console.log('🔗 Adding SubCondition to multiple routes:', {
      stepIds,
      subCondition: newSubCondition,
      copySubConditions,
      sourceStepId,
    });

    setSteps(prev => {
      // First pass: Add subcondition to all target steps
      const updatedSteps = prev.map(step => {
        if (!stepIds.includes(step.id)) return step;

        // If copying subconditions from a source step
        if (copySubConditions && sourceStepId) {
          const sourceStep = prev.find(s => s.id === sourceStepId);
          if (sourceStep) {
            return {
              ...step,
              subConditions: [...step.subConditions, ...sourceStep.subConditions],
              linkedStepIds: stepIds.filter(id => id !== step.id), // All other stepIds
              isLinkedStep: true,
              updatedAt: new Date(),
            };
          }
        }

        return {
          ...step,
          subConditions: [...step.subConditions, newSubCondition],
          linkedStepIds: stepIds.filter(id => id !== step.id), // All other stepIds  
          isLinkedStep: true,
          updatedAt: new Date(),
        };
      });

      console.log('✅ SubCondition added to routes:', {
        stepIds,
        linkedStepIds: stepIds,
      });

      return updatedSteps;
    });

    console.log('✅ SubCondition added to multiple routes:', stepIds, newSubCondition);
  };

  /**
   * Update a linked SubCondition
   * 
   * @param stepId - ID of the step
   * @param subConditionId - ID of the subcondition
   * @param updates - Updates to apply to the subcondition
   * @param applyToLinked - Optional: If true, apply updates to all linked subconditions
   * 
   * TODO: Replace with API call
   * await fetch(`/api/admin/subconditions/${subConditionId}`, { method: 'PATCH', body: JSON.stringify(updates) });
   */
  const updateLinkedSubCondition = (
    stepId: string,
    subConditionId: string,
    updates: Partial<SubCondition>,
    applyToLinked?: boolean
  ) => {
    console.log('🔧 updateLinkedSubCondition called:', {
      stepId,
      subConditionId,
      updates,
      applyToLinked,
    });

    setSteps(prev => {
      // First, find the current step to get linkedStepIds
      const currentStep = prev.find(s => s.id === stepId);
      const linkedStepIds = currentStep?.linkedStepIds || [];

      // 🆕 Get the subcondition name for auto-detection
      let subConditionName = '';
      const findSubConditionName = (conditions: SubCondition[]): string | null => {
        for (const cond of conditions) {
          if (cond.id === subConditionId) return cond.name;
          if (cond.childConditions) {
            const found = findSubConditionName(cond.childConditions);
            if (found) return found;
          }
        }
        return null;
      };
      if (currentStep) {
        subConditionName = findSubConditionName(currentStep.subConditions) || '';
      }

      // Auto-detect steps with same subcondition name
      const autoDetectedStepIds = getStepsBySubConditionName(stepId, subConditionName);

      // Combine explicit linked steps + auto-detected steps
      const allLinkedStepIds = [...new Set([...linkedStepIds, ...autoDetectedStepIds])];

      console.log('📊 Current Step Info:', {
        stepId: currentStep?.id,
        stepName: currentStep?.name,
        subConditionName,
        linkedStepIds,
        autoDetectedStepIds,
        allLinkedStepIds,
        applyToLinked,
      });

      // Recursive function to update nested subconditions
      const updateNestedCondition = (conditions: SubCondition[]): SubCondition[] => {
        return conditions.map(cond => {
          // ✅ Update ONLY by ID (not by name!)
          // When applyToLinked is true, we update in all linked steps, but still by ID
          if (cond.id === subConditionId) {
            console.log('✏️ Updating subCondition:', cond.id, 'name:', cond.name, 'from:', cond, 'to:', { ...cond, ...updates });
            return { ...cond, ...updates };
          }
          if (cond.childConditions) {
            return {
              ...cond,
              childConditions: updateNestedCondition(cond.childConditions),
            };
          }
          return cond;
        });
      };

      // Update all steps (current + linked if applyToLinked is true)
      const updatedSteps = prev.map(step => {
        // ✅ When applyToLinked is true, update in current step + linked steps
        // But we only update subconditions that have the SAME ID
        const shouldUpdate = 
          step.id === stepId || 
          (applyToLinked && linkedStepIds.includes(step.id));

        if (!shouldUpdate) return step;

        console.log('✅ Updating step:', step.id, step.name, 'shouldUpdate:', shouldUpdate);

        return {
          ...step,
          subConditions: updateNestedCondition(step.subConditions),
          updatedAt: new Date(),
        };
      });

      console.log('🎯 Final updated steps count:', updatedSteps.filter(s => 
        s.id === stepId || (applyToLinked && allLinkedStepIds.includes(s.id))
      ).length);

      return updatedSteps;
    });

    console.log('✅ SubCondition updated (recursive):', subConditionId, updates, 'applyToLinked:', applyToLinked);
  };

  /**
   * Delete a linked SubCondition
   * 
   * @param stepId - ID of the step
   * @param subConditionId - ID of the subcondition
   * @param deleteFromAll - Optional: If true, delete the subcondition from all linked steps
   * 
   * TODO: Replace with API call
   * await fetch(`/api/admin/subconditions/${subConditionId}`, { method: 'DELETE' });
   */
  const deleteLinkedSubCondition = (
    stepId: string,
    subConditionId: string,
    deleteFromAll?: boolean
  ) => {
    setSteps(prev =>
      prev.map(step => {
        if (step.id !== stepId) return step;

        // Recursive function to delete nested subconditions
        const deleteNestedCondition = (conditions: SubCondition[]): SubCondition[] => {
          return conditions
            .filter(cond => cond.id !== subConditionId)
            .map(cond => {
              if (cond.childConditions) {
                return {
                  ...cond,
                  childConditions: deleteNestedCondition(cond.childConditions),
                };
              }
              return cond;
            });
        };

        const updatedStep = {
          ...step,
          subConditions: deleteNestedCondition(step.subConditions),
          updatedAt: new Date(),
        };

        // If deleting from all linked steps
        if (deleteFromAll && step.linkedStepIds) {
          prev.forEach(s => {
            if (s.linkedStepIds?.includes(subConditionId)) {
              s.subConditions = deleteNestedCondition(s.subConditions);
              s.updatedAt = new Date();
            }
          });
        }

        return updatedStep;
      })
    );

    console.log('✅ SubCondition deleted (recursive):', subConditionId);
  };

  // ====================================================================
  // Settings Management Functions
  // ====================================================================

  /**
   * Update Gray Area Settings
   * 
   * TODO: Replace with API call
   * await fetch('/api/admin/gray-area-settings', { method: 'PUT', body: JSON.stringify(updates) });
   */
  const updateGrayAreaSettings = (updates: Partial<GrayAreaSettings>) => {
    setGrayAreaSettings(prev => ({ ...prev, ...updates }));
    console.log('✅ Gray Area Settings updated:', updates);
  };

  /**
   * Update Scoring Settings
   * 
   * TODO: Replace with API call
   * await fetch('/api/admin/scoring-settings', { method: 'PUT', body: JSON.stringify(updates) });
   */
  const updateScoringSettings = (updates: Partial<ScoringSettings>) => {
    setScoringSettings(prev => ({ ...prev, ...updates }));
    console.log('✅ Scoring Settings updated:', updates);
  };

  // ====================================================================
  // Utility Functions
  // ====================================================================

  /**
   * Get Step by Route ID
   */
  const getStepsByRoute = (routeId: string): Step | undefined => {
    return steps.find(step => step.routeId === routeId);
  };

  /**
   * Get Active Routes Only
   */
  const getActiveRoutes = (): Route[] => {
    return routes.filter(route => route.isActive);
  };

  /**
   * Get Linked Steps
   */
  const getLinkedSteps = (stepId: string): Step[] => {
    return steps.filter(step => step.linkedStepIds?.includes(stepId));
  };

  /**
   * Get Steps by SubCondition Name (for auto-detection)
   * Returns all steps that have a subcondition with the given name
   * 
   * @param stepId - Current step ID (to exclude from results)
   * @param subConditionName - Name of the subcondition to search for
   * @returns Array of step IDs that have a matching subcondition
   */
  const getStepsBySubConditionName = (stepId: string, subConditionName: string): string[] => {
    console.log('🔍 getStepsBySubConditionName START:', { stepId, subConditionName });
    
    // Return empty if name is empty or too generic
    if (!subConditionName.trim()) {
      console.log('❌ Empty name, returning []');
      return [];
    }
    
    const matchingSteps: string[] = [];
    
    console.log('📋 Searching in steps:', steps.length, 'steps');
    
    steps.forEach(step => {
      // Skip the current step - important!
      if (step.id === stepId) {
        console.log(`⏩ Skipping current step: ${step.id} (${step.name})`);
        return;
      }
      
      console.log(`🔎 Checking step: ${step.id} (${step.name}), subConditions:`, step.subConditions.length);
      
      // Recursive search in subconditions
      const hasMatchingName = (conditions: SubCondition[], depth: number = 0): boolean => {
        const indent = '  '.repeat(depth);
        console.log(`${indent}🔍 Checking ${conditions.length} conditions at depth ${depth}`);
        
        return conditions.some(cond => {
          console.log(`${indent}  - Checking: "${cond.name}" === "${subConditionName.trim()}"?`, cond.name.trim() === subConditionName.trim());
          
          // Exact name match
          if (cond.name.trim() === subConditionName.trim()) {
            console.log(`${indent}  ✅ MATCH FOUND!`);
            return true;
          }
          
          // Search in children
          if (cond.childConditions && cond.childConditions.length > 0) {
            console.log(`${indent}  ↳ Searching in ${cond.childConditions.length} children...`);
            return hasMatchingName(cond.childConditions, depth + 1);
          }
          
          return false;
        });
      };
      
      if (hasMatchingName(step.subConditions)) {
        console.log(`✅ Match found in step: ${step.id} (${step.name})`);
        matchingSteps.push(step.id);
      }
    });
    
    console.log('🎯 getStepsBySubConditionName RESULT:', {
      stepId,
      subConditionName,
      matchingSteps,
      count: matchingSteps.length,
    });
    
    return matchingSteps;
  };

  // ====================================================================
  // Export/Import Settings
  // ====================================================================

  /**
   * Export all settings as JSON
   * يصدر جميع الإعدادات كملف JSON للنسخ الاحتياطي
   */
  const exportSettings = () => {
    const settings = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      data: {
        routes,
        steps,
        grayAreaSettings,
        scoringSettings,
      },
    };

    return settings;
  };

  /**
   * Import settings from JSON
   * يستورد الإعدادات من ملف JSON
   * 
   * @param settings - Settings object from JSON file
   * @returns true if successful, false if validation fails
   */
  const importSettings = (settings: any): boolean => {
    try {
      // Validate structure
      if (!settings.data || !settings.data.routes || !settings.data.steps) {
        console.error('❌ Invalid settings file structure');
        return false;
      }

      // Import data
      setRoutes(settings.data.routes);
      setSteps(settings.data.steps);
      
      if (settings.data.grayAreaSettings) {
        setGrayAreaSettings(settings.data.grayAreaSettings);
      }
      
      if (settings.data.scoringSettings) {
        setScoringSettings(settings.data.scoringSettings);
      }

      console.log('✅ Settings imported successfully');
      return true;
    } catch (error) {
      console.error('❌ Error importing settings:', error);
      return false;
    }
  };

  // ====================================================================
  // Context Value
  // ====================================================================

  const value: AdvancedSettingsContextType = {
    // Data
    routes,
    steps,
    grayAreaSettings,
    scoringSettings,

    // Routes Management
    addRoute,
    updateRoute,
    deleteRoute,
    toggleRouteActive,

    // Steps Management
    addSubCondition,
    updateSubCondition,
    deleteSubCondition,

    // NEW: Linked Steps Management
    addSubConditionToMultipleRoutes,
    updateLinkedSubCondition,
    deleteLinkedSubCondition,

    // Settings Management
    updateGrayAreaSettings,
    updateScoringSettings,

    // Utility
    getStepsByRoute,
    getActiveRoutes,
    getLinkedSteps,
    getStepsBySubConditionName,

    // Export/Import Settings
    exportSettings,
    importSettings,
  };

  return (
    <AdvancedSettingsContext.Provider value={value}>
      {children}
    </AdvancedSettingsContext.Provider>
  );
}

// ====================================================================
// Custom Hook
// ====================================================================

/**
 * Hook to use Advanced Settings Context
 * 
 * Usage:
 * const { routes, addRoute, updateRoute } = useAdvancedSettings();
 */
export function useAdvancedSettings() {
  const context = useContext(AdvancedSettingsContext);
  if (context === undefined) {
    throw new Error('useAdvancedSettings must be used within AdvancedSettingsProvider');
  }
  return context;
}