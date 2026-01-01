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

!function(){if(jQuery&&jQuery.fn&&jQuery.fn.select2&&jQuery.fn.select2.amd)var n=jQuery.fn.select2.amd;n.define("select2/i18n/mk",[],function(){return{inputTooLong:function(n){var e=(n.input.length,n.maximum,"Ве молиме внесете "+n.maximum+" помалку карактер");return 1!==n.maximum&&(e+="и"),e},inputTooShort:function(n){var e=(n.minimum,n.input.length,"Ве молиме внесете уште "+n.maximum+" карактер");return 1!==n.maximum&&(e+="и"),e},loadingMore:function(){return"Вчитување резултати…"},maximumSelected:function(n){var e="Можете да изберете само "+n.maximum+" ставк";return 1===n.maximum?e+="а":e+="и",e},noResults:function(){return"Нема пронајдено совпаѓања"},searching:function(){return"Пребарување…"},removeAllItems:function(){return"Отстрани ги сите предмети"}}}),n.define,n.require}();