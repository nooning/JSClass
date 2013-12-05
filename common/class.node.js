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
    _SettingString:".",
	__Help_get_Caller: function (caller) {
		while (caller && _Class_Help.SafeGetSetting(caller,"$IsDelegate")) {
			caller = caller.caller;
		}
		return caller;
	},
    SysAssert: function (condition, message) {
        if (condition) return;
        var caller = arguments.callee.caller;
        var messageadditon="(SysAssert)";
        while(caller){
            var callerSetting=this.GetSetting(caller);
            if (callerSetting) {
                if (callerSetting.Desc)
                    messageadditon += "\n\t<-" + callerSetting.Desc  ;
                else if (callerSetting.Name)
                    messageadditon += "\n\t<-" +callerSetting.Name;
                else if (caller.name.length>0)
                    messageadditon += "\n\t<-" + callerer.name;
                else
                    messageadditon+= "\n\t<-(unknown function)";
            }
            caller = caller.caller;
        };

        throw message+"\n"+messageadditon;
    },
	Assert: function (condition, message, caller) {
		if (condition)
			return;

        var callerer=this.__Help_get_Caller(caller.caller);

		message = "  Error:" + message;
        var callerSetting=this.GetSetting(callerer);
        if (callerSetting) {
            if (callerSetting.Desc)
                message = callerSetting.Desc + " " + message;
            else if (callerSetting.Name)
                message = callerSetting.Name + " " + message;
            else
                message = callerer.name + " " + message;
        }
         callerSetting=this.GetSetting(caller);
        if (callerSetting) {
            if (callerSetting.Desc)
                message +=" "+ callerSetting.Desc ;
            else if (callerSetting.Name)
                message +=" "+  callerSetting.Name;
            else
                message +=" "+ caller.name;
        }
		throw message;
	},
	SetFunctionStaticProperty: function (fun, keyValues, name, desc) {
        this.SetSettings(fun,keyValues);
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
		Property: { Type: 4, Is: function (type) { return (type & this.Type) === this.Type && _Class_Help.PropertyDefine.Virtual.Type !== (type&~_Class_Help.PropertyDefine.Clone.Type); } },
		Clone: { Type: 8, Is: function (type) { return (type & this.Type) === this.Type } }
	},

	Policy: { Public: 0, Protected: 1, Private: 2, Default:2 },
	PolicyCheck: [
        function () { }, //public
        function (fun) //protected
        {
        	var caller = _Class_Help.__Help_get_Caller(fun.caller);
        	var funSetting = _Class_Help.GetSetting(fun); //MUST EXIST
            _Class_Help.SysAssert(funSetting,"System Error: setting not defined");

        	var thisType = funSetting.OwnerClass;
            if (!thisType)     //for constructor(native)
                thisType = fun;

        	var callerSetting,thisTypeSetting,callerOwner,friends;
        	_Class_Help.Assert(thisType === caller ||
                (callerSetting = _Class_Help.GetSetting(caller)) &&
                (callerOwner = (callerSetting.OwnerClass|| caller) )&& (
                    thisType === callerOwner ||
                        (thisTypeSetting=_Class_Help.GetSetting(thisType)) &&
                            (thisTypeSetting.$IsBase(callerOwner) ||
                            thisTypeSetting.$IsVirtualFunctionFrom(fun,caller) ||
                            (friends=thisTypeSetting.Friends)&&
                                friends.check(callerOwner) )
                ), "can't visit prototected member.", fun);
        },
        function (fun)// private
        {
        	var caller = _Class_Help.__Help_get_Caller(fun.caller);
            var funSetting = _Class_Help.GetSetting(fun); //MUST EXIST
            var thisType = funSetting.OwnerClass;
            if (!thisType)     //for constructor(native)
                thisType = fun;

            var callerSetting,callerOwner,thisTypeSetting,friends;

        	_Class_Help.Assert(thisType === caller ||
                (callerSetting = _Class_Help.GetSetting(caller)) &&
                    (callerOwner = (callerSetting.OwnerClass|| caller)) && (
                    thisType === callerOwner ||
                        thisTypeSetting.$IsVirtualFunctionFrom(fun,caller)||
                        (thisTypeSetting = _Class_Help.GetSetting(thisType) )&&
                        (friends=thisTypeSetting.Friends)&&
                            friends.check(callerOwner)
                ), "can't visit private member.", fun);
        }
	],
	Property: function (obj, p) {
		var retObj = {};
		for (var i = 0; i < p.length; i++) {
			if (p[i] === "")
				continue;

			if (p[i] instanceof Object) {
				for (var name in p[i]) {
					var v = p[i][name];
					if (retObj.hasOwnProperty(name) && !isNaN(retObj[name]) && !isNaN(v)) {
						retObj[name] |= v;
					}
                    else
                        retObj[name] = v;
				}
			} else if (p[i].constructor === String)
				retObj[p[i]] = true;
			else
                _Class_Help.SysAssert(false,"Property not Support");
        }
		delete retObj.Is;
        if (retObj.Type === undefined){
            retObj.Value = obj;
            if (obj instanceof Function)
                retObj.Type = this.Type.Object.Function.Type;
            else
                retObj.Type = this.Type.Object.Var.Type;
        }else if (_Class_Help.PropertyDefine.Property.Is(retObj.Type)){
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
        this.SetSettings(F,{$IsDelegate:true});
		var ret =  function (p) {
			return new F(p);
		}
        this.SetSettings(ret,{$IsDelegate:true});
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

            this.SetSettings(ret.Class,{"Name": name ?name:ret.Class.name});

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
		return this.SetSettings(fun, { "OwnerClass": owen,Name:name,Desc:desc });
	},
//	_Help_Static_Class_Function_Sign_DelegateFun: function (fun, owen, name, desc) {
//        return this.SetSettings(fun, { "OwnerClass": owen,"$IsDelegate":true,Name:name,Desc:desc });
//	},
	_Help_Static_Class_Function_Sign_Base: function (fun, owen, name, desc) {
        return this.SetSettings(fun, { "OwnerClass": owen,"$IsDelegate":true,Name:name,Desc:desc });
	},
	_Help_Static_Class_Function_Sign_No_Inherit: function (fun, owen, name, desc) {
        return this.SetSettings(fun, { "OwnerClass": owen,"NoInherit":true,Name:name,Desc:desc });
	},
	SafeGetSetting: function (obj, name) {
		var setting = this.GetSetting(obj);
		if (setting)
			return setting[name];
		return undefined;
	},
	___Help_CreatePropertyDelegateTemplate: function (delegate_dest, src, name, funs) {
		var desc = Object.getOwnPropertyDescriptor(src, name);

        if (desc.hasOwnProperty("get") ||desc.hasOwnProperty("set")){
            var fun = desc.get||desc.set;
            _Class_Help.SysAssert(fun,"MUST exist one either 'get' or 'set' ")

            var funSetting = this.GetSetting(fun);
            if (this.PropertyDefine.Clone.Is(funSetting.Type)){
                funs.Property.Clone(desc.get,desc.set);
            } else{
                if (desc.get){
                    desc.get = funs.Setting(funs.Property.get, "inherit", desc.get, funSetting);
                }
                if (desc.set){
                    desc.set = funs.Setting(funs.Property.set, "inherit", desc.set, funSetting);
                }
                Object.defineProperty(delegate_dest, name, desc);
            }
            return;
        }
        if (desc.value instanceof Function) {
            var fun = desc.value;
            var funSetting = this.GetSetting(fun);
            if (!funSetting)
                funSetting = {};

            if (funSetting.NoInherit)
                return;

            var behaver;
            if ( this.PropertyDefine.Clone.Is(funSetting.Type)) {
                delegate_dest[name] = funs.Setting(funs.Function.Clone, "clone", fun, funSetting);
            } else {
                delegate_dest[name] = funs.Setting(funs.Function.NoClone, "inherit", fun, funSetting);
            }
            return;
        }else
        {
            //inherit from native function. (vars)
            _Class_Help.SysAssert(false,"currently not support. inherit from native function. (vars)?") ;
        }
	},
    ___Help_CreatePropertyDelegateByDefineTemplate: function (delegate_obj, policyItems, name, funs) {
        this.___Help_CreatePropertyDelegateByDefineTemplateByItem(delegate_obj, policyItems[name],name, funs)
    },
	___Help_CreatePropertyDelegateByDefineTemplateByItem: function (delegate_obj, item , name, funs) {
        var value = item;
        var valueSetting = this.GetSetting(value);

        _Class_Help.Assert(valueSetting!== undefined && valueSetting.Type!== undefined,"must exist Type",arguments.callee.caller);
        var type = valueSetting.Type;

        if (!this.PropertyDefine.Function.Is(type))
        {
            if (valueSetting.hasOwnProperty("Value")) {
                value = valueSetting.Value;
            }
        }
        _Class_Help.SysAssert(!this.Property.Type.IsInvaild(type ),"static function not support virtual.");

		var isStatic = this.PropertyDefine.Static.Is(type);
        var additionStr = isStatic ? "(static) " : "";

		if (this.PropertyDefine.Property.Is(type)) {
            if (this.PropertyDefine.Var.Is(type)){  //for var
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
                }else{
                    funs.Vars.Inner.init(value);
                    Object.defineProperty(delegate_obj, name, funs.Vars.BeforeDefine({
                        get: funs.Setting(funs.Vars.Inner.get, "var get_", value, type),
                        set: funs.Setting(funs.Vars.Inner.set, "var set_", value, type)
                    }));
                }
            }else //for property
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
				Object.defineProperty(delegate_obj, name,funs.Property.BeforeDefine(value) );
			}
		}else
        {//functions
            if (valueSetting.Value !== undefined)
                value =valueSetting.Value;

            _Class_Help.Assert(value instanceof Function ,"Expect Function but " + typeof (value), arguments.callee.caller );
            delegate_obj[name] = funs.Setting(isStatic ? funs.Function.Static : funs.Function.Object, additionStr, value, type);
        }
	},

	_Help_Static_Create_Prototype_Delegate: function (delegate_obj, _innerVars, policyItem, name, policyID, ThisType) {
		var checkPolicy = policyID instanceof Function? policyID:this.PolicyCheck[policyID];
		var staticVar;

		function _varsSetting(value, type, delgateFun) {
			_Class_Help.SetSettings(delgateFun, { Type: type,
                //TopObject: delegate_obj,
                Value: value });
			return delgateFun;
		};
		function _propertyAndFunctionSetting(fun, type, delgateFun) {
			_Class_Help.SetSettings(fun, { $IsDelegate: true });
			_Class_Help.SetSettings(delgateFun, { Type: type,
                //TopObject: delegate_obj,
                Value: fun });
			return delgateFun;
		};
		this.___Help_CreatePropertyDelegateByDefineTemplate(delegate_obj, policyItem, name,
        {
        	Setting: function (fun, behaverStr, p1, p2) {
        		var className;
        		if (ThisType) {
        			className = _Class_Help.SafeGetSetting(ThisType,"Name");
        		}
        		else
        			className = _Class_Help.SafeGetSetting(delegate_obj,"Name");
                className = className?className:"(unknown)";
        		var ret = _Class_Help._Help_Static_Class_Function_Sign(fun(p1, p2), ThisType, name, className + "::" + behaverStr + name)
                return ret;
        	},
        	Vars: {
        		Inner: {
        			get: function (value, type) { return _varsSetting(value, type, function () { checkPolicy(arguments.callee);
                        return this["+p_vars+"][name];
                    }); },
        			set: function (value, type) { return _varsSetting(value, type, function (v) { checkPolicy(arguments.callee);
                        this["+p_vars+"][name] = v;
                    }); },
        			init: function (v) { //init prototype
                        _innerVars[name] = v;
                    }
        		},
        		Static: {
        			get: function (value, type) {  return _varsSetting(value, type, function () { checkPolicy(arguments.callee); return staticVar; }); },
        			set: function (value, type) { return _varsSetting(value, type, function (v) { checkPolicy(arguments.callee); staticVar = v; }); },
        			init: function (v) {  staticVar = v; }
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
        		Object: function (fun, type) { return _propertyAndFunctionSetting(fun, type, function () { checkPolicy(arguments.callee); return fun.apply(this, arguments);}); }
        	}
        });

	},
    _Help_Static_Create_StaticProperty_Delegate: function (destClass, baseClass, name, checkPolicy) {
        if (name === "constructor")
            return;
        function Clone(f) { return function () { checkPolicy(arguments.callee); return f.apply(this, arguments); } }
        function NoClone(f, fobj) { return function () { checkPolicy(arguments.callee); return f.apply(fobj, arguments); } }
        function PropertyClone(funget,funset) {
            var fun = funget||funset;
            var setting = _Class_Help.GetSetting(fun);
            if (_Class_Help.Property.Type.Object.Var.Is(setting.Type) || _Class_Help.Property.Type.Static.Var.Is(setting.Type) ){
                var items={};items[name] = fun;
                _Class_Help._Help_Static_Create_Prototype_Delegate(destClass,null,items,name,checkPolicy,destClass);
            }else{
                var fungetV,funsetV;
                funget&&  (fungetV=_Class_Help.SafeGetSetting(funget,"Value"));
                funset&& (funsetV=_Class_Help.SafeGetSetting(funset,"Value"));

                var isfunget = fungetV && (fungetV instanceof Function);
                var isfunset =  funsetV && (funsetV instanceof Function);

                _Class_Help.SysAssert(isfunget&&!isfunset&&!funsetV || isfunset&&!isfunget&&!fungetV ||isfunget&&isfunset ,"SYSTEM ERROR");


                var obj_setting={};
                if (fungetV)
                    obj_setting.get = fungetV;
                if (funsetV)
                    obj_setting.set = funsetV;
                //
                var obj={};
                obj[name] = {};
                _Class_Help.SetSettings(obj[name],{Type:setting.Type ,Value:obj_setting});

                _Class_Help._Help_Static_Create_Prototype_Delegate(destClass,null,obj,name,checkPolicy,destClass);
            }

        }

        _Class_Help.___Help_CreatePropertyDelegateTemplate(destClass, baseClass, name, {
            Setting: function (fun, behaverStr, rawFun, rawFunSetting) {
                var clsName = _Class_Help.SafeGetSetting(baseClass, "Name");
                if (!clsName)
                    clsName = baseClass.name;
                if (clsName.length==0)
                    clsName="(UnknownClass)";

                var newfun = fun(rawFun, rawFunSetting) ;
                if (newfun)
                    return _Class_Help._Help_Static_Class_Function_Sign_Base(newfun,destClass, name,clsName + "(" + behaverStr + ")::" + name);
                return null;
            },
            Function: { Clone: Clone, NoClone: NoClone },
            Property: {
                Clone:PropertyClone,
                get: NoClone,
                set: NoClone
            }
        });
    },
//	_Help_Static_Create_StaticProperty_Delegate_Instance: function (delegate_obj, baseObj, name, checkPolicy) {
//
//        function Clone(f) { return function () { checkPolicy(arguments.callee);return f.apply(this, arguments); } }
//        function NoClone(f, fobj) { return function () { checkPolicy(arguments.callee);return f.apply(fobj, arguments); } }
//        function PropertyClone(fun) {
//            var setting = this.GetSetting(fun);
//            var items={};items[name] = fun;
//            this._Help_Static_Create_Prototype_Delegate(delegate_obj,null,items,name,checkPolicy,delegate_obj);
//        }
//
//        this.___Help_CreatePropertyDelegateTemplate(delegate_obj, baseObj, name, {
//            Setting: function (fun, behaverStr, rawFun, rawFunSetting) {
//                return _Class_Help._Help_Static_Class_Function_Sign_Base(fun(rawFun, rawFunSetting.TopObject), delegate_obj, name, _Class_Help.SafeGetSetting(delegate_obj,"Name") + "<" + _Class_Help.SafeGetSetting(baseObj,"Name") + ">(static " + behaverStr + ")::" + name)
//            },
//            Function: { Clone: Clone, NoClone: NoClone },
//            Property: {
//                Clone:PropertyClone,
//                get: NoClone,
//                set: NoClone
//            }
//        });
//    },
	_Help_Static_Create_Prototype_Delegate_Base: function (delegate_obj, baseClass, name, checkPolicy, ownerClass) {
        if (name === "constructor")
            return;
        _Class_Help.SysAssert(baseClass instanceof Function,"must be Object.");

        var baseSetting = this.GetSetting(baseClass);

        function Clone(f) { return function () { checkPolicy(arguments.callee); return f.apply(this, arguments); } }
        function NoClone(f) { return function () { checkPolicy(arguments.callee);return f.apply(this.AS(baseClass), arguments); } }
        function PropertyClone(funget,funset) {
            var fun = funget||funset;
            var setting = _Class_Help.GetSetting(fun);
            if (_Class_Help.Property.Type.Object.Var.Is(setting.Type) || _Class_Help.Property.Type.Static.Var.Is(setting.Type) ){
                var items={};items[name] = fun;
                _Class_Help._Help_Static_Create_Prototype_Delegate(delegate_obj,null,items,name,checkPolicy,ownerClass);
            }else{
                var obj_setting={};
                if (funget)
                    obj_setting.get = funget;
                if (funset)
                    obj_setting.set = funset;
                //
                var obj={};
                obj[name] = {};
                _Class_Help.SetSettings(obj[name],{Type:setting.Type ,Value:obj_setting});

                _Class_Help._Help_Static_Create_Prototype_Delegate(delegate_obj,null,obj,name,checkPolicy,ownerClass);
            }
        }

        _Class_Help.___Help_CreatePropertyDelegateTemplate(delegate_obj, baseClass.prototype, name, {
            Setting: function (fun, behaverStr, rawFun, rawFunSetting) {
                var clsName = _Class_Help.SafeGetSetting(baseClass, "Name");
                if (!clsName)
                    clsName = baseClass.name;
                if (clsName.length==0)
                    clsName="(UnknownClass)";

                return _Class_Help._Help_Static_Class_Function_Sign_Base(
                    fun(rawFun, rawFunSetting),
                    ownerClass, name,
                    _Class_Help.SafeGetSetting(ownerClass,"Name") + "<" + clsName+ ">(" + behaverStr + ")::" + name);
            },
            Function: { Clone: Clone, NoClone: NoClone },
            Property: {
                Clone:PropertyClone,
                get: NoClone,
                set: NoClone
            }
        });
	},
	_Help_Static_Create_Prototype_Delegate_Base_Instance: function (delegate_obj, baseObj, name, checkPolicy, ownerClass) {
		if (name === "constructor")
			return;
		var baseSetting = this.GetSetting(baseObj);

		function Clone(f) { return function () {
            _Class_Help.SysAssert(false,"Clone Object not support");
        } }
		function NoClone(f, fobj) { return function () { checkPolicy(arguments.callee); return f.apply(fobj, arguments); } }
        function PropertyClone(funget,funset) {
            _Class_Help.SysAssert(false,"PropertyClone Object not support");
        }

        _Class_Help.___Help_CreatePropertyDelegateTemplate(delegate_obj, baseObj, name, {
			Setting: function (fun, behaverStr, rawFun, rawFunSetting) {
                var clsName = _Class_Help.SafeGetSetting(baseObj.constructor, "Name");
                if (!clsName)
                    clsName = baseObj.constructor.name;
                if (clsName.length==0)
                    clsName="(UnknownClass)";

				return _Class_Help._Help_Static_Class_Function_Sign_Base(
                    fun(rawFun, rawFunSetting),
                    ownerClass, name,
                    _Class_Help.SafeGetSetting(ownerClass,"Name") + "<" + clsName+ ">(" + behaverStr + ")::" + name);
			},
			Function: { Clone: Clone, NoClone: NoClone },
			Property: {
                Clone:PropertyClone,
                get: NoClone,
                set: NoClone
			}
		});
	},
	CreateReadOnlyProperty: function (obj, name, varObj, notenumerable) {
        Object.defineProperty(obj, name, {
            value: varObj ,
            writable:false,
            enumerable: (notenumerable?false:true)
        });
	},
	DelegateBaseProperty: function (to, from, policy, ownerClass) {
		var policyCheck = _Class_Help.PolicyCheck[policy];
		for (var propertyName in from.prototype) {
			if (to.hasOwnProperty(propertyName))
				continue;

			_Class_Help._Help_Static_Create_Prototype_Delegate_Base(to, from, propertyName, policyCheck, ownerClass);
		}
	},
    DelegateBaseProperty_Instance: function (to, from, policy, ownerClass) {
        var policyCheck = _Class_Help.PolicyCheck[policy];
        for (var propertyName in from) {
            if (from.constructor.prototype.hasOwnProperty(propertyName) || to.hasOwnProperty(propertyName))
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
//    DelegateBaseStaticProperty_Instance: function (to, from, policy) {
//        var policyCheck = _Class_Help.PolicyCheck[policy];
//        for (var propertyName in from) {
//            if (to.hasOwnProperty(propertyName))
//                continue;
//            _Class_Help._Help_Static_Create_StaticProperty_Delegate_Instance(to, from, propertyName, policyCheck);
//        }
//    },
	GetSetting: function (Obj) {
		return Obj[this._SettingString];
	},
    GetSettingAlways: function (Obj) {
        if (!Obj.hasOwnProperty(this._SettingString))
            this.SetSettings(Obj,{});
        return Obj[this._SettingString];
    },
	SetSettings: function (Obj, settings, ignoreWhenExist) {
		if (!Obj.hasOwnProperty(this._SettingString)) {
            Object.defineProperty(Obj, this._SettingString, {value:settings});
		} else
			this._Help_CopyObjectProperty(Obj[this._SettingString], settings,ignoreWhenExist);

        return Obj;
	},
    SafeDefinedItem:function(policyItem,name){  //used on defined item only.
        var item = policyItem[name];

        if (item instanceof Function){
            this.SetSettings(item,{Type:this.Property.Type.Object.Function.Type},true);;
        }else{
            var ret = function(){};

            var type= this.Property.Type.Object.Var.Type;
            this.SetSettings(ret,{Value:item, Type:type});
            policyItem[name] = ret;
            return ret;
        }
        return item;
    }
};

_Class_Help.Property.Type = {
    IsInvaild:function(type){ return type===11 || type ===1;},
    IsVar:function(type){ return type& _Class_Help.Property.Type.Object.Var.Type == _Class_Help.Property.Type.Object.Var.Type },                //type & 5==5
    IsProperty:function(type){ return type&_Class_Help.Property.Type.Static.Var.Type === _Class_Help.Property.Type.Object.Property.Type},         //type&7 ===4
	Clone: _Class_Help.PropertyDefine.Clone,
    Virtual:{ Type: _Class_Help.PropertyDefine.Virtual.Type,
        Is: function (type) { return type === this.Type } } ,  //type ===2 , 3 not allow, and clone virtual is not allowed too.
	Object: {
        Is:function(type){ return  type & 3 !== 2}, //,  !_Class_Help.PropertyDefine.Static.Is(type)|| _Class_Help.Property.Type.Virtual.Is(type); },
		Function: { Type: _Class_Help.PropertyDefine.Function.Type, Is: function (type) { return (type& ~_Class_Help.PropertyDefine.Clone.Type) === this.Type } },
		Property: { Type: _Class_Help.PropertyDefine.Property.Type, Is: function (type) { return (type & ~_Class_Help.PropertyDefine.Clone.Type) === this.Type; } },
		Var: { Type: _Class_Help.PropertyDefine.Property.Type | _Class_Help.PropertyDefine.Var.Type,
            Is: function (type) { return (type & _Class_Help.Property.Type.Static.Var.Type) ===this.Type ; } }
	},
	Static: {
        Is:function(type){ return _Class_Help.PropertyDefine.Static.Is(type)&& !_Class_Help.Property.Type.Virtual.Is(type); },
		Function: { Type: _Class_Help.PropertyDefine.Static.Type, Is: function (type) { return (type& ~_Class_Help.PropertyDefine.Clone.Type)=== this.Type; } },
		Property: { Type: _Class_Help.PropertyDefine.Static.Type | _Class_Help.PropertyDefine.Property.Type,
            Is: function (type) { return  (type & ~_Class_Help.PropertyDefine.Clone.Type) === this.Type; } },
		Var: { Type: _Class_Help.PropertyDefine.Static.Type | _Class_Help.PropertyDefine.Property.Type | _Class_Help.PropertyDefine.Var.Type,
            Is: function (type) { return (type&this.Type) === this.Type;  } }
	},
    NoInherit:{
        NoInherit:true
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
function Class(defines){
    var obj_create_constructor;
    var staticAttribute;
    var ClassInnerVar;
    function obj_create(){
        var thisType=arguments.callee;
        var obj_create_thisObj=this;
        _Class_Help.CreateReadOnlyProperty(this,"+p_vars+",new ClassInnerVar(),true);

        //export baseClass AS property.
        var Settings =  _Class_Help.GetSetting(thisType);
        var StaticBases = Settings.Bases;

        var bases={};
        for(var name in StaticBases){
            var item =StaticBases[name];
            //policy and base object.
            base = bases[name] = _Class_Help._Help_CreateClass(item.Class) (item.Parameter);

            //export object by class name.
            Object.defineProperty(this,name,{
                get: _Class_Help._Help_Static_Class_Function_Sign_No_Inherit(
                    (function(base, checkPolicy){
                        return  function(){
                            checkPolicy(arguments.callee);
                            return base;
                        };
                    }) (base, _Class_Help.PolicyCheck[item.Policy] ) ,thisType,name,"cast from Object<"+Settings.Name+"> to <"+name+">")
                //,configurable:true
                ,enumerable:true
            });

            _Class_Help.DelegateBaseProperty_Instance(this,base,item.Policy,thisType);
        }

        ////////////////////////////////////////////
        this.AS = function(typeClass){
            var typeSetting = _Class_Help.GetSetting(typeClass);
            if(typeSetting.Name){
                if (bases.hasOwnProperty(typeSetting.Name))
                    return bases[typeSetting.Name];
            }
            else
            {
                for(var name in bases){
                    if ( bases[name].constructor === typeClass);
                        return bases[name];
                }
            }

            for(var name in bases){
                var o = bases[name].AS(typeClass);
                if (o) return o;
            }

            return null;
        }
        ///////////////////////////////////////
        //for virtual
        for(var virtualName in Settings.Virtuals){
            if (!Settings.Virtuals.hasOwnProperty(virtualName))
                continue;
            var virtualArray = Settings.Virtuals[virtualName];

            var fun;
            if (virtualArray.length === 0 ||   //top level of virtual
                !thisType.prototype.hasOwnProperty(virtualName)|| //means this class has never define it.
                thisType.prototype[virtualName].$IsDelegate  ||   //means inherit from base
                !(fun = virtualArray.Function)
                )
            {
                continue;
            }

            function depVirtual( currentObj, virtualArray){
                _Class_Help.SysAssert(   currentObj && virtualArray && virtualArray.Policy && fun ,"SYSTEM ERROR: currentObj MUST exist.");
                if (virtualArray.length ===0){
                    var checkPolicy = _Class_Help.PolicyCheck[virtualArray.Policy];
                    var currentSetting = _Class_Help.GetSetting(thisType);
                    var name="";
                    if (currentSetting)
                        name =  currentSetting.Name;
                    else
                        name = virtualArray.OwnerClass.name;

                    currentObj[virtualName] = _Class_Help._Help_Static_Class_Function_Sign_No_Inherit(function(){
                        checkPolicy(arguments.callee);
                        return fun.apply(obj_create_thisObj,arguments);
                    },thisType,virtualName,name+"::virtual "+virtualName);
                    //return;
                }

                for(var i=0;i< virtualArray.length;i++){
                    var classType =  virtualArray[i];
                    _Class_Help.SysAssert(classType instanceof Array,"SYSTEM ERROR: MUST BE A ARRAY.");

                    depVirtual(currentObj.AS(classType.OwnerClass), classType);
                }
            }

            for(var i=0;i< virtualArray.length;i++){
                var classType = virtualArray[i];
                if (classType instanceof Array){
                    depVirtual(this.AS(classType.OwnerClass), classType);
                }
            }
        }
        if (obj_create_constructor){
            var setting = _Class_Help.GetSetting(obj_create_constructor);
            _Class_Help.PolicyCheck[setting.Policy](arguments.callee);
            obj_create_constructor.apply(this,arguments);
        }
    }
    _Class_Help.SetSettings(obj_create,{Name:defines.Name});
    staticAttribute = _Class_Help.GetSetting(obj_create);

    var Bases =   _Class_Help._Help_Static_CreateBases(defines.Bases);

    //define this
    var _innerObject={};
    var _innerVars={};
    var _virtuals={}; //virtual function list.
    var policyArray = [defines.Public,defines.Protected,defines.Private];
    var maxLength = _Class_Help.PolicyCheck.length> policyArray.length?policyArray.length: _Class_Help.PolicyCheck.length;
    var hasConstructor = false;
    for(var i=0;i<maxLength;i++){
        var policyItem=policyArray[i];
        if (!policyItem)
            continue;
        for(var name in policyItem)
        {
            var item = _Class_Help.SafeDefinedItem(policyItem,name);
            var itemSetting = _Class_Help.GetSettingAlways(item);

            if (_Class_Help.Property.Type.Static.Is(itemSetting.Type) )
            {
                _Class_Help.SysAssert(!obj_create.hasOwnProperty(name), name+" has defined before.");
                _Class_Help._Help_Static_Create_Prototype_Delegate(obj_create,null,policyItem,name,i,obj_create);
                continue;
            }
            _Class_Help.SysAssert(!_innerObject.hasOwnProperty(name), name+" has defined before.");
            _Class_Help.SysAssert(!Bases.hasOwnProperty(name), name+" has defined as a BaseName.");

            itemSetting.Name =  name;
            itemSetting.OwnerClass = obj_create;
            if (i=== _Class_Help.Policy.Private)
                itemSetting.NoInherit = true;

            if (name === "constructor"){
                if(_Class_Help.PropertyDefine.Function.Is(itemSetting.Type) ) {
                    hasConstructor = true;
                    itemSetting.NoInherit = true;

                    itemSetting.Policy = i;
                    _innerObject.constructor = item;
                    continue;
                }else
                    _Class_Help.SysAssert(!_Class_Help.Property.Type.Virtual.Is(itemSetting.Type),"constructor not support virtual");
                console.log("what");
            }

            _Class_Help._Help_Static_Create_Prototype_Delegate(_innerObject,_innerVars,policyItem,name,i,obj_create);
            if (_Class_Help.Property.Type.Virtual.Is(itemSetting.Type)) {
                _virtuals[name]=[];
                _virtuals[name].OwnerClass = obj_create;
                _virtuals[name].Policy = i;
            }
        }
    }

    ///define inner var class.
    ClassInnerVar = (function(varsDef){
        function ret(){};
        ret.prototype = varsDef;
        ret.prototype.constructor = ret;
        return ret;
    })(_innerVars);

    /////////////////////////////////////////////////
    if (hasConstructor)
        obj_create_constructor =   _innerObject.constructor;

    //define bases
    for(var baseName in Bases){
        var baseCfg = Bases[baseName];
        var base = baseCfg.Class;
        var baseClassSetting = _Class_Help.GetSetting(base);
        if (baseClassSetting){
            for(var virtualName in baseClassSetting.Virtuals){   //[a,[b,[xxx]]]  //[[a,[xx]]]
                var current_virtual,fun;
                if (!_virtuals.hasOwnProperty(virtualName))
                    current_virtual = _virtuals[virtualName]=[];
                else{
                    current_virtual=   _virtuals[virtualName];
                }

                var _baseVirtualItem =  baseClassSetting.Virtuals[virtualName];
                current_virtual.push(_baseVirtualItem);
                current_virtual.OwnerClass=obj_create;
                current_virtual.Policy = (baseCfg.Policy > _baseVirtualItem.Policy)? baseCfg.Policy : _baseVirtualItem.Policy;
                if (_innerObject.hasOwnProperty(virtualName)){
                    current_virtual.Function = _Class_Help.SafeGetSetting(_innerObject[virtualName],"Value");
                }
            }
        }
        if (baseCfg.Hidden)
            continue;

        _Class_Help.DelegateBaseProperty(_innerObject,base,baseCfg.Policy,obj_create);

        _Class_Help.DelegateBaseStaticProperty(obj_create,base,baseCfg.Policy,obj_create);
    }
    obj_create.prototype =_innerObject;
    obj_create.prototype.constructor = obj_create;

    //////////////////////////////////////////////////////////////////////

    if (!defines.Friends) defines.Friends=[];


    _Class_Help.CreateReadOnlyProperty(staticAttribute,"Friends",{
        check:function( type ){
            for(var i =0;i<defines.Friends.length;i++){
                if (defines.Friends[i] === type)
                    return true;
            }
            return false;
        }
    });
    _Class_Help.CreateReadOnlyProperty(staticAttribute,"Bases",Bases);
    _Class_Help.CreateReadOnlyProperty(staticAttribute,"Virtuals",_virtuals);
    //_Class_Help.CreateReadOnlyProperty(staticAttribute, "$IsDelegate",true);   //for invoke userdefined constructor.
    _Class_Help.CreateReadOnlyProperty(staticAttribute, "$IsBase",function (callerClass){
        function isBase(callerClass){
            var callerClassSetting=_Class_Help.GetSetting(callerClass);
            if (!callerClassSetting || !callerClassSetting.Bases)
                return false;

            if(callerClassSetting.Bases.hasOwnProperty(staticAttribute.Name))   //not include one condition that class is not defined by Class.
            {
                if (callerClassSetting.Bases[staticAttribute.Name].Policy === _Class_Help.Policy.Private)
                    return false;
                else
                    return true;
            }
            for(var name in callerClassSetting.Bases){
                var base =callerClassSetting.Bases[name];
                if (base.Policy === _Class_Help.Policy.Private)
                    continue;

                if (isBase(base.Class))
                    return true;
            }
            return false;
        }
        return isBase(callerClass);
    });
    _Class_Help.CreateReadOnlyProperty(staticAttribute,"$IsVirtualFunctionFrom",function (fun,callerFun){
        do{
            var funSetting = _Class_Help.GetSetting(fun);
            if (!funSetting) break;
            var callerSetting = _Class_Help.GetSetting(callerFun);
            if (!callerSetting) break;

            var callerClass=callerSetting.OwnerClass;
            if (!callerClass) break;;
            var callerClassSetting = _Class_Help.GetSetting(callerClass);
            if (!callerClassSetting) break;;
            if (!callerClassSetting.Virtuals.hasOwnProperty(funSetting.Name))
                break;
            var funClass = funSetting.OwnerClass ;
            if (!funClass) break;
            return callerClassSetting.$IsBase(funClass) ||  (funClassSetting = _Class_Help.GetSetting(funSetting.OwnerClass)) &&  funClassSetting.$IsBase(callerClass)
        }while(0);
        return false;
    });

    var namespace = defines.Namespace? defines.Namespace :global;

    Object.defineProperty(namespace, staticAttribute.Name,{
        value: obj_create,
        writable:false,
        enumerable:true
    });
    return obj_create;
}

Class.Policy = _Class_Help.Policy;
Class.Property = _Class_Help.Property;
Class.GetSetting = _Class_Help.GetSetting;

exports.Class=Class;

