import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { getCategories, addCategory, updateCategory, deleteCategory } from '../lib/db';

const Settings = () => {
    const [categories, setCategories] = useState([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        const data = await getCategories();
        setCategories(data);
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;

        await addCategory(newCategoryName.trim());
        setNewCategoryName('');
        loadCategories();
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
        loadCategories();
    };

    const handleDelete = async (id, name) => {
        if (window.confirm(`カテゴリー「${name}」を削除してもよろしいですか？\n※このカテゴリーが設定されている食材からはカテゴリーが外れます。`)) {
            await deleteCategory(id);
            loadCategories();
        }
    };

    return (
        <div className="p-4 lg:p-8">
            <div className="max-w-5xl mx-auto space-y-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-stone-800">設定</h1>
                    <p className="text-stone-500 mt-2">食材に紐付けるカテゴリーやアプリの基本設定を行います。</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-stone-100 bg-theme-sidebar/30">
                        <h2 className="font-bold text-stone-800 flex items-center">
                            食材カテゴリー管理
                        </h2>
                    </div>

                    <div className="p-6">
                        {/* Add new category */}
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

                        {/* Category List */}
                        <div className="space-y-2">
                            {categories.map((category) => (
                                <div
                                    key={category.id}
                                    className="flex items-center justify-between p-3 rounded-xl border border-stone-100 hover:border-orange-200 hover:bg-orange-50/50 transition-colors group"
                                >
                                    {editingId === category.id ? (
                                        <div className="flex flex-1 items-center gap-2 mr-2">
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="flex-1 rounded-md border-stone-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-stone-800 p-1.5 border bg-white"
                                                autoFocus
                                            />
                                            <button
                                                onClick={handleSaveEdit}
                                                className="p-1.5 text-orange-600 hover:bg-orange-100 rounded-md transition-colors"
                                            >
                                                <Save size={18} />
                                            </button>
                                            <button
                                                onClick={cancelEdit}
                                                className="p-1.5 text-stone-400 hover:bg-stone-200 rounded-md transition-colors"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="font-medium text-stone-700">{category.name}</span>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => startEdit(category)}
                                                    className="p-2 text-stone-400 hover:text-orange-500 hover:bg-orange-100 rounded-lg transition-colors"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(category.id, category.name)}
                                                    className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                            {categories.length === 0 && (
                                <p className="text-center text-stone-500 py-4">カテゴリーが登録されていません。</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
