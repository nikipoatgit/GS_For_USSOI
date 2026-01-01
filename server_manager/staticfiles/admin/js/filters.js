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

/**
 * Persist changelist filters state (collapsed/expanded).
 */
'use strict';
{
    // Init filters.
    let filters = JSON.parse(sessionStorage.getItem('django.admin.filtersState'));

    if (!filters) {
        filters = {};
    }

    Object.entries(filters).forEach(([key, value]) => {
        const detailElement = document.querySelector(`[data-filter-title='${CSS.escape(key)}']`);

        // Check if the filter is present, it could be from other view.
        if (detailElement) {
            value ? detailElement.setAttribute('open', '') : detailElement.removeAttribute('open');
        }
    });

    // Save filter state when clicks.
    const details = document.querySelectorAll('details');
    details.forEach(detail => {
        detail.addEventListener('toggle', event => {
            filters[`${event.target.dataset.filterTitle}`] = detail.open;
            sessionStorage.setItem('django.admin.filtersState', JSON.stringify(filters));
        });
    });
}
