'use strict'

const path = require('path');
const fs = require('fs-extra');
const resolve = require('resolve');
const babelParser = require('@babel/parser');
const walk = require('babylon-walk');
const {execSync} = require('child_process');

function getDependencies(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const ast = babelParser.parse(content, {sourceType: 'module', plugins: ['typescript', 'objectRestSpread', 'classProperties']})

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
    // if (r) {
    //   console.log(p, 'is symlink')
    // }
    return r
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
    return resolve.sync(i, {basedir, preserveSymlinks: false})
    // return requireUtil.resolve(i)
  } catch (e) {
    // console.log(i, e)
  }
}

function addExt(f, ext = '.js') {
  const exts = ['.js', '.json', '.ts']
  return exts.includes(path.extname(f)) ? f : f + ext
}

function mtime(filename) {
  return +fs.statSync(filename).mtime;
}

function loadCache(cacheFilePath) {
  if (!fs.existsSync(cacheFilePath)) {
    return null;
  }

  let data;

  try {
    data = fs.readJsonSync(cacheFilePath);
  } catch (err) {
    return null;
  }

  return {data, time: mtime(cacheFilePath)};
}

function analyzeFile(filePath, cache) {
  if (cache && cache.data[filePath] && mtime(filePath) <= cache.time) {
    return cache.data[filePath];
  }

  let dependencies = [];

  try {
    switch (path.extname(filePath)) {
      case '.ts':
      case '.js':
        dependencies = getDependencies(filePath);
        break;

      default:
        break;
    }
  } catch (error) {
    // fail gracefully, we treat this module as if it has no child dependencies
  }

  return dependencies
    .map(childFilePath => {
      const absoluteChildPath = tryResolveExt(
        path.dirname(filePath),
        childFilePath
      );

      return absoluteChildPath;
    })
    .filter(absoluteChildPath => shouldFollow(absoluteChildPath));
}

function analyzeDependencies(entryFilePath, statsFilePath) {
  const modules = {};
  const cache = loadCache(statsFilePath);

  const queue = [entryFilePath];

  for (const filePath of queue) {
    if (!modules[filePath]) {
      const dependencies = analyzeFile(filePath, cache);

      // push to queue
      queue.push(...dependencies);

      // set our state
      modules[filePath] = dependencies;
    }
  }

  return modules;
}

const isEveryFileBefore = (files, time) => files.every(f => mtime(f) < time)

/**
 * @param {string[]} deps
 * @param {string} cacheFilePath
 * @return {boolean}
 */
function isUpToDate(deps, cacheFilePath) {
  const depsArray = Object.keys(deps)

  try {
    const outTime = mtime(cacheFilePath)
    return isEveryFileBefore(depsArray, outTime)
  } catch (e) {
    return false
  }
}

const getDependenciesHashes = (dependencies) => {
  try {
    const depsArray = Object.keys(dependencies);
    return execSync(`git ls-tree --abbrev=7 --full-name -r HEAD ${depsArray.join(' ')}`, {encoding: 'utf8'}).split('\n').reduce((total, item) => {
      if (item) {
        const [, , hash] = item.split(/\s/);
        return total.concat(hash);
      }
      return total;
    }, []);
  } catch (e) {
    console.warn("Can't use `git ls-tree` for the current cache scenario. Using fallback to `mtime` file check");
    return undefined;
  }
};

module.exports = {
  isUpToDate,
  getDependenciesHashes,
  analyzeDependencies
}
