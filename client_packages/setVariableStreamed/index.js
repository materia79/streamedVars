// Get variable async (waiting until variable is not undefined anymore)
mp.players.local.getVariableAsync = async (key, waitTime = 10) => {
  let result = mp.players.local.getVariable(key);
  while (typeof result == "undefined") {
    await mp.game.waitAsync(waitTime);
    result = mp.players.local.getVariable(key);
  }
  return result;
}

global.getPlayerVariableAsync = async (player, key, waitTime = 10) => {
  let result = mp.players.exists(player) ? player.getVariable(key) : undefined;
  while (mp.players.exists(player) && typeof result == "undefined") {
    await mp.game.waitAsync(waitTime);
    result = mp.players.exists(player) ? player.getVariable(key) : undefined;
  }
  return result;
}

// Streamed variables (sent and updated only to players in streaming range) - heavily todo
const playerVariables = {},
  playerVariablesDataHandler = {};

for (let i = 0; i < 2 ** 16; i++) {
  playerVariables[i] = {}
};

mp.events.add("setVariableStreamed", (player, key, value) => {
  playerVariables[player.remoteId][key] = value;
  if (playerVariablesDataHandler[key]) playerVariablesDataHandler[key](player, value);
});

mp.Player.prototype.getVariableStreamed = (key) => {
  return playerVariables[this.remoteId][key];
}

mp.events.addDataHandlerStreamed = (key, func) => {
  if (key && typeof func == "function") playerVariablesDataHandler[key] = func;
}

const forwardedEntityStream = {
  "player": true,
  "ped": true
}
mp.events.add("entityStreamIn", (entity) => {
  if (forwardedEntityStream[entity.type]) mp.events.callRemote("entityStreamIn", entity.type, entity.remoteId);
});
