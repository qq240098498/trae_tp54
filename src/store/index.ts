import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  RepairOrder,
  Worker,
  User,
  OrderStatus,
  UrgencyLevel,
  RepairType,
  MaterialItem,
  ToastMessage,
  UserRole,
  InspectionPlan,
  InspectionTask,
  InspectionCategory,
  InspectionCycle,
  InspectionItemResult,
  InspectionItemTemplate,
  INSPECTION_CATEGORY_TO_REPAIR,
} from '@/types';
import { mockOrders, mockWorkers, mockUsers, mockInspectionPlans, mockInspectionTasks } from '@/data/mockData';
import {
  generateOrderNo,
  generateId,
  escalateUrgency,
  shouldEscalate,
  generateInspectionTaskNo,
  isInspectionDue,
  toDateKey,
} from '@/utils';

interface AppState {
  orders: RepairOrder[];
  workers: Worker[];
  users: User[];
  currentUser: User;
  toasts: ToastMessage[];
  inspectionPlans: InspectionPlan[];
  inspectionTasks: InspectionTask[];

  setCurrentUser: (userId: string) => void;
  switchRole: (role: UserRole) => void;

  createOrder: (data: {
    roomNumber: string;
    ownerName: string;
    ownerPhone: string;
    repairType: RepairType;
    urgency: UrgencyLevel;
    description: string;
  }) => RepairOrder;

  assignOrder: (orderId: string, workerId: string, operator: string) => void;
  acceptOrder: (orderId: string, operator: string, workerId: string) => void;
  updateOrderStatus: (
    orderId: string,
    status: OrderStatus,
    operator: string,
    remark?: string
  ) => void;
  cancelOrder: (orderId: string, operator: string, remark?: string) => void;

  addMaterial: (orderId: string, material: Omit<MaterialItem, 'id' | 'totalPrice'>) => void;
  removeMaterial: (orderId: string, materialId: string) => void;

  confirmOrder: (orderId: string, signature: string, operator: string) => void;

  checkAndEscalateOrders: () => string[];

  addInspectionPlan: (data: {
    name: string;
    category: InspectionCategory;
    cycle: InspectionCycle;
    area: string;
    items: InspectionItemTemplate[];
  }) => void;
  updateInspectionPlan: (
    id: string,
    data: Partial<Omit<InspectionPlan, 'id' | 'createdAt' | 'lastGeneratedDate'>>
  ) => void;
  toggleInspectionPlanEnabled: (id: string) => void;
  deleteInspectionPlan: (id: string) => void;
  generateDueInspectionTasks: (now?: Date) => number;
  startInspectionTask: (taskId: string, operator: string) => void;
  setInspectionItemResult: (
    taskId: string,
    itemId: string,
    result: InspectionItemResult,
    remark?: string
  ) => void;
  submitInspectionTask: (taskId: string, operator: string, remark?: string) => string[];

  addToast: (type: ToastMessage['type'], message: string) => void;
  removeToast: (id: string) => void;

  resetData: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      orders: mockOrders,
      workers: mockWorkers,
      users: mockUsers,
      currentUser: mockUsers[0],
      toasts: [],
      inspectionPlans: mockInspectionPlans,
      inspectionTasks: mockInspectionTasks,

      setCurrentUser: (userId) => {
        const user = get().users.find((u) => u.id === userId);
        if (user) set({ currentUser: user });
      },

      switchRole: (role) => {
        const user = get().users.find((u) => u.role === role);
        if (user) set({ currentUser: user });
      },

      createOrder: (data) => {
        const now = new Date().toISOString();
        const order: RepairOrder = {
          id: generateId(),
          orderNo: generateOrderNo(),
          ...data,
          status: '待派单',
          materials: [],
          timeline: [{ status: '待派单', timestamp: now, operator: data.ownerName }],
          createdAt: now,
          updatedAt: now,
          autoEscalated: false,
        };
        set((s) => ({ orders: [order, ...s.orders] }));
        get().addToast('success', `报修提交成功，工单编号：${order.orderNo}`);
        return order;
      },

      assignOrder: (orderId, workerId, operator) => {
        const worker = get().workers.find((w) => w.id === workerId);
        if (!worker) return;
        const now = new Date().toISOString();
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: '已派单',
                  assigneeId: workerId,
                  assigneeName: worker.name,
                  updatedAt: now,
                  timeline: [...o.timeline, { status: '已派单', timestamp: now, operator }],
                }
              : o
          ),
        }));
        get().addToast('success', `已派单给 ${worker.name}`);
      },

      acceptOrder: (orderId, operator, workerId) => {
        const now = new Date().toISOString();
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: '已接单',
                  updatedAt: now,
                  timeline: [...o.timeline, { status: '已接单', timestamp: now, operator }],
                }
              : o
          ),
          workers: s.workers.map((w) =>
            w.id === workerId ? { ...w, status: '忙碌' } : w
          ),
        }));
        get().addToast('success', '已接单');
      },

      updateOrderStatus: (orderId, status, operator, remark) => {
        const now = new Date().toISOString();
        const order = get().orders.find((o) => o.id === orderId);
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status,
                  updatedAt: now,
                  timeline: [...o.timeline, { status, timestamp: now, operator, remark }],
                }
              : o
          ),
          workers:
            status === '待确认' && order?.assigneeId
              ? s.workers.map((w) =>
                  w.id === order.assigneeId ? { ...w, status: '空闲' } : w
                )
              : s.workers,
        }));
        get().addToast('success', `状态已更新为：${status}`);
      },

      cancelOrder: (orderId, operator, remark) => {
        const now = new Date().toISOString();
        const order = get().orders.find((o) => o.id === orderId);
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: '已取消',
                  updatedAt: now,
                  timeline: [...o.timeline, { status: '已取消', timestamp: now, operator, remark }],
                }
              : o
          ),
          workers:
            order?.assigneeId
              ? s.workers.map((w) =>
                  w.id === order.assigneeId ? { ...w, status: '空闲' } : w
                )
              : s.workers,
        }));
        get().addToast('info', '工单已取消');
      },

      addMaterial: (orderId, material) => {
        const fullMaterial: MaterialItem = {
          ...material,
          id: generateId(),
          totalPrice: material.quantity * material.unitPrice,
        };
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId ? { ...o, materials: [...o.materials, fullMaterial] } : o
          ),
        }));
        get().addToast('success', '耗材已添加');
      },

      removeMaterial: (orderId, materialId) => {
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId
              ? { ...o, materials: o.materials.filter((m) => m.id !== materialId) }
              : o
          ),
        }));
      },

      confirmOrder: (orderId, signature, operator) => {
        const now = new Date().toISOString();
        const order = get().orders.find((o) => o.id === orderId);
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: '已完成',
                  signature,
                  updatedAt: now,
                  timeline: [...o.timeline, { status: '已完成', timestamp: now, operator, remark: '业主签字确认' }],
                }
              : o
          ),
          workers:
            order?.assigneeId
              ? s.workers.map((w) =>
                  w.id === order.assigneeId ? { ...w, completedOrders: w.completedOrders + 1 } : w
                )
              : s.workers,
        }));
        get().addToast('success', '工单已完成');
      },

      checkAndEscalateOrders: () => {
        const escalatedIds: string[] = [];
        const now = new Date().toISOString();
        set((s) => {
          const newOrders = s.orders.map((o) => {
            if (shouldEscalate(o)) {
              escalatedIds.push(o.id);
              return {
                ...o,
                urgency: escalateUrgency(o.urgency),
                autoEscalated: true,
                lastEscalationTime: now,
              };
            }
            return o;
          });
          return { orders: newOrders };
        });
        escalatedIds.forEach(() => {
          get().addToast('warning', '有工单超时未接单，已自动升级紧急程度！');
        });
        return escalatedIds;
      },

      addInspectionPlan: (data) => {
        const plan: InspectionPlan = {
          ...data,
          id: generateId(),
          enabled: true,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ inspectionPlans: [plan, ...s.inspectionPlans] }));
        get().addToast('success', `巡检计划「${plan.name}」已创建`);
      },

      updateInspectionPlan: (id, data) => {
        set((s) => ({
          inspectionPlans: s.inspectionPlans.map((p) =>
            p.id === id ? { ...p, ...data } : p
          ),
        }));
        get().addToast('success', '巡检计划已更新');
      },

      toggleInspectionPlanEnabled: (id) => {
        set((s) => ({
          inspectionPlans: s.inspectionPlans.map((p) =>
            p.id === id ? { ...p, enabled: !p.enabled } : p
          ),
        }));
      },

      deleteInspectionPlan: (id) => {
        const plan = get().inspectionPlans.find((p) => p.id === id);
        set((s) => ({ inspectionPlans: s.inspectionPlans.filter((p) => p.id !== id) }));
        get().addToast('info', `巡检计划「${plan?.name ?? ''}」已删除`);
      },

      generateDueInspectionTasks: (now = new Date()) => {
        const due = get().inspectionPlans.filter((p) => isInspectionDue(p, now));
        if (due.length === 0) return 0;
        const today = toDateKey(now);
        const createdTs = new Date().toISOString();
        const created: InspectionTask[] = due.map((plan) => ({
          id: generateId(),
          taskNo: generateInspectionTaskNo(),
          planId: plan.id,
          planName: plan.name,
          category: plan.category,
          cycle: plan.cycle,
          area: plan.area,
          items: plan.items.map((it) => ({ ...it, result: 'pending' as const })),
          status: 'pending' as const,
          scheduledDate: today,
          createdAt: createdTs,
          convertedOrderIds: [],
        }));
        set((s) => ({
          inspectionTasks: [...created, ...s.inspectionTasks],
          inspectionPlans: s.inspectionPlans.map((p) =>
            created.some((t) => t.planId === p.id) ? { ...p, lastGeneratedDate: today } : p
          ),
        }));
        get().addToast('success', `已按周期生成 ${created.length} 条公区巡检任务`);
        return created.length;
      },

      startInspectionTask: (taskId, operator) => {
        const now = new Date().toISOString();
        const user = get().currentUser;
        set((s) => ({
          inspectionTasks: s.inspectionTasks.map((t) =>
            t.id === taskId && t.status === 'pending'
              ? {
                  ...t,
                  status: 'in_progress',
                  assigneeId: user.id,
                  assigneeName: operator,
                  startedAt: now,
                }
              : t
          ),
        }));
      },

      setInspectionItemResult: (taskId, itemId, result, remark) => {
        set((s) => ({
          inspectionTasks: s.inspectionTasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: t.status === 'pending' ? 'in_progress' : t.status,
                  startedAt: t.startedAt ?? new Date().toISOString(),
                  assigneeId: t.assigneeId ?? get().currentUser.id,
                  assigneeName: t.assigneeName ?? get().currentUser.name,
                  items: t.items.map((it) =>
                    it.id === itemId
                      ? {
                          ...it,
                          result,
                          remark: result === 'abnormal' ? (remark ?? it.remark) : undefined,
                        }
                      : it
                  ),
                }
              : t
          ),
        }));
      },

      submitInspectionTask: (taskId, operator, remark) => {
        const task = get().inspectionTasks.find((t) => t.id === taskId);
        if (!task) return [];
        const now = new Date().toISOString();
        const abnormalItems = task.items.filter((it) => it.result === 'abnormal');

        const newOrders: RepairOrder[] = [];
        const convertedOrderIds: string[] = [];
        abnormalItems.forEach((item) => {
          const order: RepairOrder = {
            id: generateId(),
            orderNo: generateOrderNo(),
            roomNumber: `公区-${task.area}`,
            ownerName: operator,
            ownerPhone: '-',
            repairType: INSPECTION_CATEGORY_TO_REPAIR[task.category],
            urgency: task.category === '电梯' || task.category === '消防' ? '紧急' : '普通',
            description: `[公区巡检异常] ${task.category} - ${item.name}${
              item.remark ? '：' + item.remark : ''
            }`,
            status: '待派单',
            materials: [],
            timeline: [
              {
                status: '待派单',
                timestamp: now,
                operator: '巡检系统',
                remark: `由巡检任务 ${task.taskNo} 自动转入`,
              },
            ],
            createdAt: now,
            updatedAt: now,
            autoEscalated: false,
            sourceFromInspection: true,
            inspectionTaskId: task.id,
          };
          newOrders.push(order);
          convertedOrderIds.push(order.id);
        });

        set((s) => ({
          orders: [...newOrders, ...s.orders],
          inspectionTasks: s.inspectionTasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: 'completed',
                  completedAt: now,
                  operator,
                  remark,
                  convertedOrderIds,
                }
              : t
          ),
        }));

        if (convertedOrderIds.length > 0) {
          get().addToast(
            'warning',
            `巡检完成，发现 ${convertedOrderIds.length} 项异常，已自动转报修单`
          );
        } else {
          get().addToast('success', '巡检完成，所有项正常');
        }
        return convertedOrderIds;
      },

      addToast: (type, message) => {
        const id = generateId();
        set((s) => ({ toasts: [...s.toasts, { id, type, message }] }));
        setTimeout(() => get().removeToast(id), 3000);
      },

      removeToast: (id) => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      },

      resetData: () => {
        set({
          orders: mockOrders,
          workers: mockWorkers,
          users: mockUsers,
          currentUser: mockUsers[0],
          toasts: [],
          inspectionPlans: mockInspectionPlans,
          inspectionTasks: mockInspectionTasks,
        });
        localStorage.removeItem('repair-management-storage');
        get().addToast('success', '数据已重置');
      },
    }),
    {
      name: 'repair-management-storage',
    }
  )
);
