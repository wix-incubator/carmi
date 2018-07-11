/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');

const CompLibrary = require('../../core/CompLibrary.js');
const MarkdownBlock = CompLibrary.MarkdownBlock; /* Used to read markdown */
const Container = CompLibrary.Container;
const GridBlock = CompLibrary.GridBlock;

const siteConfig = require(process.cwd() + '/siteConfig.js');

function imgUrl(img) {
  return siteConfig.baseUrl + 'img/' + img;
}

function docUrl(doc, language) {
  return siteConfig.baseUrl + 'docs/' + (language ? language + '/' : '') + doc;
}

function pageUrl(page, language) {
  return siteConfig.baseUrl + (language ? language + '/' : '') + page;
}

class Button extends React.Component {
  render() {
    return (
      <div className="pluginWrapper buttonWrapper">
        <a className="button" href={this.props.href} target={this.props.target}>
          {this.props.children}
        </a>
      </div>
    );
  }
}

Button.defaultProps = {
  target: '_self'
};

const SplashContainer = props => (
  <div className="homeContainer">
    <div className="homeSplashFade">
      <div className="wrapper homeWrapper">{props.children}</div>
    </div>
  </div>
);

const Logo = props => (
  <div className="projectLogo">
    <img src={props.img_src} />
  </div>
);

const ProjectTitle = props => (
  <h2 className="projectTitle">
    <small>{siteConfig.tagline}</small>
  </h2>
);

const PromoSection = props => (
  <div className="section promoSection">
    <div className="promoRow">
      <div className="pluginRowBlock">{props.children}</div>
    </div>
  </div>
);

class HomeSplash extends React.Component {
  render() {
    let language = this.props.language || '';
    return (
      <SplashContainer>
        {/* <Logo img_src={imgUrl('logo.png')
      } /> */}
        <div className="inner">
          <ProjectTitle />
          <PromoSection>
            <Button href={docUrl('getting-started.html', language)}>Getting Started</Button>
            <Button href={docUrl('api.html', language)}>API</Button>
          </PromoSection>
        </div>
      </SplashContainer>
    );
  }
}

const Block = props => (
  <Container padding={['bottom', 'top']} id={props.id} background={props.background}>
    <GridBlock align="center" contents={props.children} layout={props.layout} />
  </Container>
);

const Features = props => (
  <Block layout="fourColumn">
    {[
      {
        content: 'All derived state is always up to date, all computation is incremental',
        title: 'Reactive'
      },
      {
        content: 'Values are not boxed, plain objects are 5x-10x faster',
        title: 'Zero Cost Abstraction'
      },
      {
        content: 'Uses a simple declerative lodash inspired syntax',
        title: 'Easy'
      },
      {
        content: 'Focus 100% on your business logic, without boilerplate and get unmatched performance',
        title: 'Simple'
      }
    ]}
  </Block>
);

const IntroText = `
> Phil Keaton - "There are only two hard things in Computer Science: cache invalidation and naming things"

## CARMI let's you ignore cache invalidation without sacrifing performance

Write a naive version of your state deriviation in a lodash inspired syntax and get back an optimizied function
that makes sure all your computation is incremental and super performant
`;

const Intro = props => (
  <div className="productShowcaseSection paddingBottom" style={{ textAlign: 'center' }}>
    <h2>Derived/Computed state with Zero Cost Abstraction</h2>
    <MarkdownBlock>{IntroText}</MarkdownBlock>
  </div>
);

const LearnHow = props => (
  <Block background="light">
    {[
      {
        content: 'Talk about learning how to use this',
        image: imgUrl('docusaurus.svg'),
        imageAlign: 'right',
        title: 'Learn How'
      }
    ]}
  </Block>
);

const TryOut = props => (
  <Block id="try">
    {[
      {
        content: 'Talk about trying this out',
        image: imgUrl('docusaurus.svg'),
        imageAlign: 'left',
        title: 'Try it Out'
      }
    ]}
  </Block>
);

const Description = props => (
  <Block background="dark">
    {[
      {
        content: '',
        image: imgUrl('logo.png'),
        imageAlign: 'right',
        title: ''
      }
    ]}
  </Block>
);

class Index extends React.Component {
  render() {
    let language = this.props.language || '';

    return (
      <div>
        <HomeSplash language={language} />
        <div className="mainContainer">
          <Intro />
          <Features />
          {/* <LearnHow /> */}
          {/* <TryOut /> */}
          <Description />
        </div>
      </div>
    );
  }
}

module.exports = Index;
