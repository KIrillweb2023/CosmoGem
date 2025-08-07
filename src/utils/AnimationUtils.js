import { gsap } from "gsap"

export const AnimateHover = (gem, { x, y, duration, ease }) => {
    return gsap.to(gem.scale, {
        x: x,
        y: y,
        duration: duration,
        ease: ease
    })
}
export const AnimatePosition = (gem, { x, y, duration, ease, onComplete }) => {
    return gsap.to(gem.position, {
        x: x,
        y: y,
        duration: duration,
        ease: ease,
        onComplete: onComplete
    });
}