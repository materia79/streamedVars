const localPlayer = mp.players.local;
const allowedEntities = {
  "player": true,
  "ped": true,
  "vehicle": true
}
const playerDataHandlers = {};
localPlayer.dimensionVariables = {};

localPlayer.getDimensionVariable = (key) => {
  return localPlayer.dimensionVariables[key];
};

localPlayer.getDimensionVariableAsync = async function (key, waitTime = 10) {
  while (true) {
    if (localPlayer.dimensionVariables && typeof localPlayer.dimensionVariables[key] != "undefined") return localPlayer.dimensionVariables[key];
    await mp.game.waitAsync(waitTime);
  }
};

mp.events.addDataHandlerDimension = (key, func) => {
  if (key && typeof func == "function") {
    if (!playerDataHandlers[key]) {
      playerDataHandlers[key] =  [];
    } else {
      let funcIdx = playerDataHandlers[key].indexOf(func);
      if (funcIdx !== -1) {
        if (mp.log) mp.log('[addDataHandlerDimension] DataHandler for this function already exists for the following key: ' + key);
        return;
      }
    }
    playerDataHandlers[key].push(func);
  } else {
    if (mp.log) mp.log('[addDataHandlerDimension] Invalid parameters');
    return;
  }
};

mp.events.removeDataHandlerDimension = (key, func = null) => {
  if (key && playerDataHandlers[key]) {
    if (typeof func == 'function') {
      let funcIdx = playerDataHandlers[key].indexOf(func);
      if (funcIdx == -1) return false;
      playerDataHandlers[key].splice(funcIdx, 1);
      if (playerDataHandlers[key].length == 0) delete playerDataHandlers[key];
    } else {
      delete playerDataHandlers[key];
    }
  } else {
    if (mp.log) mp.log('[removeDataHandlerDimension] No dataHandlers exist for the following key: ' + key);
    return;
  }
};

const initEntity = (entity) => {
  entity.dimensionVariables = {};
  entity.getVariableDimension = getVariableDimension.bind({ entity: entity });
  entity.getVariableDimensionAsync = getVariableDimensionAsync.bind({ entity: entity });
};

const getVariableDimension = function (key) {
  return this.entity.dimensionVariables ? this.entity.dimensionVariables[key] : undefined;
};
mp.players.getVariableDimension = (player, key) => { return getVariableDimension.bind({ entity: player })(key); };

const getVariableDimensionAsync = async function (key, waitTime = 10) {
  if (!this.entity || !mp[this.entity.type + 's'].exists(this.entity)) return null;
  try {
  while(mp[this.entity.type + 's'].exists(this.entity)) {
    if (this.entity.dimensionVariables && typeof this.entity.dimensionVariables[key] != "undefined") { // DEBUG: // if(mp.log) mp.log("[entity.getVariableDimensionAsync] remoteId: " + this.entity.remoteId + ", key: " + key + ", value: " + this.entity.dimensionVariables[key]);
      return this.entity.dimensionVariables[key];
    }
    await mp.game.waitAsync(waitTime);
  }
  return null;
  } catch (error) {
    if (mp.log) mp.log("[getVariableDimensionAsync] " + error.stack);
  }
};
mp.players.getVariableDimensionAsync = (player, key) => { return getVariableDimensionAsync.bind({ entity: player })(key); };

mp.events.add('setDimVariable', (entityType, entityID, key, data) => {
  if (!allowedEntities[entityType]) return mp.log(`[setVariableDimension] Disallowed entity type, not setting ${key} for ${entityType} (${entityID}) to value: ${data}`);
  const entity = mp[entityType + 's'].atRemoteId(parseInt(entityID));
  
  if (mp[entityType + 's'].exists(entity)) { // DEBUG: // if(mp.log) mp.log("[setVariableDimension] setting " + key + " for " + entityType + " id " + entityID + " to value: " + data);
    if (!entity.dimensionVariables) initEntity(entity); // DEBUG: // if(mp.log) mp.log(`[setDimVariable] Setting dimension variable[${key}] with data ${JSON.stringify(data)}`);
    entity.dimensionVariables[key] = data;
    if (playerDataHandlers[key]) playerDataHandlers[key].forEach(dataHandler => dataHandler(entity, data));
  } // else mp.log(`[setVariableDimension.post] ${entityType} (${entityID}) does not exist anymore. Not setting ${key} to value: ${data} anymore.`);
});
