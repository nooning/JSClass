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
var Class = (function () {
	_SettingString= ".";
	_VarString= ".";
	_IsDelegate= "$IsDelegate";
	function __Help_get_Caller(caller) {
		while (caller && SafeGetSetting(caller, _IsDelegate/*"$IsDelegate"*/)) {
			caller = caller.caller;
		}
		return caller;
	}
	function SysAssert(condition, message) {
		if (condition) return;
		var caller = arguments.callee.caller;
		var messageadditon = "(SysAssert)";
		var i = 0;
		while (caller) {
			var callerSetting = GetSetting(caller);
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
			if (i++ > 20) {
				messageadditon += "\n(more)..."
				break;
			}
		};

		throw message + "\n" + messageadditon;
	}
	function Assert(condition, message, caller) {
		if (condition)
			return;

		var callerer = __Help_get_Caller(caller.caller);

		message = "  Error:" + message;
		var callerSetting = GetSetting(callerer);
		if (callerSetting) {
			if (callerSetting.Desc)
				message = callerSetting.Desc + " " + message;
			else if (callerSetting.Name)
				message = callerSetting.Name + " " + message;
			else
				message = callerer.name + " " + message;
		}
		callerSetting = GetSetting(caller);
		if (callerSetting) {
			if (callerSetting.Desc)
				message += " " + callerSetting.Desc;
			else if (callerSetting.Name)
				message += " " + callerSetting.Name;
			else
				message += " " + caller.name;
		}
		throw message;
	}
	function SetFunctionStaticProperty(fun, keyValues, name, desc) {
		SetSettings(fun, keyValues);
		var setting = GetSetting(fun);

		setting.Name = name;
		setting.Desc = desc;

		return fun;
	}
	var PropertyDefine= {
		Function: { Type: 0, Is: function (type) { return type === this.Type || type === PropertyDefine.Virtual.Type; } },
		Var: { Type: 1, Is: function (type) { return (type & this.Type) === this.Type; } },  //NOTALLOW
		Static: { Type: 2, Is: function (type) { return (type & this.Type) === this.Type; } },
		Virtual: { Type: 3, Is: function (type) { return (type & this.Type) === this.Type; } },
		Property: { Type: 4, Is: function (type) { return (type & this.Type) === this.Type && PropertyDefine.Virtual.Type !== (type & ~PropertyDefine.Clone.Type); } },
		Clone: { Type: 8, Is: function (type) { return (type & this.Type) === this.Type } },
		Override: { Type: 16, Is: function (type) { return (type & this.Type) === this.Type } }
	}

	var Policy= { Public: 0, Protected: 1, Private: 2, Default: 2 };
	var PolicyCheck= [
			function () { }, //public
			function (fun) //protected
			{
				var caller = __Help_get_Caller(fun.caller);
				var funSetting = GetSetting(fun); //MUST EXIST
				SysAssert(funSetting, "System Error: setting not defined");

				var thisType = funSetting.OwnerClass;
				if (!thisType)     //for constructor(native)
					thisType = fun;

				var callerSetting, thisTypeSetting, callerOwner, friends;
				Assert(thisType === caller ||
					(callerSetting = GetSetting(caller)) &&
					(callerOwner = (callerSetting.OwnerClass || caller)) && (
						thisType === callerOwner ||
							(thisTypeSetting = GetSetting(thisType)) &&
								(thisTypeSetting.$IsBase(callerOwner) ||
								thisTypeSetting.$IsVirtualFunctionFrom(fun, caller) ||
								(friends = thisTypeSetting.Friends) &&
									friends.check(callerOwner))
					), "can't visit prototected member.", fun);
			},
			function (fun)// private
			{
				var caller = __Help_get_Caller(fun.caller);
				var funSetting = GetSetting(fun); //MUST EXIST
				var thisType = funSetting.OwnerClass;
				if (!thisType)     //for constructor(native)
					thisType = fun;

				var callerSetting, callerOwner, thisTypeSetting, friends;

				Assert(thisType === caller ||
					(callerSetting = GetSetting(caller)) &&
						(callerOwner = (callerSetting.OwnerClass || caller)) && (
						thisType === callerOwner ||
						((thisTypeSetting = GetSetting(thisType)) &&
							thisTypeSetting.$IsVirtualFunctionFrom(fun, caller) ||
							(friends = thisTypeSetting.Friends) &&
								friends.check(callerOwner))
					), "can't visit private member.", fun);
			}
	];

	function Property(obj, p) {
		var retObj = {};

		if (!(p instanceof Array)) {
			cc.log(p);
			//p = [p];
		}
		SysAssert(p instanceof Array, "Property must Array");

		for (var i = 0; i < p.length; i++) {
			if (p[i] === "")
				continue;
			SysAssert(p[i] && isNaN(p[i]), "Property not Support");

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
				SysAssert(false, "Property not Support");
		}
		delete retObj.Is;
		if (retObj.Type === undefined) {
			retObj.Value = obj;
			if (obj !== undefined && obj instanceof Function)
				retObj.Type = Class.Property.Type.Object.Function.Type;///this.Type.Object.Function.Type;
			else
				retObj.Type = Class.Property.Type.Object.Var.Type; //this.Type.Object.Var.Type;
		} else if (PropertyDefine.Property.Is(retObj.Type)) {
			retObj.Value = obj;
		}
		else {
			SetSettings(obj, retObj);
			return obj;
		}
		var ret = new Function();
		SetSettings(ret, retObj);
		return ret;
	}
	function _Help_CopyObjectProperty(to, from, ignore) {
		SysAssert(from !== undefined && to !== undefined && from !== to, "_Help_CopyObjectProperty: can't be undefined, or same object.");
		if (!(from instanceof Function || from instanceof Object))
			return to;

		for (var name in from) {
			if (ignore && to.hasOwnProperty(name))
				continue;
			to[name] = from[name];
		}
		return to;
	}
	function _Help_CreateClass(classDef) {
		function F(args) {
			return classDef.apply(this, args);
		}
		F.prototype = classDef.prototype;
		SetDelegate(F);
		var ret = function (p) {
			return new F(p);
		}
		SetDelegate(ret);
		return ret;
	}
	function _Help_GetBaseClassByName(obj, name) {
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

			SysAssert(ret.Class, "Class not Found.");

			SetSettings(ret.Class, { "Name": name ? name : ret.Class.name });

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
			SysAssert(false, "Class Base Define Error:Defined type is not Support");

		if (ret.Policy === undefined)
			ret.Policy = Policy.Default;

		ret.Hidden = ret.Hidden ? true : false;

		SysAssert(ret.Class, "Class not Defined.");
		return ret;
	}
	function _Help_Static_CreateBases(Bases) {
		var bases = {};
		var classDefine, name;

		if (Bases instanceof Array) {
			var count = 0;
			for (var i = 0; i < Bases.length; i++) {
				classDefine = _Help_GetBaseClassByName(Bases[i]);
				var setting = GetSettingAlways(classDefine.Class);
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
				classDefine = _Help_GetBaseClassByName(Bases, name);
				var setting = GetSetting(classDefine.Class);

				SysAssert(setting && setting.Name, "Class Base Define Error:Defined type is not Support");
				bases[setting.Name] = classDefine;
			}
		} else
			SysAssert(Bases == undefined, "Class Base Define Error:Defined type is not Support" + Bases);

		return bases;
	}
	function _Help_Static_Class_Function_Sign(fun, owen, name, desc) {
		return SetSettings(fun, { "OwnerClass": owen, Name: name, Desc: desc });
	}
	function _Help_Static_Class_Function_Sign_Base(fun, owen, name, desc) {
		SetDelegate(fun);
		return _Help_Static_Class_Function_Sign(fun, owen, name, desc);//SetSettings(fun, { "OwnerClass": owen, "$IsDelegate": true, Name: name, Desc: desc });
	}
	function _Help_Static_Class_Function_Sign_No_Inherit(fun, owen, name, desc) {
		return SetSettings(fun, { "OwnerClass": owen, "NoInherit": true, Name: name, Desc: desc });
	}
	function ___Help_CreatePropertyDelegateTemplate(delegate_dest, src, name, funs) {
		var desc = Object.getOwnPropertyDescriptor(src, name);
		if (desc !== undefined) {
			if (desc.hasOwnProperty("get") || desc.hasOwnProperty("set")) {
				var fun = desc.get || desc.set;
				SysAssert(fun, "MUST exist one either 'get' or 'set' ")

				var funSetting = GetSetting(fun);
				if (PropertyDefine.Clone.Is(funSetting.Type)) {
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
				var funSetting = GetSetting(fun);
				if (!funSetting)
					funSetting = {};

				if (funSetting.NoInherit)
					return;

				var behaver;
				if (PropertyDefine.Clone.Is(funSetting.Type)) {
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
			SysAssert(false, "currently not support. inherit from native function. (vars)?");

	}
	function ___Help_CreatePropertyDelegateByDefineTemplate(delegate_obj, policyItems, name, funs) {
		___Help_CreatePropertyDelegateByDefineTemplateByItem(delegate_obj, policyItems[name], name, funs)
	}
	function ___Help_CreatePropertyDelegateByDefineTemplateByItem(delegate_obj, item, name, funs) {
		var value = item;
		var valueSetting = GetSetting(value);

		Assert(valueSetting !== undefined && valueSetting.Type !== undefined, "must exist Type", arguments.callee.caller);
		var type = valueSetting.Type;

		if (!PropertyDefine.Function.Is(type)) {
			if (valueSetting.hasOwnProperty("Value")) {
				value = valueSetting.Value;
			}
		}
		SysAssert(!Property.Type.IsInvaild(type), "static function not support virtual.");

		var isStatic = PropertyDefine.Static.Is(type);
		var additionStr = isStatic ? "(static) " : "";

		if (PropertyDefine.Property.Is(type)) {
			if (PropertyDefine.Var.Is(type)) {  //for var
				if (PropertyDefine.Static.Is(type)) {   //StaticVar
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

			Assert(value instanceof Function, "Expect Function but " + typeof (value), arguments.callee.caller);
			delegate_obj[name] = funs.Setting(isStatic ? funs.Function.Static : funs.Function.Object, additionStr, value, type);
		}
	}
	function _Help_Static_Create_Prototype_Delegate(delegate_obj, _innerVars, policyItem, name, policyID, ThisType) {
		var checkPolicy = policyID instanceof Function ? policyID : PolicyCheck[policyID];
		var staticVar;

		function _varsSetting(value, type, delgateFun) {
			SetSettings(delgateFun, {
				Type: type,
				//TopObject: delegate_obj,
				Value: value
			});
			return delgateFun;
		};
		function _propertyAndFunctionSetting(fun, type, delgateFun) {
			SetDelegate(fun);// SetSettings(fun, { $IsDelegate: true });
			SetSettings(delgateFun, {
				Type: type,
				//TopObject: delegate_obj,
				Value: fun
			});
			return delgateFun;
		};
		___Help_CreatePropertyDelegateByDefineTemplate(delegate_obj, policyItem, name,
		{
			Setting: function (fun, behaverStr, p1, p2) {
				var className;
				if (ThisType) {
					className = SafeGetSetting(ThisType, "Name");
				}
				else
					className = SafeGetSetting(delegate_obj, "Name");
				className = className ? className : "(unknown)";
				var ret = _Help_Static_Class_Function_Sign(fun(p1, p2), ThisType, name, className + "::" + behaverStr + name)
				return ret;
			},
			Vars: {
				Inner: {
					get: function (value, type) {
						return _varsSetting(value, type, function () {
							checkPolicy(arguments.callee);
							return this[_VarString/*"+p_vars+"*/][name];
						});
					},
					set: function (value, type) {
						return _varsSetting(value, type, function (v) {
							checkPolicy(arguments.callee);
							this[_VarString/*"+p_vars+"*/][name] = v;
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

	}
	function _Help_Static_Create_StaticProperty_Delegate(destClass, srcClass, name, checkPolicy) {
		if (name === "constructor")
			return;

		function Clone(f) {				// TODO: Need Confirm
			var fun = GetSetting(f).Value;
			SetDelegate(fun);

			return function () {
				checkPolicy(arguments.callee);
				return fun.apply(this, arguments);
			}
		}

		//function NoClone(f, fobj) { return function () { checkPolicy(arguments.callee); return f.apply(destClass, arguments); } }/*MASK*/
		function NoClone(f, fobj) { return function () { checkPolicy(arguments.callee); return f.apply(srcClass, arguments); } }/*MASK*/
		function PropertyClone(funget, funset) {
			var fun = funget || funset;
			var setting = GetSetting(fun);
			if (Property.Type.Object.Var.Is(setting.Type) || Property.Type.Static.Var.Is(setting.Type)) {
				var items = {}; items[name] = fun;
				_Help_Static_Create_Prototype_Delegate(destClass, null, items, name, checkPolicy, destClass);
			} else {
				var fungetV, funsetV;
				funget && (fungetV = SafeGetSetting(funget, "Value"));
				funset && (funsetV = SafeGetSetting(funset, "Value"));

				var isfunget = fungetV && (fungetV instanceof Function);
				var isfunset = funsetV && (funsetV instanceof Function);

				SysAssert(isfunget && !isfunset && !funsetV || isfunset && !isfunget && !fungetV || isfunget && isfunset, "SYSTEM ERROR");


				var obj_setting = {};
				if (fungetV)
					obj_setting.get = fungetV;// function(){return fungetV.apply(destClass,arguments)};
				if (funsetV)
					obj_setting.set = funsetV;//function(){funsetV.apply(destClass,arguments)};
				//
				var obj = {};
				obj[name] = {};
				SetSettings(obj[name], { Type: setting.Type, Value: obj_setting });

				_Help_Static_Create_Prototype_Delegate(destClass, null, obj, name, checkPolicy, destClass);
			}

		}
		function DelegateVar(destObj, desc, name) {
			var clsName = SafeGetSetting(srcClass, "Name");
			if (!clsName)
				clsName = srcClass.name;
			if (clsName.length == 0)
				clsName = "(UnknownClass)";

			desc.get = function () { checkPolicy(arguments.callee); return destClass[name]; }
			_Help_Static_Class_Function_Sign_Base(desc.get, destClass, name, clsName + "::get_" + name);

			if (desc.writable) {
				desc.set = function (v) { checkPolicy(arguments.callee); destClass[name] = v; }
				_Help_Static_Class_Function_Sign_Base(desc.set, destClass, name, clsName + "::set_" + name);
			}
			delete desc.writable;
			delete desc.value;
			Object.defineProperty(destObj, name, desc);
		}
		___Help_CreatePropertyDelegateTemplate(destClass, srcClass, name, {
			Setting: function (fun, behaverStr, rawFun, rawFunSetting) {
				var clsName = SafeGetSetting(srcClass, "Name");
				if (!clsName)
					clsName = srcClass.name;
				if (clsName.length == 0)
					clsName = "(UnknownClass)";

				var newfun = fun(rawFun, rawFunSetting);
				if (newfun) {
					if (Class.Property.Type.Clone.Is(rawFunSetting.Type))
						return _Help_Static_Class_Function_Sign(newfun, destClass, name, clsName + "(" + behaverStr + ")::" + name);
					else
						return _Help_Static_Class_Function_Sign_Base(newfun, destClass, name, clsName + "(" + behaverStr + ")::" + name);
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
	}
	function _Help_Static_Create_Prototype_Delegate_Base(delegate_obj, baseClass, name, checkPolicy, ownerClass) {
		if (name === "constructor")
			return;
		SysAssert(baseClass instanceof Function, "must be Object.");

		var baseSetting = GetSetting(baseClass);

		function Clone(f) {
			var fun = GetSetting(f).Value;
			SetDelegate(fun);
			return function () {
				checkPolicy(arguments.callee);
				return fun.apply(this, arguments);
			}
			//return f;
		}
		function NoClone(f) {
			return function () {
				checkPolicy(arguments.callee);
				return f.apply(this.$AS(baseClass), arguments);
			}
		}
		function PropertyClone(funget, funset) {
			var fun = funget || funset;
			var setting = GetSetting(fun);
			if (Property.Type.Object.Var.Is(setting.Type) || Property.Type.Static.Var.Is(setting.Type)) {
				var items = {}; items[name] = fun;
				_Help_Static_Create_Prototype_Delegate(delegate_obj, null, items, name, checkPolicy, ownerClass);
			} else {
				var obj_setting = {};
				if (funget)
					obj_setting.get = funget;
				if (funset)
					obj_setting.set = funset;
				//
				var obj = {};
				obj[name] = {};
				SetSettings(obj[name], { Type: setting.Type, Value: obj_setting });

				_Help_Static_Create_Prototype_Delegate(delegate_obj, null, obj, name, checkPolicy, ownerClass);
			}
		}
		function DelegateVar(destObj, desc, name) {
			var clsName = SafeGetSetting(baseClass, "Name");
			if (!clsName)
				clsName = srcClass.name;
			if (clsName.length == 0)
				clsName = "(UnknownClass)";

			desc.get = function () { checkPolicy(arguments.callee); return this.$AS(baseClass)[name]; }
			_Help_Static_Class_Function_Sign_Base(desc.get, ownerClass, name, clsName + "::get_" + name);
			if (desc.writable) {
				desc.set = function (v) { checkPolicy(arguments.callee); this.$AS(baseClass)[name] = v; }
				_Help_Static_Class_Function_Sign_Base(desc.get, ownerClass, name, clsName + "::set_" + name);
			}
			delete desc.writable;
			delete desc.value;
			Object.defineProperty(destObj, name, desc);
		}
		___Help_CreatePropertyDelegateTemplate(delegate_obj, baseClass.prototype, name, {
			Setting: function (fun, behaverStr, rawFun, rawFunSetting) {
				var clsName = SafeGetSetting(baseClass, "Name");
				if (!clsName)
					clsName = baseClass.name;
				if (clsName.length == 0)
					clsName = "(UnknownClass)";

				if (Class.Property.Type.Clone.Is(rawFunSetting.Type))
					return _Help_Static_Class_Function_Sign(fun(rawFun, rawFunSetting), ownerClass, name, SafeGetSetting(ownerClass, "Name") + "<" + clsName + ">(" + behaverStr + ")::" + name);
				else
					return _Help_Static_Class_Function_Sign_Base(fun(rawFun, rawFunSetting), ownerClass, name, SafeGetSetting(ownerClass, "Name") + "<" + clsName + ">(" + behaverStr + ")::" + name);
			},
			Function: { Clone: Clone, NoClone: NoClone },
			Property: {
				Clone: PropertyClone,
				get: NoClone,
				set: NoClone
			},
			Vars: DelegateVar
		});
	}
	function _Help_Static_Create_Prototype_Delegate_Base_Instance(delegate_obj_inst, baseObj, name, checkPolicy, ownerClass) {
		if (name === "constructor")
			return;
		var baseSetting = GetSetting(baseObj);

		function Clone(f) {
			return function () {
				SysAssert(false, "Clone Object not support");
			}
		}
		function NoClone(f, fobj) {
			return function () {
				checkPolicy(arguments.callee);
				return f.apply(delegate_obj_inst, arguments);
			}
		}
		function PropertyClone(funget, funset) {
			SysAssert(false, "PropertyClone Object not support");
		}
		function DelegateVar(destObj, desc, name) {
			var clsName = SafeGetSetting(baseObj.constructor, "Name");
			if (!clsName)
				clsName = srcClass.name;
			if (clsName.length == 0)
				clsName = "(UnknownClass)";

			desc.get = function () {
				checkPolicy(arguments.callee);
				return baseObj[name];
				//return this.$AS(baseObj)[name];
			}
			_Help_Static_Class_Function_Sign_Base(desc.get, ownerClass, name, clsName + "::get_" + name);
			if (desc.writable) {
				desc.set = function (v) {
					checkPolicy(arguments.callee);
					baseObj[name] = v;
					//this.$AS(baseObj)[name] = v;
				}
				_Help_Static_Class_Function_Sign_Base(desc.get, ownerClass, name, clsName + "::set_" + name);
			}
			delete desc.writable;
			delete desc.value;
			Object.defineProperty(destObj, name, desc);
		}
		___Help_CreatePropertyDelegateTemplate(delegate_obj_inst, baseObj, name, {
			Setting: function (fun, behaverStr, rawFun, rawFunSetting) {
				var clsName = SafeGetSetting(baseObj.constructor, "Name");
				if (!clsName)
					clsName = baseObj.constructor.name;
				if (clsName.length == 0)
					clsName = "(UnknownClass)";

				return _Help_Static_Class_Function_Sign_Base(
					fun(rawFun, rawFunSetting),
					ownerClass, name,
					SafeGetSetting(ownerClass, "Name") + "<" + clsName + ">(" + behaverStr + ")::" + name);
			},
			Function: { Clone: Clone, NoClone: NoClone },
			Property: {
				Clone: PropertyClone,
				get: NoClone,
				set: NoClone
			},
			Vars: DelegateVar
		});
	}
	function CreateReadOnlyProperty(obj, name, varObj, notenumerable) {
		Object.defineProperty(obj, name, {
			value: varObj,
			writable: false,
			enumerable: (notenumerable ? false : true)
		});
	}
	function DelegateBaseProperty(to, from, policy, ownerClass) {
		var policyCheck = PolicyCheck[policy];
		var fromprototype = from.prototype;

		for (var propertyName in fromprototype) {
			if (to.hasOwnProperty(propertyName))
				continue;

			_Help_Static_Create_Prototype_Delegate_Base(to, from, propertyName, policyCheck, ownerClass);
		}
	}
	function DelegateBaseProperty_Instance(to, from, policy, ownerClass) {
		var policyCheck = PolicyCheck[policy];
		for (var propertyName in from) {
			if (
				from.constructor.prototype.hasOwnProperty(propertyName) || //if has in prototype ignore it. remove this line will be error, may be cause of "to.hasownproperty"
				to.hasOwnProperty(propertyName))
				continue;

			_Help_Static_Create_Prototype_Delegate_Base_Instance(to, from, propertyName, policyCheck, ownerClass);
		}
	}
	function DelegateBaseStaticProperty(to, from, policy) {
		var policyCheck = PolicyCheck[policy];
		for (var propertyName in from) {
			if (to.hasOwnProperty(propertyName))
				continue;
			_Help_Static_Create_StaticProperty_Delegate(to, from, propertyName, policyCheck);
		}
	}
	function GetSetting(Obj) {
		return Obj[_SettingString];
	}
	function SafeGetSetting(obj, name) {
		if (!isNaN(obj) || obj === undefined || obj === null)
			return undefined;

		var setting = GetSetting(obj);
		if (setting)
			return setting[name];
		return undefined;
	}
	function GetSettingAlways(Obj) {
		if (!Obj.hasOwnProperty(_SettingString))
			SetSettings(Obj, {});
		return Obj[_SettingString];
	}
	function SetSettings(Obj, settings, ignoreWhenExist) {
		SysAssert(Obj !== undefined, "SetSettings: Obj undefined");
		if (!Obj.hasOwnProperty(_SettingString)) {
			Object.defineProperty(Obj, _SettingString, { value: settings });
		} else
			_Help_CopyObjectProperty(Obj[_SettingString], settings, ignoreWhenExist);

		return Obj;
	}
	function SafeDefinedItem(policyItem, name) {  //used on defined item only.
		var item = policyItem[name];

		if (item !== undefined && item instanceof Function) {
			SetSettings(item, { Type: Property.Type.Object.Function.Type }, true);;
		} else {
			var ret = function () { };

			var type = Property.Type.Object.Var.Type;
			SetSettings(ret, { Value: item, Type: type });
			policyItem[name] = ret;
			return ret;
		}
		return item;
	}
	function SetDelegate(fun, isdelegate) {
		var obj = {};
		obj[_IsDelegate] = isdelegate || isdelegate === undefined ? true : false;
		SetSettings(fun, obj);
	}
	function IsDelegate(fun) {
		return GetSetting(fun)[_IsDelegate];
	}
	function _SetArguments(v) {
		if (v === undefined)
			return v;
		var r = function () { };
		SetSettings(r, { Argument: v });
		return r;
	}
	function _GetArguments(v, args) {
		var r = SafeGetSetting(v, "Argument");
		if (r === undefined && !(v instanceof Array))
			return [];

		if (r === -1)
			return args;

		SysAssert(v instanceof Array, "Base Parameter define must an Array or other Class.Arguments setting.");
		var ret = [];
		for (var i = 0; i < v.length; i++) {
			r = SafeGetSetting(v[i], "Argument");
			if (r === undefined)
				ret.push(v[i]);
			else {
				SysAssert(r >= 0 || args.length < r, "Base Parameter Arguments Setting Error. can't set the ALL or NONE in argument items, or your setting item is out of arguments range");

				ret.push(args[r]);
			}
		}
		return ret;
	}
	//////////////////////////////////////////////////////////////////////////////////////////////////

	//virtual & override not allow
	Property.Type = {
		IsInvaild: function (type) { return type === 11 || type === 1; },
		IsVar: function (type) { return type & Property.Type.Object.Var.Type == Property.Type.Object.Var.Type },                //type & 5==5
		IsProperty: function (type) { return type & Property.Type.Static.Var.Type === Property.Type.Object.Property.Type },         //type&7 ===4
		Clone: PropertyDefine.Clone,
		Override: PropertyDefine.Override, /*TODO: only for the member-function which is not defined by Class*/
		Virtual: {
			Type: PropertyDefine.Virtual.Type,
			Is: function (type) { return type === this.Type }
		},  //type ===2 , 3 not allow, and clone virtual is not allowed too.
		Object: {
			Is: function (type) { return type & 3 !== 2 }, //,  !PropertyDefine.Static.Is(type)|| Property.Type.Virtual.Is(type); },
			Function: { Type: PropertyDefine.Function.Type, Is: function (type) { return (type & ~PropertyDefine.Clone.Type) === this.Type } },
			Property: { Type: PropertyDefine.Property.Type, Is: function (type) { return (type & ~PropertyDefine.Clone.Type) === this.Type; } },
			Var: {
				Type: PropertyDefine.Property.Type | PropertyDefine.Var.Type,
				Is: function (type) { return (type & Property.Type.Static.Var.Type) === this.Type; }
			}
		},
		Static: {
			Is: function (type) { return PropertyDefine.Static.Is(type) && !Property.Type.Virtual.Is(type); },
			Function: { Type: PropertyDefine.Static.Type, Is: function (type) { return (type & ~PropertyDefine.Clone.Type) === this.Type; } },
			Property: {
				Type: PropertyDefine.Static.Type | PropertyDefine.Property.Type,
				Is: function (type) { return (type & ~PropertyDefine.Clone.Type) === this.Type; }
			},
			Var: {
				Type: PropertyDefine.Static.Type | PropertyDefine.Property.Type | PropertyDefine.Var.Type,
				Is: function (type) { return (type & this.Type) === this.Type; }
			}
		},
		NoInherit: {
			NoInherit: true
		}
	};

	//////////////////////////////////////////////////////////////////////////////////////////////////
	function Class(defines) {
		var obj_create_constructor;
		var staticAttribute;
		var ClassInnerVar;


		var _overrides = []; //no need copy it to setting.

		function obj_create() {
			var thisType = arguments.callee;
			var obj_create_thisObj = this;
			CreateReadOnlyProperty(this, _VarString/*"+p_vars+"*/, new ClassInnerVar(), true);

			//export baseClass AS property.
			var Settings = GetSetting(thisType);
			var StaticBases = Settings.Bases;


			(function () {
				var _this = obj_create_thisObj;

				var _parent = Settings.$$Parent;
				if (!_parent)
					_parent = _this;

				Object.defineProperty(_this, "$Super", {	//temp
					get: _Help_Static_Class_Function_Sign_No_Inherit(
							function () { return _parent; }), enumerable: true
				});

				var _root = _this.$Super;
				var _pre;
				do {
					_pre = _root;
					_root = _root.$Super;
				} while (_root !== _pre);

				Object.defineProperty(_this, "$Root", {
					get: _Help_Static_Class_Function_Sign_No_Inherit(
						function () {
							return _root;
						}), enumerable: true
				});
			})();

			var bases = {};
			for (var name in StaticBases) {
				var item = StaticBases[name];
				//policy and base object.
				var args = _GetArguments(item.Parameter, arguments);

				var parentSetting = GetSettingAlways(item.Class);
				var oldParent = parentSetting.$$Parent;
				parentSetting.$$Parent = this;
				base = bases[name] = _Help_CreateClass(item.Class)(args);
				parentSetting.$$Parent = oldParent;


				//export object by class name.
				Object.defineProperty(this, name, {
					get: _Help_Static_Class_Function_Sign_No_Inherit(
						(function (base, checkPolicy) {
							return function () {
								checkPolicy(arguments.callee);
								return base;
							};
						})(base, PolicyCheck[item.Policy]), thisType, name, "cast from Object<" + Settings.Name + "> to <" + name + ">")
					//,configurable:true
					, enumerable: true
				});

				DelegateBaseProperty_Instance(this, base, item.Policy, thisType);
			}

			////////////////////////////////////////////
			this.$AS = function (typeClass) {
				SysAssert(typeClass && (typeClass.constructor === String || typeClass instanceof Function), "Class.$AS typeClass is empty");
				if (typeClass.constructor === String) {
					if (bases.hasOwnProperty(typeClass)) {
						return bases[typeClass];
					}
				}
				else if (typeClass instanceof Function) {
					var typeSetting = GetSetting(typeClass);
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
					IsDelegate(thisType.prototype[virtualName]) || // thisType.prototype[virtualName].$IsDelegate ||   //means inherit from base
					!(fun = virtualArray.Function)) {
					continue;
				}

				function depVirtual(currentObj, virtualArray) {
					SysAssert(currentObj && virtualArray && virtualArray.Policy !== undefined && fun, "SYSTEM ERROR: currentObj MUST exist.");
					if (virtualArray.length === 0) {
						var checkPolicy = PolicyCheck[virtualArray.Policy];
						var currentSetting = GetSetting(thisType);
						var name = "";
						if (currentSetting)
							name = currentSetting.Name;
						else
							name = virtualArray.OwnerClass.name;

						currentObj[virtualName] = _Help_Static_Class_Function_Sign_No_Inherit((function (oldfun, curfun) {
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
						SysAssert(classType instanceof Array, "SYSTEM ERROR: MUST BE A ARRAY.");

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
					if (SafeGetSetting(base.constructor, "$IsVirtualFunctionFrom")) //override not for Class.
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
				var setting = GetSetting(obj_create_constructor);
				PolicyCheck[setting.Policy](arguments.callee);
				obj_create_constructor.apply(this, arguments);
			}
		}
		SetSettings(obj_create, { Name: defines.Name });
		staticAttribute = GetSetting(obj_create);

		var Bases = _Help_Static_CreateBases(defines.Bases);

		//define this
		var _innerObject = {};
		var _innerVars = {};
		var _virtuals = {}; //virtual function list.
		var policyArray = [defines.Public, defines.Protected, defines.Private];
		var maxLength = PolicyCheck.length > policyArray.length ? policyArray.length : PolicyCheck.length;
		var hasConstructor = false;
		for (var i = 0; i < maxLength; i++) {
			var policyItem = policyArray[i];
			if (!policyItem)
				continue;
			for (var name in policyItem) {
				var item = SafeDefinedItem(policyItem, name);
				var itemSetting = GetSettingAlways(item);
				SysAssert(itemSetting.Type === (itemSetting.Type & ~Property.Type.Override) || Property.Type.Object.Function === (itemSetting.Type & ~Property.Type.Override), "Override only support Object Function");
				if (Property.Type.Static.Is(itemSetting.Type)) {
					SysAssert(!obj_create.hasOwnProperty(name), name + " has defined before.");
					_Help_Static_Create_Prototype_Delegate(obj_create, null, policyItem, name, i, obj_create);
					continue;
				}
				SysAssert(!_innerObject.hasOwnProperty(name), name + " has defined before.");
				SysAssert(!Bases.hasOwnProperty(name), name + " has defined as a BaseName.");

				itemSetting.Name = name;
				itemSetting.OwnerClass = obj_create;
				if (i === Policy.Private)
					itemSetting.NoInherit = true;

				if (name === "constructor") {
					if (PropertyDefine.Function.Is(itemSetting.Type)) {
						hasConstructor = true;
						itemSetting.NoInherit = true;

						itemSetting.Policy = i;
						_innerObject.constructor = item;
						continue;
					} else
						SysAssert(!Property.Type.Virtual.Is(itemSetting.Type), "constructor not support virtual");
				}

				_Help_Static_Create_Prototype_Delegate(_innerObject, _innerVars, policyItem, name, i, obj_create);
				if (Property.Type.Virtual.Is(itemSetting.Type)) {
					_virtuals[name] = [];
					_virtuals[name].OwnerClass = obj_create;
					_virtuals[name].Policy = i;
				} else
					if (Property.Type.Override.Is(itemSetting.Type)) {
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
			var baseClassSetting = GetSetting(base);
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
						current_virtual.Function = SafeGetSetting(_innerObject[virtualName], "Value");
					}
				}
			}
			if (baseCfg.Hidden)
				continue;

			DelegateBaseProperty(_innerObject, base, baseCfg.Policy, obj_create);

			DelegateBaseStaticProperty(obj_create, base, baseCfg.Policy, obj_create);
		}
		obj_create.prototype = _innerObject;
		obj_create.prototype.constructor = obj_create;

		//////////////////////////////////////////////////////////////////////

		if (!defines.Friends) defines.Friends = [];


		CreateReadOnlyProperty(staticAttribute, "Friends", {
			check: function (type) {
				for (var i = 0; i < defines.Friends.length; i++) {
					if (defines.Friends[i] === type)
						return true;
				}
				return false;
			}
		});
		CreateReadOnlyProperty(staticAttribute, "Bases", Bases);
		CreateReadOnlyProperty(staticAttribute, "Virtuals", _virtuals);
		//CreateReadOnlyProperty(staticAttribute, "$IsDelegate",true);   //for invoke userdefined constructor.
		CreateReadOnlyProperty(staticAttribute, "$IsBase", function (callerClass) {
			function isBase(callerClass) {
				var callerClassSetting = GetSetting(callerClass);
				if (!callerClassSetting || !callerClassSetting.Bases)
					return false;

				if (callerClassSetting.Bases.hasOwnProperty(staticAttribute.Name))   //not include one condition that class is not defined by Class.
				{
					if (callerClassSetting.Bases[staticAttribute.Name].Policy === Policy.Private)
						return false;
					else
						return true;
				}
				for (var name in callerClassSetting.Bases) {
					var base = callerClassSetting.Bases[name];
					if (base.Policy === Policy.Private)
						continue;

					if (isBase(base.Class))
						return true;
				}
				return false;
			}
			return isBase(callerClass);
		});
		CreateReadOnlyProperty(staticAttribute, "$IsVirtualFunctionFrom", function (fun, callerFun) {
			do {
				var funSetting = GetSetting(fun);
				if (!funSetting) break;
				var callerSetting = GetSetting(callerFun);
				if (!callerSetting) break;

				var callerClass = callerSetting.OwnerClass;
				if (!callerClass) break;;
				var callerClassSetting = GetSetting(callerClass);
				if (!callerClassSetting) break;;
				if (!callerClassSetting.Virtuals.hasOwnProperty(funSetting.Name))
					break;
				var funClass = funSetting.OwnerClass;
				if (!funClass) break;
				return callerClassSetting.$IsBase(funClass) || (funClassSetting = GetSetting(funSetting.OwnerClass)) && funClassSetting.$IsBase(callerClass)
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

	Class.Policy = Policy;
	Class.Property = Property;

	Class.Arguments = function (idx) {
		return _SetArguments(idx);
	};
	Class.Arguments.NONE = _SetArguments();
	Class.Arguments.ALL = _SetArguments(-1);

	Class.GetSetting = GetSetting;
	Class.GetName = function (objOrClass) {
		if (!(objOrClass instanceof Function)) {
			objOrClass = objOrClass.constructor;
		}

		return Class.GetSetting(objOrClass).Name;
	}
	Class.Assert = SysAssert;
	Class.HiddenCaller = SetDelegate;
	Class.GetMember = function (obj, membername,e) {
		try {
			var ext;
			if (membername && membername.length > 0)
				ext = "." + membername;
			else
				ext = "";

			var r= (new Function("return this" + ext)).call(obj);
			if (e instanceof Object)
			{
				e.value = r;
				return true;
			}
			return r;
		}
		catch (e) {
			if (e instanceof Object)
			{
				e.value = undefined;
				return false;
			}
			throw "Class.GetMember: can't find member " + membername;
		}
	}

	Class.GetMemberBuilder = function (membername,withStatus) {
		if (membername === undefined || membername ===null)
			return null;
		Class.Assert(membername.constructor === String, "Class.GetMemberBuilder: membername must be String");
		var ext;
		if (membername && membername.length > 0)
			ext = "." + membername;
		else
			ext = "";

		var fun= new Function("return this" + ext);
		if (withStatus)
		{
			return function (obj) {
				var ret = {};
				try {
					ret.value = fun.call(obj);
					ret.success = true;
				}
				catch (e) {
					ret.success = false;
				}
				return ret;
			}
		}
		else
		{
			return function (obj)
			{
				try{
					return fun.call(obj);
				} catch (e) {
					throw "Class.GetMember: can't find member " + membername;
				}
			}
		}
	}


	Class.AsCurrentClassFunction = function (fun) {
		var owner = SafeGetSetting(arguments.callee.caller, "OwnerClass");
		if (!owner)
			throw "AsCurrentClass Faild. caller must defined by Class";
		_Help_Static_Class_Function_Sign(fun, owner, "anonymouse", "anonymouse function");
		return fun;
	}
	return Class;
})();
var Property = Class.Property;

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

