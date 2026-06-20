import { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Search,
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  History,
  X,
  Filter,
  RefreshCw,
  TrendingDown,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import { useAppStore } from '@/store';
import {
  MATERIAL_CATEGORIES,
  STOCK_TRANSACTION_TYPES,
  type MaterialCategory,
  type StockTransactionType,
  type InventoryItem,
} from '@/types';
import { formatDateTime, formatCurrency, formatNumber } from '@/utils';
import { cn } from '@/lib/utils';

type TabType = 'inventory' | 'transactions';

const MAX_STOCK_QUANTITY = 99999;
const MAX_UNIT_PRICE = 99999.99;

export default function InventoryManagement() {
  const {
    inventoryItems,
    stockTransactions,
    currentUser,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    addStockTransaction,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<TabType>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<MaterialCategory | 'all'>('all');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionItemId, setTransactionItemId] = useState<string | null>(null);
  const [transactionType, setTransactionType] = useState<StockTransactionType>('入库');

  const [itemForm, setItemForm] = useState({
    name: '',
    category: '灯泡' as MaterialCategory,
    spec: '',
    unit: '个',
    stock: 0,
    safeStock: 10,
    unitPrice: 0,
    supplier: '',
  });

  const [transactionForm, setTransactionForm] = useState({
    quantity: '',
    unitPrice: '',
    remark: '',
  });

  const [itemErrors, setItemErrors] = useState<Record<string, string>>({});
  const [transactionErrors, setTransactionErrors] = useState<Record<string, string>>({});

  const filteredItems = useMemo(() => {
    return inventoryItems.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.spec.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.supplier?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = categoryFilter === 'all' || item.category === categoryFilter;
      const matchLowStock = !onlyLowStock || item.stock < item.safeStock;
      return matchSearch && matchCategory && matchLowStock;
    });
  }, [inventoryItems, searchQuery, categoryFilter, onlyLowStock]);

  const lowStockCount = useMemo(
    () => inventoryItems.filter((i) => i.stock < i.safeStock).length,
    [inventoryItems]
  );

  const totalValue = useMemo(
    () => inventoryItems.reduce((sum, i) => sum + i.stock * i.unitPrice, 0),
    [inventoryItems]
  );

  const totalItems = useMemo(
    () => inventoryItems.reduce((sum, i) => sum + i.stock, 0),
    [inventoryItems]
  );

  const resetItemForm = () => {
    setItemForm({
      name: '',
      category: '灯泡',
      spec: '',
      unit: '个',
      stock: 0,
      safeStock: 10,
      unitPrice: 0,
      supplier: '',
    });
    setItemErrors({});
  };

  const openAddItemModal = () => {
    resetItemForm();
    setEditingItem(null);
    setShowItemModal(true);
  };

  const openEditItemModal = (item: InventoryItem) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      category: item.category,
      spec: item.spec,
      unit: item.unit,
      stock: item.stock,
      safeStock: item.safeStock,
      unitPrice: item.unitPrice,
      supplier: item.supplier || '',
    });
    setItemErrors({});
    setShowItemModal(true);
  };

  const validateItemForm = () => {
    const errors: Record<string, string> = {};
    if (!itemForm.name.trim()) errors.name = '请输入名称';
    if (!itemForm.spec.trim()) errors.spec = '请输入规格';
    if (!itemForm.unit.trim()) errors.unit = '请输入单位';
    if (itemForm.stock < 0) {
      errors.stock = '库存不能为负';
    } else if (itemForm.stock > MAX_STOCK_QUANTITY) {
      errors.stock = `库存不能超过 ${formatNumber(MAX_STOCK_QUANTITY)}`;
    }
    if (itemForm.safeStock < 0) {
      errors.safeStock = '安全库存不能为负';
    } else if (itemForm.safeStock > MAX_STOCK_QUANTITY) {
      errors.safeStock = `安全库存不能超过 ${formatNumber(MAX_STOCK_QUANTITY)}`;
    }
    if (itemForm.unitPrice < 0) {
      errors.unitPrice = '单价不能为负';
    } else if (itemForm.unitPrice > MAX_UNIT_PRICE) {
      errors.unitPrice = `单价不能超过 ${formatCurrency(MAX_UNIT_PRICE)}`;
    }
    setItemErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleItemSubmit = () => {
    if (!validateItemForm()) return;
    if (editingItem) {
      updateInventoryItem(editingItem.id, itemForm);
    } else {
      addInventoryItem(itemForm);
    }
    setShowItemModal(false);
  };

  const handleDeleteItem = (item: InventoryItem) => {
    if (window.confirm(`确定删除「${item.name}」吗？相关交易记录不会被删除。`)) {
      deleteInventoryItem(item.id);
    }
  };

  const openTransactionModal = (itemId: string, type: StockTransactionType) => {
    setTransactionItemId(itemId);
    setTransactionType(type);
    setTransactionForm({ quantity: '', unitPrice: '', remark: '' });
    setTransactionErrors({});
    setShowTransactionModal(true);
  };

  const validateTransactionForm = () => {
    const errors: Record<string, string> = {};
    const qty = Number(transactionForm.quantity);
    if (!transactionForm.quantity || isNaN(qty) || qty <= 0) {
      errors.quantity = '请输入有效数量';
    } else if (qty > MAX_STOCK_QUANTITY) {
      errors.quantity = `数量不能超过 ${MAX_STOCK_QUANTITY.toLocaleString()}`;
    }
    if (transactionType === '入库' && transactionForm.unitPrice) {
      const price = Number(transactionForm.unitPrice);
      if (isNaN(price) || price < 0) {
        errors.unitPrice = '请输入有效单价';
      } else if (price > MAX_UNIT_PRICE) {
        errors.unitPrice = `单价不能超过 ${MAX_UNIT_PRICE.toLocaleString()} 元`;
      }
    }
    setTransactionErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleTransactionSubmit = () => {
    if (!validateTransactionForm() || !transactionItemId) return;
    const item = inventoryItems.find((i) => i.id === transactionItemId);
    if (!item) return;

    const qty = Number(transactionForm.quantity);
    const price = transactionForm.unitPrice ? Number(transactionForm.unitPrice) : undefined;

    const result = addStockTransaction({
      inventoryItemId: transactionItemId,
      type: transactionType,
      quantity: qty,
      unitPrice: price,
      operator: currentUser.name,
      remark: transactionForm.remark || undefined,
    });

    if (result) {
      setShowTransactionModal(false);
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.stock <= 0) return { label: '缺货', color: 'bg-red-100 text-red-700 border-red-200' };
    if (item.stock < item.safeStock)
      return { label: '库存不足', color: 'bg-orange-100 text-orange-700 border-orange-200' };
    const ratio = item.stock / item.safeStock;
    if (ratio < 1.5)
      return { label: '偏低', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
    return { label: '正常', color: 'bg-green-100 text-green-700 border-green-200' };
  };

  const getTransactionTypeColor = (type: StockTransactionType) => {
    switch (type) {
      case '入库':
        return 'bg-green-100 text-green-700';
      case '出库':
      case '领用':
        return 'bg-red-100 text-red-700';
      case '退货':
        return 'bg-blue-100 text-blue-700';
      case '盘点':
        return 'bg-purple-100 text-purple-700';
    }
  };

  const selectedTransactionItem = inventoryItems.find((i) => i.id === transactionItemId);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between items-start gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-primary-900 flex items-center gap-2">
                <Package className="w-7 h-7" />
                耗材库存管理
              </h1>
              <p className="text-gray-500 mt-1">管理常用配件进销存，维修领用自动扣减库存</p>
            </div>
            {activeTab === 'inventory' && (
              <button
                type="button"
                onClick={openAddItemModal}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                新增物品
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">物品种类</p>
                <p className="text-2xl font-bold text-gray-800 mt-1 tabular-nums">{formatNumber(inventoryItems.length)}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-primary-100">
                <Package className="w-5 h-5 text-primary-700" />
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">库存总量</p>
                <p className="text-2xl font-bold text-gray-800 mt-1 tabular-nums">{formatNumber(totalItems)}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-100">
                <TrendingDown className="w-5 h-5 text-blue-700" />
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">库存总值</p>
                <p className="text-2xl font-bold text-gray-800 mt-1 tabular-nums">{formatCurrency(totalValue)}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-green-100">
                <RefreshCw className="w-5 h-5 text-green-700" />
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">低库存预警</p>
                <p className="text-2xl font-bold text-red-600 mt-1 tabular-nums">{formatNumber(lowStockCount)}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-red-100">
                <AlertTriangle className="w-5 h-5 text-red-700" />
              </div>
            </div>
          </div>
        </div>

        {lowStockCount > 0 && (
          <div className="card p-4 mb-6 border-2 border-red-300 bg-red-50/50">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-800">库存预警提醒</h3>
                <p className="text-sm text-red-700 mt-1">
                  有 {lowStockCount} 种耗材库存低于安全库存，请及时安排补货：
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {inventoryItems
                    .filter((i) => i.stock < i.safeStock)
                    .slice(0, 6)
                    .map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => openTransactionModal(item.id, '入库')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-red-200 text-red-700 text-sm hover:bg-red-100 transition-colors"
                      >
                        <span className="font-medium">{item.name}</span>
                        <span className="text-red-500">
                          ({formatNumber(item.stock)}/{formatNumber(item.safeStock)}{item.unit})
                        </span>
                        <ArrowDownCircle className="w-3.5 h-3.5" />
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-1 mb-6 border-b border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={cn(
              'px-5 py-3 font-medium text-sm border-b-2 -mb-px transition-colors',
              activeTab === 'inventory'
                ? 'border-primary-700 text-primary-800'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              库存列表
            </div>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('transactions')}
            className={cn(
              'px-5 py-3 font-medium text-sm border-b-2 -mb-px transition-colors',
              activeTab === 'transactions'
                ? 'border-primary-700 text-primary-800'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            <div className="flex items-center gap-2">
              <History className="w-4 h-4" />
              进销存记录
            </div>
          </button>
        </div>

        {activeTab === 'inventory' && (
          <>
            <div className="card p-4 mb-6 flex flex-wrap gap-3 items-center">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索物品名称、规格、供应商..."
                  className="input-field pl-10"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as MaterialCategory | 'all')}
                  className="input-field pl-10 pr-8 appearance-none"
                >
                  <option value="all">全部分类</option>
                  {MATERIAL_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-50 border border-orange-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyLowStock}
                  onChange={(e) => setOnlyLowStock(e.target.checked)}
                  className="w-4 h-4 text-orange-600 border-orange-300 focus:ring-orange-500"
                />
                <span className="text-sm text-orange-700 font-medium">只看低库存</span>
              </label>
            </div>

            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] table-fixed">
                  <colgroup>
                    <col className="w-[22%]" />
                    <col className="w-[10%]" />
                    <col className="w-[12%]" />
                    <col className="w-[12%]" />
                    <col className="w-[11%]" />
                    <col className="w-[13%]" />
                    <col className="w-[14%]" />
                    <col className="w-[10%]" />
                  </colgroup>
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        物品信息
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        分类
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        当前库存
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        安全库存
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        状态
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        单价
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        库存价值
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                          <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>暂无匹配的库存物品</p>
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map((item) => {
                        const status = getStockStatus(item);
                        const isLow = item.stock < item.safeStock;
                        return (
                          <tr
                            key={item.id}
                            className={cn(
                              'hover:bg-gray-50 transition-colors',
                              isLow && 'bg-orange-50/30'
                            )}
                          >
                            <td className="px-4 py-4">
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 truncate" title={item.name}>
                                  {item.name}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5 truncate" title={`${item.spec}${item.supplier ? ' · ' + item.supplier : ''}`}>
                                  {item.spec}
                                  {item.supplier && ` · ${item.supplier}`}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className="badge bg-primary-50 text-primary-700 whitespace-nowrap">
                                {item.category}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <span
                                className={cn(
                                  'font-semibold tabular-nums whitespace-nowrap',
                                  item.stock === 0
                                    ? 'text-red-600'
                                    : isLow
                                    ? 'text-orange-600'
                                    : 'text-gray-900'
                                )}
                              >
                                {formatNumber(item.stock)}
                                <span className="text-xs text-gray-400 ml-0.5">
                                  {item.unit}
                                </span>
                              </span>
                            </td>
                            <td className="px-4 py-4 text-right text-gray-600 tabular-nums whitespace-nowrap">
                              {formatNumber(item.safeStock)}
                              <span className="text-xs text-gray-400 ml-0.5">{item.unit}</span>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <span
                                className={cn(
                                  'badge border whitespace-nowrap',
                                  status.color
                                )}
                              >
                                {status.label}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-right text-gray-700 tabular-nums whitespace-nowrap">
                              {formatCurrency(item.unitPrice)}
                            </td>
                            <td className="px-4 py-4 text-right font-medium text-gray-900 tabular-nums whitespace-nowrap">
                              {formatCurrency(item.stock * item.unitPrice)}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center justify-center gap-0.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openTransactionModal(item.id, '入库')
                                  }
                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title="入库"
                                >
                                  <ArrowDownCircle className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    openTransactionModal(item.id, '出库')
                                  }
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="出库"
                                >
                                  <ArrowUpCircle className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openEditItemModal(item)}
                                  className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                  title="编辑"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteItem(item)}
                                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  title="删除"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'transactions' && (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] table-fixed">
                <colgroup>
                  <col className="w-[14%]" />
                  <col className="w-[14%]" />
                  <col className="w-[9%]" />
                  <col className="w-[12%]" />
                  <col className="w-[12%]" />
                  <col className="w-[13%]" />
                  <col className="w-[14%]" />
                  <col className="w-[10%]" />
                  <col className="w-[14%]" />
                </colgroup>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      时间
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      物品
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      类型
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      数量
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      单价
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      金额
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      库存变化
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      操作人
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      关联工单/备注
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stockTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
                        <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>暂无交易记录</p>
                      </td>
                    </tr>
                  ) : (
                      stockTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 tabular-nums">
                            {formatDateTime(tx.createdAt)}
                          </td>
                          <td className="px-4 py-4">
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate" title={tx.inventoryItemName}>
                                {tx.inventoryItemName}
                              </p>
                              <p className="text-xs text-gray-500 truncate">{tx.category}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={cn(
                                'badge whitespace-nowrap',
                                getTransactionTypeColor(tx.type)
                              )}
                            >
                              {tx.type}
                            </span>
                          </td>
                          <td
                            className={cn(
                              'px-4 py-4 text-right font-semibold tabular-nums whitespace-nowrap',
                              tx.type === '入库' || tx.type === '退货'
                                ? 'text-green-700'
                                : 'text-red-700'
                            )}
                          >
                            {tx.type === '入库' || tx.type === '退货' ? '+' : '-'}
                            {formatNumber(tx.quantity)}
                          </td>
                          <td className="px-4 py-4 text-right text-gray-600 tabular-nums whitespace-nowrap">
                            {formatCurrency(tx.unitPrice)}
                          </td>
                          <td className="px-4 py-4 text-right font-medium text-gray-900 tabular-nums whitespace-nowrap">
                            {formatCurrency(tx.totalPrice)}
                          </td>
                          <td className="px-4 py-4 text-right text-sm text-gray-600 tabular-nums whitespace-nowrap">
                            {formatNumber(tx.stockBefore)} →{' '}
                            <span className="font-semibold text-primary-700">
                              {formatNumber(tx.stockAfter)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-700 whitespace-nowrap truncate">
                            {tx.operator}
                          </td>
                          <td className="px-4 py-4">
                            <div className="min-w-0">
                              {tx.orderNo && (
                                <p className="text-xs font-medium text-primary-700 truncate" title={`工单：${tx.orderNo}`}>
                                  工单：{tx.orderNo}
                                </p>
                              )}
                              {tx.remark && (
                                <p className="text-xs text-gray-500 mt-0.5 truncate" title={tx.remark}>
                                  {tx.remark}
                                </p>
                              )}
                              {!tx.orderNo && !tx.remark && (
                                <span className="text-xs text-gray-400">-</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in-up">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-primary-900">
                {editingItem ? '编辑库存物品' : '新增库存物品'}
              </h3>
              <button
                type="button"
                onClick={() => setShowItemModal(false)}
                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    物品名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={itemForm.name}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, name: e.target.value })
                    }
                    placeholder="如：LED灯管"
                    className={cn(
                      'input-field',
                      itemErrors.name && 'border-red-300 focus:ring-red-500'
                    )}
                  />
                  {itemErrors.name && (
                    <p className="text-xs text-red-500 mt-1">{itemErrors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    分类 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={itemForm.category}
                    onChange={(e) =>
                      setItemForm({
                        ...itemForm,
                        category: e.target.value as MaterialCategory,
                      })
                    }
                    className="input-field"
                  >
                    {MATERIAL_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    规格 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={itemForm.spec}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, spec: e.target.value })
                    }
                    placeholder="如：18W 白光"
                    className={cn(
                      'input-field',
                      itemErrors.spec && 'border-red-300 focus:ring-red-500'
                    )}
                  />
                  {itemErrors.spec && (
                    <p className="text-xs text-red-500 mt-1">{itemErrors.spec}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    单位 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={itemForm.unit}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, unit: e.target.value })
                    }
                    placeholder="如：个/支/卷"
                    className={cn(
                      'input-field',
                      itemErrors.unit && 'border-red-300 focus:ring-red-500'
                    )}
                  />
                  {itemErrors.unit && (
                    <p className="text-xs text-red-500 mt-1">{itemErrors.unit}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    初始库存
                  </label>
                  <input
                    type="number"
                    value={itemForm.stock}
                    onChange={(e) =>
                      setItemForm({
                        ...itemForm,
                        stock: Number(e.target.value),
                      })
                    }
                    min="0"
                    max={MAX_STOCK_QUANTITY}
                    className={cn(
                      'input-field',
                      itemErrors.stock && 'border-red-300 focus:ring-red-500'
                    )}
                  />
                  {itemErrors.stock && (
                    <p className="text-xs text-red-500 mt-1">{itemErrors.stock}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    安全库存
                  </label>
                  <input
                    type="number"
                    value={itemForm.safeStock}
                    onChange={(e) =>
                      setItemForm({
                        ...itemForm,
                        safeStock: Number(e.target.value),
                      })
                    }
                    min="0"
                    max={MAX_STOCK_QUANTITY}
                    className={cn(
                      'input-field',
                      itemErrors.safeStock && 'border-red-300 focus:ring-red-500'
                    )}
                  />
                  {itemErrors.safeStock && (
                    <p className="text-xs text-red-500 mt-1">
                      {itemErrors.safeStock}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    单价 (元)
                  </label>
                  <input
                    type="number"
                    value={itemForm.unitPrice}
                    onChange={(e) =>
                      setItemForm({
                        ...itemForm,
                        unitPrice: Number(e.target.value),
                      })
                    }
                    min="0"
                    max={MAX_UNIT_PRICE}
                    step="0.01"
                    className={cn(
                      'input-field',
                      itemErrors.unitPrice && 'border-red-300 focus:ring-red-500'
                    )}
                  />
                  {itemErrors.unitPrice && (
                    <p className="text-xs text-red-500 mt-1">
                      {itemErrors.unitPrice}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    供应商
                  </label>
                  <input
                    type="text"
                    value={itemForm.supplier}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, supplier: e.target.value })
                    }
                    placeholder="可选"
                    className="input-field"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowItemModal(false)}
                className="btn-ghost"
              >
                取消
              </button>
              <button type="button" onClick={handleItemSubmit} className="btn-primary">
                {editingItem ? '保存修改' : '确认新增'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showTransactionModal && selectedTransactionItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-fade-in-up">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-primary-900">
                {transactionType} - {selectedTransactionItem.name}
              </h3>
              <button
                type="button"
                onClick={() => setShowTransactionModal(false)}
                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">分类：</span>
                    <span className="text-gray-800">
                      {selectedTransactionItem.category}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">规格：</span>
                    <span className="text-gray-800">
                      {selectedTransactionItem.spec}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">当前库存：</span>
                    <span
                      className={cn(
                        'font-semibold',
                        selectedTransactionItem.stock <
                          selectedTransactionItem.safeStock
                          ? 'text-orange-600'
                          : 'text-gray-800'
                      )}
                    >
                      {selectedTransactionItem.stock}{' '}
                      {selectedTransactionItem.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">安全库存：</span>
                    <span className="text-gray-800">
                      {selectedTransactionItem.safeStock}{' '}
                      {selectedTransactionItem.unit}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  交易类型
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {STOCK_TRANSACTION_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTransactionType(t)}
                      className={cn(
                        'px-3 py-2 rounded-lg text-sm font-medium border transition-colors',
                        transactionType === t
                          ? 'bg-primary-100 border-primary-300 text-primary-800'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {transactionType === '盘点' ? '盘点后数量' : '数量'}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={transactionForm.quantity}
                  onChange={(e) =>
                    setTransactionForm({
                      ...transactionForm,
                      quantity: e.target.value,
                    })
                  }
                  placeholder={
                    transactionType === '盘点'
                      ? '请输入盘点后库存数量'
                      : '请输入数量'
                  }
                  min="0"
                  max={MAX_STOCK_QUANTITY}
                  className={cn(
                    'input-field',
                    transactionErrors.quantity &&
                      'border-red-300 focus:ring-red-500'
                  )}
                />
                {transactionErrors.quantity && (
                  <p className="text-xs text-red-500 mt-1">
                    {transactionErrors.quantity}
                  </p>
                )}
              </div>
              {transactionType === '入库' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    入库单价 (元)
                    <span className="text-gray-400 text-xs ml-1">
                      留空使用原价
                    </span>
                  </label>
                  <input
                    type="number"
                    value={transactionForm.unitPrice}
                    onChange={(e) =>
                      setTransactionForm({
                        ...transactionForm,
                        unitPrice: e.target.value,
                      })
                    }
                    placeholder={formatCurrency(selectedTransactionItem.unitPrice)}
                    min="0"
                    max={MAX_UNIT_PRICE}
                    step="0.01"
                    className={cn(
                      'input-field',
                      transactionErrors.unitPrice &&
                        'border-red-300 focus:ring-red-500'
                    )}
                  />
                  {transactionErrors.unitPrice && (
                    <p className="text-xs text-red-500 mt-1">
                      {transactionErrors.unitPrice}
                    </p>
                  )}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  备注
                </label>
                <textarea
                  value={transactionForm.remark}
                  onChange={(e) =>
                    setTransactionForm({
                      ...transactionForm,
                      remark: e.target.value,
                    })
                  }
                  placeholder="选填"
                  rows={2}
                  className="input-field resize-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowTransactionModal(false)}
                className="btn-ghost"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleTransactionSubmit}
                className={cn(
                  'btn-primary',
                  transactionType === '入库' || transactionType === '退货'
                    ? 'bg-green-600 hover:bg-green-700'
                    : transactionType === '出库' || transactionType === '领用'
                    ? 'bg-red-600 hover:bg-red-700'
                    : ''
                )}
              >
                确认{transactionType}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
