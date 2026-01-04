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

!function(){if(jQuery&&jQuery.fn&&jQuery.fn.select2&&jQuery.fn.select2.amd)var n=jQuery.fn.select2.amd;n.define("select2/i18n/is",[],function(){return{inputTooLong:function(n){var t=n.input.length-n.maximum,e="Vinsamlegast styttið texta um "+t+" staf";return t<=1?e:e+"i"},inputTooShort:function(n){var t=n.minimum-n.input.length,e="Vinsamlegast skrifið "+t+" staf";return t>1&&(e+="i"),e+=" í viðbót"},loadingMore:function(){return"Sæki fleiri niðurstöður…"},maximumSelected:function(n){return"Þú getur aðeins valið "+n.maximum+" atriði"},noResults:function(){return"Ekkert fannst"},searching:function(){return"Leita…"},removeAllItems:function(){return"Fjarlægðu öll atriði"}}}),n.define,n.require}();