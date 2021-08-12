const destruct = (obj) => new Proxy(obj, {
    get(target, p) {
        if (p === Symbol.iterator) {
            return function *() {
                let a = 0
                while (true) {
                    yield target.get(a)
                    a += 1
                }
            }
        }
      return target.get(p)
    }
  })

module.exports = {destruct}
