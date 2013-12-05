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
				this._instance = new this(5);
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
			return new F(arguments);
		}, [Property.Type.Static.Function, Property.Type.Clone])
	}
});