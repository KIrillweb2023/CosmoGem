export const ErrorShow = (message) => {
    const errorContainer = document.getElementById('game-board') || document.body;
    errorContainer.innerHTML = `
            <div style="
                color: white;
                background: #1a1a2e;
                padding: 20px;
                border-radius: 10px;
                font-family: Arial;
                text-align: center;
                max-width: 500px;
                margin: 20px auto;
            ">
                <h3 style="color: #ff4757">Game Error</h3>
                <p>${message}</p>
                <button style="
                    background: #ff4757;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    margin-top: 15px;
                    cursor: pointer;
                " onclick="window.location.reload()">
                    Try Again
                </button>
                <p style="margin-top: 20px; font-size: 0.8em; opacity: 0.7;">
                    If the error persists, try another browser
                </p>
            </div>
        `;
};