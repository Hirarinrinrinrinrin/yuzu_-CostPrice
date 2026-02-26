import React from 'react';

const Ingredients = () => {
    return (
        <div className="p-4 lg:p-8">
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight text-stone-800">食材管理</h1>
                    <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
                        食材を追加
                    </button>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6">
                    <div className="text-center py-12 text-stone-400">
                        <p>まだ登録されている食材がありません。</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Ingredients;
