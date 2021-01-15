const entityTypeToPool = {
  "player": mp.players,
  "ped": mp.peds
}

// Set a variable that is only sent to other players when they have that player with variable set streamed in
mp.Player.prototype.setVariableStreamed = function (key, value) {
  this.variablesStreamed[key] = { value: value, lastValue: {} };
  this.call("setVariableStreamed", [this.id, this.type, key, value]);

  if (this.streamedPlayers.length) {
    this.streamedPlayers.forEach((player) => {
      this.variablesStreamed[key].lastValue[player.id] = value;
    });
    mp.players.call(this.streamedPlayer, "setVariableStreamed", [this.id, this.type, key, value]);
  }
};

mp.Player.prototype.getVariableStreamed = function (key) {
  return this.variablesStreamed[key] ? this.variablesStreamed[key].value : undefined;
};

mp.Ped.prototype.setVariableStreamed = function (key, value) {
  if (!this.variablesStreamed) this.variablesStreamed = {}; // move to npcs
  if (!this.streamedPlayers) this.streamedPlayers = []; // move to npcs

  this.variablesStreamed[key] = { value: value, lastValue: {} };

  if (this.streamedPlayers.length) {
    this.streamedPlayers.forEach((player) => {
      this.variablesStreamed[key].lastValue[player.id] = value;
    });
    mp.players.call(this.streamedPlayer, "setVariableStreamed", [this.id, this.type, key, value]);
  }
};

mp.Ped.prototype.getVariableStreamed = function (key) {
  if (!this.variablesStreamed) this.variablesStreamed = {}; // move to npcs
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
});

mp.events.add("entityStreamIn", (player, entityType, entityId) => {
  const entity = entityTypeToPool[entityType] ? entityTypeToPool[entityType].at(entityId) : false;
  
  if (entity && entityTypeToPool[entityType].exists(entity)) { // DEBUG: console.log("[Core.entityStreamIn] " + player.name + " " + entityType + " " + entityId);
    if (entityType == "ped") {
      if (!entity.streamedPlayers) entity.streamedPlayers = []; // move to npcs
      entity.streamedPlayers.push(player);
    }

    entityStreamIn(player, entity);
  }
});
