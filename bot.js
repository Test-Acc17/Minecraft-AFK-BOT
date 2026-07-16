const express = require('express')
const mineflayer = require('mineflayer')

const app = express()
const PORT = process.env.PORT || 3000

app.get('/', (req, res) => res.send('Bot is alive'))
app.listen(PORT, () => console.log(`Web server on ${PORT}`))

const CONFIG = {
  host: process.env.MC_HOST || 'snoofumc.fun',
  port: parseInt(process.env.MC_PORT) || 25565,
  username: process.env.MC_USER || 'MissDivya20',
  version: process.env.MC_VERSION || '1.21.1',
  loginCmd: process.env.MC_LOGIN_CMD || '/login CAT123',
  brand: 'fabric'
}

let attempt = 0
const MAX_DELAY = 5 * 60 * 1000

function getBackoffDelay() {
  const base = Math.min(5000 * Math.pow(2, attempt), MAX_DELAY)
  const jitter = Math.random() * 2000
  return base + jitter
}

function createBot() {
  const bot = mineflayer.createBot({
    host: CONFIG.host,
    port: CONFIG.port,
    username: CONFIG.username,
    version: CONFIG.version,
    auth: 'offline'
  })

  // Send brand + client settings as soon as the connection is established,
  // mirroring what a real client sends before login completes.
  bot._client.on('connect', () => {
    try {
      bot._client.writeChannel('minecraft:brand', CONFIG.brand)
    } catch (e) {
      console.log('[!] Brand write failed:', e.message)
    }
  })

  bot.once('spawn', () => {
    console.log('[+] Spawned')
    attempt = 0

    // Fake client settings packet (locale, view distance, chat mode, etc.)
    try {
      bot._client.write('settings', {
        locale: 'en_US',
        viewDistance: 10,
        chatFlags: 0,
        chatColors: true,
        skinParts: 0x7f,
        mainHand: 1,
        enableTextFiltering: false,
        enableServerListing: true
      })
    } catch (e) {
      console.log('[!] Settings write failed:', e.message)
    }

    setTimeout(() => bot.chat(CONFIG.loginCmd), 1000)
    startIdleMovement(bot)
  })

  bot.on('kicked', (reason) => console.log('[!] Kicked:', reason))
  bot.on('error', (err) => console.log('[!] Error:', err.message))

  bot.on('end', () => {
    const delay = getBackoffDelay()
    console.log(`[!] Disconnected, reconnecting in ${Math.round(delay / 1000)}s... (attempt ${attempt + 1})`)
    attempt++
    setTimeout(createBot, delay)
  })
}

// Small periodic look/jump jitter so the connection isn't perfectly idle/silent.
function startIdleMovement(bot) {
  const interval = setInterval(() => {
    if (!bot.entity) {
      clearInterval(interval)
      return
    }
    const yaw = Math.random() * Math.PI * 2 - Math.PI
    const pitch = (Math.random() * 0.4) - 0.2
    bot.look(yaw, pitch, true)

    if (Math.random() < 0.15) {
      bot.setControlState('jump', true)
      setTimeout(() => bot.setControlState('jump', false), 300)
    }
  }, 8000 + Math.random() * 4000)

  bot.once('end', () => clearInterval(interval))
}

createBot()
