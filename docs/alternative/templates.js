const _ = require('lodash')
const React = require('react')
const { Fragment } = React
const { renderToStaticMarkup } = require('react-dom/server')

const css = (([css]) => <style dangerouslySetInnerHTML={{ "__html": css}} />)`
  .body {
    margin: 0 auto;
  }
  .wrapper {
    display: block;
    height: 100vh
  }
  .method-link{
    font-size: 15px;
    margin-left: -15px;
    visibility: hidden;
  }
  .card-title:hover > .method-link {
    visibility: visible;
  }
  .method-link:hover {
    text-decoration:none;
  }
`
const Wrapper = (props) => (
  <html lang="en">
    <head>
      {/*<meta httpEquiv="refresh" content="20"/>*/}
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="shortcut icon" href="/img/favicon.ico"/>
      <title>{props.title}</title>
      <link rel="stylesheet" href="https://unpkg.com/bootstrap@4.1.0/dist/css/bootstrap.min.css" crossOrigin="anonymous"/>
      {css}
    </head>
    <body>
      {props.children}
    </body>
  </html>
)

const InheritedMethods = ({methods}) =>(
  <ul>
    {methods.map(({name, inheritedFrom: {name: parent, id}}) => (
      <li><a href={`#doc-${id}`}>{name}()</a></li>
    ))}
  </ul>
)
const genSignature = (signatures) => _(signatures)
  .get('0.parameters', [])
  .map((param) => _(param)
    //.tap(console.log.bind(console))
    .get('name', '*')
  )
  .join(', ')

const SelfMethods = ({methods}) => <Fragment>
  {_.chain(methods)
    //.tap((v) => console.dir(v.filter(({id}) => id == 833), {depth: null}))
    .map(({id, name, kindString: type, signatures}) =>
      <div className="card mt-2" id={`doc-${id}`}>
        <div className="card-body">
          <h5 className="card-title">
            <a className="text-secondary method-link" href={`#doc-${id}`}>🔗</a>
            <code>
              {name}({genSignature(signatures)}) {_.get(signatures, '0.comment.tags.0.tag', false) == 'sugar' ? '🍬' : ''}
            </code>
          </h5>
          <p className="card-text">{_.get(signatures, '0.comment.shortText', 'MISSING DESCR')}</p>
        </div>
      </div>
    )
    .value()}
</Fragment>

const Section = ({id, comment: {shortText: name}, kindString: type, children}) => {
  const [inherited, methods] = _(children)
    .filter(({kindString}) => 'Method' == kindString)
    .sortBy('name')
    .partition('inheritedFrom')
    .value()

  return (
    <div className="card mt-2" id={`doc-${id}`}>
      <div className="card-body">
        <h5 className="card-title">{name}</h5>
        <h6 className="card-subtitle mb-2">Inherited methods</h6>
        <InheritedMethods methods={inherited} />
        <h6 className="card-subtitle mb-2">Methods</h6>
        <SelfMethods methods={methods} />
      </div>
    </div>
  )
}

const Sidebar = ({data}) => <sidebar className="d-none d-md-block col-3 align-items-stretch">
  <ul className="sidebar">
    {data.map(({id, comment: {shortText: name}, children}) => <li>
      <a href={`#doc-${id}`}>{name}</a>

      <ul className="method-list">
        {_(children)
          .filter(({kindString, inheritedFrom}) => 'Method' == kindString && !inheritedFrom)
          .sortBy('name')
          .map(({id, name}) =>
            <li><small><code><a href={`#doc-${id}`}> {name}()</a></code></small></li>
          ).value()}
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
      <header className="row align-items-center">
        <a href="/" className="col"><img src="/img/carmi.png" alt="carmi"/></a>
        <div className="col">
          <ul className="nav nav-pills justify-content-end">
            <li className="nav-item">
              <a className="nav-link" href="/docs/getting-started.html">Getting started</a>
            </li>
            <li className="nav-item">
              <a className="nav-link active" href="/api.html">API</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/docs/design.html">Design</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/docs/help.html">Help</a>
            </li>
          </ul>
        </div>
      </header>
      <page className="row">
        <Sidebar data={data} />
        <content className="col">
          {data.map((section) => <Section {...section} />)}
        </content>
      </page>
      <footer className="row mt-2"><span className="col offset-5">Copyright © 2018 Wix</span></footer>
    </wrapper>
  }
}
