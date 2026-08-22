// Stub module - replaces raknet-native to avoid native binary crashes
// bedrock-protocol will use jsp-raknet (JS backend) instead

class Client {
  constructor() {}
  connect() {}
  close() {}
  send() {}
  ping() {}
  on() { return this; }
  once() { return this; }
  removeListener() { return this; }
  removeAllListeners() { return this; }
}

class Server {
  constructor() {}
  listen() {}
  close() {}
  send() {}
  on() { return this; }
  once() { return this; }
  removeListener() { return this; }
  removeAllListeners() { return this; }
}

module.exports = { Client, Server };
