/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');

class Footer extends React.Component {
  docUrl(doc, language) {
    const baseUrl = this.props.config.baseUrl;
    return baseUrl + 'docs/' + (language ? language + '/' : '') + doc;
  }

  pageUrl(doc, language) {
    const baseUrl = this.props.config.baseUrl;
    return baseUrl + (language ? language + '/' : '') + doc;
  }

  render() {
    const currentYear = new Date().getFullYear();
    const repoUrl = 'https://github.com/' + this.props.config.repoName;
    return (
      <footer className="nav-footer" id="footer">
        <section className="sitemap">
          <a href={this.props.config.baseUrl} className="nav-home">
            {this.props.config.footerIcon && (
              <img
                src={this.props.config.baseUrl + this.props.config.footerIcon}
                alt={this.props.config.title}
                width="100"
                height="28"
              />
            )}
          </a>
          <div>
            <h5>Docs</h5>
            <a href={this.docUrl('introduction/getting-started.html', this.props.language)}>Getting Started</a>
            <a href={this.docUrl('introduction/design.html', this.props.language)}>Design</a>
            <a href={this.docUrl('api/api.html', this.props.language)}>API Reference</a>
            <a href={this.docUrl('help.html', this.props.language)}>Help</a>
          </div>
          <div>
            <h5>More</h5>
            <a href={repoUrl}>GitHub</a>
            <a
              className="github-button"
              href={repoUrl}
              data-icon="octicon-star"
              data-count-href={'/' + this.props.config.repoName + '/stargazers'}
              data-show-count={true}
              data-count-aria-label="# stargazers on GitHub"
              aria-label="Star this project on GitHub"
            >
              Star
            </a>
          </div>
        </section>
        <section className="copyright">{this.props.config.copyright}</section>
      </footer>
    );
  }
}

module.exports = Footer;
