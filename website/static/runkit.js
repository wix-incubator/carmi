window.addEventListener('load', function() {
  const preamble = 'const createInstance = (model, input = [1, 2, 3], lib = {}) => eval(require("carmi").compile(model))(input, lib)'
  const script = document.createElement('script')
  script.addEventListener('load', () => Array.from(document.getElementsByClassName('hljs')).map(element => {
    element.style.cursor = 'pointer'
    element.addEventListener('click', () => {
      const source = element.innerText
      const container = document.createElement('code')
      //container.style.overflow = 'hidden'
      element.style.display = 'none'
      //element.parentNode.style.position = 'static'
      //container.style.position = 'absolute'
      element.parentNode.style.background = 'url(/img/loading.gif) no-repeat center'
      element.parentNode.appendChild(container)
      RunKit.createNotebook({
        element: container,
        preamble,
        source
      })
    })
  }))
  script.src = 'https://embed.runkit.com'
  script.async = true
  document.getElementsByTagName('script')[0].parentNode.appendChild(script);

})

