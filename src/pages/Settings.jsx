import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit2, Save, X, GripVertical, Download, Upload, AlertTriangle } from 'lucide-react';
import {
    getCategories, addCategory, updateCategory, deleteCategory, saveCategories,
    getMenuCategories, addMenuCategory, updateMenuCategory, deleteMenuCategory, saveMenuCategories,
    getPrepCategories, addPrepCategory, updatePrepCategory, deletePrepCategory, savePrepCategories,
    exportAllData, importAllData
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

    // 仕込食材カテゴリー
    const [prepCategories, setPrepCategories] = useState([]);
    const [newPrepCategoryName, setNewPrepCategoryName] = useState('');
    const [editingPrepId, setEditingPrepId] = useState(null);
    const [editPrepName, setEditPrepName] = useState('');

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
    );

    const loadData = async () => {
        const [cats, menuCats, prepCats] = await Promise.all([
            getCategories(),
            getMenuCategories(),
            getPrepCategories()
        ]);
        setCategories(cats);
        setMenuCategories(menuCats);
        setPrepCategories(prepCats);
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

    // --- 仕込食材カテゴリー処理 ---
    const handleAddPrepCategory = async (e) => {
        e.preventDefault();
        if (!newPrepCategoryName.trim()) return;
        await addPrepCategory(newPrepCategoryName.trim());
        setNewPrepCategoryName('');
        loadData();
    };

    const startEditPrep = (category) => {
        setEditingPrepId(category.id);
        setEditPrepName(category.name);
    };

    const cancelEditPrep = () => {
        setEditingPrepId(null);
        setEditPrepName('');
    };

    const handleSaveEditPrep = async () => {
        if (!editPrepName.trim()) return;
        await updatePrepCategory(editingPrepId, editPrepName.trim());
        setEditingPrepId(null);
        loadData();
    };

    const handleDeletePrep = async (id, name) => {
        if (window.confirm(`仕込食材カテゴリー「${name}」を削除してもよろしいですか？`)) {
            await deletePrepCategory(id);
            loadData();
        }
    };

    const handlePrepCategoryDragEnd = async (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = prepCategories.findIndex(c => c.id === active.id);
        const newIndex = prepCategories.findIndex(c => c.id === over.id);
        const reordered = arrayMove(prepCategories, oldIndex, newIndex);
        setPrepCategories(reordered);
        await savePrepCategories(reordered);
    };

    // --- バックアップ・復元処理 ---
    const fileInputRef = useRef(null);
    const [backupToast, setBackupToast] = useState(null);

    const showBackupToast = (message, type = 'success') => {
        setBackupToast({ message, type });
        setTimeout(() => setBackupToast(null), 4000);
    };

    const handleExport = async () => {
        try {
            const data = await exportAllData();
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const date = new Date().toISOString().slice(0, 10);
            a.href = url;
            a.download = `cost-manage-backup-${date}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showBackupToast('✓ バックアップファイルをダウンロードしました');
        } catch (err) {
            showBackupToast('エクスポートに失敗しました: ' + err.message, 'error');
        }
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!window.confirm('現在のデータは上書きされます。\nバックアップファイルから復元してもよろしいですか？')) {
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        try {
            const text = await file.text();
            const jsonData = JSON.parse(text);
            await importAllData(jsonData);
            showBackupToast('✓ データを復元しました。ページをリロードしてください。');
            loadData();
        } catch (err) {
            showBackupToast('復元に失敗しました: 無効なファイルです', 'error');
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="p-4 lg:p-8">
            <div className="w-full space-y-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-stone-800">設定</h1>
                    <p className="text-stone-500 mt-2">食材に紐付けるカテゴリーやアプリの基本設定を行います。</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                    <div className="border-b border-stone-200 bg-stone-50/50">
                        <nav className="flex -mb-px overflow-x-auto no-scrollbar">
                            <button
                                onClick={() => setActiveTab('ingredients')}
                                className={`flex-1 min-w-0 py-4 px-1 text-center border-b-2 font-medium text-sm transition-colors ${activeTab === 'ingredients'
                                    ? 'border-orange-500 text-orange-600 bg-white'
                                    : 'border-transparent text-stone-500 hover:text-stone-700 hover:bg-stone-50'
                                    }`}
                            >
                                調達食材
                            </button>
                            <button
                                onClick={() => setActiveTab('prep')}
                                className={`flex-1 min-w-0 py-4 px-1 text-center border-b-2 font-medium text-sm transition-colors ${activeTab === 'prep'
                                    ? 'border-orange-500 text-orange-600 bg-white'
                                    : 'border-transparent text-stone-500 hover:text-stone-700 hover:bg-stone-50'
                                    }`}
                            >
                                仕込食材
                            </button>
                            <button
                                onClick={() => setActiveTab('menus')}
                                className={`flex-1 min-w-0 py-4 px-1 text-center border-b-2 font-medium text-sm transition-colors ${activeTab === 'menus'
                                    ? 'border-orange-500 text-orange-600 bg-white'
                                    : 'border-transparent text-stone-500 hover:text-stone-700 hover:bg-stone-50'
                                    }`}
                            >
                                メニュー
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

                    {activeTab === 'prep' && (
                        <div className="p-6">
                            <form onSubmit={handleAddPrepCategory} className="flex gap-2 mb-6">
                                <input
                                    type="text"
                                    value={newPrepCategoryName}
                                    onChange={(e) => setNewPrepCategoryName(e.target.value)}
                                    placeholder="新しいカテゴリー名を追加"
                                    className="flex-1 rounded-lg border-stone-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-stone-800 p-2.5 border bg-white"
                                />
                                <button
                                    type="submit"
                                    disabled={!newPrepCategoryName.trim()}
                                    className="flex items-center bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:hover:bg-orange-500 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
                                >
                                    <Plus size={18} className="mr-1" />
                                    追加
                                </button>
                            </form>

                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handlePrepCategoryDragEnd}>
                                <SortableContext items={prepCategories.map(c => c.id)} strategy={verticalListSortingStrategy}>
                                    <div className="space-y-2">
                                        {prepCategories.map((category) => (
                                            <SortableCategoryRow
                                                key={category.id}
                                                category={category}
                                                editingId={editingPrepId}
                                                editName={editPrepName}
                                                onStartEdit={startEditPrep}
                                                onSaveEdit={handleSaveEditPrep}
                                                onCancelEdit={cancelEditPrep}
                                                onDelete={handleDeletePrep}
                                                onEditNameChange={setEditPrepName}
                                            />
                                        ))}
                                        {prepCategories.length === 0 && (
                                            <p className="text-center text-stone-500 py-4">仕込食材カテゴリーが登録されていません。</p>
                                        )}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        </div>
                    )}
                </div>

                {/* バックアップ・復元セクション */}
                <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50">
                        <h2 className="font-bold text-stone-800">データのバックアップ・復元</h2>
                        <p className="text-sm text-stone-500 mt-1">機種変更時などにデータを移行できます（画像は含まれません）</p>
                    </div>
                    <div className="p-6 space-y-6">
                        {/* エクスポート */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                            <div>
                                <h3 className="font-bold text-stone-800 flex items-center gap-2">
                                    <Download size={18} className="text-emerald-600" />
                                    バックアップ（エクスポート）
                                </h3>
                                <p className="text-sm text-stone-500 mt-1">現在の登録データをJSONファイルとして保存します</p>
                            </div>
                            <button
                                type="button"
                                onClick={handleExport}
                                className="flex items-center bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm whitespace-nowrap"
                            >
                                <Download size={18} className="mr-2" />
                                データを保存
                            </button>
                        </div>

                        {/* インポート */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
                            <div>
                                <h3 className="font-bold text-stone-800 flex items-center gap-2">
                                    <Upload size={18} className="text-amber-600" />
                                    復元（インポート）
                                </h3>
                                <p className="text-sm text-stone-500 mt-1">バックアップファイルからデータを復元します</p>
                                <p className="text-xs text-amber-700 mt-1 flex items-center gap-1">
                                    <AlertTriangle size={12} />
                                    現在のデータは上書きされます
                                </p>
                            </div>
                            <label className="flex items-center bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm cursor-pointer whitespace-nowrap">
                                <Upload size={18} className="mr-2" />
                                ファイルを選択
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".json"
                                    onChange={handleImport}
                                    className="hidden"
                                />
                            </label>
                        </div>

                        {/* トースト */}
                        {backupToast && (
                            <div className={`p-3 rounded-lg text-sm font-medium text-center ${backupToast.type === 'success' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                : 'bg-red-100 text-red-700 border border-red-200'
                                }`}>
                                {backupToast.message}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
