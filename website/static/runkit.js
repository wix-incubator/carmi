window.addEventListener('load', function() {
  const preamble = 'const fromSource = (model, input = [1, 2, 3], lib = {}) => eval(require("carmi").compile(model))(input, lib)'
  const script = document.createElement('script')
  script.addEventListener('load', () => Array.from(document.getElementsByClassName('hljs')).map(element => {

    element.addEventListener('click', () => {
      const source = element.innerText
      const container = document.createElement('div')
      container.style.overflow = 'hidden'
      element.parentNode.appendChild(container)
      element.style.display = 'none'
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

