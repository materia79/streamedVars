const entityTypes = ["players", "vehicles", "peds"];

const setDimension = function (dimension) {
  if (this.dimension == dimension) return console.log(`[Prototype.player.setDimension] ${mp.tty.yellow}${this.name} was already in dimension ${dimension}${mp.tty.normal}`);

  if (this.dimensionVariables) {
    Object.keys(this.dimensionVariables).forEach(key => {
      if (!this.dimensionVariables[key].persistent) delete this.dimensionVariables[key];  
    });
    mp.players.forEachInDimension(dimension, (player, id) => {
      dimensionVarHandling.bind({ entity: player, player: this })();
    });  
  } else this.dimensionVariables = {};
  /* Feature: Choose to enable if you need the event.
  mp.events.call('entityDimensionChange', this, dimension, this.dimension);
  mp.players.call('entityDimensionChange', [this, dimension, this.dimension]);
  */
  this.dimension = dimension;
  if (this.type == 'player') {
    this.call('dimensionChange');
    updateDimensionVariables.bind({player: this, dimension: dimension})();
  }
}
mp.Player.prototype.setDimension = mp.Vehicle.prototype.setDimension = mp.Ped.prototype.setDimension = setDimension;
const getVariableDimension = function (key) {
  if (!this.dimensionVariables) this.dimensionVariables = {};
  return this && mp[this.type + 's'].exists(this) && this.dimensionVariables[key] ? this.dimensionVariables[key].value : undefined;
};
mp.Player.prototype.getVariableDimension = mp.Vehicle.prototype.getVariableDimension = mp.Ped.prototype.getVariableDimension = getVariableDimension;

const setVariableDimension = function (key, data, persistent = true) {
  if (!this.dimensionVariables) this.dimensionVariables = {};
  if (this.dimensionVariables[key] && this.dimensionVariables[key].value == data) return;
  if (this.type == 'player') this.call('setDimVariable', [this.type, this.id, key, data]);
  this.dimensionVariables[key] = {
    value: data,
    lastValue: {},
    persistent: persistent
  };
  mp.players.forEachInDimension(this.dimension, (p, id) => { 
    if (this.id == p.id) return;
    syncDimensionVariable.bind({entity: this, player: p})(key);
  });
  return this;
}
mp.Player.prototype.setVariableDimension = mp.Vehicle.prototype.setVariableDimension = mp.Ped.prototype.setVariableDimension = setVariableDimension;

mp.events.add("playerReady", (player) => {
  player.dimensionVariables = {};
  updateDimensionVariables.bind({ player: player, dimension: player.dimension })(); // In case there are variables in dimension 0
});

mp.events.add("playerQuit", (player) => {
  mp.players.forEach((otherPlayer) => {
    if (mp.players.exists(otherPlayer) && otherPlayer.dimensionVariables) {
      Object.keys(otherPlayer.dimensionVariables).forEach((key) => {
        if (typeof otherPlayer.dimensionVariables[key].lastValue[player.id] != "undefined") delete otherPlayer.dimensionVariables[key].lastValue[player.id];  // DEBUG: //console.log("delete otherPlayer.dimensionVariables[" + key + "].lastValue[" + player.id + "]");
      });
    }
  });
});

const updateDimensionVariables = function () { // Updates all dimension data from entities to specific player
  if (mp.players.exists(this.player)) {
    entityTypes.forEach(entityType => {
      mp[entityType].forEachInDimension(this.dimension, (entity, id) => { 
        dimensionVarHandling.bind({player: this.player, entity: entity})();
      });
    });
  }
};

const syncDimensionVariable = function (key) { // Updates a certain dimension data of a entity to other players. (singular variable)
  if (this.entity.type == 'player' && this.player.id == this.entity.id) return;
  if (typeof this.entity.dimensionVariables[key].lastValue[this.player.id] != "undefined" || this.entity.dimensionVariables[key].lastValue[this.player.id] != this.entity.dimensionVariables[key].value) {
    const data = this.entity.dimensionVariables[key].value;
    this.player.call('setDimVariable', [this.entity.type, this.entity.id, key, data]);
    this.entity.dimensionVariables[key].lastValue[this.player.id] = data;
  }
};

const dimensionVarHandling = function () { // Handles dimension variables sync of a entity to other players. (All variables)
  if (!this.entity.dimensionVariables) this.entity.dimensionVariables = {};
  else {
    if (this.entity.type == 'player' && this.entity.id == this.player.id) return; // DEBUG: //console.log(this.entity.id + " -> " + this.player.id);
    Object.keys(this.entity.dimensionVariables).forEach(key => {
      try {
        if (typeof this.entity.dimensionVariables[key].lastValue[this.player.id] != "undefined" || this.entity.dimensionVariables[key].lastValue[this.player.id] != this.entity.dimensionVariables[key].value) {
          this.player.call('setDimVariable', [this.entity.type, this.entity.id, key, this.entity.dimensionVariables[key].value]); // DEBUG: //console.log(JSON.stringify([this.entity.type, this.entity.id, key, this.entity.dimensionVariables[key].value]));
          this.entity.dimensionVariables[key].lastValue[this.player.id] = this.entity.dimensionVariables[key].value;
        } // DEBUG: //else console.log("key " + key + " already sync " + this.entity.id + " -> " + this.player.id);
      } catch (error) {
        console.log("[dimensionVarHandling] " + error.stack);
      }
    });
  }
};
