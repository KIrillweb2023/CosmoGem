const setupEventUtils = (setScore, updateCombo, createBoard) => {
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            setScore(0);
            updateCombo(0);
            createBoard();
        });
    }
};


export { setupEventUtils }