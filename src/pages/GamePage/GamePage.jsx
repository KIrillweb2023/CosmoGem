import { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';

import { Link } from "react-router-dom";
import "./GamePage.scss";

export const GamePage = () => {
    // Game state
    const [score, setScore] = useState(0);
    const [combo, setCombo] = useState(0);

    // Refs for game objects
    const appRef = useRef(null);
    const boardContainerRef = useRef(null);
    const comboTextRef = useRef(null);
    const boardRef = useRef([]);
    const selectedGemRef = useRef(null);
    const lastSelectedGemRef = useRef(null);
    const resizeTimeoutRef = useRef(null);
    const comboTimeoutRef = useRef(null);
    const isRecreatingRef = useRef(false);

    // Game configuration
    const config = {
        rows: 7,
        cols: 7,
        gemSize: 0,
        gemPadding: 10,
        gemRadius: 15,
        resources: {
            gems: {
                sparkle: { color: 0xffcc00, light: 0xffeb3b, svg: '/GemsIcon/blue-gem.svg' },
                diamond: { color: 0x00e5ff, light: 0x84ffff, svg: '/GemsIcon/green-gem.svg' },
                crystal: { color: 0xab47bc, light: 0xce93d8, svg: '/GemsIcon/red-gem.svg' },
                star: { color: 0xff9100, light: 0xffc46b, svg: '/GemsIcon/purple-gem.svg' },
                lightning: { color: 0xffea00, light: 0xffff8d, svg: '/GemsIcon/revolte-gem.svg' },
                heart: { color: 0xff1744, light: 0xff616f, svg: '/GemsIcon/yellow-gem.svg' },
            }
        }
    };

    const gemTypes = Object.keys(config.resources.gems);
    const loadedTexturesRef = useRef({});

    // Initialize the game
    useEffect(() => {
        const initGame = async () => {
            try {
                // Check WebGL support
                if (!PIXI.utils.isWebGLSupported()) {
                    throw new Error('Your device does not support WebGL. Please update your browser.');
                }

                // Create PIXI application
                const app = new PIXI.Application({
                    width: window.innerWidth,
                    height: window.innerHeight,
                    backgroundColor: 0x000000, // Черный цвет, но с alpha: 0
                    backgroundAlpha: 0, // Прозрачный фон
                    transparent: true, // Включаем прозрачность
                    antialias: true,
                    resolution: Math.min(2, window.devicePixelRatio || 1),
                    autoDensity: true,
                    powerPreference: 'high-performance'
                });

                // Add to DOM
                const gameContainer = document.getElementById('game-board');
                gameContainer.appendChild(app.view);

                appRef.current = app;
                boardRef.current = Array(config.rows).fill().map(() => Array(config.cols).fill(null));

                // Load textures
                await loadTextures();

                // Setup game
                resizeGame();
                createBoard();
                setupEventListeners();

                // Handle window resize
                window.addEventListener('resize', handleResize);

            } catch (error) {
                console.error('Game initialization error:', error);
                showError(error.message);
            }
        };

        initGame();

        return () => {
            // Cleanup
            window.removeEventListener('resize', handleResize);
            if (appRef.current) {
                appRef.current.destroy(true);
                appRef.current = null;
            }
        };
    }, []);

    // Load gem textures
    const loadTextures = async () => {
        const textures = {};
        for (const gemType of gemTypes) {
            try {
                textures[gemType] = await PIXI.Texture.fromURL(config.resources.gems[gemType].svg);
            } catch (error) {
                console.warn(`Failed to load texture for ${gemType}, using fallback:`, error);
                textures[gemType] = createFallbackTexture(gemType);
            }
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
        resizeTimeoutRef.current = setTimeout(() => {
            resizeGame();
        }, 100);
    };

    // Resize game elements
    const resizeGame = () => {
        // Получаем размеры области просмотра
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

        // Определяем максимальный размер доски
        const boardSize = Math.min(screenWidth * 0.9, screenHeight * 0.8);

        // Рассчитываем размер элементов
        const maxGemWidth = Math.floor((boardSize - (config.cols + 1) * config.gemPadding) / config.cols);
        const maxGemHeight = Math.floor((boardSize - (config.rows + 1) * config.gemPadding) / config.rows);

        config.gemSize = Math.max(Math.min(maxGemWidth, maxGemHeight, 80), 30);
        config.gemPadding = Math.floor(config.gemSize * 0.15);
        config.gemRadius = Math.floor(config.gemSize * 0.2);

        // Рассчитываем финальные размеры доски
        const padding = 20;
        const totalBoardWidth = config.cols * (config.gemSize + config.gemPadding) - config.gemPadding;
        const totalBoardHeight = config.rows * (config.gemSize + config.gemPadding) - config.gemPadding;

        if (!appRef.current?.renderer) return;

        appRef.current.renderer.resize(
            totalBoardWidth + padding * 2,
            totalBoardHeight + padding * 2
        );

        // Центрируем доску внутри canvas
        boardContainerRef.current?.position.set(padding, padding);

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
        // Центрируем доску в канвасе
        boardContainer.position.set((config.gemPadding + 2.5) * 2, (config.gemPadding + 2.5) * 2);

        appRef.current.stage.addChild(boardContainer);
        boardContainerRef.current = boardContainer;
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

    // Create board background
    const createBoardBackground = () => {
        const cellSize = config.gemSize + config.gemPadding;
        const totalWidth = config.cols * cellSize - config.gemPadding;
        const totalHeight = config.rows * cellSize - config.gemPadding;

        // Main background
        const boardBg = new PIXI.Graphics();
        boardBg.beginFill(0x1a223a)
            .drawRoundedRect(-15, -15, totalWidth + 30, totalHeight + 30, 20)
            .endFill();

        // Border
        boardBg.lineStyle(3, 0x4a6caa, 0.7)
            .drawRoundedRect(-10, -10, totalWidth + 20, totalHeight + 20, 15);

        // Grid
        boardBg.lineStyle(1, 0x3a4a7a, 0.3);
        for (let y = 0; y < config.rows; y++) {
            for (let x = 0; x < config.cols; x++) {
                boardBg.drawRoundedRect(
                    x * cellSize,
                    y * cellSize,
                    config.gemSize,
                    config.gemSize,
                    config.gemRadius
                );
            }
        }

        // Glow effect
        const glow = new PIXI.Graphics();
        glow.beginFill(0x4a6caa, 0.1)
            .drawRoundedRect(-20, -20, totalWidth + 40, totalHeight + 40, 25)
            .endFill();
        glow.blur = 5;

        boardContainerRef.current.addChild(glow);
        boardContainerRef.current.addChild(boardBg);
    };

    // Initialize gems on board
    const initializeGems = () => {
        const cellSize = config.gemSize + config.gemPadding;

        for (let y = 0; y < config.rows; y++) {
            for (let x = 0; x < config.cols; x++) {
                if (boardRef.current[y][x] && boardRef.current[y][x].parent) {
                    boardRef.current[y][x].parent.removeChild(boardRef.current[y][x]);
                }

                const gemType = getRandomGemTypeWithoutMatches(x, y);
                const gem = createGem(gemType, x, y);
                gem.position.set(
                    x * cellSize + config.gemSize / 2,
                    y * cellSize + config.gemSize / 2
                );
                boardContainerRef.current.addChild(gem);
                boardRef.current[y][x] = gem;
            }
        }
    };

    // Get random gem type without initial matches
    const getRandomGemTypeWithoutMatches = (x, y, maxAttempts = 50) => {
        let gemType;
        let attempts = 0;

        do {
            gemType = gemTypes[Math.floor(Math.random() * gemTypes.length)];
            attempts++;

            if (attempts >= maxAttempts) break;

            // Check horizontal matches
            if (x >= 2 &&
                boardRef.current[y][x - 1]?.data.type === gemType &&
                boardRef.current[y][x - 2]?.data.type === gemType) {
                continue;
            }

            // Check vertical matches
            if (y >= 2 &&
                boardRef.current[y - 1][x]?.data.type === gemType &&
                boardRef.current[y - 2][x]?.data.type === gemType) {
                continue;
            }

            break;
        } while (true);

        return gemType;
    };

    // Setup combo text display
    const setupComboText = () => {
        if (!comboTextRef.current) {
            const comboText = new PIXI.Text('', {
                fontFamily: 'Arial',
                fontSize: 36,
                fill: 0xffffff,
                fontWeight: 'bold',
                dropShadow: true,
                dropShadowColor: 0x4a6caa,
                dropShadowBlur: 10
            });
            comboText.anchor.set(0.5);
            comboText.position.set(appRef.current.screen.width / 2, 50);
            comboText.alpha = 0;
            appRef.current.stage.addChild(comboText);
            comboTextRef.current = comboText;
        }
    };

    // Create a gem sprite
    const createGem = (type, x, y) => {
        if (!loadedTexturesRef.current?.[type]) {
            console.error(`Texture for type "${type}" not found!`);
            return null;
        }

        const gem = new PIXI.Container();
        gem.interactive = gem.buttonMode = true;
        gem.data = { type, x, y };

        // Create sprite
        const gemSprite = new PIXI.Sprite(loadedTexturesRef.current[type]);
        gemSprite.anchor.set(0.5);
        gemSprite.width = gemSprite.height = config.gemSize;

        // Add sprite
        gem.addChild(gemSprite);

        // Event handlers
        gem.on('pointerdown', onGemClick);
        gem.on('pointerover', () => onGemOver(gem));
        gem.on('pointerout', () => onGemOut(gem));

        return gem;
    };

    // Gem click handler
    const onGemClick = (event) => {
        event.stopPropagation();
        selectGem(event.currentTarget, event);
    };

    // Gem hover over handler
    const onGemOver = (gem) => {
        if (gem !== selectedGemRef.current) {
            gem.scale.set(1.1);
        }
    };

    // Gem hover out handler
    const onGemOut = (gem) => {
        if (gem !== selectedGemRef.current) {
            gem.scale.set(1);
        }
    };

    // Select a gem
    const selectGem = (gem, event) => {
        if (!gem) {
            if (selectedGemRef.current) {
                deselectGem();
            }
            return;
        }

        if (!selectedGemRef.current) {
            selectedGemRef.current = gem;
            createPulseEffect(gem);
            animateSelectedGem();
        } else if (selectedGemRef.current === gem) {
            deselectGem();
        } else if (isAdjacent(selectedGemRef.current, gem)) {
            swapGems(selectedGemRef.current, gem);
        } else {
            deselectGem();
            selectedGemRef.current = gem;
            createPulseEffect(gem);
            animateSelectedGem();
        }
    };

    // Deselect gem
    const deselectGem = () => {
        if (selectedGemRef.current) {
            gsap.killTweensOf(selectedGemRef.current.scale);
            gsap.to(selectedGemRef.current.scale, {
                x: 1,
                y: 1,
                duration: 0.2
            });
            selectedGemRef.current = null;
            lastSelectedGemRef.current = null;
        }
    };

    // Animate selected gem
    const animateSelectedGem = () => {
        if (selectedGemRef.current) {
            gsap.to(selectedGemRef.current.scale, {
                x: 1.2,
                y: 1.2,
                duration: 0.3,
                yoyo: true,
                repeat: -1,
                ease: "sine.inOut"
            });
        }
    };

    // Create pulse effect
    const createPulseEffect = (gem) => {
        if (!gem?.parent) return;

        const pulse = new PIXI.Graphics()
            .beginFill(0xffffff, 0.5)
            .drawCircle(0, 0, config.gemSize / 2)
            .endFill();
        pulse.position.copyFrom(gem.position);
        gem.parent.addChild(pulse);

        gsap.to(pulse, {
            width: config.gemSize * 2,
            height: config.gemSize * 2,
            alpha: 0,
            duration: 0.5,
            onComplete: () => {
                if (pulse.parent) {
                    pulse.parent.removeChild(pulse);
                }
            }
        });
    };

    // Check if gems are adjacent
    const isAdjacent = (gem1, gem2) => {
        if (!gem1 || !gem2) return false;
        const dx = Math.abs(gem1.data.x - gem2.data.x);
        const dy = Math.abs(gem1.data.y - gem2.data.y);
        return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
    };

    // Swap two gems
    const swapGems = (gem1, gem2) => {
        if (!gem1 || !gem2) return;

        gsap.killTweensOf(selectedGemRef.current?.scale);
        selectedGemRef.current = null;
        lastSelectedGemRef.current = null;

        const originalPositions = {
            gem1: { x: gem1.data.x, y: gem1.data.y },
            gem2: { x: gem2.data.x, y: gem2.data.y }
        };

        // Swap in board array
        [boardRef.current[gem1.data.y][gem1.data.x], boardRef.current[gem2.data.y][gem2.data.x]] = [gem2, gem1];
        [gem1.data.x, gem2.data.x] = [gem2.data.x, gem1.data.x];
        [gem1.data.y, gem2.data.y] = [gem2.data.y, gem1.data.y];

        const cellSize = config.gemSize + config.gemPadding;
        const gem1TargetX = gem1.data.x * cellSize + config.gemSize / 2;
        const gem1TargetY = gem1.data.y * cellSize + config.gemSize / 2;
        const gem2TargetX = gem2.data.x * cellSize + config.gemSize / 2;
        const gem2TargetY = gem2.data.y * cellSize + config.gemSize / 2;

        gsap.to(gem1.position, {
            x: gem1TargetX,
            y: gem1TargetY,
            duration: 0.3,
            onComplete: () => {
                const hasMatches = checkPotentialMatches();
                if (!hasMatches) {
                    revertSwap(gem1, gem2, originalPositions);
                } else {
                    checkMatches();
                }
            }
        });

        gsap.to(gem2.position, {
            x: gem2TargetX,
            y: gem2TargetY,
            duration: 0.3
        });
    };

    // Revert swap if no matches
    const revertSwap = (gem1, gem2, originalPositions) => {
        if (!gem1 || !gem2) return;

        [boardRef.current[gem1.data.y][gem1.data.x], boardRef.current[gem2.data.y][gem2.data.x]] = [gem2, gem1];
        gem1.data.x = originalPositions.gem1.x;
        gem1.data.y = originalPositions.gem1.y;
        gem2.data.x = originalPositions.gem2.x;
        gem2.data.y = originalPositions.gem2.y;

        const cellSize = config.gemSize + config.gemPadding;
        const gem1OriginalX = originalPositions.gem1.x * cellSize + config.gemSize / 2;
        const gem1OriginalY = originalPositions.gem1.y * cellSize + config.gemSize / 2;
        const gem2OriginalX = originalPositions.gem2.x * cellSize + config.gemSize / 2;
        const gem2OriginalY = originalPositions.gem2.y * cellSize + config.gemSize / 2;

        gsap.to(gem1.position, {
            x: gem1OriginalX,
            y: gem1OriginalY,
            duration: 0.3
        });

        gsap.to(gem2.position, {
            x: gem2OriginalX,
            y: gem2OriginalY,
            duration: 0.3
        });
    };

    // Check for potential matches
    const checkPotentialMatches = () => {
        // Horizontal matches
        for (let y = 0; y < config.rows; y++) {
            for (let x = 0; x < config.cols - 2; x++) {
                const type = boardRef.current[y]?.[x]?.data?.type;
                if (!type) continue;

                let matches = 1;
                for (let i = 1; x + i < config.cols; i++) {
                    if (boardRef.current[y]?.[x + i]?.data?.type === type) {
                        matches++;
                        if (matches >= 3) return true;
                    } else {
                        break;
                    }
                }
            }
        }

        // Vertical matches
        for (let x = 0; x < config.cols; x++) {
            for (let y = 0; y < config.rows - 2; y++) {
                const type = boardRef.current[y]?.[x]?.data?.type;
                if (!type) continue;

                let matches = 1;
                for (let i = 1; y + i < config.rows; i++) {
                    if (boardRef.current[y + i]?.[x]?.data?.type === type) {
                        matches++;
                        if (matches >= 3) return true;
                    } else {
                        break;
                    }
                }
            }
        }

        return false;
    };

    // Check for matches
    const checkMatches = () => {
        const matches = new Set();

        // Horizontal matches
        for (let y = 0; y < config.rows; y++) {
            for (let x = 0; x < config.cols - 2; x++) {
                const gem1 = boardRef.current[y]?.[x];
                const gem2 = boardRef.current[y]?.[x + 1];
                const gem3 = boardRef.current[y]?.[x + 2];
                if (!gem1 || !gem2 || !gem3) continue;

                const type = gem1.data?.type;
                if (type === gem2.data?.type && type === gem3.data?.type) {
                    let xEnd = x + 3;
                    while (xEnd < config.cols && boardRef.current[y][xEnd]?.data?.type === type) {
                        xEnd++;
                    }
                    for (let i = x; i < xEnd; i++) {
                        matches.add(boardRef.current[y][i]);
                    }
                }
            }
        }

        // Vertical matches
        for (let x = 0; x < config.cols; x++) {
            for (let y = 0; y < config.rows - 2; y++) {
                const gem1 = boardRef.current[y]?.[x];
                const gem2 = boardRef.current[y + 1]?.[x];
                const gem3 = boardRef.current[y + 2]?.[x];
                if (!gem1 || !gem2 || !gem3) continue;

                const type = gem1.data?.type;
                if (type === gem2.data?.type && type === gem3.data?.type) {
                    let yEnd = y + 3;
                    while (yEnd < config.rows && boardRef.current[yEnd][x]?.data?.type === type) {
                        yEnd++;
                    }
                    for (let i = y; i < yEnd; i++) {
                        matches.add(boardRef.current[i][x]);
                    }
                }
            }
        }

        if (matches.size > 0) {
            setCombo(prev => prev + 1);
            destroyGems([...matches]);
        } else {
            setCombo(0);
            if (!hasValidMoves() && !isRecreatingRef.current) {
                isRecreatingRef.current = true;
                recreateBoard();
                isRecreatingRef.current = false;
            }
        }
    };

    // Destroy matched gems
    const destroyGems = (gems) => {
        const validGems = gems.filter(gem => gem && gem.parent);
        if (validGems.length === 0) {
            requestAnimationFrame(() => dropGems());
            return;
        }

        clearTimeout(comboTimeoutRef.current);

        if (combo > 1) {
            comboTextRef.current.text = `COMBO x${combo}!`;
            gsap.to(comboTextRef.current, {
                alpha: 1,
                scale: { x: 1.5, y: 1.5 },
                duration: 0.2,
                yoyo: true,
                repeat: 1,
                onComplete: () => gsap.killTweensOf(comboTextRef.current)
            });
            setScore(prev => prev + 10 * (combo - 1));
        }

        comboTimeoutRef.current = setTimeout(() => {
            setCombo(0);
            gsap.to(comboTextRef.current, {
                alpha: 0,
                duration: 0.5,
                onComplete: () => gsap.killTweensOf(comboTextRef.current)
            });
        }, 2000);

        validGems.forEach(gem => {
            const { x, y } = gem.data;
            if (boardRef.current[y] && boardRef.current[y][x] !== undefined) {
                boardRef.current[y][x] = null;
            }
            createSimpleExplosion(gem);
            if (gem.parent) {
                gem.parent.removeChild(gem);
            }
            if (gem.destroy) {
                gem.destroy();
            }
        });

        setTimeout(() => dropGems(), 300);
    };

    // Create explosion effect
    const createSimpleExplosion = (gem) => {
        if (!gem?.parent) return;

        for (let i = 0; i < 8; i++) {
            const particle = new PIXI.Graphics()
                .beginFill(config.resources.gems[gem.data.type].light)
                .drawCircle(0, 0, 2)
                .endFill();
            particle.position.copyFrom(gem.position);
            gem.parent.addChild(particle);

            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;

            const updateParticle = (delta) => {
                particle.x += Math.cos(angle) * speed * delta;
                particle.y += Math.sin(angle) * speed * delta;
                particle.alpha -= 0.03 * delta;
                if (particle.alpha <= 0) {
                    if (particle.parent) {
                        particle.parent.removeChild(particle);
                    }
                    appRef.current.ticker.remove(updateParticle);
                }
            };

            appRef.current.ticker.add(updateParticle);
        }
    };

    // Drop gems after destruction
    const dropGems = () => {
        const columnsData = Array(config.cols).fill().map(() => ({
            emptyCount: 0,
            gemsToMove: []
        }));

        // Analyze columns
        for (let x = 0; x < config.cols; x++) {
            for (let y = config.rows - 1; y >= 0; y--) {
                if (!boardRef.current[y][x]) {
                    columnsData[x].emptyCount++;
                } else if (columnsData[x].emptyCount > 0) {
                    columnsData[x].gemsToMove.push({
                        gem: boardRef.current[y][x],
                        newY: y + columnsData[x].emptyCount
                    });
                }
            }
        }

        // Move existing gems
        const movePromises = [];
        const cellSize = config.gemSize + config.gemPadding;

        columnsData.forEach((colData, x) => {
            colData.gemsToMove.forEach(({ gem, newY }) => {
                boardRef.current[newY][x] = gem;
                boardRef.current[gem.data.y][x] = null;
                gem.data.y = newY;

                const targetY = newY * cellSize + config.gemSize / 2;
                movePromises.push(
                    new Promise(resolve => {
                        gsap.to(gem.position, {
                            y: targetY,
                            duration: 0.3 + (newY - gem.data.y) * 0.05,
                            ease: "power1.out",
                            onComplete: resolve
                        });
                    })
                );
            });
        });

        // Create new gems
        const createPromises = [];

        columnsData.forEach((colData, x) => {
            if (colData.emptyCount > 0) {
                for (let i = 0; i < colData.emptyCount; i++) {
                    const newY = i;
                    createPromises.push(
                        new Promise(resolve => {
                            setTimeout(() => {
                                createGemAt(x, newY, true);
                                resolve();
                            }, i * 100);
                        })
                    );
                }
            }
        });

        // Check matches after animations
        Promise.all([...movePromises, ...createPromises]).then(() => {
            setTimeout(() => {
                checkMatches();
                if (!hasValidMoves()) {
                    recreateBoard();
                }
            }, 200);
        });
    };

    // Create gem at position
    const createGemAt = (x, y, withAnimation) => {
        if (x < 0 || x >= config.cols || y < 0 || y >= config.rows) {
            console.error(`Invalid coordinates: (${x}, ${y})`);
            return null;
        }

        const gemType = gemTypes[Math.floor(Math.random() * gemTypes.length)];
        const gem = createGem(gemType, x, y);
        if (!gem) return null;

        if (boardRef.current[y][x] && boardRef.current[y][x].parent) {
            const oldGem = boardRef.current[y][x];
            oldGem.parent.removeChild(oldGem);
            if (oldGem.destroy) oldGem.destroy();
        }

        const cellSize = config.gemSize + config.gemPadding;
        const targetX = x * cellSize + config.gemSize / 2;
        const targetY = y * cellSize + config.gemSize / 2;

        if (withAnimation) {
            const startY = -config.gemSize * 2;
            gem.position.set(targetX, startY);

            gsap.to(gem.position, {
                x: targetX,
                y: targetY,
                duration: 0.5 + y * 0.05,
                ease: "bounce.out",
                onComplete: () => {
                    gem.position.set(targetX, targetY);
                }
            });
        } else {
            gem.position.set(targetX, targetY);
        }

        boardContainerRef.current.addChild(gem);
        boardRef.current[y][x] = gem;
        return gem;
    };

    // Check for valid moves
    const hasValidMoves = () => {
        for (let y = 0; y < config.rows; y++) {
            for (let x = 0; x < config.cols; x++) {
                if (x < config.cols - 1 && checkSwapMatch(x, y, x + 1, y)) return true;
                if (y < config.rows - 1 && checkSwapMatch(x, y, x, y + 1)) return true;
            }
        }
        return false;
    };

    // Check if swap would create a match
    const checkSwapMatch = (x1, y1, x2, y2) => {
        [boardRef.current[y1][x1], boardRef.current[y2][x2]] = [boardRef.current[y2][x2], boardRef.current[y1][x1]];
        const hasMatch = checkPotentialMatches();
        [boardRef.current[y1][x1], boardRef.current[y2][x2]] = [boardRef.current[y2][x2], boardRef.current[y1][x1]];
        return hasMatch;
    };

    // Remove initial matches
    const removeInitialMatches = () => {
        let matchesFound;
        do {
            matchesFound = false;
            const matches = new Set();

            // Horizontal matches
            for (let y = 0; y < config.rows; y++) {
                for (let x = 0; x < config.cols - 2; x++) {
                    const gem1 = boardRef.current[y][x], gem2 = boardRef.current[y][x + 1], gem3 = boardRef.current[y][x + 2];
                    if (gem1 && gem2 && gem3 &&
                        gem1.data.type === gem2.data.type &&
                        gem1.data.type === gem3.data.type) {
                        matches.add(gem1).add(gem2).add(gem3);
                        matchesFound = true;
                    }
                }
            }

            // Vertical matches
            for (let x = 0; x < config.cols; x++) {
                for (let y = 0; y < config.rows - 2; y++) {
                    const gem1 = boardRef.current[y][x], gem2 = boardRef.current[y + 1][x], gem3 = boardRef.current[y + 2][x];
                    if (gem1 && gem2 && gem3 &&
                        gem1.data.type === gem2.data.type &&
                        gem1.data.type === gem3.data.type) {
                        matches.add(gem1).add(gem2).add(gem3);
                        matchesFound = true;
                    }
                }
            }

            matches.forEach(gem => {
                const { x, y } = gem.data;
                boardRef.current[y][x] = null;
                if (gem.parent) {
                    gem.parent.removeChild(gem);
                }
                setTimeout(() => {
                    createGemAt(x, y, false);
                }, 50);
            });

        } while (matchesFound);
    };

    // Recreate board when no moves left
    const recreateBoard = () => {
        const message = new PIXI.Text('No valid moves!\nCreating new board', {
            fontFamily: 'Arial',
            fontSize: 36,
            fill: 0xffffff,
            align: 'center',
            stroke: 0xff0000,
            strokeThickness: 4
        });
        message.anchor.set(0.5).position.set(appRef.current.screen.width / 2, appRef.current.screen.height / 2);
        appRef.current.stage.addChild(message);

        gsap.to(message, {
            alpha: 0,
            duration: 2,
            delay: 1,
            onComplete: () => {
                if (message.parent) {
                    message.parent.removeChild(message);
                }
                createBoard();
            }
        });
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
                setCombo(0);
                createBoard();
            });
        }
    };

    return (
        <>
            <div className="app-game-container">
                <div id="game-board" className='app-game-board' />

            </div>
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
