import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Package, Copy } from 'lucide-react';
import { getIngredients, addIngredient, updateIngredient, deleteIngredient, getCategories } from '../lib/db';
import IngredientForm from '../components/ingredients/IngredientForm';

const Ingredients = () => {
    const [ingredients, setIngredients] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [activeTab, setActiveTab] = useState('すべて');
    const [toast, setToast] = useState(null); // { message, type }

    const loadData = async () => {
        const [ingData, catData] = await Promise.all([getIngredients(), getCategories()]);
        setIngredients(ingData);
        setCategories(catData);
    };

    useEffect(() => {
        // eslint-disable-next-line
        loadData();
    }, []);

    const showToast = (message) => {
        setToast(message);
        setTimeout(() => setToast(null), 2500);
    };

    const handleSave = async (ingredientData) => {
        if (editingItem) {
            await updateIngredient(editingItem.id, ingredientData);
            setEditingItem(null);
            setIsFormOpen(false);
            showToast(`「${ingredientData.name}」を更新しました`);
        } else {
            await addIngredient(ingredientData);
            showToast(`「${ingredientData.name}」を登録しました ✓`);
            // 新規時は連続登録のためフォームは開いたまま（フォーム内で名前だけクリアする）
        }
        loadData();
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setIsFormOpen(true);
    };

    const handleDuplicate = async (item) => {
        if (window.confirm(`「${item.name}」を複製しますか？`)) {
            const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...ingredientDataToCopy } = item;
            const duplicatedIngredientData = {
                ...ingredientDataToCopy,
                name: `${item.name} - コピー`
            };
            await addIngredient(duplicatedIngredientData);
            loadData();
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('この食材を削除してもよろしいですか？')) {
            await deleteIngredient(id);
            loadData();
        }
    };

    const handleCancelForm = () => {
        setIsFormOpen(false);
        setEditingItem(null);
    };

    const TABS = ['すべて', ...categories.map(c => c.name)];

    const filteredIngredients = activeTab === 'すべて'
        ? ingredients
        : ingredients.filter(i => {
            const category = categories.find(c => c.id === i.categoryId);
            return category && category.name === activeTab;
        });

    return (
        <div className="flex flex-col min-h-full pb-10">
            {/* トースト通知 */}
            {toast && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg font-medium text-sm animate-bounce-in flex items-center gap-2">
                    <span>✓</span> {toast}
                </div>
            )}
            <div className="bg-theme-sidebar px-4 pt-4 lg:px-8 lg:pt-8 border-b border-stone-200 sticky top-0 z-10">
                <div className="w-full">
                    <nav className="-mb-px flex space-x-6 overflow-x-auto no-scrollbar">
                        {TABS.map((tab) => {
                            const count = tab === 'すべて'
                                ? ingredients.length
                                : ingredients.filter(i => {
                                    const c = categories.find(cat => cat.id === i.categoryId);
                                    return c && c.name === tab;
                                }).length;

                            return (
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
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>

            <div className="flex-1 p-4 lg:p-8">
                <div className="w-full space-y-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold tracking-tight text-stone-800">食材管理</h1>
                        {!isFormOpen && (
                            <button
                                onClick={() => setIsFormOpen(true)}
                                className="flex items-center bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                            >
                                <Plus size={18} className="mr-1" />
                                食材を追加
                            </button>
                        )}
                    </div>

                    {isFormOpen && (
                        <IngredientForm
                            initialData={editingItem}
                            onSave={handleSave}
                            onCancel={handleCancelForm}
                        />
                    )}

                    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                        {filteredIngredients.length === 0 ? (
                            <div className="text-center py-16 text-stone-400">
                                <Package size={48} className="mx-auto mb-4 opacity-20" />
                                <p>このカテゴリーには食材が登録されていません。</p>
                                <p className="text-sm mt-2 opacity-80">「食材を追加」ボタンから仕入れた食材を登録してください。</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-stone-50 border-b border-stone-200 text-sm text-stone-500">
                                            <th className="px-6 py-4 font-medium">カテゴリー</th>
                                            <th className="px-6 py-4 font-medium">食材名</th>
                                            <th className="px-6 py-4 font-medium">仕入価格</th>
                                            <th className="px-6 py-4 font-medium">容量</th>
                                            <th className="px-6 py-4 font-medium">計算単価</th>
                                            <th className="px-6 py-4 font-medium text-right">操作</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-100">
                                        {filteredIngredients.map((item) => {
                                            const category = categories.find(c => c.id === item.categoryId);
                                            return (
                                                <tr key={item.id} className="hover:bg-orange-50/30 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        {category ? (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-800">
                                                                {category.name}
                                                            </span>
                                                        ) : (
                                                            <span className="text-stone-300 text-xs">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 font-medium text-stone-800 flex items-center">
                                                        {item.name}
                                                    </td>
                                                    <td className="px-6 py-4 text-stone-600">¥{item.price.toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-stone-600">{item.capacity}{item.unit}</td>
                                                    <td className="px-6 py-4 font-medium text-orange-600">
                                                        ¥{(item.price / item.capacity).toFixed(2)}<span className="text-xs text-stone-400 ml-1 font-normal">/{item.unit}</span>
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

export default Ingredients;
