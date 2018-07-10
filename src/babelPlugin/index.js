"use strict";

const isCarmiRegex = /^(.+\.carmi)(?:\.js)?$/;
const isCarmi = x => isCarmiRegex.test(x);
const { relative, resolve } = require("path");
const compileFile = require("./compileFile");
const babylon = require("babylon");

const parseCompiledFile = code => {
  const compiledAST = babylon.parse(code);
  const functionInAST = compiledAST.program.body[0].expression;
  return functionInAST;
};

const ALREADY_COMPILED_DIRECTIVE = "carmi-compiled";

module.exports = function carmiBabelTransform({ types: t }) {
  return {
    name: "carmi",
    pre() {
      this.doWork = isCarmi(this.file.opts.filename);
      this.requireExpressions = [];
    },
    visitor: {
      Program(path, state) {
        if (!this.doWork) return;
        this.programPath = path;
      },
      DirectiveLiteral(path) {
        if (!this.doWork) return;
        this.doWork = path.node.value !== ALREADY_COMPILED_DIRECTIVE;
      },
      CallExpression(path) {
        if (!this.doWork) return;
        if (
          path.node.callee.name === "require" &&
          path.node.arguments[0].value !== "carmi"
        ) {
          this.requireExpressions.push(path.node);
        }
      }
    },
    post() {
      if (!this.doWork) return;
      const compiledFile = compileFile(this.file.opts.filename);
      const functionAST = parseCompiledFile(compiledFile);
      const moduleExportsAssignment = t.assignmentExpression(
        "=",
        t.identifier("module.exports"),
        functionAST
      );
      const expressions = this.requireExpressions
        .concat([moduleExportsAssignment])
        .map(e => t.expressionStatement(e));
      const alreadyCompiledDirective = t.directive(
        t.directiveLiteral(ALREADY_COMPILED_DIRECTIVE)
      );
      this.programPath.replaceWith(
        t.program(expressions, [alreadyCompiledDirective])
      );
    }
  };
};
