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

!function(){if(jQuery&&jQuery.fn&&jQuery.fn.select2&&jQuery.fn.select2.amd)var e=jQuery.fn.select2.amd;e.define("select2/i18n/nl",[],function(){return{errorLoading:function(){return"De resultaten konden niet worden geladen."},inputTooLong:function(e){return"Gelieve "+(e.input.length-e.maximum)+" karakters te verwijderen"},inputTooShort:function(e){return"Gelieve "+(e.minimum-e.input.length)+" of meer karakters in te voeren"},loadingMore:function(){return"Meer resultaten laden…"},maximumSelected:function(e){var n=1==e.maximum?"kan":"kunnen",r="Er "+n+" maar "+e.maximum+" item";return 1!=e.maximum&&(r+="s"),r+=" worden geselecteerd"},noResults:function(){return"Geen resultaten gevonden…"},searching:function(){return"Zoeken…"},removeAllItems:function(){return"Verwijder alle items"}}}),e.define,e.require}();