const overlay = document.getElementById('about-overlay');
const aboutBtn = document.getElementById('open-about-btn');
const container = document.getElementById('device-info-container');
const headerTitle = document.getElementById('header-device-name');
let isOverlayOpen = false;

/* ---------- HELPERS ---------- */

function createCard(title, iconClass, contentHtml) {
    return `
        <div class="bg-gray-800/20 border border-gray-700/40 rounded-xl p-5">
            <div class="flex items-center gap-3 mb-4 border-b border-gray-700/50 pb-2">
                <i class="${iconClass} text-gray-400"></i>
                <h3 class="font-semibold text-gray-200">${title}</h3>
            </div>
            <div class="space-y-2 text-sm">${contentHtml}</div>
        </div>
    `;
}

function createRow(label, value) {
    return `
        <div class="flex justify-between py-1 border-b border-gray-700/20 last:border-0">
            <span class="text-gray-500">${label}</span>
            <span class="text-gray-300 font-mono text-right ml-4 break-all">${value}</span>
        </div>
    `;
}

/* ---------- RENDER ---------- */

function renderInfo() {
    if (DeviceInfo === null) return;

    const info = DeviceInfo;
    let html = '';

    /* HEADER */
    headerTitle.innerText =
        `${info.Device.Brand} ${info.Device.Model} (${info.Device.DeviceName})`;

    /* DEVICE */
    html += createCard(
        'Device Identity',
        'fas fa-mobile-alt',
        Object.entries(info.Device)
            .map(([k, v]) => createRow(k, v))
            .join('')
    );

    /* DASHBOARD */
    const ram = info.Dashboard.RAM;
    const storage = info.Dashboard.InternalStorage;

    html += createCard(
        'System Resources',
        'fas fa-chart-pie',
        `
        ${createRow('RAM Total', ram.Total)}
        ${createRow('RAM Used', ram.Used)}
        <div class="w-full bg-gray-700 h-1.5 rounded">
            <div class="bg-blue-500 h-1.5 rounded" style="width:${ram.Usage}"></div>
        </div>

        <div class="mt-4"></div>

        ${createRow('Storage Total', storage.Total)}
        ${createRow('Storage Free', storage.Free)}
        <div class="w-full bg-gray-700 h-1.5 rounded">
            <div class="bg-purple-500 h-1.5 rounded" style="width:${storage.Usage}"></div>
        </div>

        <div class="mt-4"></div>

        ${Object.entries(info.Dashboard.Display)
            .map(([k, v]) => createRow(k, v))
            .join('')}
        `
    );

    /* CPU */
    const cpu = info.CPU;

    let coreHtml = '';
    if (Array.isArray(cpu.CoreStatus)) {
        coreHtml = `
            <div class="mt-3 grid grid-cols-2 gap-2">
                ${cpu.CoreStatus.map(c => `
                    <div class="bg-black/30 p-2 rounded text-xs text-center border border-gray-700/30">
                        <div class="text-gray-500">Core ${c.Core}</div>
                        <div class="text-green-400 font-mono font-bold">
                            ${c.CurrentFreq}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    html += createCard(
        'CPU',
        'fas fa-microchip',
        `
        ${createRow('Processor', cpu.Processor)}
        ${createRow('Architecture', cpu.Architecture)}
        ${createRow('Cores', cpu.Cores)}
        ${createRow('Type', cpu.CPUType)}
        ${cpu.FrequencyRange ? createRow('Frequency', cpu.FrequencyRange) : ''}
        ${coreHtml}
        `
    );

    /* NETWORK */
    if (info.Network) {
        html += createCard(
            'Network',
            'fas fa-wifi',
            renderDynamicRows(info.Network)
        );
    }

    if (info.Mislenious && info.Mislenious.LTE) {
    const lteHtml = constructLteContent(info.Mislenious.LTE);

    html += createCard(
        'Cellular (LTE)',          // Title
        'fas fa-broadcast-tower',  // Icon
        lteHtml                    // Content
    );

}

    function formatKey(key) {
        return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, c => c.toUpperCase());
    }

    function mapNetworkType(type) {
        const map = {
            13: 'LTE (4G)',
            20: 'NR (5G)',
            3: 'UMTS (3G)',
            1: 'GPRS (2G)'
        };
        return map[type] || `Unknown (${type})`;
    }

    function normalizeValue(key, value) {
        if (Array.isArray(value)) return value.join(', ');
        if (typeof value === 'object') return JSON.stringify(value);
        if (key === 'NetworkType') return mapNetworkType(value);
        return String(value);
    }

    function renderDynamicRows(obj) {
        return Object.entries(obj)
            .filter(([_, v]) => v !== null && v !== undefined && v !== '')
            .map(([k, v]) =>
                createRow(formatKey(k), normalizeValue(k, v))
            )
            .join('');
    }



    container.innerHTML = html;
}

/* ---------- TOGGLE ---------- */

aboutBtn.addEventListener('click', e => {
    e.preventDefault();
    generatePayloadAdmin({ type: 'deviceInfo' });

    isOverlayOpen = !isOverlayOpen;

    if (isOverlayOpen) {
        renderInfo();
        overlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    } else {
        overlay.classList.add('hidden');
        document.body.style.overflow = '';
    }
});


function constructLteContent(lteData) {
    if (!lteData || !lteData.ServingCell) return '<div class="text-gray-500 italic">No LTE Data Available</div>';

    const s = lteData.ServingCell;
    const neighbors = lteData.NeighborCells || [];

    // --- HELPER: Signal Quality Color (kept for utility, but only applied to the number) ---
    const getSignalColor = (rsrp) => {
        if (rsrp > -85) return 'text-green-400';
        if (rsrp > -105) return 'text-yellow-400';
        return 'text-red-400';
    };

    // --- HELPER: Format Distance ---
    let distDisplay = '<span class="text-gray-500">N/A</span>';
    if (s.TimingAdvance && s.TimingAdvance.Value !== 2147483647 && s.TimingAdvance.ApproxDistanceMeters > 0) {
        distDisplay = `<span class="text-gray-200 font-mono">${s.TimingAdvance.ApproxDistanceMeters}m</span>`;
    }

    let html = `<div class="space-y-4">`;

    // ===========================
    // 1. SERVING CELL (Clean & Neutral)
    // ===========================
    html += `
    <div class="bg-gray-800/20 rounded-lg p-3 border border-gray-700/50">
        
        <div class="flex justify-between items-center mb-4 pb-2 border-b border-gray-700/50">
            <div class="flex flex-col">
                <span class="text-xs text-gray-500 uppercase tracking-wide">Serving Cell</span>
                <span class="text-xs text-gray-400 font-mono mt-0.5">ID: ${s.eNB}-${s.CID}</span>
            </div>
            <span class="bg-gray-700/50 text-gray-300 px-2 py-0.5 rounded text-xs border border-gray-600/30">
                Band ${s.Band}
            </span>
        </div>

        <div class="grid grid-cols-3 gap-4 mb-4 text-center">
            <div>
                <div class="text-2xl font-bold font-mono ${getSignalColor(s.RSRP)}">${s.RSRP}</div>
                <div class="text-[10px] text-gray-500 uppercase">RSRP</div>
            </div>
            <div class="pt-1">
                <div class="text-lg font-mono text-gray-300">${s.RSRQ}</div>
                <div class="text-[10px] text-gray-500 uppercase">RSRQ</div>
            </div>
            <div class="pt-1">
                <div class="text-lg font-mono text-gray-300">${s.SINR}</div>
                <div class="text-[10px] text-gray-500 uppercase">SINR</div>
            </div>
        </div>

        <div class="grid grid-cols-3 gap-2 text-xs mb-3">
            <div class="bg-black/20 p-1.5 rounded text-center">
                <div class="text-gray-500 text-[10px]">PCI</div>
                <div class="text-gray-300 font-mono">${s.PCI}</div>
            </div>
            <div class="bg-black/20 p-1.5 rounded text-center">
                <div class="text-gray-500 text-[10px]">EARFCN</div>
                <div class="text-gray-300 font-mono">${s.EARFCN}</div>
            </div>
            <div class="bg-black/20 p-1.5 rounded text-center">
                <div class="text-gray-500 text-[10px]">TAC</div>
                <div class="text-gray-300 font-mono">${s.TAC}</div>
            </div>
        </div>

        <div class="flex justify-between items-center text-xs pt-1">
             <span class="text-gray-500">Approx Distance</span>
             ${distDisplay}
        </div>
    </div>`;

   // ===========================
// 2. NEIGHBOR CELLS (Expandable Rows)
// ===========================
if (neighbors.length > 0) {
    html += `
    <div>
        <div class="text-[10px] text-gray-500 uppercase tracking-wider mb-2 pl-1">
            Neighbors
        </div>
        <div class="space-y-1">
            ${neighbors.map((n, i) => {
                const rowId = `nbr-${i}`;
                const taValid =
                    n.TimingAdvance &&
                    n.TimingAdvance.Value !== 2147483647 &&
                    n.TimingAdvance.ApproxDistanceMeters > 0;

                return `
                <div class="bg-gray-800/20 border border-gray-700/30 rounded">
                    
                    <!-- Primary Row -->
                    <div
                        class="flex justify-between items-center px-3 py-1.5 text-xs cursor-pointer hover:bg-gray-700/20 transition-colors"
                        onclick="toggleRow('${rowId}')"
                    >
                        <span class="text-gray-400 w-20">
                            PCI <span class="text-gray-300 font-mono">${n.PCI}</span>
                        </span>

                        <div class="flex items-center gap-3">
                            <span class="text-gray-500 text-[10px]">RSRP</span>
                            <span class="font-mono ${getSignalColor(n.RSRP)}">${n.RSRP}</span>
                        </div>
                    </div>

                    <!-- Expanded Details -->
                    <div id="${rowId}" class="hidden px-3 pb-2 pt-1 border-t border-gray-700/30 text-[10px]">
                        <div class="grid grid-cols-5 gap-2 text-center">
                            <div>
                                <div class="text-gray-500">EARFCN</div>
                                <div class="text-gray-300 font-mono">${n.EARFCN}</div>
                            </div>
                            <div>
                                <div class="text-gray-500">Band</div>
                                <div class="text-gray-300 font-mono">${n.Band}</div>
                            </div>
                            <div>
                                <div class="text-gray-500">RSRQ</div>
                                <div class="text-gray-300 font-mono">${n.RSRQ}</div>
                            </div>
                            <div>
                                <div class="text-gray-500">SINR</div>
                                <div class="text-gray-300 font-mono">${n.SINR}</div>
                            </div>
                            <div>
                                <div class="text-gray-500">Dist</div>
                                <div class="text-gray-300 font-mono">
                                    ${taValid ? `${n.TimingAdvance.ApproxDistanceMeters}m` : 'N/A'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;
            }).join('')}
        </div>
    </div>`;
}

    html += `</div>`;
    return html;
}

const toggleRow = (id) => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('hidden');
};
