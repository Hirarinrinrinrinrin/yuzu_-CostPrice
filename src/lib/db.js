import localforage from 'localforage';

// Configure localforage
localforage.config({
    name: 'YuzuCostApp',
    storeName: 'yuzu_data', // Should be alphanumeric
});

const KEYS = {
    INGREDIENTS: 'ingredients',
    PREP_INGREDIENTS: 'prepIngredients',
    PREP_CATEGORIES: 'prepCategories',
    MENUS: 'menus',
    CATEGORIES: 'categories',
    MENU_CATEGORIES: 'menuCategories',
};

// --- Menus ---
export const getMenus = async () => {
    const data = await localforage.getItem(KEYS.MENUS);
    if (!data) return [];

    // 既存データ（量り売り機能追加前等）に対する後方互換性のため初期値を付与 & sortOrderでソート
    return data.map((menu, index) => ({
        ...menu,
        isPortioned: menu.isPortioned || false, // 分配・量り売り設定トグル
        yieldAmount: menu.yieldAmount || 1, // 完成品の分量
        yieldUnit: menu.yieldUnit || '個', // 単位
        portionType: menu.portionType || 'cut', // 販売形態（'cut' or 'weight'）
        portionAmount: menu.portionAmount || 1, // カット数 or 1回あたりの提供量
        sortOrder: menu.sortOrder !== undefined ? menu.sortOrder : index, // ドラッグ＆ドロップ並び替え用
    })).sort((a, b) => a.sortOrder - b.sortOrder);
};

export const saveMenus = async (menus) => {
    await localforage.setItem(KEYS.MENUS, menus);
};

export const addMenu = async (menu) => {
    const menus = await getMenus();
    const newMenu = {
        ...menu,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        sortOrder: menus.length > 0 ? Math.max(...menus.map(m => m.sortOrder || 0)) + 1 : 0,
    };
    await saveMenus([...menus, newMenu]);
    return newMenu;
};

export const updateMenu = async (id, updates) => {
    const menus = await getMenus();
    const index = menus.findIndex((m) => m.id === id);
    if (index !== -1) {
        menus[index] = {
            ...menus[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        await saveMenus(menus);
        return menus[index];
    }
    return null;
};

export const deleteMenu = async (id) => {
    const menus = await getMenus();
    await saveMenus(menus.filter((m) => m.id !== id));
};

// --- Categories ---
export const getCategories = async () => {
    const data = await localforage.getItem(KEYS.CATEGORIES);
    // Default categories if empty
    if (!data || data.length === 0) {
        const defaultCategories = [
            { id: 'cat-1', name: '野菜', createdAt: new Date().toISOString() },
            { id: 'cat-2', name: '肉・魚', createdAt: new Date().toISOString() },
            { id: 'cat-3', name: '調味料', createdAt: new Date().toISOString() },
            { id: 'cat-4', name: 'その他', createdAt: new Date().toISOString() },
        ];
        await saveCategories(defaultCategories);
        return defaultCategories;
    }
    return data;
};

export const saveCategories = async (categories) => {
    await localforage.setItem(KEYS.CATEGORIES, categories);
};

export const addCategory = async (name) => {
    const categories = await getCategories();
    const newCategory = {
        id: crypto.randomUUID(),
        name,
        createdAt: new Date().toISOString(),
    };
    await saveCategories([...categories, newCategory]);
    return newCategory;
};

export const updateCategory = async (id, name) => {
    const categories = await getCategories();
    const index = categories.findIndex((c) => c.id === id);
    if (index !== -1) {
        categories[index] = { ...categories[index], name };
        await saveCategories(categories);
        return categories[index];
    }
    return null;
};

export const deleteCategory = async (id) => {
    const categories = await getCategories();
    await saveCategories(categories.filter((c) => c.id !== id));
};

// --- Menu Categories ---
export const getMenuCategories = async () => {
    const data = await localforage.getItem(KEYS.MENU_CATEGORIES);
    // Default menu categories if empty
    if (!data || data.length === 0) {
        const defaultMenuCategories = [
            { id: 'mcat-1', name: 'メイン', createdAt: new Date().toISOString() },
            { id: 'mcat-2', name: 'サイド', createdAt: new Date().toISOString() },
            { id: 'mcat-3', name: 'ドリンク', createdAt: new Date().toISOString() },
            { id: 'mcat-4', name: 'その他', createdAt: new Date().toISOString() },
        ];
        await saveMenuCategories(defaultMenuCategories);
        return defaultMenuCategories;
    }
    return data;
};

export const saveMenuCategories = async (categories) => {
    await localforage.setItem(KEYS.MENU_CATEGORIES, categories);
};

export const addMenuCategory = async (name) => {
    const categories = await getMenuCategories();
    const newCategory = {
        id: crypto.randomUUID(),
        name,
        createdAt: new Date().toISOString(),
    };
    await saveMenuCategories([...categories, newCategory]);
    return newCategory;
};

export const updateMenuCategory = async (id, name) => {
    const categories = await getMenuCategories();
    const index = categories.findIndex((c) => c.id === id);
    if (index !== -1) {
        categories[index] = { ...categories[index], name };
        await saveMenuCategories(categories);
        return categories[index];
    }
    return null;
};

export const deleteMenuCategory = async (id) => {
    const categories = await getMenuCategories();
    await saveMenuCategories(categories.filter((c) => c.id !== id));
};

// --- Ingredients ---
export const getIngredients = async () => {
    const data = await localforage.getItem(KEYS.INGREDIENTS);
    return data || [];
};

export const saveIngredients = async (ingredients) => {
    await localforage.setItem(KEYS.INGREDIENTS, ingredients);
};

export const addIngredient = async (ingredient) => {
    const ingredients = await getIngredients();
    const newIngredient = {
        ...ingredient,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
    };
    await saveIngredients([...ingredients, newIngredient]);
    return newIngredient;
};

export const updateIngredient = async (id, updates) => {
    const ingredients = await getIngredients();
    const index = ingredients.findIndex((i) => i.id === id);
    if (index !== -1) {
        ingredients[index] = {
            ...ingredients[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        await saveIngredients(ingredients);
        return ingredients[index];
    }
    return null;
};

export const deleteIngredient = async (id) => {
    const ingredients = await getIngredients();
    await saveIngredients(ingredients.filter((i) => i.id !== id));
};

// --- Prep Ingredients (仕込食材) ---
export const getPrepIngredients = async () => {
    const data = await localforage.getItem(KEYS.PREP_INGREDIENTS);
    return data || [];
};

export const savePrepIngredients = async (prepIngredients) => {
    await localforage.setItem(KEYS.PREP_INGREDIENTS, prepIngredients);
};

export const addPrepIngredient = async (prepIngredient) => {
    const items = await getPrepIngredients();
    const newItem = {
        ...prepIngredient,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
    };
    await savePrepIngredients([...items, newItem]);
    return newItem;
};

export const updatePrepIngredient = async (id, updates) => {
    const items = await getPrepIngredients();
    const index = items.findIndex((i) => i.id === id);
    if (index !== -1) {
        items[index] = {
            ...items[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        await savePrepIngredients(items);
        return items[index];
    }
    return null;
};

export const deletePrepIngredient = async (id) => {
    const items = await getPrepIngredients();
    await savePrepIngredients(items.filter((i) => i.id !== id));
};

// --- Prep Categories (仕込食材カテゴリー) ---
export const getPrepCategories = async () => {
    const data = await localforage.getItem(KEYS.PREP_CATEGORIES);
    if (!data || data.length === 0) {
        const defaults = [
            { id: 'pcat-1', name: 'ソース', createdAt: new Date().toISOString() },
            { id: 'pcat-2', name: 'スープ', createdAt: new Date().toISOString() },
            { id: 'pcat-3', name: 'その他', createdAt: new Date().toISOString() },
        ];
        await savePrepCategories(defaults);
        return defaults;
    }
    return data;
};

export const savePrepCategories = async (categories) => {
    await localforage.setItem(KEYS.PREP_CATEGORIES, categories);
};

export const addPrepCategory = async (name) => {
    const categories = await getPrepCategories();
    const newCategory = {
        id: crypto.randomUUID(),
        name,
        createdAt: new Date().toISOString(),
    };
    await savePrepCategories([...categories, newCategory]);
    return newCategory;
};

export const updatePrepCategory = async (id, name) => {
    const categories = await getPrepCategories();
    const index = categories.findIndex((c) => c.id === id);
    if (index !== -1) {
        categories[index] = { ...categories[index], name };
        await savePrepCategories(categories);
        return categories[index];
    }
    return null;
};

export const deletePrepCategory = async (id) => {
    const categories = await getPrepCategories();
    await savePrepCategories(categories.filter((c) => c.id !== id));
};

// --- Data Export / Import (バックアップ・復元) ---
export const exportAllData = async () => {
    const [ingredients, prepIngredients, menus, categories, menuCategories, prepCategories] = await Promise.all([
        localforage.getItem(KEYS.INGREDIENTS),
        localforage.getItem(KEYS.PREP_INGREDIENTS),
        localforage.getItem(KEYS.MENUS),
        localforage.getItem(KEYS.CATEGORIES),
        localforage.getItem(KEYS.MENU_CATEGORIES),
        localforage.getItem(KEYS.PREP_CATEGORIES),
    ]);

    // メニューの画像データを除外したコピーを作成
    const menusWithoutImages = (menus || []).map(m => {
        const { image, ...rest } = m;
        return rest;
    });

    return {
        version: 1,
        exportedAt: new Date().toISOString(),
        data: {
            ingredients: ingredients || [],
            prepIngredients: prepIngredients || [],
            menus: menusWithoutImages,
            categories: categories || [],
            menuCategories: menuCategories || [],
            prepCategories: prepCategories || [],
        }
    };
};

export const importAllData = async (jsonData) => {
    if (!jsonData || !jsonData.data) {
        throw new Error('無効なバックアップファイルです');
    }

    const d = jsonData.data;

    const saves = [];
    if (d.ingredients) saves.push(localforage.setItem(KEYS.INGREDIENTS, d.ingredients));
    if (d.prepIngredients) saves.push(localforage.setItem(KEYS.PREP_INGREDIENTS, d.prepIngredients));
    if (d.menus) saves.push(localforage.setItem(KEYS.MENUS, d.menus));
    if (d.categories) saves.push(localforage.setItem(KEYS.CATEGORIES, d.categories));
    if (d.menuCategories) saves.push(localforage.setItem(KEYS.MENU_CATEGORIES, d.menuCategories));
    if (d.prepCategories) saves.push(localforage.setItem(KEYS.PREP_CATEGORIES, d.prepCategories));

    await Promise.all(saves);
    return true;
};
