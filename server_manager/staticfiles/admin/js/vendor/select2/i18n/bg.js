// Copyright (C) 2026 Nikhil
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
// See the GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

/*! Select2 4.0.13 | https://github.com/select2/select2/blob/master/LICENSE.md */

!function(){if(jQuery&&jQuery.fn&&jQuery.fn.select2&&jQuery.fn.select2.amd)var n=jQuery.fn.select2.amd;n.define("select2/i18n/bg",[],function(){return{inputTooLong:function(n){var e=n.input.length-n.maximum,u="Моля въведете с "+e+" по-малко символ";return e>1&&(u+="a"),u},inputTooShort:function(n){var e=n.minimum-n.input.length,u="Моля въведете още "+e+" символ";return e>1&&(u+="a"),u},loadingMore:function(){return"Зареждат се още…"},maximumSelected:function(n){var e="Можете да направите до "+n.maximum+" ";return n.maximum>1?e+="избора":e+="избор",e},noResults:function(){return"Няма намерени съвпадения"},searching:function(){return"Търсене…"},removeAllItems:function(){return"Премахнете всички елементи"}}}),n.define,n.require}();