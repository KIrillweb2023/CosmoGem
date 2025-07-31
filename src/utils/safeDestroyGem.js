export const safeDestroyGem = (gem) => {
    if (!gem || gem.destroyed) return;

    try {
        if (gem.parent) {
            gem.parent.removeChild(gem);
        }
        if (gem.destroy) {
            gem.destroy({ children: true });
        }
        gem.destroyed = true;
    } catch (e) {
        console.error("Error destroying gem:", e);
    }
};