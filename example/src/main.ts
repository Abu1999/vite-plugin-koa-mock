const app = document.querySelector<HTMLDivElement>('#app') as HTMLDivElement

app.innerHTML = '<div></div>'

setInterval(async () => {
  const res = await fetch('/mock/foo')
  const child = document.createElement('p')
  child.innerText = await res.text()
  app.appendChild(child)
}, 2000)

export {}
