import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Plus, Trash2, Image as ImageIcon, Search } from 'lucide-react';

// ---- 食材オートコンプリートコンポーネント ----
const IngredientAutocomplete = ({ value, availableIngredients, onChange }) => {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    // 選択済みの食材名を表示
    const selectedIngredient = availableIngredients.find(i => i.id === value);

    useEffect(() => {
        if (selectedIngredient) {
            setQuery(selectedIngredient.name);
        }
    }, [value, selectedIngredient]);

    // 外側クリックで候補を閉じる
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

    const handleInputChange = (e) => {
        setQuery(e.target.value);
        setIsOpen(true);
        if (!e.target.value) onChange('');
    };

    const handleFocus = () => {
        setIsOpen(true);
        setQuery('');
    };

    return (
        <div ref={wrapperRef} className="relative">
            <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={handleFocus}
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

const MenuForm = ({ initialData, availableIngredients, categories, onSave, onCancel }) => {
    const defaultCategory = categories.length > 0 ? categories[0].name : '';

    const [formData, setFormData] = useState({
        name: '',
        category: defaultCategory,
        sellingPrice: '',
        image: '',
        menuIngredients: [], // { tempId: string, ingredientId: string, usedAmount: number|string }
        isPortioned: false,
        yieldAmount: 1,
        yieldUnit: '人前',
        portionType: 'cut',
        portionAmount: 1,
    });

    useEffect(() => {
        if (initialData) {
            // eslint-disable-next-line
            setFormData({
                name: initialData.name || '',
                category: initialData.category || defaultCategory,
                sellingPrice: initialData.sellingPrice || '',
                image: initialData.image || '',
                menuIngredients: initialData.ingredients ? initialData.ingredients.map(i => ({
                    ...i,
                    tempId: crypto.randomUUID()
                })) : [],
                isPortioned: initialData.isPortioned || false,
                yieldAmount: initialData.yieldAmount || 1,
                yieldUnit: initialData.yieldUnit || '人前',
                portionType: initialData.portionType || 'cut',
                portionAmount: initialData.portionAmount || 1,
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

    // 画像アップロード処理（Canvas APIでリサイズ・圧縮してからBase64保存）
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const img = new Image();
            img.onload = () => {
                const MAX_SIZE = 800;
                let { width, height } = img;

                // アスペクト比を維持しながら最大800pxにリサイズ
                if (width > height) {
                    if (width > MAX_SIZE) { height = Math.round(height * MAX_SIZE / width); width = MAX_SIZE; }
                } else {
                    if (height > MAX_SIZE) { width = Math.round(width * MAX_SIZE / height); height = MAX_SIZE; }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);

                // JPEG品質70%で圧縮（スマホ写真 3〜15MB → 約100〜200KB）
                const compressed = canvas.toDataURL('image/jpeg', 0.7);
                setFormData(prev => ({ ...prev, image: compressed }));
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    };

    // リアルタイム計算
    const totalCost = formData.menuIngredients.reduce((sum, item) => {
        const ingredient = availableIngredients.find(i => i.id === item.ingredientId);
        if (!ingredient || !item.usedAmount) return sum;
        const unitPrice = ingredient.price / ingredient.capacity;
        return sum + (unitPrice * Number(item.usedAmount));
    }, 0);

    // 分配・量り売り計算
    let displayCost = totalCost;
    if (formData.isPortioned) {
        if (formData.portionType === 'cut') {
            displayCost = formData.portionAmount > 0 ? totalCost / Number(formData.portionAmount) : 0;
        } else if (formData.portionType === 'weight') {
            displayCost = formData.yieldAmount > 0 ? (totalCost / Number(formData.yieldAmount)) * Number(formData.portionAmount) : 0;
        }
    }

    const costRate = Number(formData.sellingPrice) > 0
        ? (displayCost / Number(formData.sellingPrice)) * 100
        : 0;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name) return;

        // Filter out incomplete ingredients
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
            isPortioned: formData.isPortioned,
            yieldAmount: Number(formData.yieldAmount),
            yieldUnit: formData.yieldUnit,
            portionType: formData.portionType,
            portionAmount: Number(formData.portionAmount),
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

                        {/* 商品画像（左上に大きく配置） */}
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

                        {/* 分配・量り売り設定（トグルスイッチ） */}
                        <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 shadow-sm mt-6 mb-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h5 className="font-bold text-stone-800 text-sm">分配・量り売り設定</h5>
                                    <p className="text-xs text-stone-500 mt-0.5">ホールケーキのカット売りに便利</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="isPortioned"
                                        checked={formData.isPortioned}
                                        onChange={(e) => setFormData(p => ({ ...p, isPortioned: e.target.checked }))}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                                </label>
                            </div>

                            {formData.isPortioned && (
                                <div className="mt-5 space-y-4 pt-4 border-t border-stone-200 animate-in fade-in slide-in-from-top-2 duration-200">
                                    {/* 【Step 2】完成品の分量設定 */}
                                    <div>
                                        <label className="block text-xs font-bold text-stone-700 mb-1">① 完成品の分量（全体量）</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                name="yieldAmount"
                                                min="0.1"
                                                step="0.01"
                                                value={formData.yieldAmount}
                                                onChange={handleChange}
                                                className="flex-1 rounded-lg border-stone-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-stone-800 p-2 border bg-white text-sm"
                                            />
                                            <select
                                                name="yieldUnit"
                                                value={formData.yieldUnit}
                                                onChange={handleChange}
                                                className="w-24 font-medium rounded-lg border-stone-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-stone-800 p-2 border bg-white text-sm"
                                            >
                                                {['人前', 'g', 'ml'].map(u => <option key={u} value={u}>{u}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    {/* 【Step 3 & 4】販売形態と分割計算 */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-stone-700 mb-1">② 販売形態</label>
                                            <select
                                                name="portionType"
                                                value={formData.portionType}
                                                onChange={handleChange}
                                                className="w-full font-medium rounded-lg border-stone-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-stone-800 p-2 border bg-white text-sm"
                                            >
                                                <option value="cut">カット等分</option>
                                                <option value="weight">量り売り</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-stone-700 mb-1">
                                                {formData.portionType === 'cut' ? '③ カット数（等分）' : `③ 販売単位`}
                                            </label>
                                            <div className="flex gap-2 items-center">
                                                <input
                                                    type="number"
                                                    name="portionAmount"
                                                    min="0.1"
                                                    step="0.01"
                                                    value={formData.portionAmount}
                                                    onChange={handleChange}
                                                    className="w-full rounded-lg border-stone-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-stone-800 p-2 border bg-white text-sm"
                                                />
                                                <span className="text-sm font-medium text-stone-500 whitespace-nowrap min-w-[24px]">
                                                    {formData.portionType === 'cut' ? '等分' : formData.yieldUnit}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
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

                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                            {formData.menuIngredients.length === 0 ? (
                                <p className="text-sm text-stone-400 text-center py-8 bg-stone-50 rounded-lg border border-dashed border-stone-200">
                                    使用する食材を追加してください
                                </p>
                            ) : (
                                formData.menuIngredients.map((item) => {
                                    const selectedIngredient = availableIngredients.find(i => i.id === item.ingredientId);
                                    const unit = selectedIngredient ? selectedIngredient.unit : '';
                                    const cost = selectedIngredient && item.usedAmount
                                        ? ((selectedIngredient.price / selectedIngredient.capacity) * Number(item.usedAmount)).toFixed(2)
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
                                                            min="0.1"
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
                                <div className="text-xs text-stone-500 mb-1">
                                    {formData.isPortioned ? '完成品 全体原価' : '原価合計'}
                                </div>
                                <div className="text-2xl font-bold text-stone-800">¥{totalCost.toFixed(2)}</div>
                            </div>

                            {formData.isPortioned && (
                                <>
                                    <div className="hidden sm:block h-10 w-px bg-stone-300"></div>
                                    <div className="bg-orange-100 rounded-lg p-2 px-3 border border-orange-200 shadow-sm">
                                        <div className="text-[10px] text-orange-800 mb-0.5 font-bold">
                                            {formData.portionType === 'cut'
                                                ? `1カットあたりの原価 (${formData.portionAmount}等分)`
                                                : `量り売り原価 (${formData.portionAmount}${formData.yieldUnit}あたり)`}
                                        </div>
                                        <div className="text-xl font-bold text-orange-600">¥{displayCost.toFixed(2)}</div>
                                    </div>
                                </>
                            )}

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
