import { Readability } from '@mozilla/readability'
import { FeedRow } from '../src/server'

const ListView = document.getElementById('ListView')!
const ReadView = document.getElementById('ReadView')!

//
// LIST VIEW
//

type Item = {
  title: string
  pubDate: Date
  link: URL
  host: string
  niceDate: string
  who: string
}

const dato = document.getElementById('dato')
if (dato?.textContent) {
  const datoData = JSON.parse(dato.textContent)

  const allItems: Item[] = []

  datoData.results.map(async (feed: FeedRow) => {
    const ok = await fetch(`/fetch?url=${encodeURIComponent(feed.url)}`)
    const txt = await ok.text()
    const dom = new DOMParser().parseFromString(txt, 'text/xml')
    const feedHost = new URL(feed.url).host

    function addItem(item: Item) {
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
      const item: any = {}
      for (const field of ['title', 'link', 'pubDate']) {
        item[field] = itemXml.querySelector(field)?.textContent
      }
      addItem(item)
    }

    // atom
    for (const itemXml of dom.querySelectorAll('entry')) {
      const item: any = {}
      item.title = itemXml.querySelector('title')?.textContent
      item.pubDate = itemXml.querySelector('updated')?.textContent
      item.link = itemXml.querySelector('link')?.href
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
          <a href="#${item.link}">
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

    ListView.innerHTML = `
      <div class="container">
        ${html}
      </div>
    `
  }
}

//
// DETAIL
//

async function showReader(url: string) {
  const host = new URL(url).host
  const got = await fetch(`/fetch?url=${encodeURIComponent(url)}`)
  const html = await got.text()
  const dom = new DOMParser().parseFromString(html, 'text/html')
  var article = new Readability(dom).parse()

  if (!article) return console.error('no worko')

  ReadView.innerHTML = `
    <div class="container">
      <hgroup>
        <h1>${article.title}</h1>
        <a href="${url}" target="_blank">${host}</a>
      </hgroup>
      ${article.content}
    </div>
  `
  console.log('hello', article)
}

//
// ROUTER
//

function route() {
  const url = window.location.hash.substring(1)
  if (url) {
    ListView.style.display = 'none'
    ReadView.innerHTML = '<div class="loading">⏳</div>'
    showReader(url)
  } else {
    ListView.style.display = 'block'
    ReadView.innerHTML = ''
  }
}

window.onhashchange = route
route()
