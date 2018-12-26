const { compile, and, or, root, arg0, setter, chain, abstract, implement } = require('../../index');
const {
    describeCompilers,
    currentValues,
    funcLibrary,
    expectTapFunctionToHaveBeenCalled,
    rand
  } = require('../test-utils');
  const _ = require('lodash');

const compiler = 'simple';

describe('test the usage of abstracts', () => {
    it('should be able to create a abstract and implement it later', async () => {
        const todos = abstract('todos');
        const todoTitles = todos.map(todoItem => todoItem.get('text'));
        const allDone = todos.any(todoItem => todoItem.get('done').not()).not()
        implement(todos, root.get('todos'));
        const model = {allDone, todoTitles, set: setter('todos',arg0)}
        const optCode = eval(compile(model, { compiler }));
        const initialState = {todos: [{text:'first', done: false},{text:'second', done: true}]}
        const inst = optCode(initialState, funcLibrary);
        expect(inst.todoTitles).toEqual(['first','second']);
        expect(inst.allDone).toEqual(false);
    });
    it('should throw if abstract is used in expression trying to implement abstract', async () => {
        const todos = abstract('todos');
        const todoTitles = todos.map(todoItem => todoItem.get('title'));
        const allDone = todos.any(todoItem => todoItem.get('done').not()).not()
        expect(() => {
            implement(todos, todos.get(0))
        }).toThrowError()
    });
})
