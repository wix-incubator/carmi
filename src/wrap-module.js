function wrapModule(format, source, name, imports) {
    switch (format) {
        case 'iife':
          return `var ${name} = (function () {
            ${imports}
            return ${source}
          }())`;
        case 'cjs':
          return `${imports}
          module.exports = ${source}`;
        case 'esm':
          return `${imports}
          export default ${source}`;
        case 'umd':
          return `
            (function (global, factory) {
              typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
              typeof define === 'function' && define.amd ? define(factory) :
              (global.${name} = factory());
            }(this, (function () {
              ${imports}
              return ${source}
            })))
          `;
        case 'amd':
          return `
            define(function () {
              ${imports}
              return ${source}
            });
          `;
        default:
          return `(function () {
            'use strict';
            ${imports}
            return ${source}
          })()`;
      }
}

module.exports = wrapModule;