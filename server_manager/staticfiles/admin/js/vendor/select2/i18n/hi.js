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

!function(){if(jQuery&&jQuery.fn&&jQuery.fn.select2&&jQuery.fn.select2.amd)var n=jQuery.fn.select2.amd;n.define("select2/i18n/hi",[],function(){return{errorLoading:function(){return"परिणामों को लोड नहीं किया जा सका।"},inputTooLong:function(n){var e=n.input.length-n.maximum,r=e+" अक्षर को हटा दें";return e>1&&(r=e+" अक्षरों को हटा दें "),r},inputTooShort:function(n){return"कृपया "+(n.minimum-n.input.length)+" या अधिक अक्षर दर्ज करें"},loadingMore:function(){return"अधिक परिणाम लोड हो रहे है..."},maximumSelected:function(n){return"आप केवल "+n.maximum+" आइटम का चयन कर सकते हैं"},noResults:function(){return"कोई परिणाम नहीं मिला"},searching:function(){return"खोज रहा है..."},removeAllItems:function(){return"सभी वस्तुओं को हटा दें"}}}),n.define,n.require}();