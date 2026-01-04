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

!function(){if(jQuery&&jQuery.fn&&jQuery.fn.select2&&jQuery.fn.select2.amd)var n=jQuery.fn.select2.amd;n.define("select2/i18n/bn",[],function(){return{errorLoading:function(){return"ফলাফলগুলি লোড করা যায়নি।"},inputTooLong:function(n){var e=n.input.length-n.maximum,u="অনুগ্রহ করে "+e+" টি অক্ষর মুছে দিন।";return 1!=e&&(u="অনুগ্রহ করে "+e+" টি অক্ষর মুছে দিন।"),u},inputTooShort:function(n){return n.minimum-n.input.length+" টি অক্ষর অথবা অধিক অক্ষর লিখুন।"},loadingMore:function(){return"আরো ফলাফল লোড হচ্ছে ..."},maximumSelected:function(n){var e=n.maximum+" টি আইটেম নির্বাচন করতে পারবেন।";return 1!=n.maximum&&(e=n.maximum+" টি আইটেম নির্বাচন করতে পারবেন।"),e},noResults:function(){return"কোন ফলাফল পাওয়া যায়নি।"},searching:function(){return"অনুসন্ধান করা হচ্ছে ..."}}}),n.define,n.require}();