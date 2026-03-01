import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Utensils, Image as ImageIcon, Copy, GripHorizontal, ChefHat } from 'lucide-react';
import { getMenus, addMenu, updateMenu, deleteMenu, getIngredients, getPrepIngredients, getMenuCategories, saveMenus } from '../lib/db';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    TouchSensor,
    MouseSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from '@dnd-kit/core';
import {
    SortableContext,
    useSortable,
    rectSortingStrategy,
    arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import MenuForm from '../components/menus/MenuForm';

// ---- ドラッグ可能なメニューカードコンポーネント ----
const SortableMenuCard = ({ menu, ingredients, prepIngredients, onEdit, onDuplicate, onDelete }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: menu.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    // 原価計算（調達食材＋仕込食材対応）
    const getUnitPrice = (ingredientId) => {
        if (ingredientId.startsWith('prep:')) {
            const prepId = ingredientId.replace('prep:', '');
            const prep = prepIngredients.find(p => p.id === prepId);
            if (!prep) return 0;
            const prepCost = prep.ingredients.reduce((s, pi) => {
                const ing = ingredients.find(i => i.id === pi.ingredientId);
                if (!ing) return s;
                return s + (ing.price / ing.capacity) * pi.usedAmount;
            }, 0);
            return prep.yieldAmount > 0 ? prepCost / prep.yieldAmount : 0;
        }
        const ing = ingredients.find(i => i.id === ingredientId);
        if (!ing) return 0;
        return ing.price / ing.capacity;
    };

    const totalCost = menu.ingredients.reduce((sum, item) => {
        return sum + getUnitPrice(item.ingredientId) * item.usedAmount;
    }, 0);

    const costRate = menu.sellingPrice > 0 ? (totalCost / menu.sellingPrice) * 100 : 0;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden hover:shadow-md transition-shadow group flex flex-col"
        >
            {/* ドラッグハンドル */}
            <div
                {...attributes}
                {...listeners}
                className="h-8 bg-stone-50 border-b border-stone-100 flex items-center justify-center text-stone-300 hover:text-orange-500 hover:bg-orange-50 cursor-grab active:cursor-grabbing transition-colors"
            >
                <GripHorizontal size={20} />
            </div>

            <div className="h-40 bg-stone-100 relative">
                {menu.image ? (
                    <img src={menu.image} alt={menu.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-300">
                        <ImageIcon size={32} />
                    </div>
                )}
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEdit(menu)} className="p-1.5 bg-white text-stone-500 hover:text-orange-500 rounded-md shadow-sm transition-colors" title="編集">
                        <Edit2 size={16} />
                    </button>
                    <button onClick={() => onDuplicate(menu)} className="p-1.5 bg-white text-stone-500 hover:text-green-500 rounded-md shadow-sm transition-colors" title="複製">
                        <Copy size={16} />
                    </button>
                    <button onClick={() => onDelete(menu.id, menu.name)} className="p-1.5 bg-white text-stone-500 hover:text-red-500 rounded-md shadow-sm transition-colors" title="削除">
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
                <p className="text-sm text-stone-500 mb-3">{menu.ingredients.length}種類の食材を使用</p>

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
};

// ---- メインページコンポーネント ----
const Menus = () => {
    const [menus, setMenus] = useState([]);
    const [ingredients, setIngredients] = useState([]);
    const [prepIngredients, setPrepIngredients] = useState([]);
    const [menuCategories, setMenuCategories] = useState([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [activeTab, setActiveTab] = useState('すべて');
    const [dragActiveId, setDragActiveId] = useState(null);

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
    );

    const loadData = async () => {
        const [menuData, ingData, prepData, mCatsData] = await Promise.all([
            getMenus(),
            getIngredients(),
            getPrepIngredients(),
            getMenuCategories()
        ]);
        setMenus(menuData);
        setIngredients(ingData);
        setPrepIngredients(prepData);
        setMenuCategories(mCatsData);
    };

    useEffect(() => {
        loadData();
    }, []);

    const TABS = ['すべて', ...menuCategories.map(c => c.name)];

    const handleSave = async (menuData) => {
        if (editingItem) {
            await updateMenu(editingItem.id, menuData);
        } else {
            await addMenu(menuData);
        }
        setIsFormOpen(false);
        setEditingItem(null);
        loadData();
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setIsFormOpen(true);
    };

    const handleDuplicate = async (item) => {
        if (window.confirm(`「${item.name}」を複製しますか？`)) {
            const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...menuDataToCopy } = item;
            await addMenu({ ...menuDataToCopy, name: `${item.name} - コピー` });
            loadData();
        }
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

    const filteredMenus = activeTab === 'すべて'
        ? menus
        : menus.filter(m => m.category === activeTab);

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        setDragActiveId(null);
        if (!over || active.id === over.id) return;

        const oldIndex = filteredMenus.findIndex(m => m.id === active.id);
        const newIndex = filteredMenus.findIndex(m => m.id === over.id);
        const reorderedFiltered = arrayMove(filteredMenus, oldIndex, newIndex);

        // filteredMenusの並び順をmenusに反映
        const filteredIds = new Set(filteredMenus.map(m => m.id));
        let fi = 0;
        const newMenus = menus.map(m => {
            if (filteredIds.has(m.id)) return reorderedFiltered[fi++];
            return m;
        });

        const finalMenus = newMenus.map((m, index) => ({ ...m, sortOrder: index }));
        setMenus(finalMenus);
        await saveMenus(finalMenus);
    };

    const dragActiveMenu = dragActiveId ? menus.find(m => m.id === dragActiveId) : null;

    return (
        <div className="flex flex-col min-h-full pb-10">
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
                                    {tab === 'すべて' ? menus.length : menus.filter(m => m.category === tab).length}
                                </span>
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            <div className="flex-1 p-4 lg:p-8">
                <div className="w-full space-y-6">
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
                            prepIngredients={prepIngredients}
                            categories={menuCategories}
                            onSave={handleSave}
                            onCancel={handleCancelForm}
                        />
                    )}

                    {!isFormOpen && filteredMenus.length === 0 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-12 text-center text-stone-400">
                            <Utensils size={48} className="mx-auto mb-4 opacity-20" />
                            <p>このカテゴリーにはメニューが登録されていません。</p>
                        </div>
                    )}

                    {!isFormOpen && filteredMenus.length > 0 && (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragStart={({ active }) => setDragActiveId(active.id)}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext items={filteredMenus.map(m => m.id)} strategy={rectSortingStrategy}>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredMenus.map((menu) => (
                                        <SortableMenuCard
                                            key={menu.id}
                                            menu={menu}
                                            ingredients={ingredients}
                                            prepIngredients={prepIngredients}
                                            onEdit={handleEdit}
                                            onDuplicate={handleDuplicate}
                                            onDelete={handleDelete}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                            <DragOverlay>
                                {dragActiveMenu && (
                                    <div className="bg-white rounded-2xl shadow-2xl border-2 border-orange-400 overflow-hidden opacity-90">
                                        <div className="h-8 bg-orange-50 border-b border-orange-100 flex items-center justify-center text-orange-400">
                                            <GripHorizontal size={20} />
                                        </div>
                                        <div className="p-5">
                                            <p className="font-bold text-stone-800">{dragActiveMenu.name}</p>
                                        </div>
                                    </div>
                                )}
                            </DragOverlay>
                        </DndContext>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Menus;
