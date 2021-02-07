const entityTypes = ["players", "vehicles", "peds"];

const setDimension = function (dim) {
  if (this.dimensionVariables) {
    Object.keys(this.dimensionVariables).forEach(key => {
      if (!this.dimensionVariables[key].persistent) delete this.dimensionVariables[key];
    });
    mp.players.forEachInDimension(this.dimension, p => syncDimensionVariables.bind({entity: this, player: p}));
  } else this.dimensionVariables = {};
  /* //feature
  mp.events.call('entityDimensionChange', this, dim, this.dimension);
  mp.players.call('entityDimensionChange', [this, dim, this.dimension]);
  */
  this.dimension = dim;
  if (this.type == 'player') updateDimensionVariables.bind({player: this, dimension: dim});
}
mp.Player.prototype.setDimension = mp.Vehicle.prototype.setDimension = mp.Ped.prototype.setDimension = setDimension;

const getDimensionVariable = function (key) {
  if (!this.dimensionVariables) this.dimensionVariables = {};
  return mp[this.type + 's'].exists(this) && this.dimensionVariables[key] ? this.dimensionVariables[key].value : undefined;
};
mp.Player.prototype.getDimensionVariable = mp.Vehicle.prototype.getDimensionVariable = mp.Ped.prototype.getDimensionVariable = getDimensionVariable;

const setDimensionVariable = function (key, data, persistent = false) {
  if (!this.dimensionVariables) this.dimensionVariables = {};
  if (this.dimensionVariables[key] && this.dimensionVariables[key].value == data) return;
  if (this.type == 'player') this.call('setDimVariable', [this.type, this.id, key, data]);
  this.dimensionVariables[key] = {
    value: data,
    persistent: persistent
  };
  mp.players.forEachInDimension(this.dimension, p => syncDimensionVariables.bind({entity: this, player: p}));
}
mp.Player.prototype.setDimensionVariable = mp.Vehicle.prototype.setDimensionVariable = mp.Ped.prototype.setDimensionVariable = setDimensionVariable;

mp.events.add({
  "playerJoin": (player) => {
    player.dimensionVariables = {};
    updateDimensionVariables.bind({player: player, dimension: player.dimension}); // In case there are variables in dimension 0
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

const updateDimensionVariables = function () {
  if (mp.players.exists(this.player)) {
    entityTypes.forEach(entityType => {
      mp[entityType].forEachInDimension(this.dimension, e => dimensionVarHandling.bind({player: this.player, entity: e}))
    });
  }
};

const syncDimensionVariables = function () {
  if (this.entity.type == 'player' && this.player.id == this.entity.id) return;
  if (!this.entity.dimensionVariables[key].lastValue[this.player.id] || this.entity.dimensionVariables[key].lastValue[this.player.id] != this.entity.dimensionVariables[key].value) {
    this.player.call('setDimVariable', [this.entity.type, this.entity.id, key, data]);
    this.entity.dimensionVariables[key].lastValue[this.player.id] = data;
  }
};

const dimensionVarHandling = function () {
  if (!this.entity.dimensionVariables) this.entity.dimensionVariables = {};
  else {
    if (this.entity.type == 'player' && this.entity.id == this.player.id) return;
    Object.keys(this.entity.dimensionVariables).forEach(key => {
      if (!this.entity.dimensionVariables[key].lastValue[this.player.id] || this.entity.dimensionVariables[key].lastValue[this.player.id] != this.entity.dimensionVariables[key].value) {
        this.player.call('setDimVariable', [this.entity.type, this.entity.id, key, this.entity.dimensionVariables[key].value]);
        this.entity.dimensionVariables[key].lastValue[this.player.id] = this.entity.dimensionVariables[key].value;
      }
    });
  }
};
/*
mp.events.addCommand('testDim', (player) => {
  let pos = player.position;
  pos.x += 2;
  pos.y += 2;
  let v = mp.vehicles.new(mp.joaat("turismor"), pos,
  {
      numberPlate: "ADMIN",
      color: [[255, 0, 0],[255,0,0]],
      dimension: player.dimension
  });
  player.outputChatBox('Setting Dimension variable for veh ' + v.id);
  v.setDimensionVariable("key1", "hello", true);
  // v.setDimension(6); // Makes key1 undefined
  setTimeout(_ => {
    player.outputChatBox('Getting Dimension variable ' + v.getDimensionVariable('key1'));
  }, 3500);
});
*/