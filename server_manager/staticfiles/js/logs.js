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

// addLogEntry(randomLog.type, randomLog.msg, new Date().toLocaleTimeString() + ` - ${randomLog.detail}`); example use case 

const logContainer = document.getElementById('log-container');
const MAX_LOG_ENTRIES = 30;
/**
 * @param {string} type - The type of log ('success', 'error', 'info', 'warn').
 * @param {string} message - The main log message (e.g., "Client Connected").
 * @param {string} details - The secondary details (e.g., a timestamp or error code).
 */
function addLogEntry(type, message, details) {

    const logStyles = {
        success: { icon: 'fa-check-circle', color: 'green-400' },
        error: { icon: 'fa-exclamation-triangle', color: 'red-500' },
        info: { icon: 'fa-info-circle', color: 'blue-400' },
        warn: { icon: 'fa-shield-alt', color: 'yellow-400' }
    };

    const style = logStyles[type] || logStyles.info;

    const logElement = document.createElement('div');
    logElement.className = `bg-gray-800/[10%] rounded-md p-3 flex items-start space-x-3`
    logElement.innerHTML = `
            <div class="flex-shrink-0 pt-0.5">
                <i class="fas ${style.icon} text-${style.color}"></i>
            </div>
            <div>
                <p class="font-semibold text-sm text-gray-200">${message}</p>
                <p class="text-xs text-gray-400 font-mono">${details}</p>
            </div>
        `;

    logContainer.prepend(logElement);

    if (logContainer.children.length > MAX_LOG_ENTRIES) {
        logContainer.lastChild.remove();
    }
}

//-------------------------------------------------------------------------------------------------------------------------------------------------------

// log mininise and maximise code 

const sidebar = document.getElementById('log-sidebar');
const toggleButton = document.getElementById('toggle-sidebar-btn');
const sidebarContent = document.getElementById('sidebar-content');
const minimizeIcon = document.getElementById('collapse-icon');
const maximizeIcon = document.getElementById('expand-icon');
const mainContent = document.getElementById('main-content');

toggleButton.addEventListener('click', () => {
    const isMinimized = sidebar.classList.contains('xl:w-16');

    if (isMinimized) {
        sidebar.classList.remove('xl:w-16', 'px-2');
        sidebar.classList.add('xl:w-1/4', 'px-3', 'md:px-4', 'lg:px-6');
        mainContent.classList.remove('xl:w-[calc(100%-4rem)]');
        mainContent.classList.add('xl:w-3/4');
        sidebarContent.classList.remove('hidden');
        minimizeIcon.classList.remove('hidden');
        maximizeIcon.classList.add('hidden');

    } else {
        sidebar.classList.remove('xl:w-1/4', 'px-3', 'md:px-4', 'lg:px-6');
        sidebar.classList.add('xl:w-16', 'px-2');
        mainContent.classList.remove('xl:w-3/4');
        mainContent.classList.add('xl:w-[calc(100%-4rem)]');

        sidebarContent.classList.add('hidden');
        minimizeIcon.classList.add('hidden');
        maximizeIcon.classList.remove('hidden');
    }
});
