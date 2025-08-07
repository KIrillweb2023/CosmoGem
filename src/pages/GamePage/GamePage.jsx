import { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { Link } from "react-router-dom";
import "./GamePage.scss";


import { ScoreGame } from '../../components/ScoreGame/ScoreGame';
import { useGems } from '../../hooks/useGems';
import { setupEventUtils } from '../../utils/setupEventUtils';
import { ErrorShow } from '../../components/ErrorShow/ErrorShow';

import { config } from '../../constants/ConfigurationGame';
import { PIXIConfig } from '../../constants/PixiConfig';
import { LoadTextures } from '../../utils/LoaderTexture';

import { ResizeGame, HandleResize } from '../../utils/ResizeGame';
import { Loader } from '../../components/Loader/Loader';

export const GamePage = () => {
    // Loader
    const [loading, setLoading] = useState(false)

    // Refs
    const appRef = useRef(null);
    const boardContainerRef = useRef(null);
    const resizeTimeoutRef = useRef(null);
    const particlesRef = useRef([]);
    const backgroundRef = useRef(null);

    const gemTypes = Object.keys(config.resources.gems);
    const loadedTexturesRef = useRef({});

    // Custom hooks
    const {
        score,
        initializeBoard,
        initializeGems,
        removeInitialMatches,
        setupComboText,
        setScore,
    } = useGems(appRef, boardContainerRef, config, gemTypes, loadedTexturesRef);

    useEffect(() => {
        const initGame = async () => {
            try {
                setLoading(true)

                if (!PIXI.utils.isWebGLSupported()) {
                    throw new Error('Your device does not support WebGL. Please update your browser.');
                }

                const app = PIXIConfig();
                appRef.current = app;

                const gameContainer = document.getElementById('game-board');
                gameContainer.appendChild(app.view);

                await LoadTextures(appRef, config, loadedTexturesRef, gemTypes);
                createAnimatedBackground();
                initializeBoard();
                ResizeGame(
                    appRef,
                    boardContainerRef,
                    config,
                    () => createAnimatedBackground(),
                    () => updateBoardSize()
                );
                createBoard();
                setupEventUtils(setScore, createBoard);
                window.addEventListener('resize', () => HandleResize(
                    resizeTimeoutRef,
                    appRef,
                    boardContainerRef,
                    config,
                    () => createAnimatedBackground(),
                    () => updateBoardSize()
                ));



                setTimeout(() => setLoading(false), 300)

            } catch (error) {
                console.error('Game initialization error:', error);
                ErrorShow(error.message);
                setLoading(false)
            }
        };

        initGame();

        return () => {
            window.removeEventListener('resize', () => HandleResize(
                resizeTimeoutRef,
                appRef,
                boardContainerRef,
                config,
                () => createAnimatedBackground(),
                () => updateBoardSize()
            ));
            if (appRef.current) {
                appRef.current.destroy(true);
            }
        };
    }, []);

    const createAnimatedBackground = () => {
        // Remove old background if exists
        if (backgroundRef.current) {
            appRef.current.stage.removeChild(backgroundRef.current);
        }

        const background = new PIXI.Container();
        appRef.current.stage.addChildAt(background, 0);
        backgroundRef.current = background;


        // Create twinkling stars
        for (let i = 0; i < 50; i++) {
            const star = new PIXI.Graphics();
            star.beginFill(0xFFFFFF, Math.random() * 0.8 + 0.2);
            star.drawCircle(0, 0, Math.random() * 2 + 1);
            star.endFill();

            star.x = Math.random() * appRef.current.screen.width;
            star.y = Math.random() * appRef.current.screen.height;

            background.addChild(star);

            // Animate stars
            gsap.to(star, {
                alpha: Math.random() * 0.5 + 0.5,
                duration: Math.random() * 2 + 1,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });
        }
    };

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
                gsap.to(boardContainerRef.current, {
                    alpha: 1,
                    duration: 0.3,
                    onComplete: () => {
                        // Add initial particles animation
                        createInitialParticles();
                    }
                });
            }
        });
    };

    const createInitialParticles = () => {
        const particleCount = 30;
        const particles = [];

        for (let i = 0; i < particleCount; i++) {
            const particle = new PIXI.Graphics();
            particle.beginFill(0xFFFFFF);
            particle.drawCircle(0, 0, Math.random() * 3 + 2);
            particle.endFill();

            particle.x = Math.random() * appRef.current.screen.width;
            particle.y = Math.random() * appRef.current.screen.height;
            particle.alpha = 0;

            appRef.current.stage.addChild(particle);
            particles.push(particle);

            gsap.to(particle, {
                alpha: 0.8,
                duration: 0.5,
                delay: Math.random() * 0.5,
                y: particle.y - 100,
                onComplete: () => {
                    appRef.current.stage.removeChild(particle);
                }
            });
        }

        particlesRef.current = particles;
    };

    const clearPreviousBoard = () => {
        if (boardContainerRef.current) {
            appRef.current.stage.removeChild(boardContainerRef.current);
            boardContainerRef.current.destroy({ children: true });
            boardContainerRef.current = null;
        }
    };

    const setupBoardContainer = () => {
        const boardContainer = new PIXI.Container();
        boardContainer.position.set((config.gemPadding + 2.5) * 2, (config.gemPadding + 2.5) * 2);
        appRef.current.stage.addChild(boardContainer);
        boardContainerRef.current = boardContainer;
    };

    const createBoardBackground = () => {
        const cellSize = config.gemSize + config.gemPadding;
        const totalWidth = config.cols * cellSize - config.gemPadding;
        const totalHeight = config.rows * cellSize - config.gemPadding;

        // Main board with gradient
        const boardBg = new PIXI.Graphics();
        boardBg.beginTextureFill({
            texture: createGradientTexture(
                [0x1a223a, 0x2a335a, 0x1a223a],
                totalWidth + 30,
                totalHeight + 30
            )
        });
        boardBg.drawRoundedRect(-15, -15, totalWidth + 30, totalHeight + 30, 20);
        boardBg.endFill();

        // Border with animation
        const border = new PIXI.Graphics();
        border.lineStyle(3, 0x4a6caa, 0.7);
        border.drawRoundedRect(-10, -10, totalWidth + 20, totalHeight + 20, 15);

        // Animate border
        gsap.to(border, {
            alpha: 0.3,
            duration: 2,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });

        // Glow effect
        const glow = new PIXI.Graphics();
        glow.beginFill(0x4a6caa, 0.1);
        glow.drawRoundedRect(-20, -20, totalWidth + 40, totalHeight + 40, 25);
        glow.endFill();
        glow.blur = 5;

        // Add pulsing animation to glow
        gsap.to(glow, {
            alpha: 0.2,
            duration: 3,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });

        // Add cell highlights
        for (let row = 0; row < config.rows; row++) {
            for (let col = 0; col < config.cols; col++) {
                const highlight = new PIXI.Graphics();
                highlight.beginFill(0xFFFFFF, 0.03);
                highlight.drawRoundedRect(
                    col * cellSize,
                    row * cellSize,
                    config.gemSize,
                    config.gemSize,
                    5
                );
                highlight.endFill();

                // Random animation delay
                gsap.to(highlight, {
                    alpha: 0.1,
                    duration: Math.random() * 2 + 1,
                    repeat: -1,
                    yoyo: true,
                    delay: Math.random() * 2,
                    ease: "sine.inOut"
                });

                boardContainerRef.current.addChild(highlight);
            }
        }

        boardContainerRef.current.addChild(glow);
        boardContainerRef.current.addChild(boardBg);
        boardContainerRef.current.addChild(border);
    };

    const createGradientTexture = (colors, width, height) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        const gradient = ctx.createLinearGradient(0, 0, width, height);
        colors.forEach((color, i) => {
            gradient.addColorStop(i / (colors.length - 1), `#${color.toString(16)}`);
        });

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        return PIXI.Texture.from(canvas);
    };

    const createBoard = () => {
        clearPreviousBoard();
        setupBoardContainer();
        createBoardBackground();
        initializeGems();
        removeInitialMatches();
        setupComboText();
    };


    // if (loading) return <Loader />

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