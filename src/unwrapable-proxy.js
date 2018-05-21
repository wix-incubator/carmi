function unwrapableProxies(proxyHandler) {
  const proxyToObjMap = new WeakMap();

  function wrap(val) {
    if (proxyToObjMap.has(val)) {
      return val;
    }
    const res = new Proxy(val, proxyHandler);
    proxyToObjMap.set(res, val);
    return res;
  }

  function unwrap(proxy) {
    const res = proxyToObjMap.has(proxy) ? proxyToObjMap.get(proxy) : proxy;
    if (Array.isArray(res)) {
      res.forEach((val, key) => {
        res[key] = unwrap(val);
      });
    } else if (typeof res === 'object' && res !== null) {
      Object.getOwnPropertyNames(res).forEach(key => {
        res[key] = unwrap(res[key]);
      });
    }
    return res;
  }

  return { unwrap, wrap };
}

module.exports = unwrapableProxies;
