const bedrock = require('bedrock-protocol');

// ═══════════════════════════════════════════════════
//  Configurações do Bot
// ═══════════════════════════════════════════════════
const CONFIG = {
  host: 'Dragon-wBwO.aternos.me',
  port: 18869,
  username: 'BotVigia',
  offline: true,                 // modo offline (não precisa de conta Xbox)
  reconnectDelay: 15000,         // 15 segundos para reconectar
  antiAfkInterval: 5 * 60000,   // 5 minutos entre ações anti-AFK
};

let client = null;
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

  try {
    client = bedrock.createClient({
      host: CONFIG.host,
      port: CONFIG.port,
      username: CONFIG.username,
      offline: CONFIG.offline,
    });
  } catch (err) {
    console.log(`[ERRO] Falha ao criar cliente: ${err.message}`);
    scheduleReconnect();
    return;
  }

  // ── Evento: Conectou ao servidor ──
  client.on('join', () => {
    console.log(`[✔] Bot "${CONFIG.username}" conectou ao servidor Bedrock!`);
    startAntiAfk();
  });

  // ── Evento: Spawn no mundo ──
  client.on('spawn', () => {
    console.log('[✔] Bot entrou no mundo!');
  });

  // ── Evento: Mensagem do chat ──
  client.on('text', (packet) => {
    const msg = packet.message || packet.parameters?.join(' ') || '';
    if (msg.trim().length > 0) {
      console.log(`[CHAT] ${msg}`);
    }
  });

  // ── Evento: Desconexão ──
  client.on('disconnect', (packet) => {
    const reason = packet.message || 'desconhecida';
    console.log(`[✖] Desconectado do servidor. Razão: ${reason}`);
    stopAntiAfk();
    scheduleReconnect();
  });

  // ── Evento: Kicked ──
  client.on('kick', (packet) => {
    const reason = packet.message || 'desconhecida';
    console.log(`[✖] Bot foi kickado! Razão: ${reason}`);
    stopAntiAfk();
    scheduleReconnect();
  });

  // ── Evento: Erro ──
  client.on('error', (err) => {
    console.log(`[ERRO] ${err.message}`);
    stopAntiAfk();
    scheduleReconnect();
  });

  // ── Evento: Conexão fechada ──
  client.on('close', () => {
    console.log('[✖] Conexão fechada.');
    stopAntiAfk();
    scheduleReconnect();
  });
}

// ═══════════════════════════════════════════════════
//  Sistema Anti-AFK
// ═══════════════════════════════════════════════════
function startAntiAfk() {
  stopAntiAfk(); // limpa timer anterior se existir

  console.log('[ANTI-AFK] Sistema anti-AFK ativado (ações a cada 5 min)');

  antiAfkTimer = setInterval(() => {
    if (client) {
      try {
        // Envia pacote de movimento do jogador (simulando movimento)
        client.queue('move_player', {
          runtime_id: 1n,
          position: {
            x: Math.random() * 0.5,
            y: 0,
            z: Math.random() * 0.5,
          },
          pitch: Math.random() * 360,
          yaw: Math.random() * 360,
          head_yaw: Math.random() * 360,
          mode: 'normal',
          on_ground: true,
          ridden_runtime_id: 0n,
          tick: 0n,
        });

        // Envia pacote de ação (pular)
        client.queue('player_action', {
          runtime_entity_id: 1n,
          action: 'jump',
          position: { x: 0, y: 0, z: 0 },
          result_position: { x: 0, y: 0, z: 0 },
          face: 0,
        });

        console.log('[ANTI-AFK] Ação anti-AFK executada (movimento + pulo)');
      } catch (err) {
        console.log(`[ANTI-AFK] Erro ao executar ação: ${err.message}`);
      }
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
console.log('║  Bedrock Edition | Anti-AFK + Reconexão   ║');
console.log('╚═══════════════════════════════════════════╝');
console.log('');

createBot();

// Captura Ctrl+C para desconectar limpo
process.on('SIGINT', () => {
  console.log('\n[BOT] Desligando bot...');
  stopAntiAfk();
  if (client) {
    client.close();
  }
  setTimeout(() => process.exit(0), 1000);
});
