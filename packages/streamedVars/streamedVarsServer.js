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

// Set a variable that is only sent to other players when they have that player with variable set streamed in
mp.Player.prototype.setVariableStreamed = function (key, value) {
  if (this.variablesStreamed[key] == value) return console.log("[player.setVariableStreamed] value did not change!");
  if (!this.streamed_players) this.streamed_players = [];
  this.variablesStreamed[key] = { value: value, lastValue: {} };
  this.call("setVariableStreamed", [this.id, this.type, key, value]);

  if (this.streamed_players.length) {
    this.streamed_players.forEach((player) => {
      if (mp.players.exists(player)) this.variablesStreamed[key].lastValue[player.id] = value;
    });
    mp.players.call(this.streamed_players, "setVariableStreamed", [this.id, this.type, key, value]);
  }
};

mp.Player.prototype.getVariableStreamed = function (key) {
  return this.variablesStreamed[key] ? this.variablesStreamed[key].value : undefined;
};

mp.Ped.prototype.setVariableStreamed = function (key, value) {
  if (!this.variablesStreamed) this.variablesStreamed = {};
  if (!this.streamed_players) this.streamed_players = [];

  this.variablesStreamed[key] = { value: value, lastValue: {} };

  if (this.streamed_players.length) {
    this.streamed_players.forEach((player) => {
      this.variablesStreamed[key].lastValue[player.id] = value;
    });
    mp.players.call(this.streamed_players, "setVariableStreamed", [this.id, this.type, key, value]);
  }
};

mp.Ped.prototype.getVariableStreamed = function (key) {
  if (!this.variablesStreamed) this.variablesStreamed = {}; // move to npcs
  return this.variablesStreamed[key] ? this.variablesStreamed[key].value : undefined;
};

mp.Vehicle.prototype.setVariableStreamed = function (key, value) {
  if (!this.variablesStreamed) this.variablesStreamed = {};
  if (!this.streamed_players) this.streamed_players = [];
  this.variablesStreamed[key] = { value: value, lastValue: {} };

  if (this.streamed_players.length) {
    this.streamed_players.forEach((player) => {
      this.variablesStreamed[key].lastValue[player.id] = value;
    });
    mp.players.call(this.streamed_players, "setVariableStreamed", [this.id, this.type, key, value]);
  }
};

mp.Vehicle.prototype.getVariableStreamed = function (key) {
  if (!this.variablesStreamed) this.variablesStreamed = {}; // move to vehicles
  return this.variablesStreamed[key] ? this.variablesStreamed[key].value : undefined;
};

mp.events.add("playerJoin", (player) => {
  player.variablesStreamed = {};  // all variables that are set on that players entity
  player.entitiesStreamed = [];   // all entities that this player have streamed since he logged in
  player.streamed_entities = [];  // all entities that this player have streamed right now
});

mp.events.add("playerQuit", (player) => {
  player.streamed_entities.forEach((entity) => {
    entity.streamed_players = entity.streamed_players.filter(streamingPlayer => streamingPlayer != player);
    mp.events.call("entityStreamOut", player, entity.type, entity.id, entity);
  });
  player.entitiesStreamed.forEach((entity) => {
    Object.keys(entity.variablesStreamed).forEach((key) => {
      delete entity.variablesStreamed[key].lastValue[player.id];
    });
  });
});

mp.events.add("esi", (player, entityType, entityId) => {
  const entity = entityStreamInTypeToPool[entityType] ? entityStreamInTypeToPool[entityType].at(entityId) : false;
  
  if (entity && entityStreamInTypeToPool[entityType].exists(entity)) { // DEBUG: console.log("[Core.entityStreamIn] " + player.name + " " + entityType + " " + entityId);

    if (!entity.streamed_players) entity.streamed_players = [player];
    else entity.streamed_players.push(player);
    if (!player.streamed_entities) player.streamed_entities = [entity];
    else player.streamed_entities.push(entity);

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
  const entity = entityStreamOutTypeToPool[entityType] ? entityStreamOutTypeToPool[entityType].at(entityId) : false;

  if (entity && entityStreamOutTypeToPool[entityType].exists(entity)) { // DEBUG: //console.log("[Core.entityStreamOut] " + player.name + " " + entityType + " " + entityId + " streamed now: " + numSameEntityTypesStreamed);

    if (!entity.streamed_players) entity.streamed_players = [];
    else entity.streamed_players = entity.streamed_players.filter(streamedPlayer => streamedPlayer != player);
    if (!player.streamed_entities) player.streamed_entities = [];
    else player.streamed_entities = player.streamed_entities.filter(streamedEntity => streamedEntity != entity);

    mp.events.call("entityStreamOut", player, entityType, entityId, entity, numSameEntityTypesStreamed);
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
