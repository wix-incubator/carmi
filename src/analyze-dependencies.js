'use strict'
const path = require('path')
const fs = require('fs')
const resolve = require('resolve')
const astUtils = require('./utils/astUtils')

/**
 * @param {string} modulePath
 * @param {*} visited
 * @param {string[]} imports
 */
function readModule(modulePath, visited, imports) {
  if (visited[modulePath]) {
    return
  }
  visited[modulePath] = true
  const p = fs.readFileSync(modulePath)
  const ast = astUtils.tryParse(p)

  const childDeps = []

  astUtils.traverseAst(ast, function (node) {
    if (node.type === 'ImportDeclaration') {
      childDeps.push(node.source.value)
    } else if (node.type === 'CallExpression' && node.callee.name === 'require') {
      // this.skip()
      if (node.arguments.length > 0 && node.arguments[0].type === 'Literal') {
        childDeps.push(node.arguments[0].value)
      }
    }
  })

  // node 10
  // const {createRequireFromPath} = require('module')
  // const requireUtil = createRequireFromPath(modulePath)

  for (const i of childDeps) {
    try {
      const p = tryResolveExt(path.dirname(modulePath), i)
      if (p && !/node_modules/.test(p)) {
        imports.push(p)
        readModule(p, visited, imports)
      }
    } catch (e) {
      console.log(i, e)
    }
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
  if (!fs.existsSync(output)) {
    return false
  }
  const deps = analyzeDependencies(input)
  const outTime = getTime(output)
  // console.log(outTime)
  // console.log(deps.map(f => [f, getTime(f)]))
  return isEveryFileBefore(deps, outTime)
}

module.exports = {
  isUpToDate,
  analyzeDependencies
}
