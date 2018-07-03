// Usage: `require('carmi/loader!./file.carmi')`
// or just setup as a default loader for `.carmi.js$` files

'use strict'

const {compile} = require('carmi');

module.exports = function CarmiLoader() {
    const callback = this.async();
    const carmiModuleSourcePath = this.getDependencies()[0];
    const carmiModule = require(carmiModuleSourcePath);
    compile(carmiModule, {compiler: 'optimizing', format: 'cjs'}).then(compiledCode => {
        callback(null, compiledCode);
    }).catch(err => callback(err));
};
