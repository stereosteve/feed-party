const dato = document.getElementById('dato')
if (dato) {
  const datoData = JSON.parse(dato.textContent)

  const allItems = []

  datoData.results.map(async (r) => {
    const ok = await fetch(`/fetch?url=${encodeURIComponent(r.url)}`)
    const txt = await ok.text()
    const dom = new DOMParser().parseFromString(txt, 'text/xml')

    for (const itemXml of dom.querySelectorAll('item')) {
      const item = {}
      for (const field of ['title', 'link', 'pubDate']) {
        item[field] = itemXml.querySelector(field).textContent
      }
      item.pubDate = new Date(item.pubDate)
      if (item.title) {
        allItems.push(item)
      }
    }

    rerender()
  })

  function rerender() {
    allItems.sort((a, b) => (a.pubDate > b.pubDate ? -1 : 1))
    const html = allItems
      .map(
        (item) => `
    <div>
      <hgroup>
        <h4>
          <a href="${item.link}" target="_blank">
            ${item.title}
          </a>
        </h4>
        <div>
          ${new URL(item.link).host} -
          ${item.pubDate.toLocaleDateString()}
        </div>
      </hgroup>
    </div>
  `
      )
      .join('')

    console.log(html)
    document.getElementById('display').innerHTML = html
  }
}
