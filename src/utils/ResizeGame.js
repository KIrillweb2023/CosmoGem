
export const ResizeGame = (appRef, boardContainerRef, config, createAnimatedBackground, updateBoardSize) => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const boardSize = Math.min(screenWidth * 0.9, screenHeight * 0.8);

    const maxGemWidth = Math.floor((boardSize - (config.cols + 1) * config.gemPadding) / config.cols);
    const maxGemHeight = Math.floor((boardSize - (config.rows + 1) * config.gemPadding) / config.rows);
    const newGemSize = Math.max(Math.min(maxGemWidth, maxGemHeight, 40), 20);

    config.gemSize = newGemSize;
    config.gemRadius = Math.floor(newGemSize * 0.2);

    const padding = 25;
    const totalBoardWidth = config.cols * (config.gemSize + config.gemPadding) - config.gemPadding;
    const totalBoardHeight = config.rows * (config.gemSize + config.gemPadding) - config.gemPadding;

    if (!appRef.current?.renderer) return;

    appRef.current.renderer.resize(
        totalBoardWidth + padding * 2,
        totalBoardHeight + padding * 2
    );

    if (boardContainerRef.current) {
        boardContainerRef.current.position.set(padding, padding);
    }

    // Update background
    createAnimatedBackground();
    updateBoardSize();
};

export const HandleResize = (resizeTimeoutRef, appRef, boardContainerRef, config, createAnimatedBackground, updateBoardSize) => {
    clearTimeout(resizeTimeoutRef.current);
    resizeTimeoutRef.current = setTimeout(() => ResizeGame(appRef, boardContainerRef, config, createAnimatedBackground, updateBoardSize), 100);
};