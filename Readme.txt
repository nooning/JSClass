 JSClass is a modular Javascript class for v8, spider monkey,chakra, tested on Chrome/FireFox/IE, support most of c++ class behavior

 library has a Singleton BaseClass, let you're class support Singleton, just add it into your base class using Class.
 like:
 Class({
    Name:"Test",
    Bases:{Singleton:{Namespace:Class}},
    Public:{test:function(){}}
 })
 Test.Instance.test();

 * C++ Class emulation. Ver(public) 0.003.1
 * Feature:
 *      1.Multiple Inheritance (always like virtual inherit. there's no virtual table.)
 *      2.Virtual Function
 *      3.Property
 *      4.Static Function and Variable and Property
 *      5.Policy : Public ,Protected,Private(defalut)
 *      6.Clone (new feature)
 *      7.Friend, currently you must define them frist.
 *
 * Different with C++:
 *      1.inherit/virtual inherit.
 *          when:
 *              virtual Base1::A , virtual Base2::A    , Base1::A !=  Base2::A  *
 *              class C: Base1,Base2{}
 *                  ok C::A == Base1::A   C::A != Base2::A
 *              class C: Base1,Base2{ A(){}}
 *                  ok, Base1::A == Base2::A == C::A
 *              "==" means has same function, but not same object in javascript.
 *      2. You may change Policy. Default Value to Public or Protected, currently is Private.
 *
 * Not Support:
 *       1.template
 *
 * Explanation:
 *      1.base classes has same named method or property,always using first which class in Bases.
 *
 * Todo:
 *      1. Release Mode (No Check, fast mode.)
 *      2. static_cast()() & dynamic_cast()()
 *      3. template
 *
 *      Creator: wayde
 *       email: waydeGit@qq.com
 *          QQ Group: 154694913