const {analyzeDependencies, isUpToDate} = require('../analyze-dependencies')
const {resolve} = require('path')
const {close, open} = require('fs-extra')

const res = f => resolve(__dirname, '../testData', f);

const resObject = (obj) => {
  const result = {};

  for (const key in obj) { //eslint-disable-line guard-for-in
    result[res(key)] = obj[key].map(res);
  }

  return result;
}

const fsTouch = filename => open(filename, 'w').then(close);

describe('analyze-dependencies', () => {
  it('should read cjs', () => {
    const deps = analyzeDependencies(res('cjs/a.carmi.js'))
    expect(deps).toEqual(resObject({
      'cjs/a.carmi.js': ['cjs/b.carmi.js'],
      'cjs/b.carmi.js': ['cjs/c.carmi.js'],
      'cjs/c.carmi.js': []
    }))
  })

  it('should read ts', () => {
    const deps = analyzeDependencies(res('ts/a.carmi.js'))
    expect(deps).toEqual(resObject({
      'ts/a.carmi.js': ['ts/b.carmi.ts'],
      'ts/b.carmi.ts': ['ts/c.carmi.js'],
      'ts/c.carmi.js': []
    }))
  })

  it('should read ts from package.json main field', async () => {
    const deps = analyzeDependencies(res('ts/e.carmi.ts'), null)
    expect(deps).toEqual(resObject({
      'ts/e.carmi.ts': ['ts/d/main.carmi.ts'],
      'ts/d/main.carmi.ts': ['ts/d/f.carmi.js'],
      'ts/d/f.carmi.js': []
    }))
  })

  it('should read esm', () => {
    const deps = analyzeDependencies(res('esm/a.carmi.js'))
    expect(deps).toEqual(resObject({
      'esm/a.carmi.js': ['esm/b.carmi.js'],
      'esm/b.carmi.js': ['esm/c.carmi.js'],
      'esm/c.carmi.js': []
    }))
  })

  it('should isUpToDate when output is new', async () => {
    await fsTouch(res('esm/a.output.js'))
    const deps = analyzeDependencies(res('esm/a.carmi.js'))
    const upToDate = isUpToDate(Object.keys(deps), res('esm/a.output.js'))
    expect(upToDate).toEqual(true)
  })

  it('should isUpToDate when input is new', async () => {
    await fsTouch(res('esm/c.carmi.js'))
    // fs.appendFile(res('esm/a.carmi.js'), '')
    const deps = res('esm/a.carmi.js')
    const upToDate = isUpToDate(deps, res('esm/a.output.js'))
    expect(upToDate).toEqual(false)
  })
})
