(() => {
  const PROJECT_ID = '9062ece7-0f98-4fc4-ac17-dcf88ebae349'
  const BASE = new URL('.', window.location.href).pathname
  const nativeFetch = window.fetch.bind(window)
  const fixtures = {
    '/health': 'health.json',
    '/projects': 'projects.json',
    '/settings': 'settings.json',
    '/visual-styles': 'visual-styles.json',
    [`/projects/${PROJECT_ID}`]: 'project.json',
    [`/projects/${PROJECT_ID}/evidence`]: 'evidence.json'
  }
  const readonly = () => new Response(JSON.stringify({ error: '这是公网只读预览。上传材料、模型调用和 AI 修改请在本地造境工作台执行。' }), { status: 409, headers: { 'Content-Type': 'application/json; charset=utf-8' } })
  window.fetch = async (input, init = {}) => {
    const raw = typeof input === 'string' ? input : input.url
    const url = new URL(raw, window.location.href)
    if (url.origin === window.location.origin && url.pathname.startsWith('/api/')) {
      const route = url.pathname.slice(4)
      const method = String(init.method || input?.method || 'GET').toUpperCase()
      if (method === 'GET' && fixtures[route]) return nativeFetch(`${BASE}fixtures/${fixtures[route]}`)
      return readonly()
    }
    return nativeFetch(input, init)
  }
  function saveBlob(blob, filename) {
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url; anchor.download = filename; anchor.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  document.addEventListener('click', async event => {
    const anchor = event.target.closest?.('a[href]')
    if (!anchor) return
    const href = anchor.getAttribute('href') || ''
    if (href.startsWith(`/preview/${PROJECT_ID}/`)) {
      event.preventDefault()
      window.open(`${BASE}preview/${PROJECT_ID}/`, '_blank', 'noopener')
      return
    }
    if (!href.startsWith(`/api/projects/${PROJECT_ID}/`)) return
    event.preventDefault()
    if (href.endsWith('/archive')) { window.location.href = `${BASE}fixtures/demo-source.zip`; return }
    if (href.endsWith('/report')) { window.location.href = `${BASE}fixtures/delivery-report.md`; return }
    if (href.endsWith('/evidence')) {
      const response = await nativeFetch(`${BASE}fixtures/evidence.json`)
      saveBlob(await response.blob(), '复核与效果证据.json')
      return
    }
    const artifact = href.match(/\/artifact\/(baseline|spec|qa)$/)?.[1]
    if (artifact) {
      const response = await nativeFetch(`${BASE}fixtures/project.json`)
      const project = await response.json()
      saveBlob(new Blob([JSON.stringify(project[artifact], null, 2)], { type: 'application/json' }), `${artifact}.json`)
    }
  })
})()
