const {analyzeDependencies, isUpToDate} = require('../analyze-dependencies')
const {join} = require('path')
const fs = require('fs')
const {promisify} = require('util');
const open = promisify(fs.open);
const close = promisify(fs.close);

const res = f => join(__dirname, f);

const fsTouch = filename => open(filename, 'w').then(close);

describe('analyze-dependencies', () => {
  it('should read cjs', () => {
    const deps = analyzeDependencies(res('data/cjs/a.carmi.js'))
    expect(deps).toEqual(['data/cjs/a.carmi.js', 'data/cjs/b.carmi.js', 'data/cjs/c.carmi.js'].map(res))
  })

  it('should read esm', () => {
    const deps = analyzeDependencies(res('data/esm/a.carmi.js'))
    expect(deps).toEqual(['data/esm/a.carmi.js', 'data/esm/b.carmi.js', 'data/esm/c.carmi.js'].map(res))
  })

  it('should isUpToDate when output is new', async () => {
    await fsTouch(res('data/esm/a.output.js'))
    const deps = isUpToDate(res('data/esm/a.carmi.js'), res('data/esm/a.output.js'))
    expect(deps).toEqual(true)
  })

  it('should isUpToDate when input is new', async () => {
    await fsTouch(res('data/esm/c.carmi.js'))
    // fs.appendFile(res('data/esm/a.carmi.js'), '')
    const deps = isUpToDate(res('data/esm/a.carmi.js'), res('data/esm/a.output.js'))
    expect(deps).toEqual(false)
  })
})
