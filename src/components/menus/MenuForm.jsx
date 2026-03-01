import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Plus, Trash2, Image as ImageIcon, Search, ChefHat } from 'lucide-react';

// ---- 統合オートコンプリート（調達食材 + 仕込食材） ----
const UnifiedAutocomplete = ({ value, availableIngredients, prepIngredients, onChange }) => {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    // 統合リスト作成
    const allItems = [
        ...availableIngredients.map(i => ({
            id: i.id,
            name: i.name,
            type: 'ingredient',
            detail: `¥${i.price}/${i.capacity}${i.unit}`,
            unit: i.unit,
        })),
        ...prepIngredients.map(p => ({
            id: `prep:${p.id}`,
            name: p.name,
            type: 'prep',
            detail: `${p.yieldAmount}${p.yieldUnit}`,
            unit: p.yieldUnit,
        })),
    ];

    const selectedItem = allItems.find(i => i.id === value);

    useEffect(() => {
        if (selectedItem) setQuery(selectedItem.name);
    }, [value, selectedItem]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setIsOpen(false);
                if (selectedItem) setQuery(selectedItem.name);
                else setQuery('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [selectedItem]);

    const filtered = allItems.filter(item =>
        item.name.toLowerCase().includes(query.toLowerCase())
    );

    const handleSelect = (item) => {
        onChange(item.id);
        setQuery(item.name);
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
                        filtered.map(item => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => handleSelect(item)}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-orange-50 transition-colors flex justify-between items-center ${item.id === value ? 'bg-orange-50 text-orange-700 font-medium' : 'text-stone-700'
                                    }`}
                            >
                                <span className="flex items-center gap-1.5">
                                    {item.type === 'prep' && <ChefHat size={12} className="text-orange-400" />}
                                    {item.name}
                                    {item.type === 'prep' && <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-bold">仕込</span>}
                                </span>
                                <span className="text-xs text-stone-400 ml-2">{item.detail}</span>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

const MenuForm = ({ initialData, availableIngredients, prepIngredients = [], categories, onSave, onCancel }) => {
    const defaultCategory = categories.length > 0 ? categories[0].name : '';

    const [formData, setFormData] = useState({
        name: '',
        category: defaultCategory,
        sellingPrice: '',
        image: '',
        menuIngredients: [], // { tempId, ingredientId, usedAmount }
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                category: initialData.category || defaultCategory,
                sellingPrice: initialData.sellingPrice || '',
                image: initialData.image || '',
                menuIngredients: initialData.ingredients ? initialData.ingredients.map(i => ({
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

    const addMenuIngredient = () => {
        setFormData(prev => ({
            ...prev,
            menuIngredients: [
                ...prev.menuIngredients,
                { tempId: crypto.randomUUID(), ingredientId: '', usedAmount: '' }
            ]
        }));
    };

    const removeMenuIngredient = (tempId) => {
        setFormData(prev => ({
            ...prev,
            menuIngredients: prev.menuIngredients.filter(item => item.tempId !== tempId)
        }));
    };

    const handleIngredientChange = (tempId, field, value) => {
        setFormData(prev => ({
            ...prev,
            menuIngredients: prev.menuIngredients.map(item =>
                item.tempId === tempId ? { ...item, [field]: value } : item
            )
        }));
    };

    // 画像アップロード処理
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const img = new Image();
            img.onload = () => {
                const MAX_SIZE = 800;
                let { width, height } = img;
                if (width > height) {
                    if (width > MAX_SIZE) { height = Math.round(height * MAX_SIZE / width); width = MAX_SIZE; }
                } else {
                    if (height > MAX_SIZE) { width = Math.round(width * MAX_SIZE / height); height = MAX_SIZE; }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                const compressed = canvas.toDataURL('image/jpeg', 0.7);
                setFormData(prev => ({ ...prev, image: compressed }));
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    };

    // 食材の単価を取得するヘルパー
    const getItemInfo = (ingredientId) => {
        // 仕込食材の場合 (prep:xxxの形式)
        if (ingredientId.startsWith('prep:')) {
            const prepId = ingredientId.replace('prep:', '');
            const prep = prepIngredients.find(p => p.id === prepId);
            if (!prep) return null;
            // 仕込食材の原価を計算
            const prepCost = prep.ingredients.reduce((sum, item) => {
                const ing = availableIngredients.find(i => i.id === item.ingredientId);
                if (!ing) return sum;
                return sum + (ing.price / ing.capacity) * item.usedAmount;
            }, 0);
            const unitPrice = prep.yieldAmount > 0 ? prepCost / prep.yieldAmount : 0;
            return { unitPrice, unit: prep.yieldUnit, name: prep.name, type: 'prep' };
        }
        // 調達食材の場合
        const ing = availableIngredients.find(i => i.id === ingredientId);
        if (!ing) return null;
        return { unitPrice: ing.price / ing.capacity, unit: ing.unit, name: ing.name, type: 'ingredient' };
    };

    // リアルタイム原価計算
    const totalCost = formData.menuIngredients.reduce((sum, item) => {
        if (!item.ingredientId || !item.usedAmount) return sum;
        const info = getItemInfo(item.ingredientId);
        if (!info) return sum;
        return sum + info.unitPrice * Number(item.usedAmount);
    }, 0);

    const costRate = Number(formData.sellingPrice) > 0
        ? (totalCost / Number(formData.sellingPrice)) * 100
        : 0;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name) return;

        const validIngredients = formData.menuIngredients
            .filter(i => i.ingredientId && i.usedAmount)
            .map(i => ({
                ingredientId: i.ingredientId,
                usedAmount: Number(i.usedAmount)
            }));

        onSave({
            name: formData.name,
            category: formData.category,
            sellingPrice: Number(formData.sellingPrice) || 0,
            image: formData.image,
            ingredients: validIngredients,
        });
    };

    return (
        <div className="bg-white rounded-2xl shadow-md border border-stone-200 overflow-hidden mb-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-theme-sidebar/30">
                <h3 className="font-bold text-stone-800">
                    {initialData ? 'メニューを編集' : '新規メニューを作成'}
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

                        {/* 商品画像 */}
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">商品画像</label>
                            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
                                {formData.image ? (
                                    <div className="relative w-48 h-48 rounded-2xl overflow-hidden border border-stone-200 shadow-sm flex-shrink-0">
                                        <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                                            className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-2 hover:bg-black/80 transition-colors"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-48 h-48 rounded-2xl border-2 border-dashed border-stone-300 flex flex-col items-center justify-center text-stone-400 bg-stone-50 flex-shrink-0 hover:bg-stone-100 transition-colors">
                                        <ImageIcon size={40} className="mb-3 opacity-40" />
                                        <span className="text-sm font-medium">No Image</span>
                                    </div>
                                )}
                                <div className="flex-1 pb-2 w-full">
                                    <label className="block w-full text-center sm:text-left cursor-pointer">
                                        <span className="inline-block px-4 py-2 rounded-lg bg-orange-50 text-orange-600 font-semibold text-sm hover:bg-orange-100 transition-colors border border-orange-200 shadow-sm">
                                            画像を選択する
                                        </span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="hidden"
                                        />
                                    </label>
                                    <p className="text-xs text-stone-400 mt-3 text-center sm:text-left">JPEG, PNG等<br className="sm:hidden" />（※端末内に保存されます）</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">メニュー名</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="例: 特製ハンバーグ定食"
                                className="w-full rounded-lg border-stone-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-stone-800 p-2.5 border bg-white"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
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
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">販売価格（売価）</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        name="sellingPrice"
                                        min="0"
                                        value={formData.sellingPrice}
                                        onChange={handleChange}
                                        placeholder="0"
                                        className="w-full rounded-lg border-stone-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-stone-800 p-2.5 pl-8 border bg-white"
                                    />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 font-medium">¥</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 右カラム：構成食材 */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                            <h4 className="font-medium text-stone-800">使用食材リスト</h4>
                            <button
                                type="button"
                                onClick={addMenuIngredient}
                                className="text-xs flex items-center text-orange-600 hover:text-orange-700 font-medium"
                            >
                                <Plus size={14} className="mr-0.5" />
                                食材を追加
                            </button>
                        </div>

                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                            {formData.menuIngredients.length === 0 ? (
                                <p className="text-sm text-stone-400 text-center py-8 bg-stone-50 rounded-lg border border-dashed border-stone-200">
                                    使用する食材を追加してください<br />
                                    <span className="text-xs">調達食材・仕込食材の両方から選択できます</span>
                                </p>
                            ) : (
                                formData.menuIngredients.map((item) => {
                                    const info = item.ingredientId ? getItemInfo(item.ingredientId) : null;
                                    const unit = info ? info.unit : '';
                                    const cost = info && item.usedAmount
                                        ? (info.unitPrice * Number(item.usedAmount)).toFixed(2)
                                        : 0;

                                    return (
                                        <div key={item.tempId} className={`flex items-start gap-2 p-3 rounded-lg border ${info?.type === 'prep'
                                                ? 'bg-orange-50/50 border-orange-200'
                                                : 'bg-stone-50 border-stone-200'
                                            }`}>
                                            <div className="flex-1 space-y-2">
                                                <UnifiedAutocomplete
                                                    value={item.ingredientId}
                                                    availableIngredients={availableIngredients}
                                                    prepIngredients={prepIngredients}
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
                                                onClick={() => removeMenuIngredient(item.tempId)}
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
                                <div className="text-xs text-stone-500 mb-1">原価合計</div>
                                <div className="text-2xl font-bold text-stone-800">¥{totalCost.toFixed(2)}</div>
                            </div>

                            <div className="hidden sm:block h-10 w-px bg-stone-300"></div>

                            <div>
                                <div className="text-xs text-stone-500 mb-1">仕入・原価率（目安: 30%）</div>
                                <div className={`text-2xl font-bold ${costRate > 35 ? 'text-red-500' : costRate > 0 ? 'text-emerald-500' : 'text-stone-800'}`}>
                                    {costRate > 0 ? costRate.toFixed(1) : '---'}%
                                </div>
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
                                {initialData ? '更新する' : 'メニューを保存'}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default MenuForm;
