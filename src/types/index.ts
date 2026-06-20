export type RepairType = '水电' | '墙面' | '门窗' | '管道疏通' | '家电' | '其他';

export type UrgencyLevel = '普通' | '紧急' | '非常紧急';

export type OrderStatus = '待派单' | '已派单' | '已接单' | '维修中' | '待确认' | '已完成' | '已取消';

export type WorkerSkill = RepairType;

export type UserRole = 'owner' | 'admin' | 'worker' | 'inspector';

export type InspectionCategory = '电梯' | '消防' | '绿化' | '照明' | '门禁';

export type InspectionCycle = 'daily' | 'weekly' | 'monthly';

export type InspectionItemResult = 'pending' | 'normal' | 'abnormal';

export type InspectionTaskStatus = 'pending' | 'in_progress' | 'completed';

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
  sourceFromInspection?: boolean;
  inspectionTaskId?: string;
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

export interface InspectionItemTemplate {
  id: string;
  name: string;
}

export interface InspectionItem extends InspectionItemTemplate {
  result: InspectionItemResult;
  remark?: string;
}

export interface InspectionPlan {
  id: string;
  name: string;
  category: InspectionCategory;
  cycle: InspectionCycle;
  area: string;
  items: InspectionItemTemplate[];
  enabled: boolean;
  lastGeneratedDate?: string;
  createdAt: string;
}

export interface InspectionTask {
  id: string;
  taskNo: string;
  planId: string;
  planName: string;
  category: InspectionCategory;
  cycle: InspectionCycle;
  area: string;
  items: InspectionItem[];
  status: InspectionTaskStatus;
  assigneeId?: string;
  assigneeName?: string;
  scheduledDate: string;
  startedAt?: string;
  completedAt?: string;
  operator?: string;
  remark?: string;
  createdAt: string;
  convertedOrderIds: string[];
}

export const INSPECTION_CATEGORIES: InspectionCategory[] = ['电梯', '消防', '绿化', '照明', '门禁'];

export const INSPECTION_CYCLES: { value: InspectionCycle; label: string; short: string }[] = [
  { value: 'daily', label: '按天', short: '每日' },
  { value: 'weekly', label: '按周', short: '每周' },
  { value: 'monthly', label: '按月', short: '每月' },
];

export const INSPECTION_TASK_STATUSES: InspectionTaskStatus[] = ['pending', 'in_progress', 'completed'];

export const INSPECTION_TASK_STATUS_LABEL: Record<InspectionTaskStatus, string> = {
  pending: '待巡检',
  in_progress: '巡检中',
  completed: '已完成',
};

export const INSPECTION_CATEGORY_TO_REPAIR: Record<InspectionCategory, RepairType> = {
  '电梯': '其他',
  '消防': '其他',
  '绿化': '其他',
  '照明': '水电',
  '门禁': '门窗',
};

export const DEFAULT_INSPECTION_ITEMS: Record<InspectionCategory, string[]> = {
  '电梯': ['轿厢照明正常', '按键面板灵敏', '紧急对讲可用', '运行无异响', '层门开关顺畅'],
  '消防': ['灭火器压力正常', '消防栓水带完好', '疏散指示灯亮', '通道无杂物堆放', '报警按钮完好'],
  '绿化': ['苗木无枯萎', '浇水养护到位', '草坪修剪整齐', '无明显病虫害', '绿地无垃圾堆积'],
  '照明': ['楼道照明正常', '地下车库灯亮', '景观灯完好', '应急照明可用', '开关无损坏'],
  '门禁': ['门禁刷卡正常', '道闸起落正常', '可视对讲清晰', '单元门锁闭合到位', '监控画面正常'],
};
