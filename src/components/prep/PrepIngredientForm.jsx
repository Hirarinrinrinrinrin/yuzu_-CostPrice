import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Plus, Trash2, Search } from 'lucide-react';

// ---- 食材オートコンプリートコンポーネント ----
const IngredientAutocomplete = ({ value, availableIngredients, onChange }) => {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    const selectedIngredient = availableIngredients.find(i => i.id === value);

    useEffect(() => {
        if (selectedIngredient) setQuery(selectedIngredient.name);
    }, [value, selectedIngredient]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setIsOpen(false);
                if (selectedIngredient) setQuery(selectedIngredient.name);
                else setQuery('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [selectedIngredient]);

    const filtered = availableIngredients.filter(ing =>
        ing.name.toLowerCase().includes(query.toLowerCase())
    );

    const handleSelect = (ing) => {
        onChange(ing.id);
        setQuery(ing.name);
        setIsOpen(false);
    };

    return (
        <div ref={wrapperRef} className="relative">
            <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setIsOpen(true); if (!e.target.value) onChange(''); }}
                    onFocus={() => { setIsOpen(true); setQuery(''); }}
                    placeholder="食材名を入力..."
                    className="w-full text-sm rounded-md border-stone-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-stone-800 p-2 pl-8 border bg-white"
                />
            </div>
            {isOpen && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-stone-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filtered.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-stone-400">該当する食材がありません</div>
                    ) : (
                        filtered.map(ing => (
                            <button
                                key={ing.id}
                                type="button"
                                onClick={() => handleSelect(ing)}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-orange-50 transition-colors flex justify-between items-center ${ing.id === value ? 'bg-orange-50 text-orange-700 font-medium' : 'text-stone-700'
                                    }`}
                            >
                                <span>{ing.name}</span>
                                <span className="text-xs text-stone-400 ml-2">¥{ing.price}/{ing.capacity}{ing.unit}</span>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

// ---- メインフォーム ----
const PrepIngredientForm = ({ initialData, availableIngredients, categories = [], onSave, onCancel }) => {
    const defaultCategory = categories.length > 0 ? categories[0].name : '';

    const [formData, setFormData] = useState({
        name: '',
        category: defaultCategory,
        yieldAmount: '',
        yieldUnit: 'g',
        ingredients: [],
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                category: initialData.category || defaultCategory,
                yieldAmount: initialData.yieldAmount || '',
                yieldUnit: initialData.yieldUnit || 'g',
                ingredients: initialData.ingredients ? initialData.ingredients.map(i => ({
                    ...i,
                    tempId: crypto.randomUUID()
                })) : [],
            });
        }
    }, [initialData, defaultCategory]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const addIngredient = () => {
        setFormData(prev => ({
            ...prev,
            ingredients: [
                ...prev.ingredients,
                { tempId: crypto.randomUUID(), ingredientId: '', usedAmount: '' }
            ]
        }));
    };

    const removeIngredient = (tempId) => {
        setFormData(prev => ({
            ...prev,
            ingredients: prev.ingredients.filter(item => item.tempId !== tempId)
        }));
    };

    const handleIngredientChange = (tempId, field, value) => {
        setFormData(prev => ({
            ...prev,
            ingredients: prev.ingredients.map(item =>
                item.tempId === tempId ? { ...item, [field]: value } : item
            )
        }));
    };

    // 原価計算
    const totalCost = formData.ingredients.reduce((sum, item) => {
        const ingredient = availableIngredients.find(i => i.id === item.ingredientId);
        if (!ingredient || !item.usedAmount) return sum;
        return sum + (ingredient.price / ingredient.capacity) * Number(item.usedAmount);
    }, 0);

    const costPerUnit = formData.yieldAmount > 0 ? totalCost / Number(formData.yieldAmount) : 0;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name) return;

        const validIngredients = formData.ingredients
            .filter(i => i.ingredientId && i.usedAmount)
            .map(i => ({ ingredientId: i.ingredientId, usedAmount: Number(i.usedAmount) }));

        onSave({
            name: formData.name,
            category: formData.category,
            yieldAmount: Number(formData.yieldAmount) || 0,
            yieldUnit: formData.yieldUnit,
            ingredients: validIngredients,
        });
    };

    return (
        <div className="bg-white rounded-2xl shadow-md border border-stone-200 overflow-hidden mb-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-theme-sidebar/30">
                <h3 className="font-bold text-stone-800">
                    {initialData ? '仕込食材を編集' : '新規仕込食材を作成'}
                </h3>
                <button onClick={onCancel} className="text-stone-400 hover:text-stone-600 transition-colors">
                    <X size={20} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* 左カラム：基本情報 */}
                    <div className="space-y-6">
                        <h4 className="font-medium text-stone-800 border-b border-stone-100 pb-2">基本情報</h4>
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">仕込食材名</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="例: パスタソース"
                                className="w-full rounded-lg border-stone-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-stone-800 p-2.5 border bg-white"
                                required
                            />
                        </div>
                        {categories.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">カテゴリー</label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border-stone-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-stone-800 p-2.5 border bg-white"
                                >
                                    {categories.map(c => (
                                        <option key={c.id} value={c.name}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">完成量</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    name="yieldAmount"
                                    min="0.01"
                                    step="0.01"
                                    value={formData.yieldAmount}
                                    onChange={handleChange}
                                    placeholder="0"
                                    className="flex-1 rounded-lg border-stone-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-stone-800 p-2.5 border bg-white"
                                />
                                <select
                                    name="yieldUnit"
                                    value={formData.yieldUnit}
                                    onChange={handleChange}
                                    className="w-24 font-medium rounded-lg border-stone-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-stone-800 p-2.5 border bg-white"
                                >
                                    {['g', 'ml', '人前'].map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* 右カラム：使用食材 */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                            <h4 className="font-medium text-stone-800">使用食材リスト</h4>
                            <button
                                type="button"
                                onClick={addIngredient}
                                className="text-xs flex items-center text-orange-600 hover:text-orange-700 font-medium"
                            >
                                <Plus size={14} className="mr-0.5" />
                                食材を追加
                            </button>
                        </div>

                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                            {formData.ingredients.length === 0 ? (
                                <p className="text-sm text-stone-400 text-center py-8 bg-stone-50 rounded-lg border border-dashed border-stone-200">
                                    使用する食材を追加してください
                                </p>
                            ) : (
                                formData.ingredients.map((item) => {
                                    const selectedIng = availableIngredients.find(i => i.id === item.ingredientId);
                                    const unit = selectedIng ? selectedIng.unit : '';
                                    const cost = selectedIng && item.usedAmount
                                        ? ((selectedIng.price / selectedIng.capacity) * Number(item.usedAmount)).toFixed(2)
                                        : 0;

                                    return (
                                        <div key={item.tempId} className="flex items-start gap-2 p-3 bg-stone-50 rounded-lg border border-stone-200">
                                            <div className="flex-1 space-y-2">
                                                <IngredientAutocomplete
                                                    value={item.ingredientId}
                                                    availableIngredients={availableIngredients}
                                                    onChange={(id) => handleIngredientChange(item.tempId, 'ingredientId', id)}
                                                />
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            min="0.01"
                                                            step="0.01"
                                                            value={item.usedAmount}
                                                            onChange={(e) => handleIngredientChange(item.tempId, 'usedAmount', e.target.value)}
                                                            placeholder="使用量"
                                                            className="w-24 text-sm rounded-md border-stone-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-stone-800 p-1.5 border bg-white"
                                                        />
                                                        <span className="text-sm text-stone-500">{unit}</span>
                                                    </div>
                                                    <div className="text-sm text-stone-500">
                                                        小計: <span className="font-medium text-stone-700">¥{cost}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeIngredient(item.tempId)}
                                                className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-stone-200 rounded-md transition-colors mt-0.5"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* 下部：計算結果＆保存 */}
                <div className="mt-8 pt-6 border-t border-stone-200 bg-stone-50 -mx-6 -mb-6 px-6 pb-6 rounded-b-2xl">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
                            <div>
                                <div className="text-xs text-stone-500 mb-1">仕込原価合計</div>
                                <div className="text-2xl font-bold text-stone-800">¥{totalCost.toFixed(2)}</div>
                            </div>
                            <div className="hidden sm:block h-10 w-px bg-stone-300"></div>
                            <div>
                                <div className="text-xs text-stone-500 mb-1">1{formData.yieldUnit}あたりの原価</div>
                                <div className="text-2xl font-bold text-orange-600">¥{costPerUnit.toFixed(2)}</div>
                            </div>
                        </div>

                        <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="flex-1 md:flex-none px-6 py-2.5 text-stone-600 bg-white border border-stone-300 hover:bg-stone-50 rounded-lg font-medium transition-colors"
                            >
                                キャンセル
                            </button>
                            <button
                                type="submit"
                                className="flex-1 md:flex-none flex items-center justify-center px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors shadow-sm"
                            >
                                <Save size={18} className="mr-2" />
                                {initialData ? '更新する' : '仕込食材を保存'}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default PrepIngredientForm;
