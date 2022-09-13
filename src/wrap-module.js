function wrapModule(format, source, name, compiler) {
  if (compiler === 'simple' || compiler === 'naive') {
    // The output of is always in cjs format and it's already exported within the template
    return source
  }

  switch (format) {
    case 'iife':
      return `var ${name} = (function () {
            return ${source}
          }())`;
    case 'cjs':
      return `module.exports = ${source}`;
    case 'esm':
      return `export default ${source}`;
    case 'umd':
      return `
            (function (global, factory) {
              typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
              typeof define === 'function' && define.amd ? define(factory) :
              (global.${name} = factory());
            }(this, (function () {
              return ${source}
            })))
          `;
    case 'amd':
      return `
            define(function () {
              return ${source}
            });
          `;
    default:
      return `(function () {
            'use strict';
            return ${source}
          })()`;
  }
}

module.exports = wrapModule;