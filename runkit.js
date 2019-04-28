// from:https://github.com/jserz/js_piece/blob/master/DOM/ChildNode/remove()/remove().md
(function (arr) {
  arr.forEach(function (item) {
    if (item.hasOwnProperty('remove')) {
      return;
    }
    Object.defineProperty(item, 'remove', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: function remove() {
        this.parentNode.removeChild(this);
      }
    });
  });
})([Element.prototype, CharacterData.prototype, DocumentType.prototype]);

window.addEventListener('load', function() {
  const preamble = 'const createInstance = (model, input = [1, 2, 3], lib = {}) => eval(require("carmi").compile(model))(input, lib)'
  const script = document.createElement('script')
  const run = (play) => ({target}) => {
    const element = target.previousSibling
    const source = element.innerText
    element.style.display = 'none'
    element.parentNode.style.background = 'url(/img/loading.gif) no-repeat center'
    RunKit.createNotebook({
      element: element.parentNode,
      preamble,
      source,
      onLoad: () => clean(play)
    })
  }

  const clean = (e) => {
    e.removeEventListener('click', run)
    e.parentElement.style.background = 'initial'
    e.remove()
  }

  script.addEventListener('load', () => Array.from(document.getElementsByClassName('hljs')).map(element => {
    const play = document.createElement('span')
    play.innerText = '▶'
    play.className = 'edit-page-link button interactive-action'
    play.addEventListener('click', run(play))
    element.parentElement.appendChild(play)
  }))
  script.src = 'https://embed.runkit.com'
  script.async = true
  document.getElementsByTagName('script')[0].parentNode.appendChild(script);

})
