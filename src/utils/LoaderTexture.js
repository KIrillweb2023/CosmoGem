import * as PIXI from "pixi.js";

export const LoadTextures = async (appRef, config, loadedTexturesRef, gemTypes, onProgress) => {
    const textures = {};
    const total = gemTypes.length;
    let loaded = 0;

    const poolSize = 4;
    const chunks = [];

    for (let i = 0; i < gemTypes.length; i += poolSize) {
        chunks.push(gemTypes.slice(i, i + poolSize));
    }

    for (const chunk of chunks) {
        await Promise.all(chunk.map(async (gemType) => {
            try {
                const texture = await PIXI.Texture.fromURL(config.resources.gems[gemType].svg);

                await new Promise(resolve => {
                    setTimeout(() => {
                        const sprite = new PIXI.Sprite(texture);

                        requestAnimationFrame(() => {
                            if (PIXI.filters?.GlowFilter) {
                                sprite.filters = [
                                    new PIXI.filters.GlowFilter({
                                        distance: 15,
                                        outerStrength: 1.5,
                                        innerStrength: 0.5,
                                        color: config.resources.gems[gemType].color,
                                        quality: 0.5
                                    })
                                ];
                            }

                            const renderTexture = PIXI.RenderTexture.create({
                                width: sprite.width,
                                height: sprite.height
                            });

                            appRef.current.renderer.render(sprite, { renderTexture });
                            textures[gemType] = renderTexture;
                            resolve();
                        });
                    }, 0);
                });

            } catch (error) {
                console.warn(`Failed to load texture for ${gemType}`, error);
                textures[gemType] = createFallbackTexture(appRef, config, gemType);
            } finally {
                loaded++;
                if (onProgress) onProgress(loaded / total);
            }
        }));

        await new Promise(resolve => setTimeout(resolve, 50));
    }

    loadedTexturesRef.current = textures;
};

const createFallbackTexture = (appRef, config, gemType) => {
    const graphics = new PIXI.Graphics();
    graphics.beginFill(config.resources.gems[gemType].color);
    graphics.drawCircle(0, 0, 30);
    graphics.endFill();

    const container = new PIXI.Container();

    requestAnimationFrame(() => {
        if (PIXI.filters?.GlowFilter) {
            container.filters = [
                new PIXI.filters.GlowFilter({
                    distance: 15,
                    outerStrength: 2,
                    innerStrength: 0.8,
                    color: config.resources.gems[gemType].color,
                    quality: 0.5
                })
            ];
        }
    });

    container.addChild(graphics);
    const renderTexture = PIXI.RenderTexture.create({ width: 60, height: 60 });
    appRef.current.renderer.render(container, { renderTexture });
    return renderTexture;
};