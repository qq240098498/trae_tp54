import { UrgencyLevel, OrderStatus, URGENCY_WEIGHT, ESCALATION_THRESHOLD_MS, InspectionPlan, InspectionCycle } from '@/types';

export function generateOrderNo(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = String(Math.floor(Math.random() * 9000) + 1000);
  return `WX${y}${m}${d}${rand}`;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${h}:${min}`;
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${min}`;
}

export function getRelativeTime(iso: string): string {
  const now = new Date().getTime();
  const t = new Date(iso).getTime();
  const diff = now - t;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  return `${days}天前`;
}

export function getUrgencyColor(urgency: UrgencyLevel): string {
  switch (urgency) {
    case '非常紧急':
      return 'bg-red-100 text-red-700 border-red-200';
    case '紧急':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

export function getUrgencyBadge(urgency: UrgencyLevel): string {
  switch (urgency) {
    case '非常紧急':
      return 'bg-red-500 text-white';
    case '紧急':
      return 'bg-orange-500 text-white';
    default:
      return 'bg-slate-500 text-white';
  }
}

export function getStatusColor(status: OrderStatus): string {
  switch (status) {
    case '待派单':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case '已派单':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case '已接单':
      return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    case '维修中':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case '待确认':
      return 'bg-cyan-100 text-cyan-700 border-cyan-200';
    case '已完成':
      return 'bg-green-100 text-green-700 border-green-200';
    case '已取消':
      return 'bg-gray-100 text-gray-500 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

export function sortOrders<T extends { urgency: UrgencyLevel; createdAt: string; autoEscalated: boolean }>(orders: T[]): T[] {
  return [...orders].sort((a, b) => {
    const weightDiff = URGENCY_WEIGHT[b.urgency] - URGENCY_WEIGHT[a.urgency];
    if (weightDiff !== 0) return weightDiff;
    const escalatedDiff = (b.autoEscalated ? 1 : 0) - (a.autoEscalated ? 1 : 0);
    if (escalatedDiff !== 0) return escalatedDiff;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

export function shouldEscalate(order: { status: OrderStatus; updatedAt: string; autoEscalated: boolean }): boolean {
  if (order.status !== '已派单' || order.autoEscalated) return false;
  const elapsed = Date.now() - new Date(order.updatedAt).getTime();
  return elapsed >= ESCALATION_THRESHOLD_MS;
}

export function escalateUrgency(urgency: UrgencyLevel): UrgencyLevel {
  if (urgency === '普通') return '紧急';
  if (urgency === '紧急') return '非常紧急';
  return '非常紧急';
}

export function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN');
}

export function generateInspectionTaskNo(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = String(Math.floor(Math.random() * 9000) + 1000);
  return `XJ${y}${m}${d}${rand}`;
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function getWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

export function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function parseDateKey(key: string): Date {
  return new Date(key + 'T00:00:00');
}

export function isInspectionDue(plan: InspectionPlan, now: Date = new Date()): boolean {
  if (!plan.enabled) return false;
  const last = plan.lastGeneratedDate;
  switch (plan.cycle) {
    case 'daily':
      return last !== toDateKey(now);
    case 'weekly':
      return !last || getWeekKey(parseDateKey(last)) !== getWeekKey(now);
    case 'monthly':
      return !last || getMonthKey(parseDateKey(last)) !== getMonthKey(now);
    default:
      return false;
  }
}

export function getCycleLabel(cycle: InspectionCycle): string {
  switch (cycle) {
    case 'daily':
      return '每日';
    case 'weekly':
      return '每周';
    case 'monthly':
      return '每月';
    default:
      return '';
  }
}
