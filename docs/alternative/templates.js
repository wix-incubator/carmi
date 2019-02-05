const _ = require('lodash')
const React = require('react')
const { Fragment } = React
const { renderToStaticMarkup } = require('react-dom/server')
const css = `
  .body {
    margin: 0 auto;
  }
  .wrapper {
    display: block;

  }
  .sidebar {
    height: 100vh;
    overflow: auto;
  }
  .method-name {
  }
`
const Wrapper = (props) => (
  <html>
    <head>
      <meta httpEquiv="refresh" content="20"/>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>{props.title}</title>
      <link rel="stylesheet" href="https://unpkg.com/bootstrap@4.1.0/dist/css/bootstrap.min.css" crossOrigin="anonymous"/>
      <style>{css}</style>
    </head>
    <body>
      {props.children}
      <script src="https://code.jquery.com/jquery-3.3.1.slim.min.js" integrity="sha384-q8i/X+965DzO0rT7abK41JStQIAqVgRVzpbzo5smXKp4YfRvH+8abtTE1Pi6jizo" crossorigin="anonymous"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.6/umd/popper.min.js" integrity="sha384-wHAiFfRlMFy6i5SRaxvfOCifBUQy1xHdJ/yoi7FRNXMRBu5WHdZYu1hA6ZOblgut" crossorigin="anonymous"></script>
      <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.2.1/js/bootstrap.min.js" integrity="sha384-B0UglyR+jN6CkvvICOB2joaf5I4l3gm9GU6Hc1og6Ls7i6U/mkkaduKaBhlAXv9k" crossorigin="anonymous"></script>
    </body>
  </html>
)
const InheritedMethods = ({methods}) =>(
  <ul>
    {methods.map(({name, inheritedFrom: {name: parent, id}}) => (
      <li><a href={`#doc-${id}`}>{parent}</a></li>
    ))}
  </ul>
)
                    // {
                    //     "id": 304,
                    //     "name": "plus",
                    //     "kind": 4096,
                    //     "kindString": "Call signature",
                    //     "flags": {},
                    //     "comment": {
                    //         "shortText": "Resolves to (NativeType + other)"
                    //     },
                    //     "parameters": [
                    //         {
                    //             "id": 305,
                    //             "name": "num",
                    //             "kind": 32768,
                    //             "kindString": "Parameter",
                    //             "flags": {},
                    //             "type": {
                    //                 "type": "reference",
                    //                 "name": "Argument",
                    //                 "id": 1790,
                    //                 "typeArguments": [
                    //                     {
                    //                         "type": "intrinsic",
                    //                         "name": "number"
                    //                     }
                    //                 ]
                    //             }
                    //         }
                    //     ],
const SelfMethods = ({methods}) => <Fragment>
  {methods.map(({id, name, kindString: type, signatures}) =>
    <div className="card m-1" id={`doc-${id}`}>
      <div className="card-body">
        <h5 className="card-title"><a class="method-name" href={`#doc-${id}`}><code>{name}({`<`}{_(signatures)
          .get('0.parameters', [])
          .map((param) => _(param)
            .get('type.typeArguments.0.name', '*any*')
          )
          .join('>, <')}{`>`})</code></a></h5>
        <h6 className="card-subtitle mb-2 text-muted">{type}</h6>
        <p className="card-text">{_.get(signatures, '0.comment.shortText', 'MISSING DESCR')}</p>
      </div>
    </div>
  )}
</Fragment>

const Section = ({id, comment: {shortText: name}, kindString: type, children}) => {
  const [inherited, methods] = _(children)
    .filter(({kindString}) => 'Method' == kindString)
    .sortBy('name')
    .partition('inheritedFrom')
    .value()

  return (
    <div className="card" id={`doc-${id}`}>
      <div className="card-body">
        <h5 className="card-title">{name}</h5>
        <h6 className="card-subtitle mb-2 text-muted">{type}</h6>
        <InheritedMethods methods={inherited} />
        <SelfMethods methods={methods} />
      </div>
    </div>
  )
}
const Sidebar = ({data}) => <sidebar className="col-4">
  <ul className="sidebar">
    {data.map(({id, comment: {shortText: name}, children}) => <li>
      <a href={`#doc-${id}`}>{name}</a>
      <ul>
        {_(children).filter(({kindString}) => 'Method' == kindString)
    .sortBy('name').map(({id, name}) => <li><small><code><a href={`#doc-${id}`}> {name}()</a></code></small></li>).value()}
      </ul>
    </li>)}
  </ul>
</sidebar>
module.exports = {
  Section,
  Sidebar,
  main(props) {
    return `<!DOCTYPE html>
      ${renderToStaticMarkup(Wrapper(props))}
    `
  },
  home({data}) {
    return <wrapper className="container-fluid wrapper">
      <header className="row">
        <h1 className="col">Carmi</h1>
      </header>
      <page className="row">
        <Sidebar data={data} />
        <content className="col">
          {data.map((section) => <Section {...section} />)}
        </content>
      </page>
    </wrapper>
  }
}
