import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Package } from 'lucide-react';
import { getIngredients, addIngredient, updateIngredient, deleteIngredient, getCategories } from '../lib/db';
import IngredientForm from '../components/ingredients/IngredientForm';

const Ingredients = () => {
    const [ingredients, setIngredients] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [ingData, catData] = await Promise.all([getIngredients(), getCategories()]);
        setIngredients(ingData);
        setCategories(catData);
    };

    const handleSave = async (ingredientData) => {
        if (editingItem) {
            await updateIngredient(editingItem.id, ingredientData);
            setEditingItem(null);
            setIsFormOpen(false); // 編集時は閉じる
        } else {
            await addIngredient(ingredientData);
            // 新規時は連続登録のためフォームは開いたまま（フォーム内で名前だけクリアする）
        }
        loadData();
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setIsFormOpen(true);
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

    return (
        <div className="p-4 lg:p-8">
            <div className="max-w-5xl mx-auto space-y-6">
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
                    {ingredients.length === 0 ? (
                        <div className="text-center py-16 text-stone-400">
                            <Package size={48} className="mx-auto mb-4 opacity-20" />
                            <p>登録されている食材がありません。</p>
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
                                    {ingredients.map((item) => {
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
    );
};

export default Ingredients;
