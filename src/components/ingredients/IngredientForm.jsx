import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { getCategories } from '../../lib/db';

const UNITS = ['g', 'ml', '個'];

const IngredientForm = ({ initialData, onSave, onCancel }) => {
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        capacity: '',
        unit: 'g',
        categoryId: '',
    });

    useEffect(() => {
        const loadCategories = async () => {
            const cats = await getCategories();
            setCategories(cats);
        };
        loadCategories();
    }, []);

    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({
                ...prev,
                name: initialData.name,
                price: initialData.price,
                capacity: initialData.capacity,
                unit: initialData.unit,
                categoryId: initialData.categoryId || (categories.length > 0 ? categories[0].id : ''),
            }));
        } else if (categories.length > 0) {
            // 新規作成時、categoryIdが空の場合のみ初期値を設定
            setFormData(prev => {
                if (!prev.categoryId) {
                    return { ...prev, categoryId: categories[0].id };
                }
                return prev;
            });
        }
    }, [initialData, categories]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name || !formData.price || !formData.capacity) return;

        onSave({
            name: formData.name,
            categoryId: formData.categoryId,
            price: Number(formData.price),
            capacity: Number(formData.capacity),
            unit: formData.unit,
        });

        if (!initialData) {
            // 連続登録しやすくするため、フォームをリセットせずに容量などは残す
            setFormData(prev => ({ ...prev, name: '' }));
            document.getElementById('name-input')?.focus();
        }
    };

    // 1単位あたりの単価プレビュー
    const unitPrice = formData.price && formData.capacity
        ? (Number(formData.price) / Number(formData.capacity)).toFixed(2)
        : '0.00';

    return (
        <div className="bg-white rounded-2xl shadow-md border border-stone-200 overflow-hidden mb-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-theme-sidebar/30">
                <h3 className="font-bold text-stone-800">
                    {initialData ? '食材を編集' : '新規食材を追加'}
                </h3>
                <button onClick={onCancel} className="text-stone-400 hover:text-stone-600">
                    <X size={20} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">食材名</label>
                            <input
                                id="name-input"
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="例: 玉ねぎ"
                                className="w-full rounded-lg border-stone-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-stone-800 p-2.5 border bg-white"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">カテゴリー</label>
                            <select
                                name="categoryId"
                                value={formData.categoryId}
                                onChange={handleChange}
                                className="w-full rounded-lg border-stone-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-stone-800 p-2.5 border bg-white"
                            >
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">仕入価格（円）</label>
                        <div className="relative">
                            <input
                                type="number"
                                name="price"
                                min="0"
                                step="0.1"
                                value={formData.price}
                                onChange={handleChange}
                                placeholder="0"
                                className="w-full rounded-lg border-stone-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-stone-800 p-2.5 pl-8 border bg-white"
                                required
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 font-medium">¥</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">仕入容量</label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                name="capacity"
                                min="0.1"
                                step="0.1"
                                value={formData.capacity}
                                onChange={handleChange}
                                placeholder="0"
                                className="flex-1 rounded-lg border-stone-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-stone-800 p-2.5 border bg-white"
                                required
                            />
                            <select
                                name="unit"
                                value={formData.unit}
                                onChange={handleChange}
                                className="w-24 rounded-lg border-stone-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-stone-800 p-2.5 border bg-white"
                            >
                                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-stone-100 pt-6">
                    <div className="text-sm text-stone-500">
                        計算単価: <span className="font-bold text-orange-600 text-lg ml-1">¥{unitPrice}</span> / {formData.unit}
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg font-medium transition-colors"
                        >
                            キャンセル
                        </button>
                        <button
                            type="submit"
                            className="flex items-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors shadow-sm"
                        >
                            <Save size={18} className="mr-2" />
                            {initialData ? '更新する' : '保存して次へ'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default IngredientForm;
