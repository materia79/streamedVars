// Streamed variables (sent and updated only to players in streaming range)
const localPlayer = mp.players.local;
const playerVariablesDataHandler = {};
const entityStreamInTypeToPool = {
  "player": mp.players,
  "ped": mp.peds,
  "vehicle": mp.vehicles
};
const entityStreamOutTypeToPool = {
  "player": mp.players,
  "ped": mp.peds,
  "vehicle": mp.vehicles
};

const initEntity = (entity) => {
  entity.variablesStreamed = {};
  entity.getVariableStreamed = getVariableStreamed.bind({ entity: entity });
  entity.getVariableStreamedAsync = getVariableStreamedAsync.bind({ entity: entity });
};

const getVariableStreamed = function (key) { // DEBUG: //mp.log("[variableStreamed.getVariableStreamed] " + this.entity.type + " id " + this.entity.remoteId + " key: " + key + " value: " + (this.entity.variablesStreamed ? this.entity.variablesStreamed[key] : "undefined"));
  return this.entity.variablesStreamed ? this.entity.variablesStreamed[key] : undefined;
};

const getVariableStreamedAsync = async function (key, waitTime = 10) {
  if (!this.entity.pool || !this.entity.pool.exists(this.entity) || !this.entity.handle) return null;

  try {
    const handle = this.entity.handle; // ped.controller change will cause the handle to change. the original entity remains though!
    const type = this.entity.type; // remember to prevent multiplayer object errors
    while (entityStreamInTypeToPool[type].exists(this.entity) && this.entity.handle == handle) {
      if (this.entity.variablesStreamed && typeof this.entity.variablesStreamed[key] != "undefined") {
        //mp.log("[entity.getVariableStreamedAsync] remoteId: " + this.entity.remoteId + ", key: " + key + ", value: " + this.entity.variablesStreamed[key]);
        return this.entity.variablesStreamed[key];
      }
      await mp.game.waitAsync(waitTime);
    }
    //mp.log("[entity.getVariableStreamedAsync] Lost handle for key: " + key + ", networkId: " + this.entity.networkId);
    return null;
  } catch (error) {
    mp.log("[getVariableStreamedAsync] " + error.stack);
  }
};

localPlayer.variablesStreamed = {};
localPlayer.getVariableStreamed = (key) => {
  return localPlayer.variablesStreamed[key];
};
localPlayer.getVariableStreamedAsync = async function (key, waitTime = 10) {
  while (true) {
    if (localPlayer.variablesStreamed && typeof localPlayer.variablesStreamed[key] != "undefined") return localPlayer.variablesStreamed[key];
    await mp.game.waitAsync(waitTime);
  }
};

mp.events.addDataHandlerStreamed = (key, func) => {
  if (key && typeof func == "function") playerVariablesDataHandler[key] = func;
};

mp.events.add("setVariableStreamed", (entityId, entityType, key, value) => {
  const entity = entityStreamInTypeToPool[entityType] ? entityStreamInTypeToPool[entityType].atRemoteId(entityId) : undefined;

  if (entity) { // DEBUG: //mp.log("[setVariableStreamed] setting " + key + " for " + entityType + " id " + entityId + " to value: " + value);
    if (!entity.variablesStreamed) initEntity(entity); // everything else seem to be unreliable :c
    entity.variablesStreamed[key] = value;
    if (playerVariablesDataHandler[key]) playerVariablesDataHandler[key](entity, value);
  }
});

mp.events.add("entityStreamIn", (entity) => {
  if (entityStreamInTypeToPool[entity.type]) {
    entity.pool = entityStreamInTypeToPool[entity.type];
    if (!entity.variablesStreamed) initEntity(entity); // everything else seem to be unreliable :c
    mp.events.callRemote("esi", entity.type, entity.remoteId);
  }
});

mp.events.add("entityStreamOut", (entity) => {
  if (entityStreamInTypeToPool[entity.type]) mp.events.callRemote("eso", entity.type, entity.remoteId, entityStreamInTypeToPool[entity.type].streamed.length);
});

/* test works
mp.events.addDataHandlerStreamed("selftest", (entity, value) => {
  mp.log("[streamedVars.DataHandler.selftest] type: " + entity.type + " id: " + entity.remoteId + ", value: " + value);
});

(async () => {
  mp.log("waiting for veh...");
  while (!mp.vehicles.exists(localPlayer.vehicle)) await mp.game.waitAsync(10);
  mp.log("found veh!");
  const result = await localPlayer.vehicle.getVariableStreamedAsync("selftest");
  mp.log("[streamedVars.selftest(async/vehicle)] result: " + (result));
  mp.log("async done!");
})();
*/

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

  while (entityStreamInTypeToPool[this.type].exists(this) && typeof result == "undefined") {
    await mp.game.waitAsync(waitTime);
    result = entityStreamInTypeToPool[this.type].exists(this) ? this.getVariable(key) : undefined;
  }
  return result;
};
localPlayer.getVariableAsync = getVariableAsync.bind(localPlayer);

