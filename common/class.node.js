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

/**
 * C++ Class emulate for Javascript.
* */
var _Class_Help = {
	_SettingString: ".",
	_VarString: ".",
	_IsDelegate: "$IsDelegate",
	__Help_get_Caller: function (caller) {
		while (caller && _Class_Help.SafeGetSetting(caller, this._IsDelegate/*"$IsDelegate"*/)) {
			caller = caller.caller;
		}
		return caller;
	},
	SysAssert: function (condition, message) {
		if (condition) return;
		var caller = arguments.callee.caller;
		var messageadditon = "(SysAssert)";
		while (caller) {
			var callerSetting = this.GetSetting(caller);
			if (callerSetting) {
				if (callerSetting.Desc)
					messageadditon += "\n\t<-" + callerSetting.Desc;
				else if (callerSetting.Name)
					messageadditon += "\n\t<-" + callerSetting.Name;
				else if (caller.name.length > 0)
					messageadditon += "\n\t<-" + caller.name;
				else
					messageadditon += "\n\t<-(unknown function)";
			}
			caller = caller.caller;
		};

		throw message + "\n" + messageadditon;
	},
	Assert: function (condition, message, caller) {
		if (condition)
			return;

		var callerer = this.__Help_get_Caller(caller.caller);

		message = "  Error:" + message;
		var callerSetting = this.GetSetting(callerer);
		if (callerSetting) {
			if (callerSetting.Desc)
				message = callerSetting.Desc + " " + message;
			else if (callerSetting.Name)
				message = callerSetting.Name + " " + message;
			else
				message = callerer.name + " " + message;
		}
		callerSetting = this.GetSetting(caller);
		if (callerSetting) {
			if (callerSetting.Desc)
				message += " " + callerSetting.Desc;
			else if (callerSetting.Name)
				message += " " + callerSetting.Name;
			else
				message += " " + caller.name;
		}
		throw message;
	},
	SetFunctionStaticProperty: function (fun, keyValues, name, desc) {
		this.SetSettings(fun, keyValues);
		var setting = this.GetSetting(fun);

		setting.Name = name;
		setting.Desc = desc;

		return fun;
	},
	PropertyDefine: {
		Function: { Type: 0, Is: function (type) { return type === this.Type || type === _Class_Help.PropertyDefine.Virtual.Type; } },
		Var: { Type: 1, Is: function (type) { return (type & this.Type) === this.Type; } },  //NOTALLOW
		Static: { Type: 2, Is: function (type) { return (type & this.Type) === this.Type; } },
		Virtual: { Type: 3, Is: function (type) { return (type & this.Type) === this.Type; } },
		Property: { Type: 4, Is: function (type) { return (type & this.Type) === this.Type && _Class_Help.PropertyDefine.Virtual.Type !== (type & ~_Class_Help.PropertyDefine.Clone.Type); } },
		Clone: { Type: 8, Is: function (type) { return (type & this.Type) === this.Type } },
		Override: { Type: 16, Is: function (type) { return (type & this.Type) === this.Type } }
	},

	Policy: { Public: 0, Protected: 1, Private: 2, Default: 2 },
	PolicyCheck: [
		function () { }, //public
		function (fun) //protected
		{
			var caller = _Class_Help.__Help_get_Caller(fun.caller);
			var funSetting = _Class_Help.GetSetting(fun); //MUST EXIST
			_Class_Help.SysAssert(funSetting, "System Error: setting not defined");

			var thisType = funSetting.OwnerClass;
			if (!thisType)     //for constructor(native)
				thisType = fun;

			var callerSetting, thisTypeSetting, callerOwner, friends;
			_Class_Help.Assert(thisType === caller ||
				(callerSetting = _Class_Help.GetSetting(caller)) &&
				(callerOwner = (callerSetting.OwnerClass || caller)) && (
					thisType === callerOwner ||
						(thisTypeSetting = _Class_Help.GetSetting(thisType)) &&
							(thisTypeSetting.$IsBase(callerOwner) ||
							thisTypeSetting.$IsVirtualFunctionFrom(fun, caller) ||
							(friends = thisTypeSetting.Friends) &&
								friends.check(callerOwner))
				), "can't visit prototected member.", fun);
		},
		function (fun)// private
		{
			var caller = _Class_Help.__Help_get_Caller(fun.caller);
			var funSetting = _Class_Help.GetSetting(fun); //MUST EXIST
			var thisType = funSetting.OwnerClass;
			if (!thisType)     //for constructor(native)
				thisType = fun;

			var callerSetting, callerOwner, thisTypeSetting, friends;

			_Class_Help.Assert(thisType === caller ||
				(callerSetting = _Class_Help.GetSetting(caller)) &&
					(callerOwner = (callerSetting.OwnerClass || caller)) && (
					thisType === callerOwner ||
					((thisTypeSetting = _Class_Help.GetSetting(thisType)) &&
						thisTypeSetting.$IsVirtualFunctionFrom(fun, caller) ||
						(friends = thisTypeSetting.Friends) &&
							friends.check(callerOwner))
				), "can't visit private member.", fun);
		}
	],
	Property: function (obj, p) {
		var retObj = {};
		for (var i = 0; i < p.length; i++) {
			if (p[i] === "")
				continue;
			_Class_Help.SysAssert(p[i] && isNaN(p[i]), "Property not Support");

			if (p[i].constructor === String)
				retObj[p[i]] = true;
			else if (p[i] instanceof Object) {
				for (var name in p[i]) {
					var v = p[i][name];
					if (retObj.hasOwnProperty(name) && !isNaN(retObj[name]) && !isNaN(v)) {
						retObj[name] |= v;
					}
					else
						retObj[name] = v;
				}
			}
			else
				_Class_Help.SysAssert(false, "Property not Support");
		}
		delete retObj.Is;
		if (retObj.Type === undefined) {
			retObj.Value = obj;
			if (obj !== undefined && obj instanceof Function)
				retObj.Type = Class.Property.Type.Object.Function.Type;///this.Type.Object.Function.Type;
			else
				retObj.Type = Class.Property.Type.Object.Var.Type; //this.Type.Object.Var.Type;
		} else if (_Class_Help.PropertyDefine.Property.Is(retObj.Type)) {
			retObj.Value = obj;
		}
		else {
			_Class_Help.SetSettings(obj, retObj);
			return obj;
		}
		var ret = new Function();
		_Class_Help.SetSettings(ret, retObj);
		return ret;
	},
	_Help_CopyObjectProperty: function (to, from, ignore) {
		_Class_Help.SysAssert(from !== undefined && to !== undefined && from !== to, "_Help_CopyObjectProperty: can't be undefined, or same object.");
		if (!(from instanceof Function || from instanceof Object))
			return to;

		for (var name in from) {
			if (ignore && to.hasOwnProperty(name))
				continue;
			to[name] = from[name];
		}
		return to;
	},
	_Help_CreateClass: function (classDef) {
		function F(args) {
			return classDef.apply(this, args);
		}
		F.prototype = classDef.prototype;
		this.SetDelegate(F);
		var ret = function (p) {
			return new F(p);
		}
		this.SetDelegate(ret);
		return ret;
	},
	_Help_GetBaseClassByName: function (obj, name) {
		var item = (name === undefined) ? obj : obj[name];
		var ret = {};

		if (item instanceof Array && name === undefined) {
			ret.Class = item[0];
			ret.Parameter = item[1];
			ret.Policy = item[2];
			ret.Hidden = item[3];
			ret.Namespace = item[4] === undefined ? global : item[4];
		} else if (item instanceof Object && name !== undefined) {
			ret.Class = (item.Namespace) ? item.Namespace[name] : eval(name);

			_Class_Help.SysAssert(ret.Class, "Class not Found.");

			this.SetSettings(ret.Class, { "Name": name ? name : ret.Class.name });

			ret.Parameter = item.Parameter;
			ret.Policy = item.Policy;
			ret.Hidden = item.Hidden;
			ret.Namespace = item.Namespace ? item.Namespace : global;
		}
		else if (item instanceof Function) {
			ret.Class = item;
			ret.Parameter = undefined
			ret.Namespace = global;
		} else
			_Class_Help.SysAssert(false, "Class Base Define Error:Defined type is not Support");

		if (ret.Policy === undefined)
			ret.Policy = this.Policy.Default;

		ret.Hidden = ret.Hidden ? true : false;

		_Class_Help.SysAssert(ret.Class, "Class not Defined.");
		return ret;
	},
	_Help_Static_CreateBases: function (Bases) {
		var bases = {};
		var classDefine, name;

		if (Bases instanceof Array) {
			var count = 0;
			for (var i = 0; i < Bases.length; i++) {
				classDefine = this._Help_GetBaseClassByName(Bases[i]);
				var setting = this.GetSettingAlways(classDefine.Class);
				name = setting.Name;

				if (!name || name.length == 0) {
					name = "##" + count++;
					setting.Name = name;
					//classDefine.Class.Name = name;
				}
				bases[name] = classDefine;
			}
		}
		else if (Bases instanceof Object) {
			for (name in Bases) {
				classDefine = this._Help_GetBaseClassByName(Bases, name);
				var setting = this.GetSetting(classDefine.Class);

				_Class_Help.SysAssert(setting && setting.Name, "Class Base Define Error:Defined type is not Support");
				bases[setting.Name] = classDefine;
			}
		} else
			_Class_Help.SysAssert(Bases == undefined, "Class Base Define Error:Defined type is not Support" + Bases);

		return bases;
	},
	_Help_Static_Class_Function_Sign: function (fun, owen, name, desc) {
		return this.SetSettings(fun, { "OwnerClass": owen, Name: name, Desc: desc });
	},
	_Help_Static_Class_Function_Sign_Base: function (fun, owen, name, desc) {
		this.SetDelegate(fun);
		return this._Help_Static_Class_Function_Sign(fun, owen, name, desc);//this.SetSettings(fun, { "OwnerClass": owen, "$IsDelegate": true, Name: name, Desc: desc });
	},
	_Help_Static_Class_Function_Sign_No_Inherit: function (fun, owen, name, desc) {
		return this.SetSettings(fun, { "OwnerClass": owen, "NoInherit": true, Name: name, Desc: desc });
	},

	___Help_CreatePropertyDelegateTemplate: function (delegate_dest, src, name, funs) {
		var desc = Object.getOwnPropertyDescriptor(src, name);
		if (desc !== undefined) {
			if (desc.hasOwnProperty("get") || desc.hasOwnProperty("set")) {
				var fun = desc.get || desc.set;
				_Class_Help.SysAssert(fun, "MUST exist one either 'get' or 'set' ")

				var funSetting = this.GetSetting(fun);
				if (this.PropertyDefine.Clone.Is(funSetting.Type)) {
					funs.Property.Clone(desc.get, desc.set);
				} else {
					if (desc.get) {
						desc.get = funs.Setting(funs.Property.get, "inherit", desc.get, funSetting);
					}
					if (desc.set) {
						desc.set = funs.Setting(funs.Property.set, "inherit", desc.set, funSetting);
					}
					Object.defineProperty(delegate_dest, name, desc);
				}
				return;
			} else if (desc.value instanceof Function) {
				var fun = desc.value;
				var funSetting = this.GetSetting(fun);
				if (!funSetting)
					funSetting = {};

				if (funSetting.NoInherit)
					return;

				var behaver;
				if (this.PropertyDefine.Clone.Is(funSetting.Type)) {
					delegate_dest[name] = funs.Setting(funs.Function.Clone, "clone", fun, funSetting);
				} else {
					delegate_dest[name] = funs.Setting(funs.Function.NoClone, "inherit", fun, funSetting);
				}
				return;
			}
			//else{} process as Vars;
		} else { //number 
			desc = {
				configurable: true,
				enumerable: true
			};
		}

		//inherit from native function. (vars)
		if (funs.Vars) {
			funs.Vars(delegate_dest, desc, name);
		}
		else
			_Class_Help.SysAssert(false, "currently not support. inherit from native function. (vars)?");

	},
	___Help_CreatePropertyDelegateByDefineTemplate: function (delegate_obj, policyItems, name, funs) {
		this.___Help_CreatePropertyDelegateByDefineTemplateByItem(delegate_obj, policyItems[name], name, funs)
	},
	___Help_CreatePropertyDelegateByDefineTemplateByItem: function (delegate_obj, item, name, funs) {
		var value = item;
		var valueSetting = this.GetSetting(value);

		_Class_Help.Assert(valueSetting !== undefined && valueSetting.Type !== undefined, "must exist Type", arguments.callee.caller);
		var type = valueSetting.Type;

		if (!this.PropertyDefine.Function.Is(type)) {
			if (valueSetting.hasOwnProperty("Value")) {
				value = valueSetting.Value;
			}
		}
		_Class_Help.SysAssert(!this.Property.Type.IsInvaild(type), "static function not support virtual.");

		var isStatic = this.PropertyDefine.Static.Is(type);
		var additionStr = isStatic ? "(static) " : "";

		if (this.PropertyDefine.Property.Is(type)) {
			if (this.PropertyDefine.Var.Is(type)) {  //for var
				if (this.PropertyDefine.Static.Is(type)) {   //StaticVar
					var get = funs.Setting(funs.Vars.Static.get, additionStr + " var get_", value, type);
					var set = funs.Setting(funs.Vars.Static.set, additionStr + " var set_", value, type);
					funs.Vars.Static.init(valueSetting.Value);
					Object.defineProperty(delegate_obj, name,
						funs.Vars.BeforeDefine({
							get: get,
							set: set
						})
					);
				} else {
					funs.Vars.Inner.init(value);
					Object.defineProperty(delegate_obj, name, funs.Vars.BeforeDefine({
						get: funs.Setting(funs.Vars.Inner.get, "var get_", value, type),
						set: funs.Setting(funs.Vars.Inner.set, "var set_", value, type)
					}));
				}
			} else //for property
			{
				var get, set;
				if (value.get) {
					get = value.get;
					value.get = funs.Setting(isStatic ? funs.Property.Static.get : funs.Property.Object.get, additionStr + "get_", get, type);
				}
				if (value.set) {
					set = value.set;
					value.set = funs.Setting(isStatic ? funs.Property.Static.set : funs.Property.Object.set, additionStr + "set_", set, type);
				}
				Object.defineProperty(delegate_obj, name, funs.Property.BeforeDefine(value));
			}
		} else {//functions
			if (valueSetting.Value !== undefined)
				value = valueSetting.Value;

			_Class_Help.Assert(value instanceof Function, "Expect Function but " + typeof (value), arguments.callee.caller);
			delegate_obj[name] = funs.Setting(isStatic ? funs.Function.Static : funs.Function.Object, additionStr, value, type);
		}
	},

	_Help_Static_Create_Prototype_Delegate: function (delegate_obj, _innerVars, policyItem, name, policyID, ThisType) {
		var checkPolicy = policyID instanceof Function ? policyID : this.PolicyCheck[policyID];
		var staticVar;

		function _varsSetting(value, type, delgateFun) {
			_Class_Help.SetSettings(delgateFun, {
				Type: type,
				//TopObject: delegate_obj,
				Value: value
			});
			return delgateFun;
		};
		function _propertyAndFunctionSetting(fun, type, delgateFun) {
			_Class_Help.SetDelegate(fun);// _Class_Help.SetSettings(fun, { $IsDelegate: true });
			_Class_Help.SetSettings(delgateFun, {
				Type: type,
				//TopObject: delegate_obj,
				Value: fun
			});
			return delgateFun;
		};
		this.___Help_CreatePropertyDelegateByDefineTemplate(delegate_obj, policyItem, name,
		{
			Setting: function (fun, behaverStr, p1, p2) {
				var className;
				if (ThisType) {
					className = _Class_Help.SafeGetSetting(ThisType, "Name");
				}
				else
					className = _Class_Help.SafeGetSetting(delegate_obj, "Name");
				className = className ? className : "(unknown)";
				var ret = _Class_Help._Help_Static_Class_Function_Sign(fun(p1, p2), ThisType, name, className + "::" + behaverStr + name)
				return ret;
			},
			Vars: {
				Inner: {
					get: function (value, type) {
						return _varsSetting(value, type, function () {
							checkPolicy(arguments.callee);
							return this[_Class_Help._VarString/*"+p_vars+"*/][name];
						});
					},
					set: function (value, type) {
						return _varsSetting(value, type, function (v) {
							checkPolicy(arguments.callee);
							this[_Class_Help._VarString/*"+p_vars+"*/][name] = v;
						});
					},
					init: function (v) { //init prototype
						_innerVars[name] = v;
					}
				},
				Static: {
					get: function (value, type) { return _varsSetting(value, type, function () { checkPolicy(arguments.callee); return staticVar; }); },
					set: function (value, type) { return _varsSetting(value, type, function (v) { checkPolicy(arguments.callee); staticVar = v; }); },
					init: function (v) { staticVar = v; }
				},
				BeforeDefine: function (property) {
					property.configurable = true;
					property.enumerable = true;
					return property;
				}
			},
			Property: {
				Static: {
					get: function (fun, type) { return _propertyAndFunctionSetting(fun, type, function () { checkPolicy(arguments.callee); return fun.apply(this, arguments) }); },
					set: function (fun, type) { return _propertyAndFunctionSetting(fun, type, function () { checkPolicy(arguments.callee); fun.apply(this, arguments) }); }
				},
				Object: {
					get: function (fun, type) { return _propertyAndFunctionSetting(fun, type, function () { checkPolicy(arguments.callee); return fun.apply(this, arguments) }); },
					set: function (fun, type) { return _propertyAndFunctionSetting(fun, type, function () { checkPolicy(arguments.callee); fun.apply(this, arguments) }); }
				},
				BeforeDefine: function (property) {
					property.configurable = true;
					property.enumerable = true;
					return property;
				}
			},
			Function: {
				Static: function (fun, type) { return _propertyAndFunctionSetting(fun, type, function () { checkPolicy(arguments.callee); return fun.apply(this, arguments) }); },
				Object: function (fun, type) { return _propertyAndFunctionSetting(fun, type, function () { checkPolicy(arguments.callee); return fun.apply(this, arguments); }); }
			}
		});

	},
	_Help_Static_Create_StaticProperty_Delegate: function (destClass, srcClass, name, checkPolicy) {
		if (name === "constructor")
			return;

		function Clone(f) {				// TODO: Need Confirm
			var fun = _Class_Help.GetSetting(f).Value;
			_Class_Help.SetDelegate(fun);

			return function () {
				checkPolicy(arguments.callee);
				return fun.apply(this, arguments);
			}
		}

		//function NoClone(f, fobj) { return function () { checkPolicy(arguments.callee); return f.apply(destClass, arguments); } }/*MASK*/
		function NoClone(f, fobj) { return function () { checkPolicy(arguments.callee); return f.apply(srcClass, arguments); } }/*MASK*/
		function PropertyClone(funget, funset) {
			var fun = funget || funset;
			var setting = _Class_Help.GetSetting(fun);
			if (_Class_Help.Property.Type.Object.Var.Is(setting.Type) || _Class_Help.Property.Type.Static.Var.Is(setting.Type)) {
				var items = {}; items[name] = fun;
				_Class_Help._Help_Static_Create_Prototype_Delegate(destClass, null, items, name, checkPolicy, destClass);
			} else {
				var fungetV, funsetV;
				funget && (fungetV = _Class_Help.SafeGetSetting(funget, "Value"));
				funset && (funsetV = _Class_Help.SafeGetSetting(funset, "Value"));

				var isfunget = fungetV && (fungetV instanceof Function);
				var isfunset = funsetV && (funsetV instanceof Function);

				_Class_Help.SysAssert(isfunget && !isfunset && !funsetV || isfunset && !isfunget && !fungetV || isfunget && isfunset, "SYSTEM ERROR");


				var obj_setting = {};
				if (fungetV)
					obj_setting.get = fungetV;// function(){return fungetV.apply(destClass,arguments)};
				if (funsetV)
					obj_setting.set = funsetV;//function(){funsetV.apply(destClass,arguments)};
				//
				var obj = {};
				obj[name] = {};
				_Class_Help.SetSettings(obj[name], { Type: setting.Type, Value: obj_setting });

				_Class_Help._Help_Static_Create_Prototype_Delegate(destClass, null, obj, name, checkPolicy, destClass);
			}

		}
		function DelegateVar(destObj, desc, name) {
			var clsName = _Class_Help.SafeGetSetting(srcClass, "Name");
			if (!clsName)
				clsName = srcClass.name;
			if (clsName.length == 0)
				clsName = "(UnknownClass)";

			desc.get = function () { checkPolicy(arguments.callee); return destClass[name]; }
			_Class_Help._Help_Static_Class_Function_Sign_Base(desc.get, destClass, name, clsName + "::get_" + name);

			if (desc.writable) {
				desc.set = function (v) { checkPolicy(arguments.callee); destClass[name] = v; }
				_Class_Help._Help_Static_Class_Function_Sign_Base(desc.set, destClass, name, clsName + "::set_" + name);
			}
			delete desc.writable;
			delete desc.value;
			Object.defineProperty(destObj, name, desc);
		}
		_Class_Help.___Help_CreatePropertyDelegateTemplate(destClass, srcClass, name, {
			Setting: function (fun, behaverStr, rawFun, rawFunSetting) {
				var clsName = _Class_Help.SafeGetSetting(srcClass, "Name");
				if (!clsName)
					clsName = srcClass.name;
				if (clsName.length == 0)
					clsName = "(UnknownClass)";

				var newfun = fun(rawFun, rawFunSetting);
				if (newfun) {
					if (Class.Property.Type.Clone.Is(rawFunSetting.Type))
						return _Class_Help._Help_Static_Class_Function_Sign(newfun, destClass, name, clsName + "(" + behaverStr + ")::" + name);
					else
						return _Class_Help._Help_Static_Class_Function_Sign_Base(newfun, destClass, name, clsName + "(" + behaverStr + ")::" + name);
				}
				return null;
			},
			Function: { Clone: Clone, NoClone: NoClone },
			Property: {
				Clone: PropertyClone,
				get: NoClone,
				set: NoClone
			},
			Vars: DelegateVar
		});
	},

	_Help_Static_Create_Prototype_Delegate_Base: function (delegate_obj, baseClass, name, checkPolicy, ownerClass) {
		if (name === "constructor")
			return;
		_Class_Help.SysAssert(baseClass instanceof Function, "must be Object.");

		var baseSetting = this.GetSetting(baseClass);

		function Clone(f) {
			var fun = _Class_Help.GetSetting(f).Value;
			_Class_Help.SetDelegate(fun);
			return function () {
				checkPolicy(arguments.callee);
				return fun.apply(this, arguments);
			}
			//return f;
		}
		function NoClone(f) { return function () { checkPolicy(arguments.callee); return f.apply(this.$AS(baseClass), arguments); } }
		function PropertyClone(funget, funset) {
			var fun = funget || funset;
			var setting = _Class_Help.GetSetting(fun);
			if (_Class_Help.Property.Type.Object.Var.Is(setting.Type) || _Class_Help.Property.Type.Static.Var.Is(setting.Type)) {
				var items = {}; items[name] = fun;
				_Class_Help._Help_Static_Create_Prototype_Delegate(delegate_obj, null, items, name, checkPolicy, ownerClass);
			} else {
				var obj_setting = {};
				if (funget)
					obj_setting.get = funget;
				if (funset)
					obj_setting.set = funset;
				//
				var obj = {};
				obj[name] = {};
				_Class_Help.SetSettings(obj[name], { Type: setting.Type, Value: obj_setting });

				_Class_Help._Help_Static_Create_Prototype_Delegate(delegate_obj, null, obj, name, checkPolicy, ownerClass);
			}
		}
		function DelegateVar(destObj, desc, name) {
			var clsName = _Class_Help.SafeGetSetting(baseClass, "Name");
			if (!clsName)
				clsName = srcClass.name;
			if (clsName.length == 0)
				clsName = "(UnknownClass)";

			desc.get = function () { checkPolicy(arguments.callee); return this.$AS(baseClass)[name]; }
			_Class_Help._Help_Static_Class_Function_Sign_Base(desc.get, ownerClass, name, clsName + "::get_" + name);
			if (desc.writable) {
				desc.set = function (v) { checkPolicy(arguments.callee); this.$AS(baseClass)[name] = v; }
				_Class_Help._Help_Static_Class_Function_Sign_Base(desc.get, ownerClass, name, clsName + "::set_" + name);
			}
			delete desc.writable;
			delete desc.value;
			Object.defineProperty(destObj, name, desc);
		}
		_Class_Help.___Help_CreatePropertyDelegateTemplate(delegate_obj, baseClass.prototype, name, {
			Setting: function (fun, behaverStr, rawFun, rawFunSetting) {
				var clsName = _Class_Help.SafeGetSetting(baseClass, "Name");
				if (!clsName)
					clsName = baseClass.name;
				if (clsName.length == 0)
					clsName = "(UnknownClass)";

				if (Class.Property.Type.Clone.Is(rawFunSetting.Type))
					return _Class_Help._Help_Static_Class_Function_Sign(fun(rawFun, rawFunSetting), ownerClass, name, _Class_Help.SafeGetSetting(ownerClass, "Name") + "<" + clsName + ">(" + behaverStr + ")::" + name);
				else
					return _Class_Help._Help_Static_Class_Function_Sign_Base(fun(rawFun, rawFunSetting), ownerClass, name, _Class_Help.SafeGetSetting(ownerClass, "Name") + "<" + clsName + ">(" + behaverStr + ")::" + name);
			},
			Function: { Clone: Clone, NoClone: NoClone },
			Property: {
				Clone: PropertyClone,
				get: NoClone,
				set: NoClone
			},
			Vars: DelegateVar
		});
	},
	_Help_Static_Create_Prototype_Delegate_Base_Instance: function (delegate_obj_inst, baseObj, name, checkPolicy, ownerClass) {
		if (name === "constructor")
			return;
		var baseSetting = this.GetSetting(baseObj);

		function Clone(f) {
			return function () {
				_Class_Help.SysAssert(false, "Clone Object not support");
			}
		}
		function NoClone(f, fobj) {
			return function () {
				checkPolicy(arguments.callee);
				return f.apply(delegate_obj_inst, arguments);
			}
		}
		function PropertyClone(funget, funset) {
			_Class_Help.SysAssert(false, "PropertyClone Object not support");
		}
		function DelegateVar(destObj, desc, name) {
			var clsName = _Class_Help.SafeGetSetting(baseObj.constructor, "Name");
			if (!clsName)
				clsName = srcClass.name;
			if (clsName.length == 0)
				clsName = "(UnknownClass)";

			desc.get = function () {
				checkPolicy(arguments.callee);
				return baseObj[name];
				//return this.$AS(baseObj)[name];
			}
			_Class_Help._Help_Static_Class_Function_Sign_Base(desc.get, ownerClass, name, clsName + "::get_" + name);
			if (desc.writable) {
				desc.set = function (v) {
					checkPolicy(arguments.callee);
					baseObj[name] = v;
					//this.$AS(baseObj)[name] = v;
				}
				_Class_Help._Help_Static_Class_Function_Sign_Base(desc.get, ownerClass, name, clsName + "::set_" + name);
			}
			delete desc.writable;
			delete desc.value;
			Object.defineProperty(destObj, name, desc);
		}
		_Class_Help.___Help_CreatePropertyDelegateTemplate(delegate_obj_inst, baseObj, name, {
			Setting: function (fun, behaverStr, rawFun, rawFunSetting) {
				var clsName = _Class_Help.SafeGetSetting(baseObj.constructor, "Name");
				if (!clsName)
					clsName = baseObj.constructor.name;
				if (clsName.length == 0)
					clsName = "(UnknownClass)";

				return _Class_Help._Help_Static_Class_Function_Sign_Base(
					fun(rawFun, rawFunSetting),
					ownerClass, name,
					_Class_Help.SafeGetSetting(ownerClass, "Name") + "<" + clsName + ">(" + behaverStr + ")::" + name);
			},
			Function: { Clone: Clone, NoClone: NoClone },
			Property: {
				Clone: PropertyClone,
				get: NoClone,
				set: NoClone
			},
			Vars: DelegateVar
		});
	},
	CreateReadOnlyProperty: function (obj, name, varObj, notenumerable) {
		Object.defineProperty(obj, name, {
			value: varObj,
			writable: false,
			enumerable: (notenumerable ? false : true)
		});
	},
	DelegateBaseProperty: function (to, from, policy, ownerClass) {
		var policyCheck = _Class_Help.PolicyCheck[policy];
		var fromprototype = from.prototype;

		for (var propertyName in fromprototype) {
			if (to.hasOwnProperty(propertyName))
				continue;

			_Class_Help._Help_Static_Create_Prototype_Delegate_Base(to, from, propertyName, policyCheck, ownerClass);
		}

	},
	DelegateBaseProperty_Instance: function (to, from, policy, ownerClass) {
		var policyCheck = _Class_Help.PolicyCheck[policy];
		for (var propertyName in from) {
			if (
				from.constructor.prototype.hasOwnProperty(propertyName) || //if has in prototype ignore it. remove this line will be error, may be cause of "to.hasownproperty"
				to.hasOwnProperty(propertyName))
				continue;

			_Class_Help._Help_Static_Create_Prototype_Delegate_Base_Instance(to, from, propertyName, policyCheck, ownerClass);
		}
	},
	DelegateBaseStaticProperty: function (to, from, policy) {
		var policyCheck = _Class_Help.PolicyCheck[policy];
		for (var propertyName in from) {
			if (to.hasOwnProperty(propertyName))
				continue;
			_Class_Help._Help_Static_Create_StaticProperty_Delegate(to, from, propertyName, policyCheck);
		}
	},
	GetSetting: function (Obj) {
		return Obj[_Class_Help._SettingString];
	},
	SafeGetSetting: function (obj, name) {
		if (!isNaN(obj) || obj === undefined || obj === null)
			return undefined;

		var setting = this.GetSetting(obj);
		if (setting)
			return setting[name];
		return undefined;
	},
	GetSettingAlways: function (Obj) {
		if (!Obj.hasOwnProperty(this._SettingString))
			this.SetSettings(Obj, {});
		return Obj[this._SettingString];
	},
	SetSettings: function (Obj, settings, ignoreWhenExist) {
		_Class_Help.SysAssert(Obj !== undefined, "SetSettings: Obj undefined");
		if (!Obj.hasOwnProperty(this._SettingString)) {
			Object.defineProperty(Obj, this._SettingString, { value: settings });
		} else
			this._Help_CopyObjectProperty(Obj[this._SettingString], settings, ignoreWhenExist);

		return Obj;
	},
	SafeDefinedItem: function (policyItem, name) {  //used on defined item only.
		var item = policyItem[name];

		if (item !== undefined && item instanceof Function) {
			this.SetSettings(item, { Type: this.Property.Type.Object.Function.Type }, true);;
		} else {
			var ret = function () { };

			var type = this.Property.Type.Object.Var.Type;
			this.SetSettings(ret, { Value: item, Type: type });
			policyItem[name] = ret;
			return ret;
		}
		return item;
	},
	SetDelegate: function (fun, isdelegate) {
		var obj = {};
		obj[_Class_Help._IsDelegate] = isdelegate || isdelegate === undefined ? true : false;
		_Class_Help.SetSettings(fun, obj);
	},
	IsDelegate: function (fun) {
		return _Class_Help.GetSetting(fun)[this._IsDelegate];
	},
	_SetArguments: function (v) {
		if (v === undefined)
			return v;
		var r = function () { };
		_Class_Help.SetSettings(r, { Argument: v });
		return r;
	},
	_GetArguments: function (v, args) {
		var r = _Class_Help.SafeGetSetting(v, "Argument");
		if (r === undefined && !(v instanceof Array))
			return [];

		if (r === -1)
			return args;

		_Class_Help.SysAssert(v instanceof Array, "Base Parameter define must an Array or other Class.Arguments setting.");
		var ret = [];
		for (var i = 0; i < v.length; i++) {
			r = _Class_Help.SafeGetSetting(v[i], "Argument");
			if (r === undefined)
				ret.push(v[i]);
			else {
				_Class_Help.SysAssert(r >= 0 || args.length < r, "Base Parameter Arguments Setting Error. can't set the ALL or NONE in argument items, or your setting item is out of arguments range");

				ret.push(args[r]);
			}
		}
		return ret;
	}
};
//virtual & override not allow
_Class_Help.Property.Type = {
	IsInvaild: function (type) { return type === 11 || type === 1; },
	IsVar: function (type) { return type & _Class_Help.Property.Type.Object.Var.Type == _Class_Help.Property.Type.Object.Var.Type },                //type & 5==5
	IsProperty: function (type) { return type & _Class_Help.Property.Type.Static.Var.Type === _Class_Help.Property.Type.Object.Property.Type },         //type&7 ===4
	Clone: _Class_Help.PropertyDefine.Clone,
	Override: _Class_Help.PropertyDefine.Override, /*TODO: only for the member-function which is not defined by Class*/
	Virtual: {
		Type: _Class_Help.PropertyDefine.Virtual.Type,
		Is: function (type) { return type === this.Type }
	},  //type ===2 , 3 not allow, and clone virtual is not allowed too.
	Object: {
		Is: function (type) { return type & 3 !== 2 }, //,  !_Class_Help.PropertyDefine.Static.Is(type)|| _Class_Help.Property.Type.Virtual.Is(type); },
		Function: { Type: _Class_Help.PropertyDefine.Function.Type, Is: function (type) { return (type & ~_Class_Help.PropertyDefine.Clone.Type) === this.Type } },
		Property: { Type: _Class_Help.PropertyDefine.Property.Type, Is: function (type) { return (type & ~_Class_Help.PropertyDefine.Clone.Type) === this.Type; } },
		Var: {
			Type: _Class_Help.PropertyDefine.Property.Type | _Class_Help.PropertyDefine.Var.Type,
			Is: function (type) { return (type & _Class_Help.Property.Type.Static.Var.Type) === this.Type; }
		}
	},
	Static: {
		Is: function (type) { return _Class_Help.PropertyDefine.Static.Is(type) && !_Class_Help.Property.Type.Virtual.Is(type); },
		Function: { Type: _Class_Help.PropertyDefine.Static.Type, Is: function (type) { return (type & ~_Class_Help.PropertyDefine.Clone.Type) === this.Type; } },
		Property: {
			Type: _Class_Help.PropertyDefine.Static.Type | _Class_Help.PropertyDefine.Property.Type,
			Is: function (type) { return (type & ~_Class_Help.PropertyDefine.Clone.Type) === this.Type; }
		},
		Var: {
			Type: _Class_Help.PropertyDefine.Static.Type | _Class_Help.PropertyDefine.Property.Type | _Class_Help.PropertyDefine.Var.Type,
			Is: function (type) { return (type & this.Type) === this.Type; }
		}
	},
	NoInherit: {
		NoInherit: true
	}
};

/**
 * C++ Class emulation.
 * Function:
 *      1.Multiple Inheritance
 *      2.Virtual Function
 *      3.Property
 *      4.Template (Limited)
 *      5.Static Function&Var
 *
 * Class({
 *     Namespace:namespace,                 //condition. default: global, for browser should define global as window frist or other.
 *     Name:"Classname",                    //MUST. define classname in namespace. exp: namespace.Classname;
 *                                          //condition. there's there way to define the base class
 *     Bases:[BaseClass1,BaseClass2...]     //      1.write base classes in a array.
 *     Bases:[[Base,[parameters],Policy,Hidden]]         //      2.write base classes as arrays in a array,  Hidden :not inherit, but still can use method AS to convert this object to base object.
 *     Bases:{"BaseClassName":{Namespace:ABC,Parameter:null,Policy:Class.Policy.Private,Hidden:false },...}     //3. reflect by the BaseClassName in Namespace,using Parameter as named parameter ...
 *
 *     Private:{                           //condition: private members
 *           m_var:1,                      //define a var.
 *           fun:function(){},             //define a function
 *           constructor:function(){},     //condition: define constructor.
 *           _instance:Property(null,      //define a var, it will be cloned by child-class
 *              [Property.Type.Static.Var,             //means it will be init by same value, but not same object.
 *              Property.Type.Clone])
 *     },
 *     Protected:{                         //condition: protected members
 *         virtualTest:Property(           //define a virtual function.
 *         function(){},[Property.Type.Virtual])
 *     },
 *     Public:{                            //condition: public
 *          Instance:Property({            //define a property, and it will be cloned by child-class
				get:function(){
					if(this._instance)
						return this._instance;
					this._instance = new this(5);
					return this._instance;
				}
			},[Property.Type.Static.Property,Property.Type.Clone])
 *     }
 * })
 * Clone mode instead for template.
 * */
function Class(defines) {
	var obj_create_constructor;
	var staticAttribute;
	var ClassInnerVar;


	var _overrides = []; //no need copy it to setting.

	function obj_create() {
		var thisType = arguments.callee;
		var obj_create_thisObj = this;
		_Class_Help.CreateReadOnlyProperty(this, _Class_Help._VarString/*"+p_vars+"*/, new ClassInnerVar(), true);

		//export baseClass AS property.
		var Settings = _Class_Help.GetSetting(thisType);
		var StaticBases = Settings.Bases;


		(function () {
			var _this = obj_create_thisObj;

			var _parent = Settings.$$Parent;
			if (!_parent)
				_parent = _this;

			Object.defineProperty(_this, "$Super", {	//temp
				get: _Class_Help._Help_Static_Class_Function_Sign_No_Inherit(
						function () { return _parent; }), enumerable: true
			});

			var _root = _this.$Super;
			var _pre;
			do {
				_pre = _root;
				_root = _root.$Super;
			} while (_root !== _pre);

			Object.defineProperty(_this, "$Root", {
				get: _Class_Help._Help_Static_Class_Function_Sign_No_Inherit(
					function () {
						return _root;
					}), enumerable: true
			});
		})();

		var bases = {};
		for (var name in StaticBases) {
			var item = StaticBases[name];
			//policy and base object.
			var args = _Class_Help._GetArguments(item.Parameter, arguments);

			var parentSetting = _Class_Help.GetSettingAlways(item.Class);
			var oldParent = parentSetting.$$Parent;
			parentSetting.$$Parent = this;
			base = bases[name] = _Class_Help._Help_CreateClass(item.Class)(args);
			parentSetting.$$Parent = oldParent;


			//export object by class name.
			Object.defineProperty(this, name, {
				get: _Class_Help._Help_Static_Class_Function_Sign_No_Inherit(
					(function (base, checkPolicy) {
						return function () {
							checkPolicy(arguments.callee);
							return base;
						};
					})(base, _Class_Help.PolicyCheck[item.Policy]), thisType, name, "cast from Object<" + Settings.Name + "> to <" + name + ">")
				//,configurable:true
				, enumerable: true
			});

			_Class_Help.DelegateBaseProperty_Instance(this, base, item.Policy, thisType);
		}

		////////////////////////////////////////////
		this.$AS = function (typeClass) {
			_Class_Help.SysAssert(typeClass && (typeClass.constructor === String || typeClass instanceof Function), "Class.$AS typeClass is empty");
			if (typeClass.constructor === String) {
				if (bases.hasOwnProperty(typeClass)) {
					return bases[typeClass];
				}
			}
			else if (typeClass instanceof Function) {
				var typeSetting = _Class_Help.GetSetting(typeClass);
				if (typeSetting && typeSetting.Name) {
					if (bases.hasOwnProperty(typeSetting.Name))
						return bases[typeSetting.Name];
				}
			}
			else {
				for (var name in bases) {
					if (bases[name].constructor === typeClass);
					return bases[name];
				}
			}

			for (var name in bases) {
				if (!bases[name].hasOwnProperty("$AS"))
					continue;
				var o = bases[name].$AS(typeClass);
				if (o) return o;
			}

			return null;
		}
		///////////////////////////////////////
		//for virtual
		for (var virtualName in Settings.Virtuals) {
			if (!Settings.Virtuals.hasOwnProperty(virtualName))
				continue;
			var virtualArray = Settings.Virtuals[virtualName];

			var fun;
			if (virtualArray.length === 0 ||   //top level of virtual
				!thisType.prototype.hasOwnProperty(virtualName) || //means this class has never define it.
				_Class_Help.IsDelegate(thisType.prototype[virtualName]) || // thisType.prototype[virtualName].$IsDelegate ||   //means inherit from base
				!(fun = virtualArray.Function)) {
				continue;
			}

			function depVirtual(currentObj, virtualArray) {
				_Class_Help.SysAssert(currentObj && virtualArray && virtualArray.Policy && fun, "SYSTEM ERROR: currentObj MUST exist.");
				if (virtualArray.length === 0) {
					var checkPolicy = _Class_Help.PolicyCheck[virtualArray.Policy];
					var currentSetting = _Class_Help.GetSetting(thisType);
					var name = "";
					if (currentSetting)
						name = currentSetting.Name;
					else
						name = virtualArray.OwnerClass.name;

					currentObj[virtualName] = _Class_Help._Help_Static_Class_Function_Sign_No_Inherit((function (oldfun, curfun) {
						return function () {
							checkPolicy(arguments.callee);

							var tmp = obj_create_thisObj._super;
							obj_create_thisObj._super = oldfun;
							var ret = curfun.apply(obj_create_thisObj, arguments);
							obj_create_thisObj._super = tmp;
							return ret;
						}
					})(currentObj[virtualName], fun), thisType, virtualName, name + "::virtual " + virtualName);
					//return;
				}

				for (var i = 0; i < virtualArray.length; i++) {
					var classType = virtualArray[i];
					_Class_Help.SysAssert(classType instanceof Array, "SYSTEM ERROR: MUST BE A ARRAY.");

					depVirtual(currentObj.$AS(classType.OwnerClass), classType);
				}
			}

			for (var i = 0; i < virtualArray.length; i++) {
				var classType = virtualArray[i];
				if (classType instanceof Array) {
					depVirtual(this.$AS(classType.OwnerClass), classType);
				}
			}
		}
		for (var i = 0; i < _overrides.length; i++) {
			var funsetting = _overrides[i];
			for (var basename in bases) {
				var base = bases[basename];
				if (_Class_Help.SafeGetSetting(base.constructor, "$IsVirtualFunctionFrom")) //override not for Class.
					continue;
				if (funsetting.name in base) {					//if ( base.hasOwnProperty(funsetting.name)) {
					base[funsetting.name] = (function (oldfun, curfn) { //for cocos2dx class ._super
						return function () {
							var tmp = obj_create_thisObj._super;
							obj_create_thisObj._super = oldfun;
							var ret = curfn.apply(obj_create_thisObj, arguments);
							obj_create_thisObj._super = tmp;
							return ret;
						}
					})(base[funsetting.name], funsetting.fun);
				}
			}
		}
		if (obj_create_constructor) {
			var setting = _Class_Help.GetSetting(obj_create_constructor);
			_Class_Help.PolicyCheck[setting.Policy](arguments.callee);
			obj_create_constructor.apply(this, arguments);
		}
	}
	_Class_Help.SetSettings(obj_create, { Name: defines.Name });
	staticAttribute = _Class_Help.GetSetting(obj_create);

	var Bases = _Class_Help._Help_Static_CreateBases(defines.Bases);

	//define this
	var _innerObject = {};
	var _innerVars = {};
	var _virtuals = {}; //virtual function list.
	var policyArray = [defines.Public, defines.Protected, defines.Private];
	var maxLength = _Class_Help.PolicyCheck.length > policyArray.length ? policyArray.length : _Class_Help.PolicyCheck.length;
	var hasConstructor = false;
	for (var i = 0; i < maxLength; i++) {
		var policyItem = policyArray[i];
		if (!policyItem)
			continue;
		for (var name in policyItem) {
			var item = _Class_Help.SafeDefinedItem(policyItem, name);
			var itemSetting = _Class_Help.GetSettingAlways(item);
			_Class_Help.SysAssert(itemSetting.Type === (itemSetting.Type & ~_Class_Help.Property.Type.Override) || _Class_Help.Property.Type.Object.Function === (itemSetting.Type & ~_Class_Help.Property.Type.Override), "Override only support Object Function");
			if (_Class_Help.Property.Type.Static.Is(itemSetting.Type)) {
				_Class_Help.SysAssert(!obj_create.hasOwnProperty(name), name + " has defined before.");
				_Class_Help._Help_Static_Create_Prototype_Delegate(obj_create, null, policyItem, name, i, obj_create);
				continue;
			}
			_Class_Help.SysAssert(!_innerObject.hasOwnProperty(name), name + " has defined before.");
			_Class_Help.SysAssert(!Bases.hasOwnProperty(name), name + " has defined as a BaseName.");

			itemSetting.Name = name;
			itemSetting.OwnerClass = obj_create;
			if (i === _Class_Help.Policy.Private)
				itemSetting.NoInherit = true;

			if (name === "constructor") {
				if (_Class_Help.PropertyDefine.Function.Is(itemSetting.Type)) {
					hasConstructor = true;
					itemSetting.NoInherit = true;

					itemSetting.Policy = i;
					_innerObject.constructor = item;
					continue;
				} else
					_Class_Help.SysAssert(!_Class_Help.Property.Type.Virtual.Is(itemSetting.Type), "constructor not support virtual");
			}

			_Class_Help._Help_Static_Create_Prototype_Delegate(_innerObject, _innerVars, policyItem, name, i, obj_create);
			if (_Class_Help.Property.Type.Virtual.Is(itemSetting.Type)) {
				_virtuals[name] = [];
				_virtuals[name].OwnerClass = obj_create;
				_virtuals[name].Policy = i;
			} else
				if (_Class_Help.Property.Type.Override.Is(itemSetting.Type)) {
					_overrides.push({ name: name, fun: policyItem[name] });
				}
		}
	}

	///define inner var class.
	ClassInnerVar = (function (varsDef) {
		function ret() { };
		ret.prototype = varsDef;
		ret.prototype.constructor = ret;
		return ret;
	})(_innerVars);

	/////////////////////////////////////////////////
	if (hasConstructor)
		obj_create_constructor = _innerObject.constructor;

	//define bases
	for (var baseName in Bases) {
		var baseCfg = Bases[baseName];
		var base = baseCfg.Class;
		var baseClassSetting = _Class_Help.GetSetting(base);
		if (baseClassSetting) {
			for (var virtualName in baseClassSetting.Virtuals) {   //[a,[b,[xxx]]]  //[[a,[xx]]]
				var current_virtual, fun;
				if (!_virtuals.hasOwnProperty(virtualName))
					current_virtual = _virtuals[virtualName] = [];
				else {
					current_virtual = _virtuals[virtualName];
				}

				var _baseVirtualItem = baseClassSetting.Virtuals[virtualName];
				current_virtual.push(_baseVirtualItem);
				current_virtual.OwnerClass = obj_create;
				current_virtual.Policy = (baseCfg.Policy > _baseVirtualItem.Policy) ? baseCfg.Policy : _baseVirtualItem.Policy;
				if (_innerObject.hasOwnProperty(virtualName)) {
					current_virtual.Function = _Class_Help.SafeGetSetting(_innerObject[virtualName], "Value");
				}
			}
		}
		if (baseCfg.Hidden)
			continue;

		_Class_Help.DelegateBaseProperty(_innerObject, base, baseCfg.Policy, obj_create);

		_Class_Help.DelegateBaseStaticProperty(obj_create, base, baseCfg.Policy, obj_create);
	}
	obj_create.prototype = _innerObject;
	obj_create.prototype.constructor = obj_create;

	//////////////////////////////////////////////////////////////////////

	if (!defines.Friends) defines.Friends = [];


	_Class_Help.CreateReadOnlyProperty(staticAttribute, "Friends", {
		check: function (type) {
			for (var i = 0; i < defines.Friends.length; i++) {
				if (defines.Friends[i] === type)
					return true;
			}
			return false;
		}
	});
	_Class_Help.CreateReadOnlyProperty(staticAttribute, "Bases", Bases);
	_Class_Help.CreateReadOnlyProperty(staticAttribute, "Virtuals", _virtuals);
	//_Class_Help.CreateReadOnlyProperty(staticAttribute, "$IsDelegate",true);   //for invoke userdefined constructor.
	_Class_Help.CreateReadOnlyProperty(staticAttribute, "$IsBase", function (callerClass) {
		function isBase(callerClass) {
			var callerClassSetting = _Class_Help.GetSetting(callerClass);
			if (!callerClassSetting || !callerClassSetting.Bases)
				return false;

			if (callerClassSetting.Bases.hasOwnProperty(staticAttribute.Name))   //not include one condition that class is not defined by Class.
			{
				if (callerClassSetting.Bases[staticAttribute.Name].Policy === _Class_Help.Policy.Private)
					return false;
				else
					return true;
			}
			for (var name in callerClassSetting.Bases) {
				var base = callerClassSetting.Bases[name];
				if (base.Policy === _Class_Help.Policy.Private)
					continue;

				if (isBase(base.Class))
					return true;
			}
			return false;
		}
		return isBase(callerClass);
	});
	_Class_Help.CreateReadOnlyProperty(staticAttribute, "$IsVirtualFunctionFrom", function (fun, callerFun) {
		do {
			var funSetting = _Class_Help.GetSetting(fun);
			if (!funSetting) break;
			var callerSetting = _Class_Help.GetSetting(callerFun);
			if (!callerSetting) break;

			var callerClass = callerSetting.OwnerClass;
			if (!callerClass) break;;
			var callerClassSetting = _Class_Help.GetSetting(callerClass);
			if (!callerClassSetting) break;;
			if (!callerClassSetting.Virtuals.hasOwnProperty(funSetting.Name))
				break;
			var funClass = funSetting.OwnerClass;
			if (!funClass) break;
			return callerClassSetting.$IsBase(funClass) || (funClassSetting = _Class_Help.GetSetting(funSetting.OwnerClass)) && funClassSetting.$IsBase(callerClass)
		} while (0);
		return false;
	});

	var namespace = defines.Namespace ? defines.Namespace : global;

	Object.defineProperty(namespace, staticAttribute.Name, {
		value: obj_create,
		writable: false,
		enumerable: true
	});
	return obj_create;
}

Class.Policy = _Class_Help.Policy;
Class.Property = _Class_Help.Property;

Class.Arguments = function (idx) {
	return _Class_Help._SetArguments(idx);
};
Class.Arguments.NONE = _Class_Help._SetArguments();
Class.Arguments.ALL = _Class_Help._SetArguments(-1);

Class.GetSetting = _Class_Help.GetSetting;
Class.GetName = function (objOrClass)
{
	if (!(objOrClass instanceof Function)) {
		objOrClass = objOrClass.constructor;
	}

	return Class.GetSetting(objOrClass).Name;
}
Class.Assert = _Class_Help.SysAssert;
Class.HiddenCaller = _Class_Help.SetDelegate;
Class.GetMember = function (obj, membername) {
	try {
		return (new Function("return this." + membername)).call(obj);
	}
	catch (e) {
		throw "Class.GetMember: can't find member " + membername;
	}
}

Class.AsCurrentClassFunction = function (fun) {
	var owner = _Class_Help.SafeGetSetting(arguments.callee.caller, "OwnerClass");
	if (!owner)
		throw "AsCurrentClass Faild. caller must defined by Class";
	_Class_Help._Help_Static_Class_Function_Sign(fun, owner, "anonymouse", "anonymouse function");
	return fun;
}

Class({
	Namespace: Class,
	Name: "CSingleton",
	Private: {
		_instance: Property(null, [Property.Type.Static.Var, Property.Type.Clone])
	},
	Public: {
		Instance: Property({
			get: function () {
				if (this._instance)
					return this._instance;
				this._instance = new this();
				return this._instance;
			}
		}, [Property.Type.Static.Property, Property.Type.Clone])
	}
});
Class({
	Namespace: Class,
	Name: "CCreator",
	Public: {
		Create: Property(function () {
			var TYPE = this;
			function F(args) { return TYPE.apply(this, args); }
			F.prototype = TYPE.prototype;
			Class.HiddenCaller(F);
			return new F(arguments);
		}, [Property.Type.Static.Function, Property.Type.Clone])
	}
});

exports.Class=Class;

