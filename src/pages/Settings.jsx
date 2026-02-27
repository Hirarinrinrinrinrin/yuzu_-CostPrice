import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, GripVertical } from 'lucide-react';
import {
    getCategories, addCategory, updateCategory, deleteCategory, saveCategories,
    getMenuCategories, addMenuCategory, updateMenuCategory, deleteMenuCategory, saveMenuCategories
} from '../lib/db';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    TouchSensor,
    MouseSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
    arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ---- ドラッグ可能なカテゴリー行コンポーネント ----
const SortableCategoryRow = ({ category, editingId, editName, onStartEdit, onSaveEdit, onCancelEdit, onDelete, onEditNameChange }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: category.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 10 : 'auto',
    };

    const isEditing = editingId === category.id;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center justify-between p-3 rounded-xl border border-stone-100 hover:border-orange-200 hover:bg-orange-50/50 transition-colors group bg-white"
        >
            {isEditing ? (
                <div className="flex flex-1 items-center gap-2 mr-2">
                    <input
                        type="text"
                        value={editName}
                        onChange={(e) => onEditNameChange(e.target.value)}
                        className="flex-1 rounded-md border-stone-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-stone-800 p-1.5 border bg-white"
                        autoFocus
                    />
                    <button onClick={onSaveEdit} className="p-1.5 text-orange-600 hover:bg-orange-100 rounded-md transition-colors">
                        <Save size={18} />
                    </button>
                    <button onClick={onCancelEdit} className="p-1.5 text-stone-400 hover:bg-stone-200 rounded-md transition-colors">
                        <X size={18} />
                    </button>
                </div>
            ) : (
                <>
                    <div className="flex items-center gap-2">
                        <div
                            {...attributes}
                            {...listeners}
                            className="text-stone-300 hover:text-orange-400 cursor-grab active:cursor-grabbing p-1 transition-colors"
                        >
                            <GripVertical size={18} />
                        </div>
                        <span className="font-medium text-stone-700">{category.name}</span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onStartEdit(category)} className="p-2 text-stone-400 hover:text-orange-500 hover:bg-orange-100 rounded-lg transition-colors">
                            <Edit2 size={16} />
                        </button>
                        <button onClick={() => onDelete(category.id, category.name)} className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={16} />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

// ---- メインページコンポーネント ----
const Settings = () => {
    // 食材カテゴリー
    const [categories, setCategories] = useState([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');

    // タブ状態
    const [activeTab, setActiveTab] = useState('ingredients');

    // メニューカテゴリー
    const [menuCategories, setMenuCategories] = useState([]);
    const [newMenuCategoryName, setNewMenuCategoryName] = useState('');
    const [editingMenuId, setEditingMenuId] = useState(null);
    const [editMenuName, setEditMenuName] = useState('');

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
    );

    const loadData = async () => {
        const [cats, menuCats] = await Promise.all([
            getCategories(),
            getMenuCategories()
        ]);
        setCategories(cats);
        setMenuCategories(menuCats);
    };

    useEffect(() => {
        loadData();
    }, []);

    // --- 食材カテゴリー処理 ---
    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;
        await addCategory(newCategoryName.trim());
        setNewCategoryName('');
        loadData();
    };

    const startEdit = (category) => {
        setEditingId(category.id);
        setEditName(category.name);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditName('');
    };

    const handleSaveEdit = async () => {
        if (!editName.trim()) return;
        await updateCategory(editingId, editName.trim());
        setEditingId(null);
        loadData();
    };

    const handleDelete = async (id, name) => {
        if (window.confirm(`カテゴリー「${name}」を削除してもよろしいですか？\n※このカテゴリーが設定されている食材からはカテゴリーが外れます。`)) {
            await deleteCategory(id);
            loadData();
        }
    };

    const handleCategoryDragEnd = async (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = categories.findIndex(c => c.id === active.id);
        const newIndex = categories.findIndex(c => c.id === over.id);
        const reordered = arrayMove(categories, oldIndex, newIndex);
        setCategories(reordered);
        await saveCategories(reordered);
    };

    // --- メニューカテゴリー処理 ---
    const handleAddMenuCategory = async (e) => {
        e.preventDefault();
        if (!newMenuCategoryName.trim()) return;
        await addMenuCategory(newMenuCategoryName.trim());
        setNewMenuCategoryName('');
        loadData();
    };

    const startEditMenu = (category) => {
        setEditingMenuId(category.id);
        setEditMenuName(category.name);
    };

    const cancelEditMenu = () => {
        setEditingMenuId(null);
        setEditMenuName('');
    };

    const handleSaveEditMenu = async () => {
        if (!editMenuName.trim()) return;
        await updateMenuCategory(editingMenuId, editMenuName.trim());
        setEditingMenuId(null);
        loadData();
    };

    const handleDeleteMenu = async (id, name) => {
        if (window.confirm(`メニューカテゴリー「${name}」を削除してもよろしいですか？`)) {
            await deleteMenuCategory(id);
            loadData();
        }
    };

    const handleMenuCategoryDragEnd = async (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = menuCategories.findIndex(c => c.id === active.id);
        const newIndex = menuCategories.findIndex(c => c.id === over.id);
        const reordered = arrayMove(menuCategories, oldIndex, newIndex);
        setMenuCategories(reordered);
        await saveMenuCategories(reordered);
    };

    return (
        <div className="p-4 lg:p-8">
            <div className="max-w-5xl mx-auto space-y-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-stone-800">設定</h1>
                    <p className="text-stone-500 mt-2">食材に紐付けるカテゴリーやアプリの基本設定を行います。</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                    <div className="border-b border-stone-200 bg-stone-50/50">
                        <nav className="flex -mb-px">
                            <button
                                onClick={() => setActiveTab('ingredients')}
                                className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm transition-colors ${activeTab === 'ingredients'
                                    ? 'border-orange-500 text-orange-600 bg-white'
                                    : 'border-transparent text-stone-500 hover:text-stone-700 hover:bg-stone-50'
                                    }`}
                            >
                                食材カテゴリー管理
                            </button>
                            <button
                                onClick={() => setActiveTab('menus')}
                                className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm transition-colors ${activeTab === 'menus'
                                    ? 'border-orange-500 text-orange-600 bg-white'
                                    : 'border-transparent text-stone-500 hover:text-stone-700 hover:bg-stone-50'
                                    }`}
                            >
                                メニューカテゴリー管理
                            </button>
                        </nav>
                    </div>

                    {activeTab === 'ingredients' && (
                        <div className="p-6">
                            <form onSubmit={handleAddCategory} className="flex gap-2 mb-6">
                                <input
                                    type="text"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="新しいカテゴリー名を追加"
                                    className="flex-1 rounded-lg border-stone-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-stone-800 p-2.5 border bg-white"
                                />
                                <button
                                    type="submit"
                                    disabled={!newCategoryName.trim()}
                                    className="flex items-center bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:hover:bg-orange-500 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
                                >
                                    <Plus size={18} className="mr-1" />
                                    追加
                                </button>
                            </form>

                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd}>
                                <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
                                    <div className="space-y-2">
                                        {categories.map((category) => (
                                            <SortableCategoryRow
                                                key={category.id}
                                                category={category}
                                                editingId={editingId}
                                                editName={editName}
                                                onStartEdit={startEdit}
                                                onSaveEdit={handleSaveEdit}
                                                onCancelEdit={cancelEdit}
                                                onDelete={handleDelete}
                                                onEditNameChange={setEditName}
                                            />
                                        ))}
                                        {categories.length === 0 && (
                                            <p className="text-center text-stone-500 py-4">カテゴリーが登録されていません。</p>
                                        )}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        </div>
                    )}

                    {activeTab === 'menus' && (
                        <div className="p-6">
                            <form onSubmit={handleAddMenuCategory} className="flex gap-2 mb-6">
                                <input
                                    type="text"
                                    value={newMenuCategoryName}
                                    onChange={(e) => setNewMenuCategoryName(e.target.value)}
                                    placeholder="新しいカテゴリー名を追加"
                                    className="flex-1 rounded-lg border-stone-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-stone-800 p-2.5 border bg-white"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMenuCategoryName.trim()}
                                    className="flex items-center bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:hover:bg-orange-500 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
                                >
                                    <Plus size={18} className="mr-1" />
                                    追加
                                </button>
                            </form>

                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleMenuCategoryDragEnd}>
                                <SortableContext items={menuCategories.map(c => c.id)} strategy={verticalListSortingStrategy}>
                                    <div className="space-y-2">
                                        {menuCategories.map((category) => (
                                            <SortableCategoryRow
                                                key={category.id}
                                                category={category}
                                                editingId={editingMenuId}
                                                editName={editMenuName}
                                                onStartEdit={startEditMenu}
                                                onSaveEdit={handleSaveEditMenu}
                                                onCancelEdit={cancelEditMenu}
                                                onDelete={handleDeleteMenu}
                                                onEditNameChange={setEditMenuName}
                                            />
                                        ))}
                                        {menuCategories.length === 0 && (
                                            <p className="text-center text-stone-500 py-4">メニューカテゴリーが登録されていません。</p>
                                        )}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
