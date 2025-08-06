const app = document.querySelector<HTMLDivElement>('#app') as HTMLDivElement

app.innerHTML = '<div></div>'

setTimeout(async () => {
  const res = await fetch('/api/foo')
  const child = document.createElement('p')
  child.innerText = await res.text()
  app.appendChild(child)
}, 2000)

export {}
