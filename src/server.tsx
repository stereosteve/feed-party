import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'
import { jsxRenderer } from 'hono/jsx-renderer'

type Bindings = {
  DB: D1Database
}

type FeedRow = {
  url: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/*', serveStatic({ root: './' }))

app.get(
  '*',
  jsxRenderer(({ children }) => {
    return (
      <html lang="en" data-theme="dark">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="stylesheet" href="/pico.css" />
          <title>feedz</title>
        </head>
        <body>{children}</body>
        <script src="/todo.js"></script>
      </html>
    )
  })
)

app.get('/', async (c) => {
  const ok = await c.env.DB.prepare('select * from feeds').all<FeedRow>()
  if (c.req.query('json')) return c.json(ok)

  return c.render(
    <div class="container" style={{ marginTop: 60 }}>
      <div style={{ position: 'fixed', top: 30, right: 30 }}>
        <a href="/add">+ add</a>
      </div>
      <div id="display">...</div>
      <script
        id="dato"
        type="application/json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(ok),
        }}
      />
    </div>
  )
})

app.get('/fetch', async (c) => {
  const url = c.req.query('url')
  if (!url) return c.text('no url', 400)

  // cache for a few minutes
  const maxAge = 60 * 10
  const got = await fetch(url, {
    cf: {
      cacheTtl: maxAge,
      cacheEverything: true,
    },
  })
  return c.body(got.body, 200, {
    'Cache-Control': `public, max-age=${maxAge}`,
  })
})

app.get('/add', (c) => {
  return c.render(
    <div class="container">
      <article>
        <h3>Add Feed</h3>
        <form method="POST">
          <label>
            Feed URL
            <input type="url" name="url" placeholder="Feed URL" required />
          </label>
          <label>
            Your Name
            <input type="text" name="who" placeholder="Your Name" required />
          </label>
          <button>submit</button>
        </form>
      </article>
    </div>
  )
})

app.post('/add', async (c) => {
  const body = await c.req.parseBody()
  await c.env.DB.prepare('insert into feeds (url, who) values (?, ?) on conflict do nothing')
    .bind(body.url, body.who)
    .run()
  return c.redirect('/')
})

export default app
