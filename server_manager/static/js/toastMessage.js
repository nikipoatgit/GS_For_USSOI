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

// --------------------------------------------------------------------------------------------------------------------------
//Toast message 
function showToast(message, duration = 2000) {
    console.log(message);
    const toast = document.createElement('div');
    toast.classList.add(
        'fixed',
        'bottom-5',
        'left-1/2',
        '-translate-x-1/2',
        'bg-grey-500',
        'text-white',
        'px-6',
        'py-3',
        'rounded-lg',
        'shadow-xl',
        'opacity-0',
        'translate-y-4',
        'transition-all',
        'duration-300',
        'ease-in-out'
    );

    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.remove('opacity-0', 'translate-y-4');
        toast.classList.add('opacity-100', 'translate-y-0');
    }, 10);
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-4');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, duration);
}
