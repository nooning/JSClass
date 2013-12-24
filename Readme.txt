 JSClass is a modular Javascript class for v8, spider monkey,chakra, tested on Chrome/FireFox/IE/node.js, support most of c++ class behavior

 library has a Singleton base class, it make inheritted class support Singleton, just add it into your base class using Class.
 like:
 Class({
    Name:"Test",
    Bases:{CSingleton:{Namespace:Class}},
    Public:{test:function(){}}
 })

 Test.Instance.test();

 * C++ Class emulation. Ver 0.003.2
 * Feature:
 *      1.Multiple Inheritance (always like virtual inherit. there's no virtual table.)
 *      2.Virtual Function
 *      3.Property
 *      4.Static Function and Variable and Property
 *      5.Policy : Public ,Protected,Private(defalut)
 *      6.Clone, Clone to child class, Clone function as an function for child class.(only static)
 *      7.Friend, currently you must define them before write in Friends.
 *      8.Override, rewrite base class, like write virtual keyword in base class, using for function-class which not defined by Class.(new Add.)
