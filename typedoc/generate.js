const fs = require('fs')
const path = require('path')
const _ = require('lodash')
const typedoc = require('typedoc')

const genSignature = (signatures) => _(signatures)
  .get('0.parameters', [])
  .map((param) => _(param)
    .get('name', '*')
  )
  .join(', ')

const genExample = (src) => src ? '```js\n' + src.text.trim() + '\n```' : ''
const generateApiDocs = (src) => _
  .chain(new typedoc.Application({
    exclude: '**/node_modules/**',
    ignoreCompilerErrors: true,
    includeDeclarations: true
  }))
  .thru(app => app.convert([src]))
  .thru(app => app.toObject())
  .get('children[0].children')
  .filter(({comment}) => comment)
  .map(({id, comment: {shortText: name}, kindString: type, children}) => {
    const [inherited, methods] = _(children)
      .filter(({kindString}) => kindString == 'Method')
      .sortBy('name')
      .partition('inheritedFrom')
      .value()
    //${inherited.map(({name, inheritedFrom: {name: parent, id}}) =>)}
    return [path.resolve(__dirname, `../docs/api/${name}.md`),
      `---
      id: ${name}
      title: ${name}
      sidebar_label: ${name}
      ---
      ${methods.map(({id, name, kindString: type, signatures}) =>
        `## \`${name}(${genSignature(signatures)})\` ${_.chain(signatures).get('0.comment.tags', []).some({ tag: 'sugar' }).value() ? '🍬' : ''}
        ${_.get(signatures, '0.comment.shortText', 'MISSING DESCR')}
        ${genExample(_.chain(signatures).get('0.comment.tags', []).find({tag: 'example'}).value())}`
      ).join('\n')}
    `.split('\n').map(l => l.trim()).join('\n')]
  })
  .each((args) => fs.writeFileSync(...args))
  .commit()


generateApiDocs(path.resolve(__dirname, '../typings/index.d.ts'))
