'use strict'
const path = require('path')
const fs = require('fs-extra')
const resolve = require('resolve')
const {parse} = require('babylon');
const walk = require('babylon-walk');
const ts = require('typescript')

function printAllChildren(node, deps) {
  for (const c of node.getChildren()) {
    printAllChildren(c, deps)
    if (ts.formatSyntaxKind(c.kind) === 'ImportDeclaration') {
      // console.log(ts.formatSyntaxKind(c.kind))
      deps.push(c.moduleSpecifier.text)
    }
  }
}

function readTS(p) {
  const childDeps = [];
  const sourceFile = ts.createSourceFile('foo.ts', p, ts.ScriptTarget.ES5, true);
  printAllChildren(sourceFile, childDeps);
  // console.log(sourceFile)
  return childDeps
}

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

  const childDeps = path.extname(modulePath) === '.ts' ? readTS(p) : readJS(p);
  // const childDeps = readJS(p)

  // node 10
  // const {createRequireFromPath} = require('module')
  // const requireUtil = createRequireFromPath(modulePath)

  for (const i of childDeps) {
    // try {
    const p = tryResolveExt(path.dirname(modulePath), i)
    if (shouldFollow(p)) {
      imports.push(p)
      readModule(p, visited, imports)
    }
    // } catch (e) {
    //   console.log('error parsing file', i, e)
    //   throw e
    // }
  }

  return imports
}

/**
 * @param {string} p
 * @return boolean
 */
function shouldFollow(p) {
  if (!p) {
    return false
  }
  if (/node_modules/.test(p)) {
    const arr = p.split('/')
    const pkgPath = arr.splice(0, arr.findIndex(x => x === 'node_modules') + 2).join('/')

    const stats = fs.lstatSync(pkgPath)
    const r = stats.isSymbolicLink()
    if (r) {
      console.log(p, 'is symlink')
    }
    return r
    //'/Users/idok/projects/bolt/bolt-main/node_modules/bolt-components'
  }
  return true
}

// function isSymLink(p) {
//   const stats = fs.lstatSync(p)
//   return stats.isSymbolicLink()
// }

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

/**
 * @param {string} input
 * @param {string} output
 * @param {string} stats
 * @return {*}
 */
function isUpToDate(input, output, stats) {
  try {
    if (!fs.existsSync(output)) {
      return false
    }
    const deps = analyzeDependencies(input)

    if (stats) {
      console.log(stats)
      fs.outputJSONSync(path.resolve(stats), deps);
      console.log('wrote stats to', path.resolve(stats))
    }
    const outTime = getTime(output)
    // console.log(outTime)
    // console.log(deps.map(f => [f, getTime(f)]))
    return isEveryFileBefore(deps, outTime)
  } catch (e) {
    // console.log(e)
    return false
  }
}

// console.log(shouldFollow('/Users/idok/projects/bolt/bolt-main/node_modules/bolt-components'))

module.exports = {
  isUpToDate,
  analyzeDependencies
}
