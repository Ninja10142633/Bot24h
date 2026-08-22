const mineflayer = require('mineflayer');

// ═══════════════════════════════════════════════════
//  Configurações do Bot
// ═══════════════════════════════════════════════════
const CONFIG = {
  host: 'Dragon-wBwO.aternos.me',
  port: 18869,
  username: 'BotVigia',
  version: false,              // auto-detecta a versão do servidor
  hideErrors: false,
  reconnectDelay: 15000,       // 15 segundos para reconectar
  antiAfkInterval: 5 * 60000,  // 5 minutos entre ações anti-AFK
};

let bot = null;
let antiAfkTimer = null;
let reconnecting = false;

// ═══════════════════════════════════════════════════
//  Função para criar e conectar o bot
// ═══════════════════════════════════════════════════
function createBot() {
  console.log('─────────────────────────────────────────');
  console.log(`[BOT] Conectando como "${CONFIG.username}" em ${CONFIG.host}:${CONFIG.port}...`);
  console.log('─────────────────────────────────────────');

  reconnecting = false;

  bot = mineflayer.createBot({
    host: CONFIG.host,
    port: CONFIG.port,
    username: CONFIG.username,
    version: CONFIG.version,
    hideErrors: CONFIG.hideErrors,
  });

  // ── Evento: Login bem-sucedido ──
  bot.on('login', () => {
    console.log(`[✔] Bot "${bot.username}" logou com sucesso!`);
  });

  // ── Evento: Spawn no mundo ──
  bot.on('spawn', () => {
    console.log('[✔] Bot entrou no mundo!');
    console.log(`[INFO] Posição: X=${Math.floor(bot.entity.position.x)} Y=${Math.floor(bot.entity.position.y)} Z=${Math.floor(bot.entity.position.z)}`);
    startAntiAfk();
  });

  // ── Evento: Mensagem do chat ──
  bot.on('chat', (username, message) => {
    if (username === bot.username) return;
    console.log(`[CHAT] <${username}> ${message}`);
  });

  // ── Evento: Mensagem do sistema ──
  bot.on('message', (jsonMsg) => {
    const msg = jsonMsg.toString().trim();
    if (msg.length > 0) {
      console.log(`[SISTEMA] ${msg}`);
    }
  });

  // ── Evento: Saúde atualizada ──
  bot.on('health', () => {
    console.log(`[HP] Vida: ${bot.health.toFixed(1)} | Fome: ${bot.food} | Saturação: ${bot.foodSaturation.toFixed(1)}`);
  });

  // ── Evento: Kicked ──
  bot.on('kicked', (reason, loggedIn) => {
    console.log(`[✖] Bot foi kickado! Razão: ${reason}`);
    stopAntiAfk();
    scheduleReconnect();
  });

  // ── Evento: Erro ──
  bot.on('error', (err) => {
    console.log(`[ERRO] ${err.message}`);
  });

  // ── Evento: Desconexão ──
  bot.on('end', (reason) => {
    console.log(`[✖] Conexão encerrada. Razão: ${reason || 'desconhecida'}`);
    stopAntiAfk();
    scheduleReconnect();
  });
}

// ═══════════════════════════════════════════════════
//  Sistema Anti-AFK
// ═══════════════════════════════════════════════════
function startAntiAfk() {
  stopAntiAfk(); // limpa timer anterior se existir

  console.log('[ANTI-AFK] Sistema anti-AFK ativado (pulo a cada 5 min)');

  antiAfkTimer = setInterval(() => {
    if (bot && bot.entity) {
      // Pula
      bot.setControlState('jump', true);
      setTimeout(() => bot.setControlState('jump', false), 500);

      // Gira levemente a câmera (rotação aleatória)
      const yaw = (Math.random() * Math.PI * 2) - Math.PI;
      const pitch = (Math.random() * 0.5) - 0.25;
      bot.look(yaw, pitch, false);

      // Anda um pouco para frente e para
      bot.setControlState('forward', true);
      setTimeout(() => bot.setControlState('forward', false), 600);

      console.log('[ANTI-AFK] Ação anti-AFK executada (pulo + rotação + movimento)');
    }
  }, CONFIG.antiAfkInterval);
}

function stopAntiAfk() {
  if (antiAfkTimer) {
    clearInterval(antiAfkTimer);
    antiAfkTimer = null;
    console.log('[ANTI-AFK] Sistema anti-AFK pausado.');
  }
}

// ═══════════════════════════════════════════════════
//  Reconexão Automática
// ═══════════════════════════════════════════════════
function scheduleReconnect() {
  if (reconnecting) return;
  reconnecting = true;

  const delaySec = CONFIG.reconnectDelay / 1000;
  console.log(`[RECONEXÃO] Tentando reconectar em ${delaySec} segundos...`);

  setTimeout(() => {
    createBot();
  }, CONFIG.reconnectDelay);
}

// ═══════════════════════════════════════════════════
//  Início
// ═══════════════════════════════════════════════════
console.log('');
console.log('╔═══════════════════════════════════════════╗');
console.log('║       🤖  BOT VIGIA - MINECRAFT AFK      ║');
console.log('║  Anti-AFK + Reconexão Automática          ║');
console.log('╚═══════════════════════════════════════════╝');
console.log('');

createBot();

// Captura Ctrl+C para desconectar limpo
process.on('SIGINT', () => {
  console.log('\n[BOT] Desligando bot...');
  stopAntiAfk();
  if (bot) {
    bot.quit('Bot desligado pelo operador.');
  }
  setTimeout(() => process.exit(0), 1000);
});
