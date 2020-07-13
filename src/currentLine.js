'use strict'

const _ = require('lodash')
const callsites = require('callsites')
const sourceMapSupport = require('source-map-support')
const path = require('path')
const carmiRoot = require('../carmiRoot')
const testPaths = [
  '__tests__',
  'babelPlugin'
].map(p => path.resolve(__dirname, p))

function isExternalLine(line) {
  const isCarmi = _.includes(line, carmiRoot)
  const isTest = _.some(testPaths, p => _.includes(line, p))
  return !isCarmi || isTest
}

module.exports = () => {
  const csites = callsites()
  const firstExternalCallsite = sourceMapSupport.wrapCallSite(
    csites.find(
      callsite => isExternalLine(callsite.getFileName())
    )
  )
  const fileName = firstExternalCallsite.getFileName() || 'unknown'
  const lineNumber = firstExternalCallsite.getLineNumber()
  const columnNumber = firstExternalCallsite.getColumnNumber()
  const fileNameWithoutRootFolder = fileName.substr(fileName.indexOf(path.sep))

  const newValue = [
    fileNameWithoutRootFolder, lineNumber, columnNumber
  ].join(':')

  // const s = (new Error()).stack
  // .split('\n')
  // .slice(1)
  // const firstExternalLine = s
  //   .find(isExternalLine) || 'unknown'

  // const oldValue = firstExternalLine
  //   .substr(firstExternalLine.indexOf(path.sep))
  //   .split(':')
  //   .map((str, idx) => idx > 0 ? `${parseInt(str, 10)}` : str)
  //   .join(':')

  // if (newValue !== oldValue) {
  //   console.log('#==========#')
  //   console.log('new: ', newValue, ' s: ', csites.map(csite => {
  //     const cs = sourceMapSupport.wrapCallSite(csite)
  //     return `${cs.getFileName()}:${cs.getLineNumber()}:${cs.getColumnNumber()}\n`
  //   }))
  //   console.log('old: ', oldValue, ' s: ', s)
  //   console.log('#==========#')
  //   return oldValue
  // }
  return newValue
}
