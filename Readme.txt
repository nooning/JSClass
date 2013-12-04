 * C++ Class emulation. Ver(public) 0.003
 * Feature:
 *      1.Multiple Inheritance (always like virtual inherit. there's no virtual table.)
 *      2.Virtual Function
 *      3.Property
 *      4.Static Function&Var&Property
 *      5.Policy (Public ,Protected,Private)
 *      6.Clone (new feature)
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
 *      2. Default Policy is Public(C++ is Private). Change Policy.Default Value to Private will same as C++
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
 *          email: 700142@qq.com