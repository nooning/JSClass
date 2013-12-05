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

var ClassObj = require('../common/class.node.js');
var Class = ClassObj.Class;
var Property = ClassObj.Class.Property;

//Change normal policy
Class.Policy.Default = Class.Policy.Public;

//Define a Namespace ABC, and define two Class by normal way
var ABC={
    Class2:function(parameter){
        this.testClass2=function(){
            console.log("class2");
        }
    },
    Class3:function(parameter){
        this.testClass3=function(){
            console.log("class3");
        }
    }
};

Class({
        Namespace:ABC,
        Name:"ClassTop",
        /* Base define, You should using one of them or none. default policy is public, inherit all methods & property except private members*/
        Bases:[ABC.Class2,ABC.Class3],//no parameter,default policy, inherit all methods& property.
//        Bases:[ [ABC.Class2,[],Class.Policy.Private,true], [ABC.Class3,[],Class.Policy.Public]],
//        Bases:{"Class2":{Namespace:ABC,Parameter:null,Policy:Class.Policy.Private,Hidden:false },"Class3":{Namespace:ABC,Parameter:[1],Policy:Class.Policy.Public} },

        Private:{
            m_var:1,
            _instance:Property(null,[Property.Type.Static.Var,Property.Type.Clone])
        },
        Protected:{
            constructor:function(v){
                this.m_var=v;
            }
        },
        Public:{
            Test:function(){
                this.m_var++;
                //this.Class2.testClass2();
                this.AS(ABC.Class2).testClass2();
                this.testClass2();
                return this.m_var;
            },

            Instance:Property({
                get:function(){
                    if(this._instance)
                        return this._instance;
                    this._instance = new this(5);
                    return this._instance;
                }
            },[Property.Type.Static.Property,Property.Type.Clone])
        }
    }
);

Class({
    Namespace:ABC,
    Name:"ClassL2",
    Bases:[ABC.ClassTop],
    Private:{
        m_var:2
    },
    Protected:{
        proval:2,
        fight:Property(function(){
            this.m_var--;
            console.log("ClassL2::fight (m_var)" +this.m_var);
        },[Property.Type.Virtual])
    },
    Public:{
        Fight:function(){
            console.log("ClassL2::Fight (m_var)"+this.m_var);
            this.fight();
        }
    }
});
Class({
    Namespace:ABC,
    Name:"ClassL3",
    Bases:{"ClassL2":{Namespace:ABC,Policy:Class.Policy.Public}},
    Private:{
        Leg:2
    },
    Protected:{
        TestProtected:0,
        fight:function(){
            console.log("ClassL3::fight "+this.constructor["."].Name);
            this.Leg--;
        }
    }
});

Class({
        Namespace:ABC,
        Name:"ClassL4",
        Bases:[ABC.ClassL3],
        Private:{
            fight:function(){
                console.log("ClassL4::fight " +this.constructor["."].Name);
            }
        },
        Public:{
            GetTestProtected:function(){
                return this.TestProtected;
            }
        }
    }
);

Class({
        Namespace:ABC,
        Name:"ClassL5",
        Bases:[ABC.ClassL4],
        Private:{
            m_var:1,
            constructor:function(v){
                this.m_var=v;
            }
        },
        Public:{
            GetTestProtected:function(){
                this.m_var++;
                return this.TestProtected;
            },
            Create:Property(function(v){
                return new ABC.ClassL5(5);
            },[Property.Type.Static.Function])
        }
    }
);

ABC.ClassTop.Instance.Test();
ABC.ClassTop.Instance.testClass3();
ABC.ClassTop.Instance.AS(ABC.Class2).testClass2();


ABC.ClassL2.Instance.Fight();
ABC.ClassL3.Instance.Fight();
ABC.ClassL4.Instance.Fight();
ABC.ClassL5.Instance.GetTestProtected();



ABC.ClassL5.Create(5);
//var a = new ABC.ClassL5(5);   //constructor is private.
var p = new ABC.ClassL4();
p = ABC.ClassL5.Instance;
p.GetTestProtected();
//p.TestProtected=0; //can't visit protected member.

