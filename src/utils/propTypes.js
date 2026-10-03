// Small runtime prop checks without adding a dependency for a handful of components.
export const stringProp = (props, name, component) => props[name] != null && typeof props[name] !== 'string'
    ? new Error(`${component}.${name} must be a string`) : null
export const objectProp = (props, name, component) => props[name] != null && typeof props[name] !== 'object'
    ? new Error(`${component}.${name} must be an object`) : null
export const nodeProp = () => null
