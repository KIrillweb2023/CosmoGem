import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import * as PIXI from 'pixi.js';
import { safeDestroyGem } from '../utils/safeDestroyGem';


export const useGems = (appRef, boardContainerRef, config, gemTypes, loadedTexturesRef) => {
    const boardRef = useRef([]);
    const selectedGemRef = useRef(null);
    const lastSelectedGemRef = useRef(null);
    const isRecreatingRef = useRef(false);
    const isSwappingRef = useRef(false); // Added to prevent swaps during animation
    const [combo, setCombo] = useState(0);
    const comboTextRef = useRef(null);
    const [score, setScore] = useState(0);



    // Инициализация доски
    const initializeBoard = () => {
        boardRef.current = Array(config.rows).fill().map(() => Array(config.cols).fill(null));
    };

    const sortChildrenByYPosition = useCallback(() => {
        if (!boardContainerRef.current) return;

        boardContainerRef.current.children.sort((a, b) => {
            return a.y - b.y; // Сортируем по Y-координате
        });
    }, []);

    // Создание гема
    const createGem = useCallback((type, x, y) => {
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
    }, [config.gemSize, loadedTexturesRef]);

    const handleGemHover = (gem) => {
        if (isRecreatingRef.current || selectedGemRef.current || isSwappingRef.current) return;

        if (gem.data.hoverAnimation) {
            gem.data.hoverAnimation.kill();
        }

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
        if (isRecreatingRef.current || isSwappingRef.current) return;

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

        if (gem.data.selectionAnimation) {
            gem.data.selectionAnimation.kill();
        }

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
        isSwappingRef.current = true;
        try {
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
        } finally {
            isSwappingRef.current = false;
            selectedGemRef.current = null;
        }
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

    const getRandomGemTypeWithoutMatches = useCallback((x, y, maxAttempts = 50) => {
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

            if (x >= 1 && x < config.cols - 1 &&
                boardRef.current[y][x - 1]?.data.type === gemType &&
                boardRef.current[y][x + 1]?.data.type === gemType) {
                continue;
            }

            if (x < config.cols - 2 &&
                boardRef.current[y][x + 1]?.data.type === gemType &&
                boardRef.current[y][x + 2]?.data.type === gemType) {
                continue;
            }

            // Check vertical matches
            if (y >= 2 &&
                boardRef.current[y - 1][x]?.data.type === gemType &&
                boardRef.current[y - 2][x]?.data.type === gemType) {
                continue;
            }

            if (y >= 1 && y < config.rows - 1 &&
                boardRef.current[y - 1][x]?.data.type === gemType &&
                boardRef.current[y + 1][x]?.data.type === gemType) {
                continue;
            }

            if (y < config.rows - 2 &&
                boardRef.current[y + 1][x]?.data.type === gemType &&
                boardRef.current[y + 2][x]?.data.type === gemType) {
                continue;
            }

            break;
        } while (true);

        return gemType;
    }, [config.cols, config.rows, gemTypes]);

    const initializeGems = useCallback(() => {
        const cellSize = config.gemSize + config.gemPadding;

        for (let y = 0; y < config.rows; y++) {
            for (let x = 0; x < config.cols; x++) {
                if (boardRef.current[y][x] && boardRef.current[y][x].parent) {
                    safeDestroyGem(boardRef.current[y][x]);
                }

                const gemType = getRandomGemTypeWithoutMatches(x, y);
                const gem = createGem(gemType, x, y);
                if (!gem) continue;

                gem.position.set(
                    x * cellSize + config.gemSize / 2,
                    y * cellSize + config.gemSize / 2
                );
                boardContainerRef.current.addChild(gem);
                boardRef.current[y][x] = gem;
            }
        }
    }, [config.cols, config.gemPadding, config.gemSize, config.rows, boardContainerRef, createGem, getRandomGemTypeWithoutMatches]);

    const isAdjacent = (gem1, gem2) => {
        if (!gem1 || !gem2) return false;
        const dx = Math.abs(gem1.data.x - gem2.data.x);
        const dy = Math.abs(gem1.data.y - gem2.data.y);
        return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
    };

    const swapGems = async (gem1, gem2) => {
        if (!gem1 || !gem2) {
            console.error("One of the gems is null!");
            return;
        }

        // Update board state first
        [boardRef.current[gem1.data.y][gem1.data.x], boardRef.current[gem2.data.y][gem2.data.x]] = [gem2, gem1];
        [gem1.data.x, gem2.data.x] = [gem2.data.x, gem1.data.x];
        [gem1.data.y, gem2.data.y] = [gem2.data.y, gem1.data.y];

        const cellSize = config.gemSize + config.gemPadding;
        const gem1TargetX = gem1.data.x * cellSize + config.gemSize / 2;
        const gem1TargetY = gem1.data.y * cellSize + config.gemSize / 2;
        const gem2TargetX = gem2.data.x * cellSize + config.gemSize / 2;
        const gem2TargetY = gem2.data.y * cellSize + config.gemSize / 2;

        await Promise.all([
            new Promise(resolve => {
                gsap.to(gem1.position, {
                    x: gem1TargetX,
                    y: gem1TargetY,
                    duration: 0.3,
                    ease: "power1.out",
                    onComplete: resolve
                });
            }),
            new Promise(resolve => {
                gsap.to(gem2.position, {
                    x: gem2TargetX,
                    y: gem2TargetY,
                    duration: 0.3,
                    ease: "power1.out",
                    onComplete: resolve
                });
            })
        ]);
    };

    const revertSwap = async (gem1, gem2, originalPositions) => {
        if (!gem1 || !gem2) {
            console.error("One of the gems is null when reverting swap!");
            return;
        }

        // Update board state first
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

        await Promise.all([
            new Promise(resolve => {
                gsap.to(gem1.position, {
                    x: gem1OriginalX,
                    y: gem1OriginalY,
                    duration: 0.3,
                    ease: "power1.out",
                    onComplete: resolve
                });
            }),
            new Promise(resolve => {
                gsap.to(gem2.position, {
                    x: gem2OriginalX,
                    y: gem2OriginalY,
                    duration: 0.3,
                    ease: "power1.out",
                    onComplete: resolve
                });
            })
        ]);
    };

    const checkPotentialMatches = () => {
        // Temporarily disable this check as it's not reliable
        // Implement proper move checking instead
        return true;
    };

    const checkMatches = () => {
        const matches = new Set();

        // Check horizontal matches
        for (let y = 0; y < config.rows; y++) {
            for (let x = 0; x < config.cols - 2; x++) {
                const gem1 = boardRef.current[y][x];
                if (!gem1) continue;

                let matchLength = 1;
                while (x + matchLength < config.cols &&
                    boardRef.current[y][x + matchLength]?.data?.type === gem1.data.type) {
                    matchLength++;
                }

                if (matchLength >= 3) {
                    for (let i = 0; i < matchLength; i++) {
                        matches.add(boardRef.current[y][x + i]);
                    }
                }
                x += matchLength - 1;
            }
        }

        // Check vertical matches
        for (let x = 0; x < config.cols; x++) {
            for (let y = 0; y < config.rows - 2; y++) {
                const gem1 = boardRef.current[y][x];
                if (!gem1) continue;

                let matchLength = 1;
                while (y + matchLength < config.rows &&
                    boardRef.current[y + matchLength][x]?.data?.type === gem1.data.type) {
                    matchLength++;
                }

                if (matchLength >= 3) {
                    for (let i = 0; i < matchLength; i++) {
                        matches.add(boardRef.current[y + i][x]);
                    }
                }
                y += matchLength - 1;
            }
        }

        return matches;
    };

    const destroyGems = async (gems) => {
        const validGems = gems.filter(gem => gem && gem.parent && !gem.destroyed);
        if (validGems.length === 0) return;

        const basePoints = 10;
        const comboMultiplier = combo > 0 ? combo : 1;
        const pointsToAdd = validGems.length * basePoints * comboMultiplier;
        setScore(prevScore => prevScore + pointsToAdd);

        const destroyPromises = validGems.map(gem => {
            return new Promise(resolve => {
                const { x, y } = gem.data;
                boardRef.current[y][x] = null;

                if (gem && gem.position) {
                    createSimpleExplosion(gem);
                }

                safeDestroyGem(gem);
                setTimeout(resolve, 100);
            });
        });

        await Promise.all(destroyPromises);
    };

    const createSimpleExplosion = (gem) => {
        if (!gem || !gem.position || !gem.parent || !appRef.current) return;

        const explosionContainer = new PIXI.Container();
        explosionContainer.position.copyFrom(gem.position);
        gem.parent.addChild(explosionContainer);

        const particleCount = 8 + Math.floor(Math.random() * 5);
        for (let i = 0; i < particleCount; i++) {
            const particle = new PIXI.Graphics()
                .beginFill(config.resources.gems[gem.data.type].light || 0xffffff)
                .drawCircle(0, 0, 2 + Math.random() * 3)
                .endFill();

            particle.position.set(0, 0);
            explosionContainer.addChild(particle);

            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;

            const updateParticle = (delta) => {
                if (!particle.parent) {
                    appRef.current.ticker.remove(updateParticle);
                    return;
                }

                particle.x += Math.cos(angle) * speed * delta;
                particle.y += Math.sin(angle) * speed * delta;
                particle.alpha -= 0.03 * delta;

                if (particle.alpha <= 0) {
                    explosionContainer.removeChild(particle);
                    appRef.current.ticker.remove(updateParticle);
                }
            };

            appRef.current.ticker.add(updateParticle);
        }

        setTimeout(() => {
            if (explosionContainer.parent) {
                explosionContainer.parent.removeChild(explosionContainer);
            }
        }, 1000);
    };

    const dropGems = async () => {
        const columnsData = Array(config.cols).fill().map(() => ({
            emptyCount: 0,
            gemsToMove: []
        }));

        // 1. Сначала анализируем какие камни куда должны упасть
        for (let x = 0; x < config.cols; x++) {
            let emptySpaces = 0;

            for (let y = config.rows - 1; y >= 0; y--) {
                if (!boardRef.current[y][x]) {
                    emptySpaces++;
                } else if (emptySpaces > 0) {
                    const gem = boardRef.current[y][x];
                    const newY = y + emptySpaces;

                    gem.data.y = newY;
                    boardRef.current[newY][x] = gem;
                    boardRef.current[y][x] = null;

                    columnsData[x].gemsToMove.push({ gem, newY });
                }
            }
            columnsData[x].emptyCount = emptySpaces;
        }

        // 2. Анимация падения существующих камней
        const cellSize = config.gemSize + config.gemPadding;
        const fallDuration = 0.4; // Базовая длительность анимации

        // Сначала вычисляем все целевые позиции
        const moveAnimations = columnsData.map((colData, x) => {
            return colData.gemsToMove.map(({ gem, newY }) => {
                const targetY = newY * cellSize + config.gemSize / 2;
                return {
                    gem,
                    targetY,
                    // Чем дальше падает - тем дольше анимация
                    duration: fallDuration + (newY - gem.data.y) * 0.03
                };
            });
        }).flat();

        // Запускаем все анимации падения одновременно
        await Promise.all(
            moveAnimations.map(({ gem, targetY, duration }) => {
                return new Promise(resolve => {
                    gsap.to(gem.position, {
                        y: targetY,
                        duration,
                        ease: "sine.out", // Более плавное замедление
                        onComplete: resolve
                    });
                });
            })
        );

        // 3. Анимация создания новых камней сверху
        const createAnimations = columnsData.map((colData, x) => {
            return Array.from({ length: colData.emptyCount }).map((_, i) => {
                const newY = i; // Верхние позиции
                const delay = i * 0.03; // Небольшая задержка между созданиями

                return {
                    x,
                    newY,
                    delay,
                    // Чем ниже - тем дольше анимация
                    duration: 0.12 + i * 0.05
                };
            });
        }).flat();

        for (const { x, newY, delay, duration } of createAnimations) {
            await new Promise(resolve => {
                setTimeout(async () => {
                    const gem = createGemAt(x, newY, false); // Создаем без анимации
                    if (!gem) return resolve();

                    const startY = -config.gemSize;
                    const targetY = newY * cellSize + config.gemSize / 2;

                    gem.position.set(
                        x * cellSize + config.gemSize / 2,
                        startY
                    );

                    await new Promise(resolveAnim => {
                        gsap.to(gem.position, {
                            y: targetY,
                            duration,
                            ease: "back.out(1.2)", // Красивое "пружинное" движение
                            onComplete: () => {
                                sortChildrenByYPosition();
                                resolveAnim();
                            }
                        });
                    });
                    resolve();
                }, delay * 1000); // Конвертируем в миллисекунды
            });
        }
    };


    const createGemAt = useCallback((x, y, withAnimation) => {
        if (x < 0 || x >= config.cols || y < 0 || y >= config.rows) return null;

        const gemType = getRandomGemTypeWithoutMatches(x, y);
        const gem = createGem(gemType, x, y);
        if (!gem) return null;

        if (boardRef.current[y][x]) {
            safeDestroyGem(boardRef.current[y][x]);
        }

        const cellSize = config.gemSize + config.gemPadding;
        const targetX = x * cellSize + config.gemSize / 2;
        const targetY = y * cellSize + config.gemSize / 2;

        gem.position.set(targetX, withAnimation ? -config.gemSize : targetY);
        boardContainerRef.current.addChild(gem);
        boardRef.current[y][x] = gem;

        // Для новых камней устанавливаем небольшой scale для эффекта "появления"
        if (withAnimation) {
            gem.scale.set(0.8);
            gsap.to(gem.scale, {
                x: 1,
                y: 1,
                duration: 0.2,
                ease: "elastic.out(1, 0.5)"
            });
        }

        sortChildrenByYPosition();
        return gem;
    }, [config, getRandomGemTypeWithoutMatches, createGem, sortChildrenByYPosition]);

    const setupGemPosition = (obj, x, y, withAnimation) => {
        const cellSize = config.gemSize + config.gemPadding;
        const targetX = x * cellSize + config.gemSize / 2;
        const targetY = y * cellSize + config.gemSize / 2;

        if (withAnimation) {
            const startY = -config.gemSize * 2;
            obj.position.set(targetX, startY);
            boardContainerRef.current.addChild(obj);

            gsap.to(obj.position, {
                y: targetY,
                duration: 0.5 + y * 0.05,
                ease: "bounce.out"
            });
        } else {
            obj.position.set(targetX, targetY);
            boardContainerRef.current.addChild(obj);
        }
    };

    const hasValidMoves = () => {
        // Implement proper move checking logic here
        // This is a simplified version - should be improved
        for (let y = 0; y < config.rows; y++) {
            for (let x = 0; x < config.cols; x++) {
                // Check right neighbor
                if (x < config.cols - 1) {
                    [boardRef.current[y][x], boardRef.current[y][x + 1]] =
                        [boardRef.current[y][x + 1], boardRef.current[y][x]];

                    const matches = checkMatches();
                    [boardRef.current[y][x], boardRef.current[y][x + 1]] =
                        [boardRef.current[y][x + 1], boardRef.current[y][x]];

                    if (matches.size > 0) return true;
                }

                // Check bottom neighbor
                if (y < config.rows - 1) {
                    [boardRef.current[y][x], boardRef.current[y + 1][x]] =
                        [boardRef.current[y + 1][x], boardRef.current[y][x]];

                    const matches = checkMatches();
                    [boardRef.current[y][x], boardRef.current[y + 1][x]] =
                        [boardRef.current[y + 1][x], boardRef.current[y][x]];

                    if (matches.size > 0) return true;
                }
            }
        }
        return false;
    };

    const removeInitialMatches = async () => {
        let matchesFound;
        do {
            matchesFound = false;
            const matches = checkMatches();

            if (matches.size > 0) {
                matchesFound = true;
                await destroyGems(Array.from(matches));
                await dropGems();
            }
        } while (matchesFound);
    };

    const recreateBoard = async () => {
        isRecreatingRef.current = true;

        // Clear existing gems
        for (let y = 0; y < config.rows; y++) {
            for (let x = 0; x < config.cols; x++) {
                if (boardRef.current[y][x]) {
                    safeDestroyGem(boardRef.current[y][x]);
                    boardRef.current[y][x] = null;
                }
            }
        }

        // Create new board
        initializeGems();
        await removeInitialMatches();

        isRecreatingRef.current = false;
    };

    const setupComboText = () => {
        if (!comboTextRef.current && appRef.current) {
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
                gsap.to(comboTextRef.current, {
                    alpha: 0,
                    duration: 1,
                    delay: 0.5,
                    ease: "power1.out"
                });
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
        setScore,
        createGemAt,
        hasValidMoves,
        removeInitialMatches,
        recreateBoard,
        setupComboText,
        updateCombo
    };
};