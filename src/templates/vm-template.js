const {base} = require('./naive')
const {library} = require('./optimizing')
const {rt} = require('../vm/vm-rt')
function updateDerived() {
    /* RT */
    const $vm = buildVM({
        $projectionData,
        $funcLib,
        $funcLibRaw,
        $res,
        library: {
            map: mapOpt,
            any: anyOpt,
            filter: filterOpt,
            filterBy: filterByOpt,
            mapValues: mapValuesOpt,
            recursiveMap: recursiveMapOpt,
            recursiveMapValues: recursiveMapValuesOpt,
            keyBy: keyByOpt,
            mapKeys: mapKeysOpt,
            anyValues: anyValuesOpt,
            groupBy: groupByOpt,
            valuesOrKeysForObject,
            array,
            object,
            call,
            bind,
            assignOrDefaults,
            flatten,
            size,
            sum,
            range,
            set,
            splice,
            push,
            $setter,

            recursiveSteps,
            setOnObject,
            setOnArray,
            deleteOnObject,
            track,
            trackPath,
            triggerInvalidations,

            invalidate,
            untrack,

            mathFunction,
            checkTypes
        },
        ...$vmOptions
    });

    function updateDerived() {
        $vm.step({
            $invalidatedRoots,
            $first,
            $model
        })
    }
}

module.exports = {base, library, updateDerived, rt}