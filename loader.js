// Usage: `require('carmi/loader!./file.carmi')`
// or just setup as a default loader for `.carmi.js$` files

'use strict';

const _ = require('lodash');
const {compile} = require('carmi');

const clearAllCarmiModules = () => {
    _(require.cache).keys().filter(k => k.endsWith('.carmi.js')).forEach(key => {
        delete require.cache[key];
    });
};

module.exports = function CarmiLoader() {
    this.cacheable(false);
    const callback = this.async();
    const srcPath = this.getDependencies()[0];
    clearAllCarmiModules();
    compile(require(srcPath), {compiler: 'optimizing', format: 'cjs'}).then(compiledCode => {
        callback(null, compiledCode);
    }).catch(err => callback(err));
};
