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

!function(){if(jQuery&&jQuery.fn&&jQuery.fn.select2&&jQuery.fn.select2.amd)var e=jQuery.fn.select2.amd;e.define("select2/i18n/ca",[],function(){return{errorLoading:function(){return"La càrrega ha fallat"},inputTooLong:function(e){var n=e.input.length-e.maximum,r="Si us plau, elimina "+n+" car";return r+=1==n?"àcter":"àcters"},inputTooShort:function(e){var n=e.minimum-e.input.length,r="Si us plau, introdueix "+n+" car";return r+=1==n?"àcter":"àcters"},loadingMore:function(){return"Carregant més resultats…"},maximumSelected:function(e){var n="Només es pot seleccionar "+e.maximum+" element";return 1!=e.maximum&&(n+="s"),n},noResults:function(){return"No s'han trobat resultats"},searching:function(){return"Cercant…"},removeAllItems:function(){return"Treu tots els elements"}}}),e.define,e.require}();