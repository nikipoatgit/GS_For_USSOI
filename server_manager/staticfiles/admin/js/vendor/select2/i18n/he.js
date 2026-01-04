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

!function(){if(jQuery&&jQuery.fn&&jQuery.fn.select2&&jQuery.fn.select2.amd)var n=jQuery.fn.select2.amd;n.define("select2/i18n/he",[],function(){return{errorLoading:function(){return"שגיאה בטעינת התוצאות"},inputTooLong:function(n){var e=n.input.length-n.maximum,r="נא למחוק ";return r+=1===e?"תו אחד":e+" תווים"},inputTooShort:function(n){var e=n.minimum-n.input.length,r="נא להכניס ";return r+=1===e?"תו אחד":e+" תווים",r+=" או יותר"},loadingMore:function(){return"טוען תוצאות נוספות…"},maximumSelected:function(n){var e="באפשרותך לבחור עד ";return 1===n.maximum?e+="פריט אחד":e+=n.maximum+" פריטים",e},noResults:function(){return"לא נמצאו תוצאות"},searching:function(){return"מחפש…"},removeAllItems:function(){return"הסר את כל הפריטים"}}}),n.define,n.require}();