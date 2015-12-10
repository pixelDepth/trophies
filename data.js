trophies.Data = (function(){

	function Data(user_id){

		/**
		 * @property {Number} user_id The user id for this user.
		 */

		this.user_id = user_id;

		/**
		 * @property {Object} trophy_data Data object for the user, contains all data for each pack (trophies earned, and other
		 * random data that may be needed for that pack).
		 */

		this.trophy_data = {};
		this.trophy_local_data = {};
		this.trophy_merged_data = {};
		this.user_trophies = {};

		this.stats = {

			earned_trophies: [],
			total_trophies: 0,
			total_points: 0,
			current_level: 1,
			next_level: 2,
			level_percentage: 0,
			maxed: false,
			calculated: false,

			cups: {

				total: 0,
				bronze: 0,
				silver: 0,
				gold: 0

			}
		};

		var self = this;

		this.sync_to_keys = function(hook, skip_key_update, callbacks){

			// Update all pack keys with the data and trophies

			if(trophies.packs.length){
				for(var pack in trophies.packs){
					var pack_info = trophies.utils.get.pack(trophies.packs[pack]);

					if(pack_info){

						// First we need to move local trophies to the key

						var _local_data = self.get.local_pack_trophies(pack_info.pack);

						if(_local_data){
							for(var trophy_id in _local_data){
								var the_trophy = trophies.utils.get.trophy(pack_info.pack, trophy_id);

								if(the_trophy){

									// Add to key data

									self.add.trophy(the_trophy, true);

									// Now we need to remove the trophy from local if
									// it has been seen.

									if(_local_data[trophy_id].s){
										self.remove.trophy(the_trophy, true);
									}
								}
							}

							// Now update local storage

							if(pack_info.plugin_key){
								yootil.storage.set(pack_info.plugin_key, self.get.local_pack(pack_info.pack), true, true);
							}
						}

						// Now we need to do key updates

						if(!skip_key_update){

							// Check if we have space, otherwise let the user know and then bail out

							if(!yootil.key.has_space(pack_info.plugin_key)){
								this.error = "Data length has gone over it's limit of " + yootil.forum.plugin_max_key_length();

								pb.window.dialog("data_limit", {

									title: "Key Data Limit Reached",
									modal: true,
									height: 200,
									width: 350,
									resizable: false,
									draggable: false,
									html: "Unfortunately we can not save anymore data in the key.<br /><br />Plugin: Trophies - [" + pack_info.plugin_key + "]",

									buttons: {

										Close: function () {
											$(this).dialog("close");
										}

									}

								});

								return;
							}

							if(hook){
								yootil.key.set_on(pack_info.plugin_key, self.get.pack(pack_info.pack), this.user_id, hook);
							} else {
								yootil.key.set(pack_info.plugin_key, self.get.pack(pack_info.pack), this.user_id, callbacks);
							}
						}
					}
				}
			}


		};

		this.add = {

			pack_data: function(pack, data){
				self.trophy_data[pack] = data;
			},

			pack_local_data: function(pack, data){
				self.trophy_local_data[pack] = data;
			},

			trophy: function(trophy, data, local){
				if(trophy && trophy.id && trophy.pack){
					var pack_info = trophies.utils.get.pack(trophy.pack);

					if(pack_info){
						var trophies_key = pack_info.trophies_key;

						if(data){
							self.pack.create(pack_info.pack);
							self.trophy_data[pack_info.pack][trophies_key][trophy.id] = trophy.t || yootil.timestamp();
						}

						if(local){
							self.pack.create(trophy.pack, true);

							if(self.trophy_local_data[trophy.pack] && self.trophy_local_data[trophy.pack][trophies_key]){
								self.trophy_local_data[trophy.pack][trophies_key][trophy.id] = {

										s: 0,
										t: trophy.t || yootil.timestamp()

								};

								if(pack_info.plugin_key){
									yootil.storage.set(pack_info.plugin_key, self.trophy_local_data[pack_info.pack], true, true);
								}
							}
						}
					}
				}
			}

		};

		this.pack = {

			exists: function(pack,  local){
				if(!self[((local)? "trophy_local_data" : "trophy_data")][pack]){
					return false;
				}

				return true;
			},

			create: function(pack, local){
				var the_data = self[((local)? "trophy_local_data" : "trophy_data")];

				if(!self.pack.exists(pack, local)){
					the_data[pack] = {};
				}

				var pack_info = trophies.utils.get.pack(pack);

				if(pack_info){
					if(!the_data[pack][pack_info.trophies_key]){
						the_data[pack][pack_info.trophies_key] = {};
					}

					if(!the_data[pack][pack_info.trophies_data_key]){
						the_data[pack][pack_info.trophies_data_key] = {};
					}
				}
			}

		};

		this.get = {

			data: function(){
				return self.trophy_data;
			},

			local_data: function(){
				return self.trophy_local_data;
			},

			pack: function(pack_id){
				if(self.trophy_data[pack_id]){
					return self.trophy_data[pack_id];
				}

				return null;
			},

			local_pack: function(pack_id){
				if(self.trophy_local_data[pack_id]){
					return self.trophy_local_data[pack_id];
				}

				return null;
			},

			pack_trophies: function(pack_id){
				var pack_info = trophies.utils.get.pack(pack_id);

				if(pack_info){
					if(self.trophy_data[pack_id] && self.trophy_data[pack_id][pack_info.trophies_key]){
						return self.trophy_data[pack_id][pack_info.trophies_key];
					}
				}

				return null;
			},

			local_pack_trophies: function(pack_id){
				var pack_info = trophies.utils.get.pack(pack_id);

				if(pack_info){
					if(self.trophy_local_data[pack_id] && self.trophy_local_data[pack_id][pack_info.trophies_key]){
						return self.trophy_local_data[pack_id][pack_info.trophies_key];
					}
				}

				return null;
			},

			pack_data: function(pack_id){
				var pack_info = trophies.utils.get.pack(pack_id);

				if(pack_info){
					if(self.trophy_data[pack_id] && self.trophy_data[pack_id][pack_info.trophies_data_key]){
						return self.trophy_data[pack_id][pack_info.trophies_data_key];
					}
				}

				return {};
			},

			local_pack_data: function(pack_id){
				var pack_info = trophies.utils.get.pack(pack_id);

				if(pack_info){
					if(self.trophy_local_data[pack_id] && self.trophy_local_data[pack_id][pack_info.trophies_data_key]){
						return self.trophy_local_data[pack_id][pack_info.trophies_data_key];
					}
				}

				return {};
			},

			trophy: function(trophy, local, anywhere){
				var pack_info = trophies.utils.get.pack(trophy.pack);

				if(pack_info){
					if(anywhere){
						if(self.trophy.exists(trophy)){
							if(self.trophy_data[pack_info.pack] && self.trophy_data[pack_info.pack][pack_info.trophies_key] && self.trophy_data[pack_info.pack][pack_info.trophies_key][trophy.id]){
								return self.trophy_data[pack_info.pack][pack_info.trophies_key][trophy.id];
							}
						} else if(self.trophy.exists(trophy, true)){
							if(self.trophy_local_data[pack_info.pack] && self.trophy_local_data[pack_info.pack][pack_info.trophies_key] && self.trophy_local_data[pack_info.pack][pack_info.trophies_key][trophy.id]){
								return self.trophy_local_data[pack_info.pack][pack_info.trophies_key][trophy.id];
							}
						}
					} else {
						if(self.trophy.exists(trophy, local)){
							var where = (local)? self.trophy_local_data : self.trophy_data;

							if(where[pack_info.pack] && where[pack_info.pack][pack_info.trophies_key] && where[pack_info.pack][pack_info.trophies_key][trophy.id]){
								return where[pack_info.pack][pack_info.trophies_key][trophy.id];
							}
						}
					}
				}

				return false;
			},

			stat: {

				earned_trophies: function(){
					return self.stats.earned_trophies;
				},

				total_trophies: function(){
					return self.stats.total_trophies;
				},

				total_points: function(){
					return self.stats.total_points;
				},

				total_xp: function(){
					return self.stats.total_points;
				},

				current_level: function(){
					return self.stats.current_level;
				},

				next_level: function(){
					return self.stats.next_level;
				},

				level_percentage: function(){
					return self.stats.level_percentage;
				},

				maxed: function(){
					return this.stats.maxed;
				},

				cups: {

					bronze: function(){
						return self.stats.cups.bronze;
					},

					silver: function(){
						return self.stats.cups.silver;
					},

					gold: function(){
						return self.stats.cups.gold;
					}

				}

			},

			trophies: function(){
				return self.user_trophies;
			}

		};

		this.set = {

			data: function(data){
				self.trophy_data = data;
			},

			local_data: function(data){
				self.trophy_local_data = data;
			},

			pack: function(pack_id, pack){
				self.trophy_data[pack_id] = pack;
			},

			local_pack: function(pack_id, pack){
				self.trophy_local_data[pack_id] = pack;
			},

			pack_trophies: function(pack_id, pack_trophies){
				var pack_info = trophies.utils.get.pack(pack_id);

				if(pack_info){
					if(self.trophy_data[pack_id]){
						self.trophy_data[pack_id][pack_info.trophies_key] = pack_trophies;

						return true;
					}
				}

				return null;
			},

			local_pack_trophies: function(pack_id, pack_trophies){
				var pack_info = trophies.utils.get.pack(pack_id);

				if(pack_info){
					if(self.trophy_local_data[pack_id]){
						self.trophy_local_data[pack_id][pack_info.trophies_key] = pack_trophies;

						return true;
					}
				}

				return null;
			},

			pack_data: function(pack_id, pack_data){
				var pack_info = trophies.utils.get.pack(pack_id);

				if(pack_info){
					if(self.trophy_data[pack_id] && self.trophy_data[pack_id][pack_info.trophies_data_key]){
						self.trophy_data[pack_id][pack_info.trophies_data_key] = pack_data;

						return true;
					}
				}

				return null;
			},

			local_pack_data: function(pack_id, pack_data){
				var pack_info = trophies.utils.get.pack(pack_id);

				if(pack_info){
					if(self.trophy_local_data[pack_id] && self.trophy_local_data[pack_id][pack_info.trophies_data_key]){
						self.trophy_local_data[pack_id][pack_info.trophies_data_key] = pack_data;

						return true;
					}
				}

				return null;
			},

			trophy: {

				seen: function(trophy){
					var pack_info = trophies.utils.get.pack(trophy.pack);

					if(pack_info){
						if(self.trophy.exists(trophy, true)){
							if(self.trophy_local_data[trophy.pack] && self.trophy_local_data[trophy.pack][pack_info.trophies_key]){
								self.trophy_local_data[trophy.pack][pack_info.trophies_key][trophy.id].s = 1;
							}
						}

						if(pack_info.plugin_key){
							yootil.storage.set(pack_info.plugin_key, self.trophy_local_data[trophy.pack], true, true);
						}
					}
				}

			}

		};

		this.remove = {

			trophy: function(trophy, local){
				var pack_info = trophies.utils.get.pack(trophy.pack);

				if(pack_info){
					if(self.trophy.exists(trophy, local)){
						if(local && self.trophy_local_data[trophy.pack] && self.trophy_local_data[trophy.pack][pack_info.trophies_key]){
							delete self.trophy_local_data[trophy.pack][pack_info.trophies_key][trophy.id];

						} else if(self.trophy_data[trophy.pack] && self.trophy_data[trophy.pack][pack_info.trophies_key]){
							delete self.trophy_data[trophy.pack][pack_info.trophies_key][trophy.id];
						}
					}
				}
			}

		};

		this.clear = {

			everything: function(skip_key_update, callbacks){
				for(var pack in trophies.packs){
					var pack_info = trophies.utils.get.pack(trophies.packs[pack]);

					if(pack_info){
						if(pack_info.plugin_key){
							yootil.storage.remove(pack_info.plugin_key);

							self.trophy_data = {};
							self.trophy_local_data = {};
							self.trophy_merged_data = {};
							self.user_trophies = {};

							if(!skip_key_update){
								yootil.key.set(pack_info.plugin_key, {}, this.user_id, callbacks);
							}
						}
					}
				}
			}

		};

		this.trophy = {

			earned: function(trophy){
				if(self.trophy.exists(trophy) || self.trophy.exists(trophy, true)){
					return true;
				}

				return false;
			},

			seen: function(trophy){
				var user_trophy = self.get.trophy(trophy, true);

				if(user_trophy){
					if(user_trophy.s){
						return true;
					}
				} else if(self.get.trophy(trophy)){
					return true;
				}

				return false;
			},

			exists: function(trophy, local){
				var store = self[((local)? "trophy_local_data" : "trophy_data")];
				var pack_info = trophies.utils.get.pack(trophy.pack);

				if(pack_info){
					if(trophy && store[trophy.pack] && store[trophy.pack][pack_info.trophies_key] && store[trophy.pack][pack_info.trophies_key][trophy.id]){
						return true;
					}
				}

				return false;
			}

		};

		this.calculate_stats = function(force_recalculations){
			if(this.stats.calculated && !force_recalculations){
				return;
			}

			for(var pack in this.trophy_data){
				if(trophies.utils.pack.exists(pack)){
					var pack_info = trophies.utils.get.pack(pack);

					if(pack_info){
						if(!this.user_trophies[pack]){
							this.user_trophies[pack] = {};
						}

						for(var trophy in this.trophy_data[pack][pack_info.trophies_key]){
							var the_trophy = {

								id: trophy,
								pack: pack

							};

							if(trophies.utils.trophy.exists(the_trophy)){
								this.user_trophies[pack][trophy] = this.trophy_data[pack][pack_info.trophies_key][trophy];
							}
						}
					}
				}
			}

			for(var pack in this.trophy_local_data){
				if(trophies.utils.pack.exists(pack)){
					var pack_info = trophies.utils.get.pack(pack);

					if(pack_info){
						if(!this.user_trophies[pack]){
							this.user_trophies[pack] = {};
						}

						for(var trophy in this.trophy_local_data[pack][pack_info.trophies_key]){
							var the_trophy = {

								id: trophy,
								pack: pack

							};

							if(trophies.utils.trophy.exists(the_trophy)){
								if(!this.user_trophies[pack][trophy]){
									this.user_trophies[pack][trophy] = this.trophy_local_data[pack][pack_info.trophies_key][trophy];
								}
							}
						}
					}
				}
			}

			for(var pack in this.user_trophies){
				for(var trophy in this.user_trophies[pack]){
					if(!trophies.lookup[pack][trophy] || trophies.lookup[pack][trophy].disabled){
						continue;
					}

					var lookup_trophy = trophies.lookup[pack][trophy];

					this.stats.total_trophies ++;

					switch(lookup_trophy.cup){

						case "bronze" :
							this.stats.total_points += trophies.settings.bronze_xp;
							this.stats.cups.bronze ++;
							break;

						case "silver" :
							this.stats.total_points += trophies.settings.silver_xp;
							this.stats.cups.silver ++;
							break;

						case "gold" :
							this.stats.total_points += trophies.settings.gold_xp;
							this.stats.cups.gold ++;
							break;

					}
				}
			}

			if(this.stats.total_points > 0){
				if(this.stats.total_points > trophies.levels[trophies.levels.length - 1]){
					this.stats.current_level = trophies.levels.length;
					this.stats.next_level = this.stats.current_level + 1

					this.stats.maxed = true;
				} else {
					for(var i = 0, l = trophies.levels.length; i < l; i ++){
						if(this.stats.total_points >= trophies.levels[i] && this.stats.total_points < trophies.levels[i + 1]){
							this.stats.current_level = i + 1;
							this.stats.next_level = this.stats.current_level + 1;
							break;
						}
					}
				}
			}

			var percentage = 0;

			if(!this.stats.maxed){
				var next_level_points = trophies.levels[this.stats.next_level - 1];
				var current_level_points = trophies.levels[this.stats.current_level - 1];
				var points_so_far = (this.stats.total_points % current_level_points);
				var diff = next_level_points % current_level_points

				if(next_level_points){
					percentage = ((points_so_far / diff) * 100).toFixed(0);
				}

				if(percentage > 100){
					percentage = 100;
				}
			} else {
				percentage = 100;
			}

			this.stats.level_percentage = percentage;
			this.stats.calculated = true;
		}
	}

	return Data;

})();