const VirtualMachineInstance = require('./virtual-machine');

function extractConstants($bytecode) {
  // console.log($bytecode);
  const dataView = new Uint32Array($bytecode);
  // console.log({header: [dataView[0], dataView[1], dataView[2]]});
  const textOffsets = dataView[0] * 2 + dataView[1] + dataView[2] + 3;
  const textView = new Uint16Array($bytecode, textOffsets * 4);
  const unis = [];
  for (let i = 0; i < textView.length; i++) {
    unis.push(textView[i]);
  }
  const str = String.fromCharCode.apply(null, unis);
  // console.log(str);
  return JSON.parse(str);
}

function loadBytecode($bytecode) {
  const $constants = extractConstants($bytecode);

  return function instance($model, $funcLibRaw, $batchingStrategy) {
      // console.log('create instance');
      const virtualMachine = new VirtualMachineInstance($constants, $bytecode, $model, $funcLibRaw, $batchingStrategy)
      return virtualMachine.$res;
  };
}

module.exports = loadBytecode;
