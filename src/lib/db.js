import localforage from 'localforage';

// Configure localforage
localforage.config({
    name: 'YuzuCostApp',
    storeName: 'yuzu_data', // Should be alphanumeric
});

const KEYS = {
    INGREDIENTS: 'ingredients',
    MENUS: 'menus',
    CATEGORIES: 'categories',
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
