function applyDirection() {
    const sidebar = document.querySelector('.sidebar') || document.getElementById('sidebar');
    const content = document.querySelector('.content');

    if (!sidebar) return;

    const isLtr = document.body.classList.contains('ltr') || document.documentElement.dir === 'ltr';
    const collapsed = sidebar.classList.contains('collapsed');
    const mobileOpen = sidebar.classList.contains('mobile-open');
    const width = window.innerWidth;
    const isPersistent = width >= 768;

    // Reset inline positioning 
    sidebar.style.left = '';
    sidebar.style.right = '';
    sidebar.style.borderLeft = '';
    sidebar.style.borderRight = '';

    if (isLtr) {
        // Sidebar on the left (LTR)
        sidebar.style.left = '0';
        sidebar.style.right = 'auto';
        sidebar.style.borderLeft = 'none';
        sidebar.style.borderRight = '1px solid #ddd';

        if (content) {
            if (isPersistent) {
                content.style.marginLeft = collapsed ? '70px' : '220px';
                content.style.marginRight = '0';
            } else {
                content.style.marginLeft = '0';
                content.style.marginRight = '0';
            }
        }
    } else {
        // Sidebar on the right (RTL)
        sidebar.style.right = '0';
        sidebar.style.left = 'auto';
        sidebar.style.borderRight = 'none';
        sidebar.style.borderLeft = '1px solid #ddd';

        if (content) {
            if (isPersistent) {
                content.style.marginRight = collapsed ? '70px' : '220px';
                content.style.marginLeft = '0';
            } else {
                content.style.marginLeft = '0';
                content.style.marginRight = '0';
            }
        }
    }

    // Visibility and Overlay Logic
    if (isPersistent) {
        sidebar.style.visibility = 'visible';
        sidebar.style.transform = 'translateX(0)';
        sidebar.style.zIndex = '1000';
    } else {
        if (mobileOpen) {
            sidebar.style.visibility = 'visible';
            sidebar.style.transform = 'translateX(0)';
            sidebar.style.zIndex = '1200';
        } else {
            sidebar.style.visibility = 'hidden';
            sidebar.style.zIndex = '';
            // CSS handles the translateX hide
        }
    }
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar') || document.getElementById('sidebar');
    const content = document.querySelector('.content');

    if (!sidebar) return;

    const width = window.innerWidth;
    const isPersistent = width >= 768;

    if (!isPersistent) {
        sidebar.classList.toggle('mobile-open');
    } else {
        sidebar.classList.toggle('collapsed');
        if (content) content.classList.toggle('expanded');
    }

    if (sidebar.classList.contains('collapsed') && isPersistent) {
        document.querySelectorAll('.nav-item.open').forEach(item => item.classList.remove('open'));
    }

    applyDirection();
}

// Global Exports
if (typeof window !== 'undefined') {
    window.toggleSidebar = toggleSidebar;
    window.applyDirection = applyDirection;
}

// ── Shared fetch helper ───────────────────────────────────────────────────────
// Wraps native fetch with:
//   • Automatic CSRF token injection (RequestVerificationToken)
//   • Automatic Content-Type: application/json (skipped for FormData)
//   • response.ok check — throws on 4xx / 5xx so every catch block gets it
//   • Returns parsed JSON directly
window.apiFetch = async function (url, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const isMutating = !['GET', 'HEAD', 'OPTIONS'].includes(method);
    const isFormData = options.body instanceof FormData;
    const token = isMutating
        ? (document.querySelector('input[name="__RequestVerificationToken"]')?.value || '')
        : '';

    const extraHeaders = {};
    if (isMutating && !isFormData) extraHeaders['Content-Type'] = 'application/json';
    if (isMutating && token)       extraHeaders['RequestVerificationToken'] = token;

    const response = await fetch(url, {
        credentials: 'include',
        ...options,
        headers: {
            ...extraHeaders,
            ...options.headers
        }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    return response.json();
};

// Direction Observer
(function observeBodyDirection() {
    if (typeof MutationObserver === 'undefined') return;
    const target = document.body;
    let lastIsLtr = target.classList.contains('ltr') || document.documentElement.dir === 'ltr';
    let rafId = null;

    const observer = new MutationObserver(mutations => {
        for (const m of mutations) {
            if (m.type === 'attributes') {
                const currentIsLtr = target.classList.contains('ltr') || document.documentElement.dir === 'ltr';
                if (currentIsLtr !== lastIsLtr) {
                    lastIsLtr = currentIsLtr;
                    if (rafId) cancelAnimationFrame(rafId);
                    rafId = requestAnimationFrame(() => {
                        applyDirection();
                    });
                    break;
                }
            }
        }
    });
    observer.observe(target, { attributes: true, attributeFilter: ['class', 'dir'] });
})();

// Navigation Logic
document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.querySelector('.sidebar') || document.getElementById('sidebar');
    const width = window.innerWidth;

    // MD/LG should be collapsed by default
    if (sidebar && width >= 768 && width < 1200) {
        sidebar.classList.add('collapsed');
        const content = document.querySelector('.content');
        if (content) content.classList.add('expanded');
    }

    applyDirection();

    document.querySelectorAll('.nav-item > a').forEach(link => {
        link.addEventListener('click', function (e) {
            const parent = this.parentElement;
            const sidebar = document.querySelector('.sidebar');

            document.querySelectorAll('.nav-item.active').forEach(i => i.classList.remove('active'));
            parent.classList.add('active');

            if (parent.classList.contains('has-submenu')) {
                const width = window.innerWidth;
                const isPersistent = width >= 768;

                // Toggle this submenu
                const isOpening = !parent.classList.contains('open');

                // Collapse others if opening this one (optional accordion style)
                if (isOpening) {
                    document.querySelectorAll('.nav-item.open').forEach(openItem => {
                        if (openItem !== parent) openItem.classList.remove('open');
                    });
                }

                // If collapsed desktop and opening, expand sidebar
                if (isOpening && sidebar && sidebar.classList.contains('collapsed') && isPersistent) {
                    toggleSidebar();
                }

                parent.classList.toggle('open');

                // Only prevent default if it has no direct link or is just a toggle
                if (!this.getAttribute('href') || this.getAttribute('href') === '#') {
                    e.preventDefault();
                }
            } else {
                // Not a parent item, maybe a child? Ensure its parent stays open
                const parentMenu = parent.closest('.nav-item.has-submenu');
                if (parentMenu) parentMenu.classList.add('open');
            }
        });
    });

    let resizeRaf = null;
    window.addEventListener('resize', function () {
        if (resizeRaf) cancelAnimationFrame(resizeRaf);
        resizeRaf = requestAnimationFrame(applyDirection);
    }, { passive: true });
});

async function createComponentFromUrl(url) {
    const separator = url.includes('?') ? '&' : '?';
    const cacheBusterUrl = `${url}${separator}_t=${Date.now()}`;
    const response = await fetch(cacheBusterUrl, { cache: 'no-store' });
    const template = await response.text();
    return template;
}
async function loadComponentTemplate(url) {
    const separator = url.includes('?') ? '&' : '?';
    const cacheBusterUrl = `${url}${separator}_t=${Date.now()}`;
    const response = await fetch(cacheBusterUrl, { cache: 'no-store' });
    const template = await response.text();
    return template;
}

function findNodeByKey(tree, key) {
    if (!tree || !key) return null;
    let realKey = treeKeyNormalizer(key);
    for (const node of tree) {
        if (String(node.key) === String(realKey)) {
            return node;
        }
        if (node.children?.length) {
            const found = findNodeByKey(node.children, realKey);
            if (found) return found;
        }
    }
    return null;
}

function treeKeyNormalizer(treeNodeKey) {
    if (typeof treeNodeKey === 'object' && treeNodeKey !== null) {
        return Object.keys(treeNodeKey)[0];
    }
    return treeNodeKey;
}

// Prevent 'Blocked aria-hidden on an element because its descendant retained focus'
document.addEventListener('pointerdown', function (event) {
    if (event.target && (event.target.closest('[data-bs-dismiss="modal"]') || event.target.classList.contains('modal'))) {
        if (document.activeElement && typeof document.activeElement.blur === 'function') {
            document.activeElement.blur();
        }
    }
}, true);

document.addEventListener('click', function (event) {
    if (event.target && event.target.closest('[data-bs-dismiss="modal"]')) {
        if (document.activeElement && typeof document.activeElement.blur === 'function') {
            document.activeElement.blur();
        }
    }
}, true);

document.addEventListener('hide.bs.modal', function (event) {
    if (document.activeElement && event.target && event.target.contains(document.activeElement)) {
        document.activeElement.blur();
    }
}, true);

document.addEventListener('hidden.bs.modal', function (event) {
    if (document.activeElement && event.target && event.target.contains(document.activeElement)) {
        document.activeElement.blur();
    }
}, true);