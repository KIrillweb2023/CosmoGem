import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import * as PIXI from 'pixi.js';
import { safeDestroyGem } from '../utils/safeDestroyGem';

export const useGems = (appRef, boardContainerRef, config, gemTypes, loadedTexturesRef) => {
    const boardRef = useRef([]);
    const selectedGemRef = useRef(null);
    const lastSelectedGemRef = useRef(null);
    const isRecreatingRef = useRef(false);
    const [combo, setCombo] = useState(0);
    const comboTextRef = useRef(null);
    const [score, setScore] = useState(0);

    // Инициализация доски
    const initializeBoard = () => {
        boardRef.current = Array(config.rows).fill().map(() => Array(config.cols).fill(null));
    };

    // Создание гема
    const createGem = (type, x, y) => {
        if (!loadedTexturesRef.current?.[type]) {
            console.error(`Texture for type "${type}" not found!`);
            return null;
        }

        const gem = new PIXI.Container();
        gem.interactive = gem.buttonMode = true;
        gem.data = { type, x, y };

        const gemSprite = new PIXI.Sprite(loadedTexturesRef.current[type]);
        gemSprite.anchor.set(0.5);
        gemSprite.width = gemSprite.height = config.gemSize;
        gem.addChild(gemSprite);

        // Сохраняем исходный масштаб
        gem.data.originalScale = { x: 1, y: 1 };

        // Обработчики событий
        gem.on('pointerdown', () => handleGemClick(gem));
        gem.on('pointerover', () => handleGemHover(gem));
        gem.on('pointerout', () => handleGemOut(gem));

        return gem;
    };

    const handleGemHover = (gem) => {
        if (isRecreatingRef.current || selectedGemRef.current) return;

        gem.data.hoverAnimation = gsap.to(gem.scale, {
            x: 1.1,
            y: 1.1,
            duration: 0.2,
            ease: "power1.out"
        });
    };

    const handleGemOut = (gem) => {
        if (gem.data.hoverAnimation) {
            gem.data.hoverAnimation.kill();
        }

        if (gem !== selectedGemRef.current) {
            gsap.to(gem.scale, {
                x: gem.data.originalScale.x,
                y: gem.data.originalScale.y,
                duration: 0.2,
                ease: "power1.out"
            });
        }
    };

    const handleGemClick = (gem) => {
        if (isRecreatingRef.current) return;

        if (gem.data.hoverAnimation) {
            gem.data.hoverAnimation.kill();
        }

        if (selectedGemRef.current === gem) {
            deselectGem(gem);
            return;
        }

        if (!selectedGemRef.current) {
            selectGem(gem);
            return;
        }

        const firstGem = selectedGemRef.current;
        if (isAdjacent(firstGem, gem)) {
            swapAndCheckMatches(firstGem, gem);
        } else {
            deselectGem(firstGem);
            selectGem(gem);
        }
    };

    const selectGem = (gem) => {
        selectedGemRef.current = gem;
        gem.data.originalScale = { x: 1.2, y: 1.2 };

        gem.data.selectionAnimation = gsap.to(gem.scale, {
            x: 1.2,
            y: 1.2,
            duration: 0.2,
            ease: "power1.out"
        });
    };

    const deselectGem = (gem) => {
        if (!gem) gem = selectedGemRef.current;
        if (!gem) return;

        if (gem.data.selectionAnimation) {
            gem.data.selectionAnimation.kill();
        }

        gem.data.originalScale = { x: 1, y: 1 };
        gsap.to(gem.scale, {
            x: 1,
            y: 1,
            duration: 0.2,
            ease: "power1.out"
        });

        selectedGemRef.current = null;
    };

    const swapAndCheckMatches = async (gem1, gem2) => {
        gsap.to(gem1.scale, { x: 1, y: 1, duration: 0.2 });
        gsap.to(gem2.scale, { x: 1, y: 1, duration: 0.2 });

        const originalPositions = {
            gem1: { x: gem1.data.x, y: gem1.data.y },
            gem2: { x: gem2.data.x, y: gem2.data.y }
        };

        await swapGems(gem1, gem2);

        const matches = checkMatches();

        if (matches.size > 0) {
            await destroyGems(Array.from(matches));
            await dropGems();
            await checkAndProcessMatches();
        } else {
            await revertSwap(gem1, gem2, originalPositions);
        }

        selectedGemRef.current = null;
    };

    const checkAndProcessMatches = async () => {
        let matches = checkMatches();
        let comboCount = 0;

        while (matches.size > 0) {
            comboCount++;
            updateCombo(comboCount);

            await destroyGems(Array.from(matches));
            await dropGems();
            matches = checkMatches();
        }

        if (comboCount > 0 && !hasValidMoves()) {
            await recreateBoard();
        }
    };

    const getRandomGemTypeWithoutMatches = (x, y, maxAttempts = 50) => {
        let gemType;
        let attempts = 0;

        do {
            gemType = gemTypes[Math.floor(Math.random() * gemTypes.length)];
            attempts++;

            if (attempts >= maxAttempts) break;

            if (x >= 2 &&
                boardRef.current[y][x - 1]?.data.type === gemType &&
                boardRef.current[y][x - 2]?.data.type === gemType) {
                continue;
            }

            if (y >= 2 &&
                boardRef.current[y - 1][x]?.data.type === gemType &&
                boardRef.current[y - 2][x]?.data.type === gemType) {
                continue;
            }

            break;
        } while (true);

        return gemType;
    };

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

    const isAdjacent = (gem1, gem2) => {
        if (!gem1 || !gem2) return false;
        const dx = Math.abs(gem1.data.x - gem2.data.x);
        const dy = Math.abs(gem1.data.y - gem2.data.y);
        return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
    };

    const swapGems = (gem1, gem2) => {
        if (!gem1 || !gem2) {
            console.error("Один из гемов равен null!");
            return Promise.resolve();
        }

        const originalPositions = {
            gem1: { x: gem1.data.x, y: gem1.data.y },
            gem2: { x: gem2.data.x, y: gem2.data.y }
        };

        [boardRef.current[gem1.data.y][gem1.data.x], boardRef.current[gem2.data.y][gem2.data.x]] = [gem2, gem1];
        [gem1.data.x, gem2.data.x] = [gem2.data.x, gem1.data.x];
        [gem1.data.y, gem2.data.y] = [gem2.data.y, gem1.data.y];

        const cellSize = config.gemSize + config.gemPadding;
        const gem1TargetX = gem1.data.x * cellSize + config.gemSize / 2;
        const gem1TargetY = gem1.data.y * cellSize + config.gemSize / 2;
        const gem2TargetX = gem2.data.x * cellSize + config.gemSize / 2;
        const gem2TargetY = gem2.data.y * cellSize + config.gemSize / 2;

        return new Promise((resolve) => {
            gsap.to(gem1.position, {
                x: gem1TargetX,
                y: gem1TargetY,
                duration: 0.3
            });

            gsap.to(gem2.position, {
                x: gem2TargetX,
                y: gem2TargetY,
                duration: 0.3,
                onComplete: resolve
            });
        });
    };

    const revertSwap = (gem1, gem2, originalPositions) => {
        if (!gem1 || !gem2) {
            console.error("Один из гемов равен null при отмене обмена!");
            return Promise.resolve();
        }

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

        return new Promise((resolve) => {
            gsap.to(gem1.position, {
                x: gem1OriginalX,
                y: gem1OriginalY,
                duration: 0.3
            });

            gsap.to(gem2.position, {
                x: gem2OriginalX,
                y: gem2OriginalY,
                duration: 0.3,
                onComplete: resolve
            });
        });
    };

    const checkPotentialMatches = () => {
        for (let y = 0; y < config.rows; y++) {
            for (let x = 0; x < config.cols - 2; x++) {
                const gem1 = boardRef.current[y][x];
                const gem2 = boardRef.current[y][x + 1];
                const gem3 = boardRef.current[y][x + 2];
                if (!gem1 || !gem2 || !gem3) continue;

                if (gem1.data.type === gem2.data.type && gem1.data.type === gem3.data.type) {
                    return true;
                }
            }
        }

        for (let x = 0; x < config.cols; x++) {
            for (let y = 0; y < config.rows - 2; y++) {
                const gem1 = boardRef.current[y][x];
                const gem2 = boardRef.current[y + 1][x];
                const gem3 = boardRef.current[y + 2][x];
                if (!gem1 || !gem2 || !gem3) continue;

                if (gem1.data.type === gem2.data.type && gem1.data.type === gem3.data.type) {
                    return true;
                }
            }
        }

        return false;
    };

    const checkMatches = () => {
        const matches = new Set();

        for (let y = 0; y < config.rows; y++) {
            for (let x = 0; x < config.cols - 2; x++) {
                const gem1 = boardRef.current[y][x];
                const gem2 = boardRef.current[y][x + 1];
                const gem3 = boardRef.current[y][x + 2];

                if (!gem1 || !gem2 || !gem3) continue;

                if (gem1.data.type === gem2.data.type && gem1.data.type === gem3.data.type) {
                    let xx = x;
                    while (xx < config.cols && boardRef.current[y][xx]?.data?.type === gem1.data.type) {
                        matches.add(boardRef.current[y][xx]);
                        xx++;
                    }
                }
            }
        }

        for (let x = 0; x < config.cols; x++) {
            for (let y = 0; y < config.rows - 2; y++) {
                const gem1 = boardRef.current[y][x];
                const gem2 = boardRef.current[y + 1][x];
                const gem3 = boardRef.current[y + 2][x];

                if (!gem1 || !gem2 || !gem3) continue;

                if (gem1.data.type === gem2.data.type && gem1.data.type === gem3.data.type) {
                    let yy = y;
                    while (yy < config.rows && boardRef.current[yy][x]?.data?.type === gem1.data.type) {
                        matches.add(boardRef.current[yy][x]);
                        yy++;
                    }
                }
            }
        }

        return matches;
    };

    const destroyGems = (gems) => {
        const validGems = gems.filter(gem => gem && gem.parent && !gem.destroyed);
        if (validGems.length === 0) return Promise.resolve();

        const basePoints = 10;
        const comboMultiplier = combo > 0 ? combo : 1;
        const pointsToAdd = validGems.length * basePoints * comboMultiplier;
        setScore(prevScore => prevScore + pointsToAdd);

        validGems.forEach(gem => {
            const { x, y } = gem.data;
            boardRef.current[y][x] = null;

            if (gem && gem.position) {
                createSimpleExplosion(gem);
            }

            safeDestroyGem(gem);
        });

        return new Promise(resolve => setTimeout(resolve, 300));
    };

    const createSimpleExplosion = (gem) => {
        if (!gem || !gem.position || !gem.parent || !appRef.current) return;

        for (let i = 0; i < 8; i++) {
            const particle = new PIXI.Graphics()
                .beginFill(config.resources.gems[gem.data.type].light)
                .drawCircle(0, 0, 2)
                .endFill();

            particle.position.set(gem.position.x, gem.position.y);
            gem.parent.addChild(particle);

            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;

            const updateParticle = (delta) => {
                if (!particle || !particle.parent) {
                    appRef.current.ticker.remove(updateParticle);
                    return;
                }

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

            if (appRef.current.ticker) {
                appRef.current.ticker.add(updateParticle);
            }
        }
    };

    const dropGems = () => {
        const columnsData = Array(config.cols).fill().map(() => ({
            emptyCount: 0,
            gemsToMove: []
        }));

        for (let x = 0; x < config.cols; x++) {
            for (let y = config.rows - 1; y >= 0; y--) {
                const gem = boardRef.current[y][x];
                if (!gem) {
                    columnsData[x].emptyCount++;
                } else if (columnsData[x].emptyCount > 0) {
                    columnsData[x].gemsToMove.push({
                        gem: gem,
                        newY: y + columnsData[x].emptyCount
                    });
                }
            }
        }

        const movePromises = [];
        const cellSize = config.gemSize + config.gemPadding;

        columnsData.forEach((colData, x) => {
            colData.gemsToMove.forEach(({ gem, newY }) => {
                if (!gem || !gem.position) {
                    console.error("Гем не существует или не имеет позиции!");
                    return;
                }

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

        return Promise.all([...movePromises, ...createPromises]);
    };

    const createGemAt = useCallback((x, y, withAnimation) => {
        if (x < 0 || x >= config.cols || y < 0 || y >= config.rows) {
            console.error(`Invalid coordinates: (${x}, ${y})`);
            return null;
        }

        if (!boardContainerRef.current || !boardRef.current) {
            console.error('Board containers not initialized');
            return null;
        }

        const gemType = getRandomGemTypeWithoutMatches(x, y);
        const gem = createGem(gemType, x, y);
        if (!gem) return null;

        if (boardRef.current[y][x]) {
            safeDestroyGem(boardRef.current[y][x]);
        }

        setupGemPosition(gem, x, y, withAnimation);
        boardRef.current[y][x] = gem;
        return gem;
    }, [config, getRandomGemTypeWithoutMatches]);

    const setupGemPosition = (obj, x, y, withAnimation) => {
        const cellSize = config.gemSize + config.gemPadding;
        const targetX = x * cellSize + config.gemSize / 2;
        const targetY = y * cellSize + config.gemSize / 2;

        if (withAnimation) {
            const startY = -config.gemSize * 2;
            obj.position.set(targetX, startY);

            gsap.to(obj.position, {
                x: targetX,
                y: targetY,
                duration: 0.5 + y * 0.05,
                ease: "bounce.out"
            });
        } else {
            obj.position.set(targetX, targetY);
        }

        boardContainerRef.current.addChild(obj);
    };

    const hasValidMoves = () => {
        for (let y = 0; y < config.rows; y++) {
            for (let x = 0; x < config.cols; x++) {
                if (x < config.cols - 1 && checkSwapMatch(x, y, x + 1, y)) return true;
                if (y < config.rows - 1 && checkSwapMatch(x, y, x, y + 1)) return true;
            }
        }
        return false;
    };

    const checkSwapMatch = (x1, y1, x2, y2) => {
        [boardRef.current[y1][x1], boardRef.current[y2][x2]] = [boardRef.current[y2][x2], boardRef.current[y1][x1]];
        const hasMatch = checkPotentialMatches();
        [boardRef.current[y1][x1], boardRef.current[y2][x2]] = [boardRef.current[y2][x2], boardRef.current[y1][x1]];
        return hasMatch;
    };

    const removeInitialMatches = () => {
        let matchesFound;
        do {
            matchesFound = false;
            const matches = new Set();

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

    const recreateBoard = () => {
        isRecreatingRef.current = true;
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

        return new Promise((resolve) => {
            gsap.to(message, {
                alpha: 0,
                duration: 2,
                delay: 1,
                onComplete: () => {
                    if (message.parent) {
                        message.parent.removeChild(message);
                    }
                    initializeGems();
                    removeInitialMatches();
                    isRecreatingRef.current = false;
                    resolve();
                }
            });
        });
    };

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

    const updateCombo = (newCombo) => {
        setCombo(newCombo);
        if (comboTextRef.current) {
            if (newCombo > 1) {
                comboTextRef.current.text = `COMBO x${newCombo}!`;
                comboTextRef.current.alpha = 1;
                gsap.to(comboTextRef.current, { alpha: 0, duration: 1, delay: 0.5 });
            } else {
                comboTextRef.current.alpha = 0;
            }
        }
    };

    return {
        boardRef,
        selectedGemRef,
        lastSelectedGemRef,
        combo,
        score,
        initializeBoard,
        initializeGems,
        isAdjacent,
        swapGems,
        revertSwap,
        checkPotentialMatches,
        checkMatches,
        destroyGems,
        dropGems,
        createGemAt,
        hasValidMoves,
        removeInitialMatches,
        recreateBoard,
        setupComboText,
        updateCombo
    };
};