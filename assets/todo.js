const dato = document.getElementById('dato')
if (dato) {
  const datoData = JSON.parse(dato.textContent)

  const allItems = []

  datoData.results.map(async (feed) => {
    const ok = await fetch(`/fetch?url=${encodeURIComponent(feed.url)}`)
    const txt = await ok.text()
    const dom = new DOMParser().parseFromString(txt, 'text/xml')
    const feedHost = new URL(feed.url).host

    function addItem(item) {
      item.pubDate = new Date(item.pubDate)
      item.link = new URL(item.link, feed.url)
      item.host = feedHost
      item.niceDate = item.pubDate.toLocaleDateString()
      item.who = feed.who
      if (item.title) {
        allItems.push(item)
      }
    }

    // rss
    for (const itemXml of dom.querySelectorAll('item')) {
      const item = {}
      for (const field of ['title', 'link', 'pubDate']) {
        item[field] = itemXml.querySelector(field).textContent
      }
      addItem(item)
    }

    // atom
    for (const itemXml of dom.querySelectorAll('entry')) {
      const item = {}
      item.title = itemXml.querySelector('title')?.textContent
      item.pubDate = itemXml.querySelector('updated')?.textContent
      item.link = itemXml.querySelector('link').href
      addItem(item)
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
          <a href="${item.link}">
            ${item.title}
          </a>
        </h4>
        <div>
          ${item.host} -
          ${item.niceDate} -
          ${item.who}
        </div>
      </hgroup>
    </div>
  `
      )
      .join('')

    document.getElementById('display').innerHTML = html
  }
}
