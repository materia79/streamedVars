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
  if (key && typeof func == "function") playerDataHandlers[key] = func;
};

const initEntity = (entity) => {
  entity.dimensionVariables = {};
  entity.getVariableDimension = getVariableDimension.bind({ entity: entity });
  entity.getVariableDimensionAsync = getVariableDimensionAsync.bind({ entity: entity });
};

const getVariableDimension = function (key) {
  return this.entity.dimensionVariables ? this.entity.dimensionVariables[key] : undefined;
};

const getVariableDimensionAsync = async function (key) {
  if (!this.entity || !mp[this.entity.type + 's'].exists(this.entity)) return null;
  try {
  while(mp[this.entity.type + 's'].exists(this.entity)) {
    if (this.entity.dimensionVariables && typeof this.entity.dimensionVariables[key] != "undefined") {
      //mp.log("[entity.getVariableDimensionAsync] remoteId: " + this.entity.remoteId + ", key: " + key + ", value: " + this.entity.dimensionVariables[key]);
      return this.entity.dimensionVariables[key];
    }
    await mp.game.waitAsync(waitTime);
  }
  return null;
  } catch (e) {
    mp.log("[getVariableDimensionAsync] " + error.stack);
  }
};

mp.events.add('setDimVariable', (entityType, entityId, key, value) => {
  if (!allowedEntities[entityType] || !mp[entityType + 's'].exists(parseInt(entityId))) return;
  const entity = mp[entityType + 's'].atRemoteId(parseInt(entityId));
  if (entity) { // DEBUG: //
    mp.log("[setVariableDimension] setting " + key + " for " + entityType + " id " + entityId + " to value: " + value);
    if (!entity.dimensionVariables) initEntity(entity);
    entity.dimensionVariables[key] = value;
    if (playerDataHandlers[key]) playerDataHandlers[key](entity, value);
  }
});