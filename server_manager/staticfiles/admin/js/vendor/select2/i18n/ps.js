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

!function(){if(jQuery&&jQuery.fn&&jQuery.fn.select2&&jQuery.fn.select2.amd)var n=jQuery.fn.select2.amd;n.define("select2/i18n/ps",[],function(){return{errorLoading:function(){return"پايلي نه سي ترلاسه کېدای"},inputTooLong:function(n){var e=n.input.length-n.maximum,r="د مهربانۍ لمخي "+e+" توری ړنګ کړئ";return 1!=e&&(r=r.replace("توری","توري")),r},inputTooShort:function(n){return"لږ تر لږه "+(n.minimum-n.input.length)+" يا ډېر توري وليکئ"},loadingMore:function(){return"نوري پايلي ترلاسه کيږي..."},maximumSelected:function(n){var e="تاسو يوازي "+n.maximum+" قلم په نښه کولای سی";return 1!=n.maximum&&(e=e.replace("قلم","قلمونه")),e},noResults:function(){return"پايلي و نه موندل سوې"},searching:function(){return"لټول کيږي..."},removeAllItems:function(){return"ټول توکي لرې کړئ"}}}),n.define,n.require}();