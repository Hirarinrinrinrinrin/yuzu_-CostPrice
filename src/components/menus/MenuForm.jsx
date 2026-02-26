import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, Image as ImageIcon } from 'lucide-react';

const MenuForm = ({ initialData, availableIngredients, categories, onSave, onCancel }) => {
    const defaultCategory = categories.length > 0 ? categories[0].name : '';

    const [formData, setFormData] = useState({
        name: '',
        category: defaultCategory,
        sellingPrice: '',
        image: '',
        menuIngredients: [] // { tempId: string, ingredientId: string, usedAmount: number|string }
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                category: initialData.category || defaultCategory,
                sellingPrice: initialData.sellingPrice || '',
                image: initialData.image || '',
                menuIngredients: initialData.ingredients.map(i => ({
                    ...i,
                    tempId: crypto.randomUUID()
                })) || []
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

    // 画像アップロード処理（今回はBase64のURLとして保存する簡易実装）
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, image: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    // リアルタイム計算計算
    const totalCost = formData.menuIngredients.reduce((sum, item) => {
        const ingredient = availableIngredients.find(i => i.id === item.ingredientId);
        if (!ingredient || !item.usedAmount) return sum;
        const unitPrice = ingredient.price / ingredient.capacity;
        return sum + (unitPrice * Number(item.usedAmount));
    }, 0);

    const costRate = Number(formData.sellingPrice) > 0
        ? (totalCost / Number(formData.sellingPrice)) * 100
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

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">商品画像</label>
                            <div className="flex items-center gap-4">
                                {formData.image ? (
                                    <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-stone-200">
                                        <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                                            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-24 h-24 rounded-lg border-2 border-dashed border-stone-300 flex flex-col items-center justify-center text-stone-400 bg-stone-50">
                                        <ImageIcon size={24} className="mb-1 opacity-50" />
                                        <span className="text-[10px]">No Image</span>
                                    </div>
                                )}
                                <div className="flex-1">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="block w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-600 hover:file:bg-orange-100 transition-colors"
                                    />
                                    <p className="text-xs text-stone-400 mt-2">JPEG, PNG等の画像形式に対応（※端末内に保存されます）</p>
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

                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                            {formData.menuIngredients.length === 0 ? (
                                <p className="text-sm text-stone-400 text-center py-8 bg-stone-50 rounded-lg border border-dashed border-stone-200">
                                    使用する食材を追加してください
                                </p>
                            ) : (
                                formData.menuIngredients.map((item, index) => {
                                    const selectedIngredient = availableIngredients.find(i => i.id === item.ingredientId);
                                    const unit = selectedIngredient ? selectedIngredient.unit : '';
                                    const cost = selectedIngredient && item.usedAmount
                                        ? ((selectedIngredient.price / selectedIngredient.capacity) * Number(item.usedAmount)).toFixed(2)
                                        : 0;

                                    return (
                                        <div key={item.tempId} className="flex items-start gap-2 p-3 bg-stone-50 rounded-lg border border-stone-200">
                                            <div className="flex-1 space-y-2">
                                                <select
                                                    value={item.ingredientId}
                                                    onChange={(e) => handleIngredientChange(item.tempId, 'ingredientId', e.target.value)}
                                                    className="w-full text-sm rounded-md border-stone-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-stone-800 p-2 border bg-white"
                                                >
                                                    <option value="">食材を選択...</option>
                                                    {availableIngredients.map(ing => (
                                                        <option key={ing.id} value={ing.id}>
                                                            {ing.name} (¥{ing.price}/{ing.capacity}{ing.unit})
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            min="0.1"
                                                            step="0.1"
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
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-8">
                            <div>
                                <div className="text-xs text-stone-500 mb-1">原価合計</div>
                                <div className="text-2xl font-bold text-stone-800">¥{totalCost.toFixed(2)}</div>
                            </div>
                            <div className="h-10 w-px bg-stone-300"></div>
                            <div>
                                <div className="text-xs text-stone-500 mb-1">原価率（目安: 30%）</div>
                                <div className={`text - 2xl font - bold ${costRate > 35 ? 'text-red-500' : costRate > 0 ? 'text-emerald-500' : 'text-stone-800'} `}>
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
