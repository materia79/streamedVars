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
  if (!this.streamed_players) this.streamed_players = []; // fix for unreliable entity.streamedPlayers sometimes
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
  if (!this.variablesStreamed) this.variablesStreamed = {}; // move to npcs
  if (!this.streamed_players) this.streamed_players = []; // fix for unreliable entity.streamedPlayers sometimes

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
  if (!this.variablesStreamed) this.variablesStreamed = {}; // move to vehicles
  if (!this.streamed_players) this.streamed_players = []; // fix for unreliable entity.streamedPlayers sometimes
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

const entityStreamIn = (player, entity) => {
  for (let key in entity.variablesStreamed) {
    if (!entity.variablesStreamed[key].lastValue[player.id] || entity.variablesStreamed[key].lastValue[player.id] != entity.variablesStreamed[key].value) {
      player.call("setVariableStreamed", [entity.id, entity.type, key, entity.variablesStreamed[key].value]);
      entity.variablesStreamed[key].lastValue[player.id] = entity.variablesStreamed[key].value;
    }
  }
};

mp.events.add("playerJoin", (player) => {
  player.variablesStreamed = {}; // move to login
  player.pedsStreamed = [];
});

mp.events.add("playerQuit", (player) => {
  player.pedsStreamed.forEach((ped) => {
    ped.streamed_players = ped.streamed_players.filter(streamingPlayer => streamingPlayer != player);
  });
});

mp.events.add("entityStreamIn", (player, entityType, entityId) => {
  const entity = entityStreamInTypeToPool[entityType] ? entityStreamInTypeToPool[entityType].at(entityId) : false;
  
  if (entity && entityStreamInTypeToPool[entityType].exists(entity)) { // DEBUG: console.log("[Core.entityStreamIn] " + player.name + " " + entityType + " " + entityId);
    console.log("[StreamIn] " + player.name + " (" + player.id + ") streamed in " + entity.type + " id " + entityId);
    //if (entityType == "ped") {
      if (!entity.streamed_players) entity.streamed_players = []; // move to npcs
      entity.streamed_players.push(player);
      player.pedsStreamed.push(entity);
    //}

    entityStreamIn(player, entity);
  }
});

mp.events.add("entityStreamOut", (player, entityType, entityId) => {
  const entity = entityStreamOutTypeToPool[entityType] ? entityStreamOutTypeToPool[entityType].at(entityId) : false;

  if (entity && entityStreamOutTypeToPool[entityType].exists(entity)) { // DEBUG: console.log("[Core.entityStreamIn] " + player.name + " " + entityType + " " + entityId);
    console.log("[StreamOut] " + player.name + " streamed out " + entity.type + " id " + entityId);
    //if (entityType == "ped") {
      if (!entity.streamed_players) entity.streamed_players = []; // move to npcs
      entity.streamed_players = entity.streamed_players.filter(streamedPlayer => streamedPlayer != player);
      player.pedsStreamed = player.pedsStreamed.filter(pedStreamed => pedStreamed != entity);
    //}
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
