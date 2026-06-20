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
} from '@/types';
import { mockOrders, mockWorkers, mockUsers } from '@/data/mockData';
import { generateOrderNo, generateId, escalateUrgency, shouldEscalate } from '@/utils';

interface AppState {
  orders: RepairOrder[];
  workers: Worker[];
  users: User[];
  currentUser: User;
  toasts: ToastMessage[];

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
