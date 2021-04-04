const entityTypes = ["players", "vehicles", "peds"];
const setDimension = function (dim) {
  if (this.dimensionVariables) {
    Object.keys(this.dimensionVariables).forEach(key => {
      if (!this.dimensionVariables[key].persistent) delete this.dimensionVariables[key];  
    });
    mp.players.forEachInDimension(dim, (p, id) => { 
      dimensionVarHandling.bind({entity: this, player: p})();
    });  
  } else this.dimensionVariables = {};
  /* Feature: Choose to enable if you need the event.
  mp.events.call('entityDimensionChange', this, dim, this.dimension);
  mp.players.call('entityDimensionChange', [this, dim, this.dimension]);
  */
  this.dimension = dim;
  if (this.type == 'player') updateDimensionVariables.bind({player: this, dimension: dim})();
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
}
mp.Player.prototype.setVariableDimension = mp.Vehicle.prototype.setVariableDimension = mp.Ped.prototype.setVariableDimension = setVariableDimension;

mp.events.add({
  "playerReady": (player) => {
    player.dimensionVariables = {};
    updateDimensionVariables.bind({player: player, dimension: player.dimension})(); // In case there are variables in dimension 0
  },
  "playerQuit": (player) => {
    mp.players.forEach(p => {
      if (mp.players.exists(p) && p.dimensionVariables) {
        Object.keys(p.dimensionVariables).forEach(key => {
          if (p.dimensionVariables[key].lastValue[player.id]) delete p.dimensionVariables[key].lastValue[player.id];
        });
      }
    });
  }
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
    if (!this.entity.dimensionVariables[key].lastValue[this.player.id] || this.entity.dimensionVariables[key].lastValue[this.player.id] != this.entity.dimensionVariables[key].value) {
      let data = this.entity.dimensionVariables[key].value;
      this.player.call('setDimVariable', [this.entity.type, this.entity.id, key, data]);
      this.entity.dimensionVariables[key].lastValue[this.player.id] = data;
    }
};

const dimensionVarHandling = function () { // Handles dimension variables sync of a entity to other players. (All variables)
  if (!this.entity.dimensionVariables) this.entity.dimensionVariables = {};
  else {
    if (this.entity.type == 'player' && this.entity.id == this.player.id) return; //console.log(this.entity.id + " -> " + this.player.id);
    Object.keys(this.entity.dimensionVariables).forEach(key => {
      try {
      if (!this.entity.dimensionVariables[key].lastValue[this.player.id] || this.entity.dimensionVariables[key].lastValue[this.player.id] != this.entity.dimensionVariables[key].value) {
        this.player.call('setDimVariable', [this.entity.type, this.entity.id, key, this.entity.dimensionVariables[key].value]);
        this.entity.dimensionVariables[key].lastValue[this.player.id] = this.entity.dimensionVariables[key].value;
        }
      } catch (error) {
        console.log("[dimensionVarHandling] " + error.stack);
      }
    });
  }
};
