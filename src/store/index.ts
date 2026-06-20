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
  InventoryItem,
  StockTransaction,
  StockTransactionType,
  MaterialCategory,
} from '@/types';
import { mockOrders, mockWorkers, mockUsers, mockInspectionPlans, mockInspectionTasks, mockInventoryItems, mockStockTransactions } from '@/data/mockData';
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
  inventoryItems: InventoryItem[];
  stockTransactions: StockTransaction[];

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

  addInventoryItem: (data: {
    name: string;
    category: MaterialCategory;
    spec: string;
    unit: string;
    stock: number;
    safeStock: number;
    unitPrice: number;
    supplier?: string;
  }) => void;
  updateInventoryItem: (
    id: string,
    data: Partial<Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>>
  ) => void;
  deleteInventoryItem: (id: string) => void;
  addStockTransaction: (data: {
    inventoryItemId: string;
    type: StockTransactionType;
    quantity: number;
    unitPrice?: number;
    operator: string;
    orderId?: string;
    orderNo?: string;
    remark?: string;
  }) => boolean;
  getLowStockItems: () => InventoryItem[];
  consumeInventoryForOrder: (
    orderId: string,
    items: Array<{ inventoryItemId: string; quantity: number; operator: string }>
  ) => boolean;

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
      inventoryItems: mockInventoryItems,
      stockTransactions: mockStockTransactions,

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

        if (material.inventoryItemId) {
          const item = get().inventoryItems.find((i) => i.id === material.inventoryItemId);
          if (item) {
            if (item.stock < material.quantity) {
              get().addToast('error', `${item.name}库存不足，当前库存：${item.stock}${item.unit}`);
              return;
            }
            const order = get().orders.find((o) => o.id === orderId);
            const now = new Date().toISOString();
            const stockBefore = item.stock;
            const stockAfter = item.stock - material.quantity;
            const transaction: StockTransaction = {
              id: generateId(),
              inventoryItemId: item.id,
              inventoryItemName: item.name,
              category: item.category,
              type: '领用',
              quantity: material.quantity,
              unitPrice: material.unitPrice,
              totalPrice: material.quantity * material.unitPrice,
              stockBefore,
              stockAfter,
              operator: get().currentUser.name,
              orderId,
              orderNo: order?.orderNo,
              remark: order?.description ? `维修领用：${order.description.slice(0, 20)}` : '维修领用',
              createdAt: now,
            };
            set((s) => ({
              inventoryItems: s.inventoryItems.map((i) =>
                i.id === item.id ? { ...i, stock: stockAfter, updatedAt: now } : i
              ),
              stockTransactions: [transaction, ...s.stockTransactions],
              orders: s.orders.map((o) =>
                o.id === orderId ? { ...o, materials: [...o.materials, fullMaterial] } : o
              ),
            }));
            if (stockAfter < item.safeStock) {
              get().addToast('warning', `${item.name}库存已低于安全库存（剩${stockAfter}${item.unit}），请及时补货！`);
            } else {
              get().addToast('success', '耗材已添加，库存已扣减');
            }
            return;
          }
        }

        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId ? { ...o, materials: [...o.materials, fullMaterial] } : o
          ),
        }));
        get().addToast('success', '耗材已添加');
      },

      removeMaterial: (orderId, materialId) => {
        const order = get().orders.find((o) => o.id === orderId);
        const material = order?.materials.find((m) => m.id === materialId);
        if (material?.inventoryItemId) {
          const item = get().inventoryItems.find((i) => i.id === material.inventoryItemId);
          if (item) {
            const now = new Date().toISOString();
            const stockBefore = item.stock;
            const stockAfter = item.stock + material.quantity;
            const transaction: StockTransaction = {
              id: generateId(),
              inventoryItemId: item.id,
              inventoryItemName: item.name,
              category: item.category,
              type: '退货',
              quantity: material.quantity,
              unitPrice: material.unitPrice,
              totalPrice: material.quantity * material.unitPrice,
              stockBefore,
              stockAfter,
              operator: get().currentUser.name,
              orderId,
              orderNo: order?.orderNo,
              remark: '删除耗材，退回库存',
              createdAt: now,
            };
            set((s) => ({
              inventoryItems: s.inventoryItems.map((i) =>
                i.id === item.id ? { ...i, stock: stockAfter, updatedAt: now } : i
              ),
              stockTransactions: [transaction, ...s.stockTransactions],
              orders: s.orders.map((o) =>
                o.id === orderId
                  ? { ...o, materials: o.materials.filter((m) => m.id !== materialId) }
                  : o
              ),
            }));
            return;
          }
        }
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
        if (!task || task.status === 'completed') return [];
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

      addInventoryItem: (data) => {
        const now = new Date().toISOString();
        const item: InventoryItem = {
          ...data,
          id: generateId(),
          lastRestockDate: data.stock > 0 ? toDateKey(new Date()) : undefined,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ inventoryItems: [item, ...s.inventoryItems] }));
        get().addToast('success', `库存物品「${item.name}」已创建`);
      },

      updateInventoryItem: (id, data) => {
        const item = get().inventoryItems.find((i) => i.id === id);
        if (!item) return;
        const now = new Date().toISOString();
        set((s) => ({
          inventoryItems: s.inventoryItems.map((i) =>
            i.id === id ? { ...i, ...data, updatedAt: now } : i
          ),
        }));
        get().addToast('success', '库存物品已更新');
      },

      deleteInventoryItem: (id) => {
        const item = get().inventoryItems.find((i) => i.id === id);
        set((s) => ({ inventoryItems: s.inventoryItems.filter((i) => i.id !== id) }));
        get().addToast('info', `库存物品「${item?.name ?? ''}」已删除`);
      },

      addStockTransaction: (data) => {
        const item = get().inventoryItems.find((i) => i.id === data.inventoryItemId);
        if (!item) return false;

        const now = new Date().toISOString();
        const stockBefore = item.stock;
        let stockAfter = stockBefore;
        const unitPrice = data.unitPrice ?? item.unitPrice;

        switch (data.type) {
          case '入库':
            stockAfter = stockBefore + data.quantity;
            break;
          case '出库':
          case '领用':
            if (stockBefore < data.quantity) {
              get().addToast('error', `${item.name}库存不足，当前库存：${stockBefore}${item.unit}`);
              return false;
            }
            stockAfter = stockBefore - data.quantity;
            break;
          case '退货':
            stockAfter = stockBefore + data.quantity;
            break;
          case '盘点':
            stockAfter = data.quantity;
            break;
        }

        const transaction: StockTransaction = {
          id: generateId(),
          inventoryItemId: item.id,
          inventoryItemName: item.name,
          category: item.category,
          type: data.type,
          quantity: data.type === '盘点' ? Math.abs(stockAfter - stockBefore) : data.quantity,
          unitPrice,
          totalPrice: (data.type === '盘点' ? Math.abs(stockAfter - stockBefore) : data.quantity) * unitPrice,
          stockBefore,
          stockAfter,
          operator: data.operator,
          orderId: data.orderId,
          orderNo: data.orderNo,
          remark: data.remark,
          createdAt: now,
        };

        const shouldUpdateRestockDate = data.type === '入库';

        set((s) => ({
          inventoryItems: s.inventoryItems.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  stock: stockAfter,
                  updatedAt: now,
                  lastRestockDate: shouldUpdateRestockDate ? toDateKey(new Date()) : i.lastRestockDate,
                  unitPrice: data.type === '入库' && data.unitPrice !== undefined ? data.unitPrice : i.unitPrice,
                }
              : i
          ),
          stockTransactions: [transaction, ...s.stockTransactions],
        }));

        const typeLabel: Record<StockTransactionType, string> = {
          '入库': '入库',
          '出库': '出库',
          '领用': '领用',
          '退货': '退货',
          '盘点': '盘点',
        };
        get().addToast('success', `${item.name}${typeLabel[data.type]}成功`);

        if (data.type !== '入库' && data.type !== '退货' && stockAfter < item.safeStock) {
          get().addToast(
            'warning',
            `${item.name}库存已低于安全库存（当前${stockAfter}${item.unit}，安全库存${item.safeStock}${item.unit}），请及时补货！`
          );
        }
        return true;
      },

      getLowStockItems: () => {
        return get().inventoryItems.filter((i) => i.stock < i.safeStock);
      },

      consumeInventoryForOrder: (orderId, items) => {
        const order = get().orders.find((o) => o.id === orderId);
        if (!order) return false;

        let allSuccess = true;
        for (const { inventoryItemId, quantity, operator } of items) {
          const result = get().addStockTransaction({
            inventoryItemId,
            type: '领用',
            quantity,
            operator,
            orderId,
            orderNo: order.orderNo,
            remark: order.description ? `维修领用：${order.description.slice(0, 20)}` : '维修领用',
          });
          if (!result) allSuccess = false;
        }
        return allSuccess;
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
          inventoryItems: mockInventoryItems,
          stockTransactions: mockStockTransactions,
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
