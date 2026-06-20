import { useState, useMemo } from 'react';
import {
  Wallet,
  Search,
  ListFilter,
  AlertTriangle,
  CheckCircle2,
  Home,
  User,
  Phone,
  CalendarClock,
  Edit2,
  Banknote,
  TrendingDown,
  RefreshCw,
} from 'lucide-react';
import { useAppStore } from '@/store';
import {
  PROPERTY_FEE_ARREARS_THRESHOLD,
  type PropertyFeeRecord,
  type PropertyFeeStatus,
} from '@/types';
import { formatCurrency, checkPropertyFeeStatus } from '@/utils';
import { cn } from '@/lib/utils';

type StatusFilter = 'all' | PropertyFeeStatus;
type ArrearsFilter = 'all' | 'danger' | 'warning' | 'normal';

interface PayForm {
  months: string;
}

interface EditForm {
  monthlyFee: string;
  arrearsMonths: string;
  lastPaymentDate: string;
}

export default function PropertyFeeManagement() {
  const {
    propertyFees,
    currentUser,
    payPropertyFee,
    updatePropertyFee,
    resetData,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [arrearsFilter, setArrearsFilter] = useState<ArrearsFilter>('all');

  const [payModalOpen, setPayModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PropertyFeeRecord | null>(null);

  const [payForm, setPayForm] = useState<PayForm>({ months: '1' });
  const [editForm, setEditForm] = useState<EditForm>({
    monthlyFee: '',
    arrearsMonths: '',
    lastPaymentDate: '',
  });
  const [payError, setPayError] = useState('');
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  const stats = useMemo(() => {
    const total = propertyFees.length;
    const normalCount = propertyFees.filter(
      (p) => p.status === '正常' || p.arrearsMonths <= 0
    ).length;
    const arrearsCount = propertyFees.filter(
      (p) => p.status === '欠费' && p.arrearsMonths > 0
    ).length;
    const dangerCount = propertyFees.filter(
      (p) => p.arrearsMonths > PROPERTY_FEE_ARREARS_THRESHOLD
    ).length;
    const totalArrearsAmount = propertyFees.reduce(
      (sum, p) => sum + (p.arrearsMonths > 0 ? p.totalArrears : 0),
      0
    );
    const expectedMonthly = propertyFees.reduce((sum, p) => sum + p.monthlyFee, 0);
    return {
      total,
      normalCount,
      arrearsCount,
      dangerCount,
      totalArrearsAmount,
      expectedMonthly,
    };
  }, [propertyFees]);

  const filteredRecords = useMemo(() => {
    return propertyFees
      .filter((p) => {
        const keyword = searchQuery.trim().toLowerCase();
        const matchSearch =
          !keyword ||
          p.roomNumber.toLowerCase().includes(keyword) ||
          p.ownerName.toLowerCase().includes(keyword) ||
          p.ownerPhone.includes(keyword);
        const matchStatus = statusFilter === 'all' || p.status === statusFilter;
        const check = checkPropertyFeeStatus(p);
        const matchArrears =
          arrearsFilter === 'all' || check.level === arrearsFilter;
        return matchSearch && matchStatus && matchArrears;
      })
      .sort((a, b) => {
        const aDanger = a.arrearsMonths > PROPERTY_FEE_ARREARS_THRESHOLD ? 1 : 0;
        const bDanger = b.arrearsMonths > PROPERTY_FEE_ARREARS_THRESHOLD ? 1 : 0;
        if (bDanger !== aDanger) return bDanger - aDanger;
        return b.arrearsMonths - a.arrearsMonths;
      });
  }, [propertyFees, searchQuery, statusFilter, arrearsFilter]);

  const openPayModal = (record: PropertyFeeRecord) => {
    setSelectedRecord(record);
    setPayForm({ months: '1' });
    setPayError('');
    setPayModalOpen(true);
  };

  const openEditModal = (record: PropertyFeeRecord) => {
    setSelectedRecord(record);
    setEditForm({
      monthlyFee: String(record.monthlyFee),
      arrearsMonths: String(record.arrearsMonths),
      lastPaymentDate: record.lastPaymentDate || '',
    });
    setEditErrors({});
    setEditModalOpen(true);
  };

  const handlePaySubmit = () => {
    if (!selectedRecord) return;
    const months = Number(payForm.months);
    if (!payForm.months || isNaN(months) || months <= 0) {
      setPayError('请输入有效的缴费月数');
      return;
    }
    if (months > 36) {
      setPayError('单次登记缴费月数不能超过36');
      return;
    }
    payPropertyFee(selectedRecord.id, months, currentUser.name);
    setPayModalOpen(false);
  };

  const handleEditSubmit = () => {
    if (!selectedRecord) return;
    const errors: Record<string, string> = {};
    const monthlyFee = Number(editForm.monthlyFee);
    const arrearsMonths = Number(editForm.arrearsMonths);

    if (!editForm.monthlyFee || isNaN(monthlyFee) || monthlyFee <= 0) {
      errors.monthlyFee = '请输入有效的月物业费';
    } else if (monthlyFee > 99999) {
      errors.monthlyFee = '月物业费不能超过 99999 元';
    }

    if (
      editForm.arrearsMonths === '' ||
      isNaN(arrearsMonths) ||
      arrearsMonths < 0
    ) {
      errors.arrearsMonths = '请输入有效的欠费月数';
    } else if (arrearsMonths > 120) {
      errors.arrearsMonths = '欠费月数不能超过 120';
    }

    if (editForm.lastPaymentDate && isNaN(Date.parse(editForm.lastPaymentDate))) {
      errors.lastPaymentDate = '日期格式不正确';
    }

    setEditErrors(errors);
    if (Object.keys(errors).length > 0) return;

    updatePropertyFee(
      selectedRecord.id,
      {
        monthlyFee,
        arrearsMonths,
        totalArrears: arrearsMonths * monthlyFee,
        lastPaymentDate: editForm.lastPaymentDate || undefined,
      },
      currentUser.name
    );
    setEditModalOpen(false);
  };

  const handleReset = () => {
    if (
      window.confirm(
        '确定要重置物业费数据为初始状态吗？该操作不可恢复。'
      )
    ) {
      resetData();
    }
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setArrearsFilter('all');
    setSearchQuery('');
  };

  const hasFilters =
    statusFilter !== 'all' || arrearsFilter !== 'all' || searchQuery.trim();

  const getArrearsLevelBadge = (record: PropertyFeeRecord) => {
    const check = checkPropertyFeeStatus(record);
    if (check.level === 'danger') {
      return {
        text: `欠费${record.arrearsMonths}月`,
        className: 'bg-orange-100 text-orange-700 border-orange-200',
      };
    }
    if (check.level === 'warning') {
      return {
        text: `欠费${record.arrearsMonths}月`,
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      };
    }
    return {
      text: '正常',
      className: 'bg-green-100 text-green-700 border-green-200',
    };
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary-900 flex items-center gap-2 font-serif">
              <Wallet className="w-7 h-7 text-primary-700" />
              物业费管理
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              查询业主物业费缴纳情况，报修时自动校验欠费状态（欠费超{PROPERTY_FEE_ARREARS_THRESHOLD}个月仅提示不影响受理）
            </p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            重置数据
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">业主户数</p>
                <p className="text-2xl font-bold text-gray-800 mt-1 tabular-nums">
                  {stats.total}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-primary-100">
                <Home className="w-5 h-5 text-primary-700" />
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">正常缴费</p>
                <p className="text-2xl font-bold text-green-600 mt-1 tabular-nums">
                  {stats.normalCount}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-green-100">
                <CheckCircle2 className="w-5 h-5 text-green-700" />
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">欠费户数</p>
                <p className="text-2xl font-bold text-orange-600 mt-1 tabular-nums">
                  {stats.arrearsCount}
                </p>
                <p className="text-xs text-orange-500 mt-1">
                  超{PROPERTY_FEE_ARREARS_THRESHOLD}个月 {stats.dangerCount} 户
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-orange-100">
                <AlertTriangle className="w-5 h-5 text-orange-700" />
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">累计欠费金额</p>
                <p className="text-2xl font-bold text-red-600 mt-1 tabular-nums">
                  {formatCurrency(stats.totalArrearsAmount)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  月应收 {formatCurrency(stats.expectedMonthly)}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-red-100">
                <TrendingDown className="w-5 h-5 text-red-700" />
              </div>
            </div>
          </div>
        </div>

        {stats.dangerCount > 0 && (
          <div className="card p-4 mb-6 border-2 border-orange-300 bg-orange-50/50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-orange-800">
                  严重欠费预警（超{PROPERTY_FEE_ARREARS_THRESHOLD}个月）
                </h3>
                <p className="text-sm text-orange-700 mt-1">
                  有 {stats.dangerCount} 户业主物业费欠费超过 {PROPERTY_FEE_ARREARS_THRESHOLD} 个月，报修受理时已自动标记提示但不会拦截。建议尽快催缴。
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="card overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <ListFilter className="w-4 h-4 text-primary-600" />
              <span className="font-medium text-gray-700">筛选条件</span>
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="ml-auto text-sm text-primary-600 hover:text-primary-700 hover:underline"
                >
                  清空筛选
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">
                  关键字搜索
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="房号 / 业主姓名 / 电话"
                    className="input-field pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">
                  缴费状态
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="select-field"
                >
                  <option value="all">全部状态</option>
                  <option value="正常">正常</option>
                  <option value="欠费">欠费</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">
                  欠费级别
                </label>
                <select
                  value={arrearsFilter}
                  onChange={(e) =>
                    setArrearsFilter(e.target.value as ArrearsFilter)
                  }
                  className="select-field"
                >
                  <option value="all">全部级别</option>
                  <option value="danger">
                    严重欠费（超{PROPERTY_FEE_ARREARS_THRESHOLD}月）
                  </option>
                  <option value="warning">轻度欠费（1-{PROPERTY_FEE_ARREARS_THRESHOLD}月）</option>
                  <option value="normal">正常</option>
                </select>
              </div>
            </div>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <Wallet className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>暂无符合条件的物业费记录</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      房号
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      业主信息
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      月物业费
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      欠费月数
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      累计欠费
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      最近缴费
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRecords.map((record) => {
                    const badge = getArrearsLevelBadge(record);
                    return (
                      <tr
                        key={record.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3.5">
                          <span className="text-sm text-gray-900 font-medium">
                            {record.roomNumber}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm text-gray-900 flex items-center gap-1">
                              <User className="w-3 h-3 text-gray-400" />
                              {record.ownerName}
                            </span>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-gray-400" />
                              {record.ownerPhone}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm text-gray-700 tabular-nums">
                            {formatCurrency(record.monthlyFee)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={cn(
                              'text-sm font-medium tabular-nums',
                              record.arrearsMonths > 0
                                ? record.arrearsMonths > PROPERTY_FEE_ARREARS_THRESHOLD
                                  ? 'text-orange-700'
                                  : 'text-yellow-700'
                                : 'text-gray-400'
                            )}
                          >
                            {record.arrearsMonths} 月
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={cn(
                              'text-sm font-medium tabular-nums',
                              record.totalArrears > 0
                                ? 'text-red-600'
                                : 'text-gray-400'
                            )}
                          >
                            {formatCurrency(record.totalArrears)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <CalendarClock className="w-3.5 h-3.5 text-gray-400" />
                            {record.lastPaymentDate || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium',
                              badge.className
                            )}
                          >
                            {badge.text}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openPayModal(record)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                            >
                              <Banknote className="w-3.5 h-3.5" />
                              登记缴费
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(record)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              编辑
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
            共 {filteredRecords.length} 条记录
            {stats.arrearsCount > 0 && (
              <span className="ml-2 text-orange-600">
                · 其中欠费 {stats.arrearsCount} 户，累计欠费 {formatCurrency(stats.totalArrearsAmount)}
              </span>
            )}
          </div>
        </div>
      </div>

      {payModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setPayModalOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col animate-slide-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 font-serif">
                登记缴费
              </h2>
              <button
                type="button"
                onClick={() => setPayModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">房号</span>
                  <span className="text-gray-900 font-medium">
                    {selectedRecord.roomNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">业主</span>
                  <span className="text-gray-900">{selectedRecord.ownerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">月物业费</span>
                  <span className="text-gray-900">
                    {formatCurrency(selectedRecord.monthlyFee)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">当前欠费</span>
                  <span
                    className={cn(
                      'font-medium',
                      selectedRecord.arrearsMonths > 0
                        ? 'text-orange-700'
                        : 'text-green-700'
                    )}
                  >
                    {selectedRecord.arrearsMonths} 月 · {formatCurrency(selectedRecord.totalArrears)}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  本次缴费月数 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="36"
                  value={payForm.months}
                  onChange={(e) => {
                    setPayForm({ months: e.target.value });
                    setPayError('');
                  }}
                  className="input-field"
                  placeholder="请输入缴费月数"
                />
                {payError && (
                  <p className="mt-1 text-xs text-red-500">{payError}</p>
                )}
                <p className="mt-1 text-xs text-gray-400">
                  缴费后欠费月数将相应减少，归零后状态自动置为"正常"
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setPayModalOpen(false)}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handlePaySubmit}
                className="btn-primary flex items-center gap-2"
              >
                <Banknote className="w-4 h-4" />
                确认缴费
              </button>
            </div>
          </div>
        </div>
      )}

      {editModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setEditModalOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col animate-slide-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 font-serif">
                编辑物业费记录
              </h2>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">房号</span>
                  <span className="text-gray-900 font-medium">
                    {selectedRecord.roomNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">业主</span>
                  <span className="text-gray-900">{selectedRecord.ownerName}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  月物业费（元） <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.monthlyFee}
                  onChange={(e) =>
                    setEditForm({ ...editForm, monthlyFee: e.target.value })
                  }
                  className={`input-field ${
                    editErrors.monthlyFee ? 'border-red-400' : ''
                  }`}
                />
                {editErrors.monthlyFee && (
                  <p className="mt-1 text-xs text-red-500">{editErrors.monthlyFee}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  欠费月数 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={editForm.arrearsMonths}
                  onChange={(e) =>
                    setEditForm({ ...editForm, arrearsMonths: e.target.value })
                  }
                  className={`input-field ${
                    editErrors.arrearsMonths ? 'border-red-400' : ''
                  }`}
                />
                {editErrors.arrearsMonths && (
                  <p className="mt-1 text-xs text-red-500">{editErrors.arrearsMonths}</p>
                )}
                <p className="mt-1 text-xs text-gray-400">
                  累计欠费将自动计算为 月费 × 欠费月数
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  最近缴费日期
                </label>
                <input
                  type="date"
                  value={editForm.lastPaymentDate}
                  onChange={(e) =>
                    setEditForm({ ...editForm, lastPaymentDate: e.target.value })
                  }
                  className={`input-field ${
                    editErrors.lastPaymentDate ? 'border-red-400' : ''
                  }`}
                />
                {editErrors.lastPaymentDate && (
                  <p className="mt-1 text-xs text-red-500">{editErrors.lastPaymentDate}</p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleEditSubmit}
                className="btn-primary flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
