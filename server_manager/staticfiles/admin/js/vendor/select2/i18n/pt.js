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

!function(){if(jQuery&&jQuery.fn&&jQuery.fn.select2&&jQuery.fn.select2.amd)var e=jQuery.fn.select2.amd;e.define("select2/i18n/pt",[],function(){return{errorLoading:function(){return"Os resultados não puderam ser carregados."},inputTooLong:function(e){var r=e.input.length-e.maximum,n="Por favor apague "+r+" ";return n+=1!=r?"caracteres":"caractere"},inputTooShort:function(e){return"Introduza "+(e.minimum-e.input.length)+" ou mais caracteres"},loadingMore:function(){return"A carregar mais resultados…"},maximumSelected:function(e){var r="Apenas pode seleccionar "+e.maximum+" ";return r+=1!=e.maximum?"itens":"item"},noResults:function(){return"Sem resultados"},searching:function(){return"A procurar…"},removeAllItems:function(){return"Remover todos os itens"}}}),e.define,e.require}();