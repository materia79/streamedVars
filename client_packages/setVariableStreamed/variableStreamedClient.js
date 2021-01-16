// Streamed variables (sent and updated only to players in streaming range)
const localPlayer = mp.players.local;
const playerVariablesDataHandler = {};
const entityTypeToPool = {
  "player": mp.players,
  "ped": mp.peds
};

const getVariableStreamed = function (key) {
  mp.log("[variableSteamed.getVariableStreamed] " + this.player.type + " id " + this.player.remoteId + " key: " + key + " value: " + (this.player.variablesStreamed ? this.player.variablesStreamed[key] : "undefined"));
  return this.player.variablesStreamed ? this.player.variablesStreamed[key] : undefined;
};

const getVariableStreamedAsync = async function (key, waitTime = 10) {
  try {
    const type = this.type; // remember to prevent multiplayer object errors
    while (entityTypeToPool[type].exists(this)) {
      if (this.variablesStreamed && typeof this.variablesStreamed[key] != "undefined") return this.variablesStreamed[key];
      await mp.game.waitAsync(waitTime);
    }
    return null;
  } catch (error) {
    mp.log("[getVariableStreamedAsync] " + error.stack);
  }
};

localPlayer.variablesStreamed = {};
localPlayer.getVariableStreamed = (key) => {
  return localPlayer.variablesStreamed[key];
};

mp.events.addDataHandlerStreamed = (key, func) => {
  if (key && typeof func == "function") playerVariablesDataHandler[key] = func;
}

mp.events.add("setVariableStreamed", (entityId, entityType, key, value) => {
  const entity = entityTypeToPool[entityType] ? entityTypeToPool[entityType].atRemoteId(entityId) : undefined;

  if (entity) {
    mp.log("[setVariableStreamed] setting " + key + " for " + entityType + " id " + entityId + " to value: " + value);
    entity.variablesStreamed[key] = value;
    if (playerVariablesDataHandler[key]) playerVariablesDataHandler[key](entity, value);
  }
});

mp.events.add("entityStreamIn", (entity) => {
  if (entityTypeToPool[entity.type]) {
    /*if (!entity.variablesStreamed) {
      entity.variablesStreamed = {};
      entity.getVariableStreamed = getVariableStreamed.bind(entity);
      entity.getVariableAsync = getVariableAsync.bind(entity);
    }*/
    mp.events.callRemote("entityStreamIn", entity.type, entity.remoteId);
  }
});

mp.events.add("entityStreamOut", (entity) => {
  if (entityTypeToPool[entity.type]) mp.events.callRemote("entityStreamOut", entity.type, entity.remoteId);
});

mp.events.add("playerJoin", (player) => {
  mp.log("[setVarStreamed.playerJoin] remoteId: " + player.remoteId)
  player.variablesStreamed = {};
  player.getVariableStreamed = getVariableStreamed.bind({ player: player });
  player.getVariableAsync = getVariableAsync.bind({ player: player });
});

// Get variable async (waiting until variable is not undefined anymore)
localPlayer.getVariableAsync = async (key, waitTime = 10) => {
  let result = localPlayer.getVariable(key);
  while (typeof result == "undefined") {
    await mp.game.waitAsync(waitTime);
    result = localPlayer.getVariable(key);
  }
  return result;
};

// TODO
// player.getVariableAsync
const getVariableAsync = async (key, waitTime = 10) => {
  let result = mp.players.exists(this) ? this.getVariable(key) : undefined;

  while (entityTypeToPool[this.type].exists(this) && typeof result == "undefined") {
    await mp.game.waitAsync(waitTime);
    result = entityTypeToPool[this.type].exists(this) ? this.getVariable(key) : undefined;
  }
  return result;
};
localPlayer.getVariableAsync = getVariableAsync.bind(localPlayer);

