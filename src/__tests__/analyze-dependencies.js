const {analyzeDependencies, isUpToDate} = require('../analyze-dependencies')
const {join} = require('path')

const res = f => join(__dirname, f)

const fsTouch = filename => fs.open(filename, 'w').then(fs.close);

describe('analyze-dependencies', () => {
  it('should read cjs', () => {
    const deps = analyzeDependencies(res('data/cjs/a.carmi.js'))
    expect(deps).toEqual(['data/cjs/a.carmi.js', 'data/cjs/b.carmi.js', 'data/cjs/c.carmi.js'].map(res))
  })

  it('should read esm', () => {
    const deps = analyzeDependencies(res('data/esm/a.carmi.js'))
    expect(deps).toEqual(['data/esm/a.carmi.js', 'data/esm/b.carmi.js', 'data/esm/c.carmi.js'].map(res))
  })
  //
  // it('should isUpToDate', () => {
  //   const deps = isUpToDate(res('data/esm/a.carmi.js'), res('data/esm/a.output.js'))
  //   expect(deps).toEqual(['data/esm/a.carmi.js', 'data/esm/b.carmi.js', 'data/esm/c.carmi.js'].map(res))
  // })
})
