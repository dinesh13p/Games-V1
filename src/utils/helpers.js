export const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

export const randRange = (min, max) => Math.random() * (max - min) + min
