const VirtualMachineInstance = require('./virtual-machine');
function extractConstants($bytecode) {
  // console.log($bytecode);
  const textView = VirtualMachineInstance.getTypedArrayByIndex($bytecode, 7, 2);
  const unis = [];
  for (let i = 0; i < textView.length; i++) {
    unis.push(textView[i]);
  }
  const str = String.fromCharCode.apply(null, unis);
  return JSON.parse(str);
}

function loadBytecode($bytecode) {
  const $constants = extractConstants($bytecode);
  const $globals = new Map();

  return function instance($model, $funcLibRaw, $batchingStrategy) {
      const virtualMachine = new VirtualMachineInstance($constants, $globals, $bytecode, $model, $funcLibRaw, $batchingStrategy)
      return virtualMachine.$res;
  };
}

module.exports = loadBytecode;
