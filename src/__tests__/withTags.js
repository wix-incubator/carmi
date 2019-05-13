const {root, setter, arg0, withTags, compile} = require('../../index');
const {describeCompilers} = require('../test-utils');

describe('withTag', () => { //eslint-disable-line padded-blocks


  // afterEach(() => {
  //   jest.restoreAllMocks()
  // })

  describe('$recalculateWithTags', () => {
    it('should recalculate only values marked by withTags', () => {
      const model = {
        add: withTags(['add'], root.get('x').plus(root.get('y'))),
        mult: root.get('x').mult(root.get('y')),
        set: setter(arg0)
      }

      const optModel = eval(compile(model))
      const initialData = {x: 2, y: 3}

      const instance = optModel(initialData)
      debugger
      instance.$recalculateWithTags(() => {
        instance.set('x', 4)

        expect(instance.add).toEqual(7)
        expect(instance.mult).toEqual(6)
      }, 'add')
    })

    it('should recalculate all once done', () => {
      const model = {
        add: withTags(['add'], root.get('x').plus(root.get('y'))),
        mult: root.get('x').mult(root.get('y')),
        set: setter(arg0)
      }

      const optModel = eval(compile(model))
      const initialData = {x: 2, y: 3}

      const instance = optModel(initialData)
      debugger
      instance.$recalculateWithTags(() => {
        instance.set('x', 4)
      }, 'add')

      expect(instance.add).toEqual(7)
      expect(instance.mult).toEqual(12)
    })

    it('should recalculate dependencies of expressions with tags', () => {
      const add = root.get('x').plus(root.get('y'))
      const model = {
        add,
        doubleAdd: withTags(['doubleAdd'], add.mult(2)),
        mult: root.get('x').mult(root.get('y')),
        set: setter(arg0)
      }

      const optModel = eval(compile(model))
      const initialData = {x: 2, y: 3}

      const instance = optModel(initialData)
      debugger
      instance.$recalculateWithTags(() => {
        instance.set('x', 4)

        expect(instance.add).toEqual(7)
        expect(instance.doubleAdd).toEqual(14)
        expect(instance.mult).toEqual(6)
      }, 'doubleAdd')
    })
  })

})
