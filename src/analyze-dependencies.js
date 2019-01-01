'use strict'
const path = require('path')
const fs = require('fs')
const resolve = require('resolve')
const {parse} = require('babylon');
const walk = require('babylon-walk');
// const ts = require('typescript')
//
// function printAllChildren(node, deps) {
//   for (const c of node.getChildren()) {
//     printAllChildren(c, deps)
//     if (ts.formatSyntaxKind(c.kind) === 'ImportDeclaration') {
//       // console.log(ts.formatSyntaxKind(c.kind))
//       deps.push(c.moduleSpecifier.text)
//     }
//   }
// }

// function readTS(p) {
//   const childDeps = [];
//   const sourceFile = ts.createSourceFile('foo.ts', p, ts.ScriptTarget.ES5, true);
//   printAllChildren(sourceFile, childDeps);
//   // console.log(sourceFile)
//   return childDeps
// }

function readJS(p) {
  const ast = parse(p, {sourceType: 'module', plugins: ['typescript', 'objectRestSpread']})

  const visitors = {
    ImportDeclaration(node, state) {
      state.push(node.source.value)
    },
    CallExpression(node, state) {
      if (node.callee.name === 'require' && node.arguments.length > 0 && node.arguments[0].type === 'StringLiteral') {
        state.push(node.arguments[0].value)
      }
    }
  };

  const childDeps = [];
  walk.recursive(ast, visitors, childDeps);
  return childDeps;
}

/**
 * @param {string} modulePath
 * @param {Set} visited
 * @param {string[]} imports
 */
function readModule(modulePath, visited, imports) {
  if (visited.has(modulePath)) {
    return
  }
  visited.add(modulePath)
  const p = fs.readFileSync(modulePath).toString()

  // const childDeps = path.extname(modulePath) === '.ts' ? readTS(p) : readJS(p);
  const childDeps = readJS(p)

  // node 10
  // const {createRequireFromPath} = require('module')
  // const requireUtil = createRequireFromPath(modulePath)

  for (const i of childDeps) {
    // try {
      const p = tryResolveExt(path.dirname(modulePath), i)
      if (p && !/node_modules/.test(p)) {
        imports.push(p)
        readModule(p, visited, imports)
      }
    // } catch (e) {
    //   console.log('error parsing file', i, e)
    // }
  }

  return imports
}

function tryResolveExt(dir, i) {
  const vars = ['.js', '.ts']
  for (const v of vars) {
    const r = tryResolve(dir, addExt(i, v))
    if (r) {
      return r
    }
  }
}

function tryResolve(basedir, i) {
  try {
    return resolve.sync(i, {basedir})
    // return requireUtil.resolve(i)
  } catch (e) {
    // console.log(i, e)
  }
}

function addExt(f, ext = '.js') {
  const exts = ['.js', '.json', '.ts']
  return exts.includes(path.extname(f)) ? f : f + ext
}

/**
 * @param {string} file
 * @return {string[]}
 */
function analyzeDependencies(file) {
  const visited = new Set()
  const imports = [file]
  readModule(file, visited, imports)
  // console.log(imports)
  return imports
}

const getTime = file => fs.statSync(file).mtime
const isEveryFileBefore = (files, time) => files.every(f => getTime(f) < time)

function isUpToDate(input, output) {
  try {
    if (!fs.existsSync(output)) {
      return false
    }
    const deps = analyzeDependencies(input)
    const outTime = getTime(output)
    // console.log(outTime)
    // console.log(deps.map(f => [f, getTime(f)]))
    return isEveryFileBefore(deps, outTime)
  } catch (e) {
    // console.log(e)
    return false
  }
}

module.exports = {
  isUpToDate,
  analyzeDependencies
}
