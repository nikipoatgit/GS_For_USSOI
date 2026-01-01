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

!function(){if(jQuery&&jQuery.fn&&jQuery.fn.select2&&jQuery.fn.select2.amd)var e=jQuery.fn.select2.amd;e.define("select2/i18n/et",[],function(){return{inputTooLong:function(e){var n=e.input.length-e.maximum,t="Sisesta "+n+" täht";return 1!=n&&(t+="e"),t+=" vähem"},inputTooShort:function(e){var n=e.minimum-e.input.length,t="Sisesta "+n+" täht";return 1!=n&&(t+="e"),t+=" rohkem"},loadingMore:function(){return"Laen tulemusi…"},maximumSelected:function(e){var n="Saad vaid "+e.maximum+" tulemus";return 1==e.maximum?n+="e":n+="t",n+=" valida"},noResults:function(){return"Tulemused puuduvad"},searching:function(){return"Otsin…"},removeAllItems:function(){return"Eemalda kõik esemed"}}}),e.define,e.require}();