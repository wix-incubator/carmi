module.exports = (func) => {
    const cache = new WeakMap();
    return (arg) => {
        if (!cache.has(arg)) {
            cache.set(arg, func(arg));
        }
        return cache.get(arg);
    }
}