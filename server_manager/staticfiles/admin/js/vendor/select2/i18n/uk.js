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

!function(){if(jQuery&&jQuery.fn&&jQuery.fn.select2&&jQuery.fn.select2.amd)var n=jQuery.fn.select2.amd;n.define("select2/i18n/uk",[],function(){function n(n,e,u,r){return n%100>10&&n%100<15?r:n%10==1?e:n%10>1&&n%10<5?u:r}return{errorLoading:function(){return"Неможливо завантажити результати"},inputTooLong:function(e){return"Будь ласка, видаліть "+(e.input.length-e.maximum)+" "+n(e.maximum,"літеру","літери","літер")},inputTooShort:function(n){return"Будь ласка, введіть "+(n.minimum-n.input.length)+" або більше літер"},loadingMore:function(){return"Завантаження інших результатів…"},maximumSelected:function(e){return"Ви можете вибрати лише "+e.maximum+" "+n(e.maximum,"пункт","пункти","пунктів")},noResults:function(){return"Нічого не знайдено"},searching:function(){return"Пошук…"},removeAllItems:function(){return"Видалити всі елементи"}}}),n.define,n.require}();