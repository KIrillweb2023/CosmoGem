import * as PIXI from 'pixi.js';


export const PIXIConfig = () => {
    return new PIXI.Application({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x00000000,
        backgroundAlpha: 0,
        transparent: true,
        antialias: true,
        resolution: Math.min(2, window.devicePixelRatio || 1),
        autoDensity: true,
        powerPreference: 'high-performance'
    });
}