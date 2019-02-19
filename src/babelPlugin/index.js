'use strict';

const isCarmiRegex = /^(.+\.carmi)(?:\.js)?$/;
const isCarmiFilename = x => isCarmiRegex.test(x);
const {relative, resolve} = require('path');
const compileFile = require('./compileFile');
const babylon = require('babylon');

const parseCompiledFile = code => {
  const compiledAST = babylon.parse(code);
  const functionInAST = compiledAST.program.body[0].expression;
  return functionInAST;
};

const findCarmiDeclarationComment = file => {
  const comments = file.ast.comments;
  if (!comments) {return null;}
  return comments.find(comment => comment.value.trim().includes('@carmi'));
};

module.exports = function carmiBabelTransform({types: t}) {
  return {
    name: 'carmi',
    pre() {
      this.carmiDeclarationComment = findCarmiDeclarationComment(this.file);
      this.doWork =
        this.carmiDeclarationComment &&
        isCarmiFilename(this.file.opts.filename);
      this.requireExpressions = [];
    },
    visitor: {
      Program(path, state) {
        if (!this.doWork) {return;}
        this.programPath = path;
        this.carmiDeclarationComment.value = this.carmiDeclarationComment.value.replace(
          '@carmi',
          ''
        );
      },
      CallExpression(path) {
        if (!this.doWork) {return;}
        if (
          path.node.callee.name === 'require' &&
          path.node.arguments[0].value !== 'carmi'
        ) {
          this.requireExpressions.push(path.node);
        }
      }
    },
    post() {
      if (!this.doWork) {return;}
      const compiledFile = compileFile(this.file.opts.filename);
      const functionAST = parseCompiledFile(compiledFile);
      const moduleExportsAssignment = t.assignmentExpression(
        '=',
        t.identifier('module.exports'),
        functionAST
      );
      const expressions = this.requireExpressions
        .concat([moduleExportsAssignment])
        .map(e => t.expressionStatement(e));
      this.programPath.replaceWith(t.program(expressions, []));
    }
  };
};
