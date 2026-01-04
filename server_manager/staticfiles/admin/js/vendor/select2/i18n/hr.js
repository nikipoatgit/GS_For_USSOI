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

!function(){if(jQuery&&jQuery.fn&&jQuery.fn.select2&&jQuery.fn.select2.amd)var n=jQuery.fn.select2.amd;n.define("select2/i18n/hr",[],function(){function n(n){var e=" "+n+" znak";return n%10<5&&n%10>0&&(n%100<5||n%100>19)?n%10>1&&(e+="a"):e+="ova",e}return{errorLoading:function(){return"Preuzimanje nije uspjelo."},inputTooLong:function(e){return"Unesite "+n(e.input.length-e.maximum)},inputTooShort:function(e){return"Unesite još "+n(e.minimum-e.input.length)},loadingMore:function(){return"Učitavanje rezultata…"},maximumSelected:function(n){return"Maksimalan broj odabranih stavki je "+n.maximum},noResults:function(){return"Nema rezultata"},searching:function(){return"Pretraga…"},removeAllItems:function(){return"Ukloni sve stavke"}}}),n.define,n.require}();