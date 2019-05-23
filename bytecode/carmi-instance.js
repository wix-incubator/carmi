const VirtualMachineInstance = require('./virtual-machine');
const base64ArrayBuffer = require('./base64-arraybuffer');
function extractConstants($bytecode) {
  // console.log($bytecode);
  const textView = VirtualMachineInstance.getTypedArrayByIndex($bytecode, 6, 2);
  const unis = [];
  for (let i = 0; i < textView.length; i++) {
    unis.push(String.fromCharCode(textView[i]));
  }
  return JSON.parse(unis.join(''));
}

function loadBytecode($bytecode) {
  if (typeof $bytecode === 'string') {
    $bytecode = base64ArrayBuffer.decode($bytecode);
  }
  const $constants = extractConstants($bytecode);
  const $globals = new Map();

  return function instance($model, $funcLibRaw, $batchingStrategy) {
      const virtualMachine = new VirtualMachineInstance($constants, $globals, $bytecode, $model, $funcLibRaw, $batchingStrategy)
      return virtualMachine.$res;
  };
}

module.exports = loadBytecode;
