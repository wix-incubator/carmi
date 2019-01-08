const {analyzeDependencies, isUpToDate} = require('../analyze-dependencies')
const {resolve} = require('path')
const {close, open} = require('fs-extra')

const res = f => resolve(__dirname, '../testData', f);

const fsTouch = filename => open(filename, 'w').then(close);

describe('analyze-dependencies', () => {
  it('should read cjs', () => {
    const deps = analyzeDependencies(res('cjs/a.carmi.js'))
    expect(deps).toEqual(['cjs/a.carmi.js', 'cjs/b.carmi.js', 'cjs/c.carmi.js'].map(res))
  })

  it('should read ts', () => {
    const deps = analyzeDependencies(res('ts/a.carmi.js'))
    expect(deps).toEqual(['ts/a.carmi.js', 'ts/b.carmi.ts', 'ts/c.carmi.js'].map(res))
  })

  it('should read esm', () => {
    const deps = analyzeDependencies(res('esm/a.carmi.js'))
    expect(deps).toEqual(['esm/a.carmi.js', 'esm/b.carmi.js', 'esm/c.carmi.js'].map(res))
  })

  it('should isUpToDate when output is new', async () => {
    await fsTouch(res('esm/a.output.js'))
    const deps = analyzeDependencies(res('esm/a.carmi.js'))
    const upToDate = isUpToDate(deps, res('esm/a.output.js'))
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
