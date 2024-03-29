  // Streamed variables (sent and updated only to players in streaming range)
const localPlayer = mp.players.local;
const playerVariablesDataHandler = {};
const streamedEntityTypeToPool = {
  "player": mp.players,
  "ped": mp.peds,
  "vehicle": mp.vehicles
};
const streamedEntityTypeToEventNameIn = {
  "player": "playerStreamIn",
  "ped": "pedStreamIn",
  "vehicle": "vehicleStreamIn"
}
const streamedEntityTypeToEventNameOut = {
  "player": "playerStreamOut",
  "ped": "pedStreamOut",
  "vehicle": "vehicleStreamOut"
}

const events = mp.events;

// Use these globals to activate/deactivate streaming of types clientside as your application requires!
events.streamedEntityTypeToPool = streamedEntityTypeToPool; 
events.streamedEntityTypeToEventName = streamedEntityTypeToEventNameIn;
events.streamedEntityTypeToEventName = streamedEntityTypeToEventNameOut;

// disable streaming completely (with server)
events.streamingEnabled = true;

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
    while (streamedEntityTypeToPool[type].exists(this.entity) && this.entity.handle == handle) {
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

events.addDataHandlerStreamed = (key, func) => {
  if (playerVariablesDataHandler[key]) return;
  if (key && typeof func == "function") playerVariablesDataHandler[key] = func;
};

events.removeDataHandlerStreamed = (key, func) => {
  if (playerVariablesDataHandler[key] && playerVariablesDataHandler[key] == func) delete playerVariablesDataHandler[key];
};

events.add("setVariableStreamed", (entityId, entityType, key, value) => {
  const entity = streamedEntityTypeToPool[entityType] ? streamedEntityTypeToPool[entityType].atRemoteId(entityId) : undefined;

  if (entity) { // DEBUG: //mp.log("[setVariableStreamed] setting " + key + " for " + entityType + " id " + entityId + " to value: " + value);
    if (!entity.variablesStreamed) initEntity(entity); // everything else seem to be unreliable :c
    entity.variablesStreamed[key] = value;
    if (playerVariablesDataHandler[key]) playerVariablesDataHandler[key](entity, value);
  }
});

events.add("entityStreamIn", (entity) => {
  if (streamedEntityTypeToPool[entity.type]) {
    entity.pool = streamedEntityTypeToPool[entity.type];
    if (!entity.variablesStreamed) initEntity(entity); // everything else seem to be unreliable :c
    if (events.streamingEnabled && entity.remoteId != 65535) events.callRemote("esi", entity.type, entity.remoteId);
    if (streamedEntityTypeToEventNameIn[entity.type]) events.call(streamedEntityTypeToEventNameIn[entity.type], entity);
  }
});

events.add("entityStreamOut", (entity) => {
  if (events.streamingEnabled && entity.remoteId != 65535) if (streamedEntityTypeToPool[entity.type]) events.callRemote("eso", entity.type, entity.remoteId, streamedEntityTypeToPool[entity.type].streamed.length);
  if (streamedEntityTypeToEventNameOut[entity.type]) events.call(streamedEntityTypeToEventNameOut[entity.type], entity);
});

/* test works
events.addDataHandlerStreamed("selftest", (entity, value) => {
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

  while (streamedEntityTypeToPool[this.type].exists(this) && typeof result == "undefined") {
    await mp.game.waitAsync(waitTime);
    result = streamedEntityTypeToPool[this.type].exists(this) ? this.getVariable(key) : undefined;
  }
  return result;
};
localPlayer.getVariableAsync = getVariableAsync.bind(localPlayer);