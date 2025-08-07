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
        texture: `${import.meta.env.BASE_URL}/AppIcons/key.png`
    }
};

export { config }