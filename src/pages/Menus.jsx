import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Utensils, Image as ImageIcon } from 'lucide-react';
import { getMenus, addMenu, updateMenu, deleteMenu, getIngredients, getMenuCategories } from '../lib/db';
import MenuForm from '../components/menus/MenuForm';

const Menus = () => {
    const [menus, setMenus] = useState([]);
    const [ingredients, setIngredients] = useState([]);
    const [menuCategories, setMenuCategories] = useState([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [activeTab, setActiveTab] = useState('すべて');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [menuData, ingData, mCatsData] = await Promise.all([
            getMenus(),
            getIngredients(),
            getMenuCategories()
        ]);
        setMenus(menuData);
        setIngredients(ingData);
        setMenuCategories(mCatsData);
    };

    const TABS = ['すべて', ...menuCategories.map(c => c.name)];

    const handleSave = async (menuData) => {
        if (editingItem) {
            await updateMenu(editingItem.id, menuData);
            setEditingItem(null);
            setIsFormOpen(false);
        } else {
            await addMenu(menuData);
            setIsFormOpen(false); // メニュー追加後は閉じる
        }
        loadData();
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setIsFormOpen(true);
    };

    const handleDelete = async (id, name) => {
        if (window.confirm(`「${name}」を削除してもよろしいですか？`)) {
            await deleteMenu(id);
            loadData();
        }
    };

    const handleCancelForm = () => {
        setIsFormOpen(false);
        setEditingItem(null);
    };

    const calculateMenuStats = (menu) => {
        const totalCost = menu.ingredients.reduce((sum, item) => {
            const ing = ingredients.find(i => i.id === item.ingredientId);
            if (!ing) return sum;
            const unitPrice = ing.price / ing.capacity;
            return sum + (unitPrice * item.usedAmount);
        }, 0);

        const costRate = menu.sellingPrice > 0 ? (totalCost / menu.sellingPrice) * 100 : 0;

        return { totalCost, costRate };
    };

    const filteredMenus = activeTab === 'すべて'
        ? menus
        : menus.filter(m => m.category === activeTab);

    return (
        <div className="flex flex-col min-h-full pb-10">
            <div className="bg-theme-sidebar px-4 pt-4 lg:px-8 lg:pt-8 border-b border-stone-200 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto">
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
                                    {tab === 'すべて' ? menus.length : menus.filter(m => m.category === tab).length}
                                </span>
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            <div className="flex-1 p-4 lg:p-8">
                <div className="max-w-5xl mx-auto space-y-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold tracking-tight text-stone-800">
                            {activeTab}のメニュー
                        </h1>
                        {!isFormOpen && (
                            <button
                                onClick={() => setIsFormOpen(true)}
                                className="flex items-center bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                            >
                                <Plus size={18} className="mr-1" />
                                メニューを追加
                            </button>
                        )}
                    </div>

                    {isFormOpen && (
                        <MenuForm
                            initialData={editingItem}
                            availableIngredients={ingredients}
                            categories={menuCategories}
                            onSave={handleSave}
                            onCancel={handleCancelForm}
                        />
                    )}

                    {!isFormOpen && filteredMenus.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-12 text-center text-stone-400">
                            <Utensils size={48} className="mx-auto mb-4 opacity-20" />
                            <p>このカテゴリーにはメニューが登録されていません。</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {!isFormOpen && filteredMenus.map((menu) => {
                                const { totalCost, costRate } = calculateMenuStats(menu);
                                return (
                                    <div key={menu.id} className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
                                        <div className="h-40 bg-stone-100 relative">
                                            {menu.image ? (
                                                <img src={menu.image} alt={menu.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-stone-300">
                                                    <ImageIcon size={32} />
                                                </div>
                                            )}
                                            <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(menu)}
                                                    className="p-1.5 bg-white text-stone-500 hover:text-orange-500 rounded-md shadow-sm transition-colors"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(menu.id, menu.name)}
                                                    className="p-1.5 bg-white text-stone-500 hover:text-red-500 rounded-md shadow-sm transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            <div className="absolute top-3 left-3">
                                                <span className="bg-white/90 backdrop-blur text-stone-700 text-xs font-bold px-2 py-1 rounded-md shadow-sm">
                                                    {menu.category}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="p-5 flex-1 flex flex-col">
                                            <h3 className="font-bold text-lg text-stone-800 mb-1 line-clamp-1">{menu.name}</h3>
                                            <p className="text-sm text-stone-500 mb-4">{menu.ingredients.length}種類の食材を使用</p>

                                            <div className="mt-auto pt-4 border-t border-stone-100 grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[10px] text-stone-400 font-medium mb-0.5">販売価格</p>
                                                    <p className="font-bold text-stone-700">¥{menu.sellingPrice.toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-stone-400 font-medium mb-0.5">原価 / 原価率</p>
                                                    <div className="flex items-baseline gap-1.5">
                                                        <p className="font-bold text-stone-700 text-sm">¥{totalCost.toFixed(0)}</p>
                                                        <p className={`text-xs font-bold ${costRate > 35 ? 'text-red-400' : 'text-emerald-500'}`}>
                                                            ({costRate > 0 ? costRate.toFixed(1) : '-'}%)
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Menus;
