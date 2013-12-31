/********************************************************************
 * Javascript Class Copyright (c) 2013 Wayde.Fei<waydeGIT@qq.com>
 * C++ Class emulation. Ver0.003
 *
 *This program is free software: you can redistribute it and/or modify
 *it under the terms of the GNU General Public License as published by
 *the Free Software Foundation, either version 3 of the License, or
 *(at your option) any later version.
 *
 *You should have received a copy of the GNU General Public License
 *along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *********************************************************************/

Class({
	Namespace: Library,
	Name: "CNamedSingletonManagerBase",
	Private: {
		m_name: null,
		m_count: 0
	},
	Protected: {
		g_instances: Property({}, [Property.Type.Static.Var]),
		constructor: function (name, ThisType) {
			this.m_name = name;
			this.constructor.g_instances[this.m_name] = this;
		},
		IsObjectVaild: Property(function () {
			return this.CNamedSingletonManagerBase.g_instances.hasOwnProperty(this.m_name);
		}, [Property.Type.Object.Property]),
		addref: function () {
			if (this.IsObjectVaild)
				this.m_count++;
		},
		release: function () {
			if (this.IsObjectVaild) {
				if (--this.m_count === 0)
					delete this.CNamedSingletonManagerBase.g_instances[this.m_name];
			}
		}
	},
	Public: {
		Name: Property({
			get: function () {
				return this.m_name;
			}
		}, [Property.Type.Object.Property]),
		AlwaysGet: Property(function (obj, name) {
			var instance = Class.CNamedSingletonManagerBase.g_instances;
			if (instance.hasOwnProperty(name))
				return instance[name];
			return new this(obj, name, this);
		}, [Property.Type.Static.Function, Property.Type.Clone]),
		Get: Property(function (obj, name) {
			var instance = Class.CNamedSingletonManagerBase.g_instances;
			if (instance.hasOwnProperty(name))
				return instance[name];
			return null;
		}, [Property.Type.Static.Function, Property.Type.Clone])
	}
});


Class({
	Namespace: Library,
	Name: "ProtocolBindFactory",
	Bases: [[Library.CNamedSingletonManagerBase, [Class.Arguments(1), Class.Arguments(2)]]],
	Friends: [],
	Private: {
		m_callbacks: null,
		constructor: function (obj, name) {
			this.m_callbacks = {};
			Client.addmap(this.Name, this, true, this.onCallback);
		}
	},
	Public: {
		onCallback: function (msg) {
			var callbacks = this.m_callbacks;
			for (var n in callbacks) {
				var callback = callbacks[n];
				if (callback[0])
					callback[1].call(callback[0], this, msg);
				else
					callback[1](this, msg);
			}
		},
		SetNotice: function (nameObj, obj,fun, isremove) {
			//TODO: do check.
			var name = Class.GetSetting(nameObj.constructor).Name;
			Class.Assert(name, "can't reflect the class name");
			if (isremove) {
				delete this.m_callbacks[name];
				this.release();
			}
			else {
				if (!this.m_callbacks.hasOwnProperty(name))
					this.addref();

				this.m_callbacks[name] = [obj, fun];
			}
		}
	}
});


Class({
	Namespace: Library,
	Name: "ProtocolBind",
	Bases: [Class.CCreator],
	Friends: [Library.ProtocolBindFactory],
	Private: {
		m_value: null,
		m_dirtyValue: undefined,
		m_callbacks: [],
		m_protocolMap: [],
		_delegate_callback: function (v) {
			var parent = this;
			var callback = this.onCallback;
			var factoryIns = v[0], name = v[1], processNewValue = v[2];
			var ret = function () {
				var a = [name, processNewValue];
				for (var i = 0; i < arguments.length; i++)
					a.push(arguments[i]);
				callback.apply(parent, a);
			};
			Class.HiddenCaller(ret);
			factoryIns.SetNotice(this, null, ret);
			return ret;
		},
		constructor: function () {
			this.m_callbacks = [];
			this.m_protocolMap = [];
			for (var i = 0; i < arguments.length; i++) {
				this.m_protocolMap.push([this._delegate_callback(arguments[i])].concat(arguments[i]));
			}
		},
	},
	Protected: {
		callback_SetNewValue: function (name, processNewValue,obj, msg) {
			if (msg.errorCode !== 0)
				return { success: false };

			var ret = null;
			var oldValue = this.m_value;
			if (name === undefined) {
				newValue = this.m_dirtyValue;
				this.m_dirtyValue = undefined;
			}
			else {
				var newValue = Class.GetMember(msg, name);
			}
			if (processNewValue) {
				ret = processNewValue(this.m_value, newValue);
				Class.Assert(ret, "return value error.");
			}
			else {
				ret = oldValue;
				this.m_value = newValue;
			}
			return { success: true, value: ret };
		},
		onCallback: Property(function (name, processNewValue, obj, msg) {
			var ret = this.callback_SetNewValue(name, processNewValue,obj, msg);
			if (!ret.success)
				return;
			ret = ret.value;
			var callbacks = this.m_callbacks;
			for (var i = 0; i < callbacks.length; i++) {
				callbacks[i][1].call(callbacks[i][0], ret, this.m_value);
			}

		}, [Property.Type.Object.Function])
	},
	Public: {
		Value: Property({
			get: function () { return this.m_value; },
			set: function (v) {
				this.m_dirtyValue = v;
			}
		}, [Property.Type.Object.Property]),

		SetNotice: function (obj, fun, isremove) {
			var callbacks = this.m_callbacks;
			if (isremove) {
				for (var i = 0; i < callbacks.length;) {
					if (callbacks[i][0] === obj && callbacks[i][1] === fun)
						callbacks[i].splice(i, 1);
					else
						i++;
				}
			}
			else {
				callbacks.push([obj, fun]);
				fun.call(obj, this.m_value, this.m_value);
			}
		},
		Dispose: function () {
			var protocolMap = this.m_protocolMap;
			for (var i = 0; i < protocolMap.length;i++) {
				var v = protocolMap[i];
				v[1].SetNotice(this, protocolMap[0], true);
			}
			protocolMap = [];
		},
		Type: Property({
			ArrayModify: 1,
			ArrayDelete: 2,
			ArrayAdd: 3,
		}, [Property.Type.Static.Var])
	}
});