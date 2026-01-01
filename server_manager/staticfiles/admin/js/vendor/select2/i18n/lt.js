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

!function(){if(jQuery&&jQuery.fn&&jQuery.fn.select2&&jQuery.fn.select2.amd)var n=jQuery.fn.select2.amd;n.define("select2/i18n/lt",[],function(){function n(n,e,i,t){return n%10==1&&(n%100<11||n%100>19)?e:n%10>=2&&n%10<=9&&(n%100<11||n%100>19)?i:t}return{inputTooLong:function(e){var i=e.input.length-e.maximum,t="Pašalinkite "+i+" simbol";return t+=n(i,"į","ius","ių")},inputTooShort:function(e){var i=e.minimum-e.input.length,t="Įrašykite dar "+i+" simbol";return t+=n(i,"į","ius","ių")},loadingMore:function(){return"Kraunama daugiau rezultatų…"},maximumSelected:function(e){var i="Jūs galite pasirinkti tik "+e.maximum+" element";return i+=n(e.maximum,"ą","us","ų")},noResults:function(){return"Atitikmenų nerasta"},searching:function(){return"Ieškoma…"},removeAllItems:function(){return"Pašalinti visus elementus"}}}),n.define,n.require}();