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
  reconnectDelay: 5000
}

function createBot() {
  const bot = mineflayer.createBot({
    host: CONFIG.host,
    port: CONFIG.port,
    username: CONFIG.username,
    version: CONFIG.version,
    auth: 'offline'
  })

  bot.once('spawn', () => {
    console.log('[+] Spawned, logging in...')
    setTimeout(() => bot.chat(CONFIG.loginCmd), 1000)
  })

  bot.on('kicked', (reason) => console.log('[!] Kicked:', reason))
  bot.on('error', (err) => console.log('[!] Error:', err.message))

  bot.on('end', () => {
    console.log('[!] Disconnected, reconnecting in 5s...')
    setTimeout(createBot, CONFIG.reconnectDelay)
  })
}

createBot()
