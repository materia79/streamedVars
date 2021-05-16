const streamedEntityTypeToPool = {
  "player": mp.players,
  "ped": mp.peds,
  "vehicle": mp.vehicles
};
mp.events.streamedEntityTypeToPool = streamedEntityTypeToPool;

// Set a variable that is only sent to other players when they have that player with variable set streamed in
const playerSetVarStreamed = function (key, value) {
  if (this.variablesStreamed[key] == value) {
    console.log(`[${this.type}.setVariableStreamed] value did not change!`);
    return this;
  }
  this.variablesStreamed[key] = { value: value, lastValue: {} };
  this.call("setVariableStreamed", [this.id, this.type, key, value]);
  
  if (!this.streamed_players) this.streamed_players = [];
  else if (this.streamed_players.length) {
    this.streamed_players.forEach((player) => {
      if (mp.players.exists(player)) this.variablesStreamed[key].lastValue[player.id] = value;
    });
    mp.players.call(this.streamed_players, "setVariableStreamed", [this.id, this.type, key, value]);
  }
  return this;
};

const entitySetVarStreamed = function (key, value) {
  if (!this.variablesStreamed) this.variablesStreamed = {};
  if (this.variablesStreamed[key] == value) {
    console.log(`[${this.type}.setVariableStreamed] value did not change!`);
    return this;
  }
  this.variablesStreamed[key] = { value: value, lastValue: {} };
  
  if (!this.streamed_players) this.streamed_players = [];
  else if (this.streamed_players.length) {
    this.streamed_players.forEach((player) => {
      if (mp.players.exists(player)) this.variablesStreamed[key].lastValue[player.id] = value;
    });
    mp.players.call(this.streamed_players, "setVariableStreamed", [this.id, this.type, key, value]);
  }
  return this;
};

const setVarsStreamed = function (object) {
  Object.keys(object).forEach((key) => { this.setVariableStreamed(key, object[key]); });
  return this;
};

mp.Player.prototype.setVariableStreamed = playerSetVarStreamed;
mp.Player.prototype.setVariablesStreamed = setVarsStreamed;
mp.Vehicle.prototype.setVariableStreamed = mp.Ped.prototype.setVariableStreamed = entitySetVarStreamed;
mp.Vehicle.prototype.setVariablesStreamed = mp.Ped.prototype.setVariablesStreamed = setVarsStreamed;

const playerGetVarStreamed = function (key) {
  return this.variablesStreamed[key] ? this.variablesStreamed[key].value : undefined;
};

const entityGetVarStreamed = function (key) {
  if (!this.variablesStreamed) this.variablesStreamed = {};
  return this.variablesStreamed[key] ? this.variablesStreamed[key].value : undefined;
};
mp.Player.prototype.getVariableStreamed = playerGetVarStreamed;
mp.Vehicle.prototype.getVariableStreamed = mp.Ped.prototype.getVariableStreamed = entityGetVarStreamed;

const destroyStreamed = function () {
  mp.players.forEach((player) => {
    if (player.entitiesStreamed) delete player.entitiesStreamed[this.type + this.id];
    if (player.streamed_entities) player.streamed_entities = player.streamed_entities.filter(entity => entity != this);
  });
  return this.destroy();
};
mp.Vehicle.prototype.destroyStreamed = mp.Ped.prototype.destroyStreamed = mp.Player.prototype.destroyStreamed = destroyStreamed;

mp.events.add("playerJoin", (player) => {
  player.variablesStreamed = {};  // all variables that are set on that players entity
  player.entitiesStreamed = {};   // all entities that this player have streamed since he logged in
  player.streamed_entities = [];  // all entities that this player have streamed right now
});

mp.events.add("playerQuit", (player) => {
  player.streamed_entities.forEach((entity) => {
    entity.streamed_players = entity.streamed_players.filter(streamingPlayer => streamingPlayer != player);
    mp.events.call("entityStreamOut", player, entity.type, entity.id, entity);
  });
  Object.keys(player.entitiesStreamed).forEach((entityKey) => {
    if (player.entitiesStreamed[entityKey].variablesStreamed) Object.keys(player.entitiesStreamed[entityKey].variablesStreamed).forEach((key) => { // DEBUG: //console.log("[streamedVars.playerQuit] delete entity " + entityKey + " key " + key);
      delete player.entitiesStreamed[entityKey].variablesStreamed[key].lastValue[player.id];
    });
  });
});

mp.events.add("esi", (player, entityType, entityId) => {
  const entity = streamedEntityTypeToPool[entityType] ? streamedEntityTypeToPool[entityType].at(entityId) : false;
  
  if (entity && streamedEntityTypeToPool[entityType].exists(entity)) { // DEBUG: console.log("[Core.entityStreamIn] " + player.name + " " + entityType + " " + entityId);

    if (!entity.streamed_players) entity.streamed_players = [player];
    else entity.streamed_players.push(player);
    player.streamed_entities.push(entity);
    player.entitiesStreamed[entityType + entityId] = entity;

    mp.events.call("entityStreamIn", player, entityType, entityId, entity);

    for (let key in entity.variablesStreamed) {
      if (!entity.variablesStreamed[key].lastValue[player.id] || entity.variablesStreamed[key].lastValue[player.id] != entity.variablesStreamed[key].value) {
        player.call("setVariableStreamed", [entity.id, entity.type, key, entity.variablesStreamed[key].value]);
        entity.variablesStreamed[key].lastValue[player.id] = entity.variablesStreamed[key].value;
      }
    }
  }
});

mp.events.add("eso", (player, entityType, entityId, numSameEntityTypesStreamed) => {
  const entity = streamedEntityTypeToPool[entityType] ? streamedEntityTypeToPool[entityType].at(entityId) : false;

  if (entity && streamedEntityTypeToPool[entityType].exists(entity)) { // DEBUG: //console.log("[Core.entityStreamOut] " + player.name + " " + entityType + " " + entityId + " streamed now: " + numSameEntityTypesStreamed);
    if (!entity.streamed_players) entity.streamed_players = [];
    else entity.streamed_players = entity.streamed_players.filter(streamedPlayer => streamedPlayer != player);
    if (!player.streamed_entities) player.streamed_entities = [];
    else player.streamed_entities = player.streamed_entities.filter(streamedEntity => streamedEntity != entity);

    mp.events.call("entityStreamOut", player, entityType, entityId, entity, numSameEntityTypesStreamed);
  } else {
    if (!player.streamed_entities) player.streamed_entities = [];
    else player.streamed_entities = player.streamed_entities.filter(streamedEntity => !(streamedEntity.type == entityType && streamedEntity.id == entityId));
    if (player.entitiesStreamed) delete player.entitiesStreamed[entityType + entityId];
  }
});

/* test works
const selftest = (player) => {
  player.setVariableStreamed("selftest", Math.random()); // works
  if(mp.vehicles.exists(player.personalVehicle)) player.personalVehicle.setVariableStreamed("selftest", "vehicle_test_" + Math.random());  // works
};

mp.events.add("playerJoin", (player) => {
  setInterval(selftest, 15000, player);
});
*/
