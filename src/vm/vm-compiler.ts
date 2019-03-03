const OptimizingCompiler = require('../optimizing-compiler')
import * as rt from './vm-rt'

class VMCompiler extends OptimizingCompiler {
    buildRT() {
        debugger
    }

    buildEnvelope() {
        debugger
        return `function buildEnvelope($projectionData) {
            return ${super.compile()}
        }`
    }

    buildProjectionData() {
        return {}
    }

    compile() {
        return `(${this.buildEnvelope()})(${JSON.stringify(this.buildProjectionData())})`
    }

    allExpressions() {
        return this.mergeTemplate(this.template.updateDerived, {
            RT: this.buildRT()
        })
      }    
}


module.exports = VMCompiler