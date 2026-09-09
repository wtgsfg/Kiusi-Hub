(function () {
    function getUsuario() {
        try {
            return JSON.parse(localStorage.getItem("usuario") || "null");
        } catch {
            return null;
        }
    }

    function ensureToastRoot() {
        let root = document.getElementById("toast-root");
        if (root) return root;
        root = document.createElement("div");
        root.id = "toast-root";
        root.className = "toast-root";
        document.body.appendChild(root);
        return root;
    }

    function toast(message, type = "info") {
        const root = ensureToastRoot();
        const el = document.createElement("div");
        el.className = `toast toast-${type}`;
        el.textContent = String(message ?? "");
        root.appendChild(el);
        requestAnimationFrame(() => el.classList.add("show"));

        const timeout = setTimeout(() => {
            el.classList.remove("show");
            setTimeout(() => el.remove(), 220);
        }, 3400);

        el.addEventListener("click", () => {
            clearTimeout(timeout);
            el.classList.remove("show");
            setTimeout(() => el.remove(), 180);
        });
    }

    function ensureModalRoot() {
        let root = document.getElementById("ui-modal-root");
        if (root) return root;
        root = document.createElement("div");
        root.id = "ui-modal-root";
        root.className = "ui-modal-root oculto";
        root.innerHTML = `
            <div class="ui-modal-backdrop"></div>
            <div class="ui-modal-card" role="dialog" aria-modal="true">
                <div class="ui-modal-header">
                    <div class="ui-modal-title" id="ui-modal-title"></div>
                    <button class="btn-secondary" type="button" id="ui-modal-close">Cerrar</button>
                </div>
                <div class="ui-modal-body" id="ui-modal-body"></div>
                <div class="ui-modal-actions" id="ui-modal-actions"></div>
            </div>
        `;
        document.body.appendChild(root);

        const close = () => ocultarModal();
        root.querySelector(".ui-modal-backdrop")?.addEventListener("click", close);
        root.querySelector("#ui-modal-close")?.addEventListener("click", close);
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") close();
        });
        return root;
    }

    function mostrarModal({ title, body, bodyHtml, actions }) {
        const root = ensureModalRoot();
        const titleEl = root.querySelector("#ui-modal-title");
        const bodyEl = root.querySelector("#ui-modal-body");
        const actionsEl = root.querySelector("#ui-modal-actions");

        if (titleEl) titleEl.textContent = title || "";

        if (bodyEl) {
            bodyEl.textContent = "";
            const txt = document.createElement("div");
            txt.className = "ui-modal-text";
            if (bodyHtml) {
                txt.innerHTML = bodyHtml;
            } else {
                txt.textContent = body || "";
            }
            bodyEl.appendChild(txt);
        }

        if (actionsEl) {
            actionsEl.innerHTML = "";
            (actions || []).forEach(a => {
                const b = document.createElement("button");
                b.type = "button";
                b.className = a.className || "btn-primary";
                b.textContent = a.label || "OK";
                b.addEventListener("click", a.onClick);
                actionsEl.appendChild(b);
            });
        }

        root.classList.remove("oculto");
        document.body.classList.add("modal-open");
    }

    function ocultarModal() {
        const root = document.getElementById("ui-modal-root");
        if (!root) return;
        root.classList.add("oculto");
        document.body.classList.remove("modal-open");
        const actionsEl = root.querySelector("#ui-modal-actions");
        if (actionsEl) actionsEl.innerHTML = "";
    }

    function dialog(title, message) {
        mostrarModal({
            title: title || "Mensaje",
            body: String(message ?? ""),
            actions: [{
                label: "Entendido",
                className: "btn-primary",
                onClick: () => ocultarModal()
            }]
        });
    }

    function confirmDialog(message, title = "Confirmar") {
        return new Promise(resolve => {
            mostrarModal({
                title,
                body: String(message ?? ""),
                actions: [
                    {
                        label: "Cancelar",
                        className: "btn-secondary",
                        onClick: () => {
                            ocultarModal();
                            resolve(false);
                        }
                    },
                    {
                        label: "Sí, continuar",
                        className: "btn-danger",
                        onClick: () => {
                            ocultarModal();
                            resolve(true);
                        }
                    }
                ]
            });
        });
    }

    function buildNavLinks() {
        const usuario = getUsuario();
        const links = [];
        const add = (href, label, icono) => links.push({ href, label, icono: icono || "" });

        const rolUsuario = (usuario && usuario.rol) ? String(usuario.rol).toUpperCase().trim() : null;
        const esAdmin = ["ADMIN", "ADMINISTRADOR", "SUPER_ADMIN", "SUPERADMIN", "ROOT"].includes(rolUsuario);
        const esCartera = ["CARTERA", "CARTERA_COBROS", "COBRANZA", "COBRANZAS"].includes(rolUsuario);
        const esVendedor = ["VENDEDOR", "VENDEDORA", "VENTAS"].includes(rolUsuario);
        const esBodeguero = ["BODEGUERO", "BODEGA", "ALMACEN", "ALMACENISTA"].includes(rolUsuario);

        if (!usuario) {
            add("home.html", "Inicio", "🏠");
            add("catalogo.html", "Catálogo", "🛍️");
            add("vendedor.html", "Vendedores", "👥");
        } else {
            add("home.html", "Inicio", "🏠");
            add("catalogo.html", "Catálogo", "🛍️");
            add("vendedor.html", "Vendedores", "👥");

            if (esAdmin) {
                add("usuarios.html", "Usuarios", "👤");
                add("clientes.html", "Clientes", "🧑‍💼");
                add("index.html", "Productos", "📦");
                add("pedidos.html", "Pedidos", "📋");
                add("facturas.html", "Facturas", "🧾");
                add("recaudos.html", "Recaudos", "💰");
                add("notas-credito.html", "Notas Crédito", "💳");
                add("bodeguero.html", "Bodega", "🏪");
            } else if (esVendedor) {
                add("pedidos.html", "Pedidos", "📋");
            } else if (esCartera) {
                add("facturas.html", "Facturas", "🧾");
                add("recaudos.html", "Recaudos", "💰");
                add("notas-credito.html", "Notas Crédito", "💳");
            } else if (esBodeguero) {
                add("bodeguero.html", "Bodega", "🏪");
            } else {
                add("facturas.html", "Facturas", "🧾");
                add("notas-credito.html", "Notas Crédito", "💳");
            }
        }

        return { links, usuario, rolUsuario, esAdmin, esCartera, esVendedor, esBodeguero };
    }

    function currentPageActive(href) {
        const path = window.location.pathname.split("/").pop() || "home.html";
        return href === path;
    }

    function renderSidebar() {
        const sidebarEl = document.getElementById("app-sidebar");
        if (!sidebarEl) return false;

        const { links, usuario, rolUsuario } = buildNavLinks();
        const currentFile = (window.location.pathname.split("/").pop() || "home.html").toLowerCase();

        const linksHtml = links
            .map(l => {
                const active = currentPageActive(l.href) ? "active" : "";
                return `
                    <a href="${l.href}" class="sidebar-link ${active}" title="${l.label}">
                        <span class="sidebar-link-label">
                            ${l.icono ? `<span class="sidebar-link-icon">${l.icono}</span>` : ""}
                            ${l.label}
                        </span>
                        <span class="sidebar-link-arrow">❯</span>
                    </a>
                `;
            })
            .join("");

        const footerHtml = usuario
            ? `
                <div class="sidebar-footer">
                    <div class="sidebar-user" title="Rol: ${rolUsuario || 'Sin rol'}">
                        <span class="sidebar-user-dot"></span>
                        <div class="sidebar-user-info">
                            <span class="sidebar-username">${usuario.username}</span>
                            <span class="sidebar-userrole">${rolUsuario || '—'}</span>
                        </div>
                    </div>
                    <button class="sidebar-logout" type="button" onclick="logout()">
                        🔒 Cerrar Sesión
                    </button>
                </div>
            `
            : `
                <div class="sidebar-footer">
                    <a href="login.html" class="sidebar-link" style="text-align:center; justify-content:center;">
                        <span class="sidebar-link-label" style="justify-content:center;">🔐 Iniciar Sesión</span>
                    </a>
                </div>
            `;

        sidebarEl.innerHTML = `
            <div class="sidebar-brand">
                <h2 onclick="location.href='home.html'" title="Ir al inicio">KiusiHub</h2>
            </div>
            <nav class="sidebar-nav">
                ${linksHtml}
            </nav>
            ${footerHtml}
        `;

        const mobileToggle = document.getElementById("sidebar-mobile-toggle");
        if (mobileToggle) {
            mobileToggle.addEventListener("click", () => {
                sidebarEl.classList.toggle("open");
                const open = sidebarEl.classList.contains("open");
                mobileToggle.setAttribute("aria-expanded", String(open));
            });
            sidebarEl.querySelectorAll("a.sidebar-link").forEach(a => {
                a.addEventListener("click", () => {
                    if (window.innerWidth <= 980) {
                        sidebarEl.classList.remove("open");
                        mobileToggle.setAttribute("aria-expanded", "false");
                    }
                });
            });
        }

        return true;
    }

    function renderNavbar() {
        const sidebarRendered = renderSidebar();
        if (sidebarRendered) return;

        document.body.classList.add("kiusi-dropdown-nav");

        const usuario = getUsuario();

        const navEl =
            document.getElementById("nav-user") ||
            document.getElementById("nav") ||
            document.querySelector("header.navbar nav") ||
            document.querySelector("header.navbar #nav-user");
        if (!navEl) return;

        const { links, rolUsuario } = buildNavLinks();

        const linksHtml = links
            .map(l => {
                const active = currentPageActive(l.href) ? "active" : "";
                return `
                    <a href="${l.href}" class="kiusi-menu-item ${active}" title="${l.label}">
                        <span class="kiusi-menu-item-label">
                            ${l.icono ? `<span class="kiusi-menu-item-icon">${l.icono}</span>` : ""}
                            ${l.label}
                        </span>
                        <span class="kiusi-menu-item-arrow">❯</span>
                    </a>
                `;
            })
            .join("");

        const footerHtml = usuario
            ? `
                <div class="kiusi-menu-divider"></div>
                <div class="kiusi-menu-footer">
                    <div class="kiusi-menu-user" title="Rol: ${rolUsuario || 'Sin rol'}">
                        <span class="kiusi-menu-user-dot"></span>
                        <span class="kiusi-menu-username">${usuario.username}</span>
                        <span class="kiusi-menu-userrole">${rolUsuario || '—'}</span>
                    </div>
                    <button class="kiusi-menu-logout" type="button" onclick="logout()">
                        🔒 Cerrar Sesión
                    </button>
                </div>
            `
            : `
                <div class="kiusi-menu-divider"></div>
                <div class="kiusi-menu-footer">
                    <a href="login.html" class="kiusi-menu-login">
                        🔐 Iniciar Sesión
                    </a>
                </div>
            `;

        navEl.style.position = "relative";
        navEl.style.width = "100%";
        navEl.style.justifyContent = "space-between";

        navEl.innerHTML = `
            <button class="kiusi-dots-trigger" type="button" aria-label="Abrir menú" aria-expanded="false" title="Menú">
                <span class="kiusi-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </span>
            </button>
            <div class="kiusi-menu-panel" data-open="false" role="menu">
                <div class="kiusi-menu-list">
                    ${linksHtml}
                </div>
                ${footerHtml}
            </div>
        `;

        const toggle = navEl.querySelector(".kiusi-dots-trigger");
        const menu = navEl.querySelector(".kiusi-menu-panel");
        if (toggle && menu) {
            const openMenu = () => {
                menu.setAttribute("data-open", "true");
                toggle.setAttribute("aria-expanded", "true");
            };
            const closeMenu = () => {
                menu.setAttribute("data-open", "false");
                toggle.setAttribute("aria-expanded", "false");
            };
            const toggleMenu = () => {
                const isOpen = menu.getAttribute("data-open") === "true";
                if (isOpen) closeMenu(); else openMenu();
            };

            toggle.addEventListener("click", (e) => {
                e.stopPropagation();
                toggleMenu();
            });

            document.addEventListener("click", (e) => {
                if (!menu.contains(e.target) && !toggle.contains(e.target)) {
                    closeMenu();
                }
            });

            document.addEventListener("keydown", (e) => {
                if (e.key === "Escape") closeMenu();
            });

            menu.querySelectorAll("a.kiusi-menu-item").forEach(a => {
                a.addEventListener("click", () => closeMenu());
            });
        }

        if (usuario && window.console) {
            console.log("[KiusiUI Navbar] Usuario:", usuario.username, "| Rol detectado:", rolUsuario,
                "| Links:", links.map(l => l.label).join(" · "));
            if (!links.some(l => l.href.startsWith("notas")) && !buildNavLinks().esVendedor && !buildNavLinks().esBodeguero) {
                console.warn("[KiusiUI Navbar] No se agregó Notas Crédito. Rol actual:", rolUsuario,
                    ". Agregué acceso de todos modos si no es vendedor/bodeguero.");
            }
        }

        const headerTitle = document.querySelector("header.navbar h2");
        if (headerTitle && !headerTitle.dataset.bound) {
            headerTitle.dataset.bound = "1";
            headerTitle.style.cursor = "pointer";
            headerTitle.title = "Ir al inicio";
            headerTitle.addEventListener("click", () => {
                location.href = "home.html";
            });
        }
    }

    function logout() {
        localStorage.removeItem("usuario");
        location.href = "home.html";
    }

    window.KiusiUI = {
        toast,
        dialog,
        confirm: confirmDialog,
        renderNavbar,
        getUsuario,
        mostrarModal,
        ocultarModal
    };

    window.logout = logout;
    window.uiConfirm = confirmDialog;

    const oldAlert = window.alert;
    window.alert = function (msg) {
        const text = String(msg ?? "");
        if (text.length > 140 || text.includes("\n")) {
            dialog("Información", text);
            return;
        }
        toast(text, text.startsWith("✅") ? "success" : text.startsWith("❌") ? "error" : "info");
    };

    document.addEventListener("DOMContentLoaded", () => {
        renderNavbar();
        ensureToastRoot();
        ensureModalRoot();
    });

    window.addEventListener("unhandledrejection", (e) => {
        const reason = e?.reason;
        if (reason && reason.__kiusiHandled) return;
        if (reason instanceof Error && reason.__kiusiHandled) return;
        const msg = (reason && reason.message) ? String(reason.message) : "Ocurrió un error inesperado";
        if (window.console && console.warn) {
            console.warn("[Unhandled Promise Rejection]", reason);
        }
    });

    window.addEventListener("error", (ev) => {
        const err = ev?.error;
        if (err && err.__kiusiHandled) return;
        if (window.console && console.warn) {
            console.warn("[Global Error]", err || ev?.message);
        }
    });

    if (oldAlert && typeof oldAlert === "function") {
        window.__oldAlert = oldAlert;
    }
})();
