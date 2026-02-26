import React from 'react';

const Menus = () => {
    return (
        <div className="flex flex-col min-h-full">
            <div className="bg-theme-sidebar px-4 pt-4 lg:px-8 lg:pt-8 border-b border-stone-200">
                <div className="max-w-5xl mx-auto">
                    <nav className="-mb-px flex space-x-8 overflow-x-auto">
                        {['すべて', 'メイン', 'サイド', 'ドリンク', 'その他'].map((tab, idx) => (
                            <button
                                key={tab}
                                className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${idx === 0
                                    ? 'border-orange-500 text-orange-600'
                                    : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            <div className="flex-1 p-4 lg:p-8">
                <div className="max-w-5xl mx-auto space-y-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold tracking-tight text-stone-800">原価管理</h1>
                        <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
                            メニューを追加
                        </button>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6">
                        <div className="text-center py-12 text-stone-400">
                            <p>メニューが登録されていません。</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Menus;
