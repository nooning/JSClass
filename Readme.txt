 JSClass is a modular Javascript class for v8, spider monkey,chakra, tested on Chrome/FireFox/IE/node.js, support most of c++ class behavior

 library has a Singleton base class, it make inheritted class support Singleton, just add it into your base class using Class.
 like:
 Class({
    Name:"Test",
    Bases:{CSingleton:{Namespace:Class}},
    Public:{test:function(){}}
 })

 Test.Instance.test();
  Class({
    Name:"Test1",
    Bases:[Test],
    Public:{test1:function(){
		this.test();
		this.Test.test();
		this.$AS(Test).test();
		this.$Super.test();
		this.$Root.test();
	}}
 })

 * C++ Class emulation. Ver 0.004.1
 * Feature:
 *      1.Multiple Inheritance (always like virtual inherit. there's no virtual table.)
 *      2.Virtual Function
 *      3.Property
 *      4.Static Function and Variable and Property
 *      5.Policy : Public ,Protected,Private(defalut)
 *      6.Clone, Clone to child class, Clone function as an function for child class.(only static)
 *      7.Friend, currently you must define them before write in Friends.
 *      8.Override, rewrite base class, like write virtual keyword in base class, using for function-class which not defined by Class.(new Add.)
 
 API:	Instance Support
			var x=new Class(...);
			x.$AS		Convert to parent instance.
			x.$Super	Get Child of this.
			x.$Root		Get most dep-level child.
 		Class Support
			Class(...)		//define the Class
			Class.Policy	//the policy of parent class.
			Class.Arguments	//base class reference the constructor parameters.
			Class.Property	//demand how to define the member.
			Class.GetName	//Get class name by class or instance which defined by Class
			Class.GetMember	//it's help to get the member of object. like (Class.GetMember(document,"all.innerHTML"));
Usage:
	Class.Policy.Default = Class.Policy.Public	//set default policy, private by default.
	Class({
	Namespace: ,
	Name:"",
	Friends:[],
	Bases:	one of following:
			[ClassX]
			[[ClassX,["",Class.Arguments(0),1],Class.Policy.Private],[...]] //1 class opt:[, 2 Arguments, 3 Policy]
			{ClassX:{Namespace:"",Policy:{},Parameters:Class.Arguments.ALL}} 
			
	Private:{
		constructor:function(){} // any policy or constructor.
	},
	Protected:{
		static:Property(function(){},[Property.Type.Static.Function ]) // or Static.Var;
		staticClone:Property(function(){},[Property.Type.Static.Function,Property.Type.Clone ]) //or Static.Var
		property:Property({get:function(){},set:function(){}},[Property.Type.Object.Property])	//or Static
		virtualFun:Property(function(){},[Property.Type.Virtual]) //virtual
		overrideFun:Property(function(){},{Property.Type.Override}) //override
	},
	Public:{
		
	}

	});