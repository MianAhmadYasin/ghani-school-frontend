const axios = require('axios')

const FRONTEND = process.env.FRONTEND_URL || 'http://127.0.0.1:3000'
const BACKEND = process.env.API_URL || 'https://ghani-school-backend.vercel.app'

async function check(url) {
  try {
    const res = await axios.get(url, { timeout: 10000 })
    return res.status
  } catch (err) {
    console.error(`${url} -> error: ${err.message}`)
    return null
  }
}

async function run() {

  const checks = [
    `${FRONTEND}/`,
    `${FRONTEND}/login`,
    `${FRONTEND}/admin/announcements`,
    `${BACKEND}/health`,
  ]

  const results = await Promise.all(checks.map((u) => check(u)))

  const ok = results.every((s) => s && s >= 200 && s < 400)
  if (!ok) {
    console.error('Smoke tests failed')
    process.exit(2)
  }

}

run()

