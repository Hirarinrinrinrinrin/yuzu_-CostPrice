import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Package, Copy, ChefHat } from 'lucide-react';
import { getPrepIngredients, addPrepIngredient, updatePrepIngredient, deletePrepIngredient, getIngredients, getPrepCategories } from '../lib/db';
import PrepIngredientForm from '../components/prep/PrepIngredientForm';

const PrepIngredients = () => {
    const [prepIngredients, setPrepIngredients] = useState([]);
    const [ingredients, setIngredients] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [toast, setToast] = useState(null);
    const [activeTab, setActiveTab] = useState('すべて');

    const loadData = async () => {
        const [prepData, ingData, catData] = await Promise.all([getPrepIngredients(), getIngredients(), getPrepCategories()]);
        setPrepIngredients(prepData);
        setIngredients(ingData);
        setCategories(catData);
    };

    useEffect(() => {
        loadData();
    }, []);

    const showToast = (message) => {
        setToast(message);
        setTimeout(() => setToast(null), 2500);
    };

    const handleSave = async (data) => {
        if (editingItem) {
            await updatePrepIngredient(editingItem.id, data);
            setEditingItem(null);
            setIsFormOpen(false);
            showToast(`「${data.name}」を更新しました`);
        } else {
            await addPrepIngredient(data);
            showToast(`「${data.name}」を登録しました ✓`);
        }
        loadData();
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setIsFormOpen(true);
    };

    const handleDuplicate = async (item) => {
        if (window.confirm(`「${item.name}」を複製しますか？`)) {
            const { id: _id, createdAt: _c, updatedAt: _u, ...dataToCopy } = item;
            await addPrepIngredient({ ...dataToCopy, name: `${item.name} - コピー` });
            loadData();
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('この仕込食材を削除してもよろしいですか？')) {
            await deletePrepIngredient(id);
            loadData();
        }
    };

    const handleCancelForm = () => {
        setIsFormOpen(false);
        setEditingItem(null);
    };

    // 仕込食材の原価を計算
    const calcCost = (prepItem) => {
        return prepItem.ingredients.reduce((sum, item) => {
            const ing = ingredients.find(i => i.id === item.ingredientId);
            if (!ing) return sum;
            return sum + (ing.price / ing.capacity) * item.usedAmount;
        }, 0);
    };

    // フィルタリング
    const TABS = ['すべて', ...categories.map(c => c.name)];
    const filteredItems = activeTab === 'すべて'
        ? prepIngredients
        : prepIngredients.filter(item => item.category === activeTab);

    return (
        <div className="flex flex-col min-h-full pb-10">
            {/* トースト通知 */}
            {toast && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg font-medium text-sm animate-bounce-in flex items-center gap-2">
                    <span>✓</span> {toast}
                </div>
            )}

            {/* カテゴリータブ */}
            <div className="bg-theme-sidebar px-4 pt-4 lg:px-8 lg:pt-8 border-b border-stone-200 sticky top-0 z-10">
                <div className="w-full">
                    <nav className="-mb-px flex space-x-6 overflow-x-auto no-scrollbar">
                        {TABS.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab
                                    ? 'border-orange-500 text-orange-600'
                                    : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
                                    }`}
                            >
                                {tab}
                                <span className="ml-2 py-0.5 px-2 bg-stone-100 text-stone-500 rounded-full text-xs">
                                    {tab === 'すべて' ? prepIngredients.length : prepIngredients.filter(i => i.category === tab).length}
                                </span>
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            <div className="flex-1 p-4 lg:p-8">
                <div className="w-full space-y-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold tracking-tight text-stone-800">仕込食材管理</h1>
                        {!isFormOpen && (
                            <button
                                onClick={() => setIsFormOpen(true)}
                                className="flex items-center bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                            >
                                <Plus size={18} className="mr-1" />
                                仕込食材を追加
                            </button>
                        )}
                    </div>

                    {isFormOpen && (
                        <PrepIngredientForm
                            initialData={editingItem}
                            availableIngredients={ingredients}
                            categories={categories}
                            onSave={handleSave}
                            onCancel={handleCancelForm}
                        />
                    )}

                    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                        {filteredItems.length === 0 ? (
                            <div className="text-center py-16 text-stone-400">
                                <ChefHat size={48} className="mx-auto mb-4 opacity-20" />
                                <p>仕込食材が登録されていません。</p>
                                <p className="text-sm mt-2 opacity-80">「仕込食材を追加」ボタンからパスタソースなどの仕込食材を登録してください。</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-stone-50 border-b border-stone-200 text-sm text-stone-500">
                                            <th className="px-6 py-4 font-medium">仕込食材名</th>
                                            <th className="px-6 py-4 font-medium">完成量</th>
                                            <th className="px-6 py-4 font-medium">食材数</th>
                                            <th className="px-6 py-4 font-medium">仕込原価</th>
                                            <th className="px-6 py-4 font-medium">単価</th>
                                            <th className="px-6 py-4 font-medium text-right">操作</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-100">
                                        {filteredItems.map((item) => {
                                            const totalCost = calcCost(item);
                                            const unitCost = item.yieldAmount > 0 ? totalCost / item.yieldAmount : 0;
                                            return (
                                                <tr key={item.id} className="hover:bg-orange-50/30 transition-colors group">
                                                    <td className="px-6 py-4 font-medium text-stone-800">
                                                        <div className="flex items-center gap-2">
                                                            <ChefHat size={16} className="text-orange-400" />
                                                            {item.name}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-stone-600">{item.yieldAmount}{item.yieldUnit}</td>
                                                    <td className="px-6 py-4 text-stone-600">{item.ingredients.length}種類</td>
                                                    <td className="px-6 py-4 text-stone-600">¥{totalCost.toFixed(0)}</td>
                                                    <td className="px-6 py-4 font-medium text-orange-600">
                                                        ¥{unitCost.toFixed(2)}<span className="text-xs text-stone-400 ml-1 font-normal">/{item.yieldUnit}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => handleEdit(item)}
                                                                className="p-2 text-stone-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                                                                title="編集"
                                                            >
                                                                <Edit2 size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDuplicate(item)}
                                                                className="p-2 text-stone-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                                                                title="複製"
                                                            >
                                                                <Copy size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(item.id)}
                                                                className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="削除"
                                                            >
                                                                <Trash2 size={18} />
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
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrepIngredients;
