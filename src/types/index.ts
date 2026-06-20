export type RepairType = '水电' | '墙面' | '门窗' | '管道疏通' | '家电' | '其他';

export type UrgencyLevel = '普通' | '紧急' | '非常紧急';

export type OrderStatus = '待派单' | '已派单' | '已接单' | '维修中' | '待确认' | '已完成' | '已取消';

export type WorkerSkill = RepairType;

export type UserRole = 'owner' | 'admin' | 'worker';

export interface MaterialItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface TimelineNode {
  status: OrderStatus;
  timestamp: string;
  operator: string;
  remark?: string;
}

export interface RepairOrder {
  id: string;
  orderNo: string;
  roomNumber: string;
  ownerName: string;
  ownerPhone: string;
  repairType: RepairType;
  urgency: UrgencyLevel;
  description: string;
  images?: string[];
  status: OrderStatus;
  assigneeId?: string;
  assigneeName?: string;
  materials: MaterialItem[];
  signature?: string;
  timeline: TimelineNode[];
  createdAt: string;
  updatedAt: string;
  autoEscalated: boolean;
  lastEscalationTime?: string;
}

export interface Worker {
  id: string;
  name: string;
  phone: string;
  skills: WorkerSkill[];
  status: '空闲' | '忙碌' | '休息';
  avatar?: string;
  completedOrders: number;
}

export interface User {
  id: string;
  role: UserRole;
  name: string;
  roomNumber?: string;
  workerId?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

export const REPAIR_TYPES: RepairType[] = ['水电', '墙面', '门窗', '管道疏通', '家电', '其他'];

export const URGENCY_LEVELS: UrgencyLevel[] = ['普通', '紧急', '非常紧急'];

export const ORDER_STATUSES: OrderStatus[] = ['待派单', '已派单', '已接单', '维修中', '待确认', '已完成', '已取消'];

export const URGENCY_WEIGHT: Record<UrgencyLevel, number> = {
  '普通': 1,
  '紧急': 2,
  '非常紧急': 3,
};

export const ESCALATION_THRESHOLD_MS = 15 * 60 * 1000;
