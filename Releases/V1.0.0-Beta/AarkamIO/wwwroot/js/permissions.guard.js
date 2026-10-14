// GLOBAL PERMISSION OBJECT (no imports)
window.roles = [];
window.permissions = [];

window.Permission = {
    get roles() {
        return window.roles || [];
    },
    set roles(val) {
        window.roles = val || [];
    },
    get permissions() {
        return window.permissions || [];
    },
    set permissions(val) {
        window.permissions = val || [];
    },

    load(data) {
        window.roles = data.roles || [];
        window.permissions = data.permissions || [];
    },

    hasPermission(p) {
        if (!p) return true;
        if (Array.isArray(p)) {
            return p.some(x => this.permissions.includes(x));
        }
        if (typeof p === 'string' && p.includes(',')) {
            return p.split(',').map(x => x.trim()).some(x => this.permissions.includes(x));
        }
        return this.permissions.includes(p);
    },

    hasRole(r) {
        return this.roles.includes(r);
    }
};

window.setPermissionsAndRoles = function (roles, permissions) {
    window.roles = roles || [];
    window.permissions = permissions || [];
};

window.resetPermissionsAndRoles = function () {
    window.roles = [];
    window.permissions = [];
};

// REGISTER GLOBAL Vue EXTENSIONS
window.registerPermissionSystem = function (app, router) {

    // Add global $permission to Vue
    app.config.globalProperties.$permission = window.Permission;
    app.config.globalProperties.$showConfirm = (title, message, onConfirm, onReject = null, variant = 'confirm') => {
        if (window.showConfirm) {
            window.showConfirm(title, message, onConfirm, onReject, variant);
        } else {
            if (confirm(message)) {
                if (onConfirm) onConfirm();
            } else {
                if (onReject) onReject();
            }
        }
    };

    // Global directive
    app.directive("permission", {
        mounted(el, binding) {
            if (!window.Permission.hasPermission(binding.value)) {
                el.remove(); //el.style.display = "none"; //
            }
        }
    });

    // Optional: Router guard
    if (router) {
        router.beforeEach((to, from, next) => {
            if (to.meta.permission && !window.Permission.hasPermission(to.meta.permission)) {
                //next("/authorize/access-denied");
                window.location.href = "/authorize/access-denied";
                return;
            }
            next();
        });
    }
};
