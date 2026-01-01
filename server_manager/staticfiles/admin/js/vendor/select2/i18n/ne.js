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

!function(){if(jQuery&&jQuery.fn&&jQuery.fn.select2&&jQuery.fn.select2.amd)var n=jQuery.fn.select2.amd;n.define("select2/i18n/ne",[],function(){return{errorLoading:function(){return"नतिजाहरु देखाउन सकिएन।"},inputTooLong:function(n){var e=n.input.length-n.maximum,u="कृपया "+e+" अक्षर मेटाउनुहोस्।";return 1!=e&&(u+="कृपया "+e+" अक्षरहरु मेटाउनुहोस्।"),u},inputTooShort:function(n){return"कृपया बाँकी रहेका "+(n.minimum-n.input.length)+" वा अरु धेरै अक्षरहरु भर्नुहोस्।"},loadingMore:function(){return"अरु नतिजाहरु भरिँदैछन् …"},maximumSelected:function(n){var e="तँपाई "+n.maximum+" वस्तु मात्र छान्न पाउँनुहुन्छ।";return 1!=n.maximum&&(e="तँपाई "+n.maximum+" वस्तुहरु मात्र छान्न पाउँनुहुन्छ।"),e},noResults:function(){return"कुनै पनि नतिजा भेटिएन।"},searching:function(){return"खोजि हुँदैछ…"}}}),n.define,n.require}();