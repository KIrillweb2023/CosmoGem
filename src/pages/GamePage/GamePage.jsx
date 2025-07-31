import { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { Link } from "react-router-dom";
import "./GamePage.scss";
import { ScoreGame } from '../../components/ScoreGame/ScoreGame';
import { useGems } from '../../hooks/useGems';

export const GamePage = () => {
    // Refs
    const appRef = useRef(null);
    const boardContainerRef = useRef(null);
    const resizeTimeoutRef = useRef(null);

    // Game configuration
    const config = {
        rows: 7,
        cols: 7,
        gemSize: 0,
        gemPadding: 10,
        gemRadius: 15,
        resources: {
            gems: {
                sparkle: { color: 0xffcc00, light: 0xffeb3b, svg: `${import.meta.env.BASE_URL}/GemsIcon/amethyst-gem.png` },
                diamond: { color: 0x00e5ff, light: 0x84ffff, svg: `${import.meta.env.BASE_URL}/GemsIcon/crystal-gem.png` },
                crystal: { color: 0xab47bc, light: 0xce93d8, svg: `${import.meta.env.BASE_URL}/GemsIcon/emerald-gem.png` },
                star: { color: 0xff9100, light: 0xffc46b, svg: `${import.meta.env.BASE_URL}/GemsIcon/ruby-gem.png` },
                lightning: { color: 0xffea00, light: 0xffff8d, svg: `${import.meta.env.BASE_URL}/GemsIcon/ruby2-gem.png` },
                heart: { color: 0xff1744, light: 0xff616f, svg: `${import.meta.env.BASE_URL}/GemsIcon/topaz-gem.png` },
            }
        },
        keys: {
            spawnChance: 0.05,
            scoreValue: 150,
            texture: `${import.meta.env.BASE_URL}/key.png`
        }
    };

    const gemTypes = Object.keys(config.resources.gems);
    const loadedTexturesRef = useRef({});

    // Custom hooks
    const {
        boardRef,
        selectedGemRef,
        combo,
        score,
        initializeBoard,
        initializeGems,
        isAdjacent,
        swapGems,
        checkPotentialMatches,
        destroyGems,
        hasValidMoves,
        removeInitialMatches,
        setupComboText,
        updateCombo,
        recreateBoard
    } = useGems(appRef, boardContainerRef, config, gemTypes, loadedTexturesRef);

    useEffect(() => {
        const initGame = async () => {
            try {
                if (!PIXI.utils.isWebGLSupported()) {
                    throw new Error('Your device does not support WebGL. Please update your browser.');
                }

                const app = new PIXI.Application({
                    width: window.innerWidth,
                    height: window.innerHeight,
                    backgroundColor: 0x000000,
                    backgroundAlpha: 0,
                    transparent: true,
                    antialias: true,
                    resolution: Math.min(2, window.devicePixelRatio || 1),
                    autoDensity: true,
                    powerPreference: 'high-performance'
                });

                const gameContainer = document.getElementById('game-board');
                gameContainer.appendChild(app.view);
                appRef.current = app;

                await loadTextures();
                initializeBoard();
                resizeGame();
                createBoard();
                setupEventListeners();
                window.addEventListener('resize', handleResize);

            } catch (error) {
                console.error('Game initialization error:', error);
                showError(error.message);
            }
        };

        initGame();

        return () => {
            window.removeEventListener('resize', handleResize);
            if (appRef.current) {
                appRef.current.destroy(true);
            }
        };
    }, []);

    // Load textures
    const loadTextures = async () => {
        const textures = {};

        // Load gem textures
        for (const gemType of gemTypes) {
            try {
                textures[gemType] = await PIXI.Texture.fromURL(config.resources.gems[gemType].svg);
            } catch (error) {
                console.warn(`Failed to load texture for ${gemType}, using fallback:`, error);
                textures[gemType] = createFallbackTexture(gemType);
            }
        }

        // Load key texture
        try {
            textures.key = await PIXI.Texture.fromURL(config.keys.texture);
        } catch (error) {
            console.warn('Failed to load key texture, using fallback:', error);
            textures.key = createFallbackTexture('sparkle');
        }

        loadedTexturesRef.current = textures;
    };

    // Create fallback texture
    const createFallbackTexture = (gemType) => {
        const graphics = new PIXI.Graphics();
        graphics.beginFill(config.resources.gems[gemType].color);
        graphics.drawCircle(0, 0, 30);
        graphics.endFill();
        return appRef.current.renderer.generateTexture(graphics);
    };

    // Handle window resize
    const handleResize = () => {
        clearTimeout(resizeTimeoutRef.current);
        resizeTimeoutRef.current = setTimeout(resizeGame, 100);
    };

    // Resize game elements
    const resizeGame = () => {
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
        updateBoardSize();
    };

    // Update board after resize
    const updateBoardSize = () => {
        if (!boardContainerRef.current) {
            createBoard();
            return;
        }

        gsap.to(boardContainerRef.current, {
            alpha: 0,
            duration: 0.2,
            onComplete: () => {
                clearPreviousBoard();
                createBoard();
                gsap.to(boardContainerRef.current, { alpha: 1, duration: 0.3 });
            }
        });
    };

    // Clear previous board
    const clearPreviousBoard = () => {
        if (boardContainerRef.current) {
            appRef.current.stage.removeChild(boardContainerRef.current);
            boardContainerRef.current.destroy({ children: true });
            boardContainerRef.current = null;
        }
    };

    // Setup board container
    const setupBoardContainer = () => {
        const boardContainer = new PIXI.Container();
        boardContainer.position.set((config.gemPadding + 2.5) * 2, (config.gemPadding + 2.5) * 2);
        appRef.current.stage.addChild(boardContainer);
        boardContainerRef.current = boardContainer;
    };

    // Create board background
    const createBoardBackground = () => {
        const cellSize = config.gemSize + config.gemPadding;
        const totalWidth = config.cols * cellSize - config.gemPadding;
        const totalHeight = config.rows * cellSize - config.gemPadding;

        const boardBg = new PIXI.Graphics();
        boardBg.beginFill(0x1a223a)
            .drawRoundedRect(-15, -15, totalWidth + 30, totalHeight + 30, 20)
            .endFill();

        boardBg.lineStyle(3, 0x4a6caa, 0.7)
            .drawRoundedRect(-10, -10, totalWidth + 20, totalHeight + 20, 15);

        const glow = new PIXI.Graphics();
        glow.beginFill(0x4a6caa, 0.1)
            .drawRoundedRect(-20, -20, totalWidth + 40, totalHeight + 40, 25)
            .endFill();
        glow.blur = 5;

        boardContainerRef.current.addChild(glow);
        boardContainerRef.current.addChild(boardBg);
    };

    // Create game board
    const createBoard = () => {
        clearPreviousBoard();
        setupBoardContainer();
        createBoardBackground();
        initializeGems();
        removeInitialMatches();
        setupComboText();
    };


    // Show error message
    const showError = (message) => {
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

    // Setup event listeners
    const setupEventListeners = () => {
        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                setScore(0);
                updateCombo(0);
                createBoard();
            });
        }
    };

    return (
        <>
            <div className="app-game-container">
                <div id="game-board" className='app-game-board' />
            </div>
            <ScoreGame score={score} keys={0} />
            <div className="app-game-btns">
                <Link to={"/"} className='app-game-btn app-game-home'>
                    На главную
                </Link>
                <button id="restart-btn" className='app-game-btn app-game-restart'>
                    Restart
                </button>
            </div>
        </>
    );
};