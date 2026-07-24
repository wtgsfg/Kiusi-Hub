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

    function renderNavbar() {
        const usuario = getUsuario();

        const navEl =
            document.getElementById("nav-user") ||
            document.getElementById("nav") ||
            document.querySelector("header.navbar nav") ||
            document.querySelector("header.navbar #nav-user");
        if (!navEl) return;

        const links = [];

        const add = (href, label) => links.push({ href, label });

        if (!usuario) {
            add("home.html", "Inicio");
            add("catalogo.html", "Catálogo");
            add("vendedor.html", "Vendedores");
        } else {
            add("home.html", "Inicio");
            add("catalogo.html", "Catálogo");
            add("vendedor.html", "Vendedores");

            if (usuario.rol === "ADMIN") {
                add("usuarios.html", "Usuarios");
                add("index.html", "Productos");
                add("pedidos.html", "Pedidos");
                add("facturas.html", "Facturas");
                add("bodeguero.html", "Bodega");
            } else if (usuario.rol === "VENDEDOR") {
                add("pedidos.html", "Pedidos");
            } else if (usuario.rol === "CARTERA") {
                add("facturas.html", "Facturas");
            } else if (usuario.rol === "BODEGUERO") {
                add("bodeguero.html", "Bodega");
            }
        }

        const forceCollapsible = links.length > 5;

        const linksHtml = links
            .map(l => `<a href="${l.href}" class="nav-link nav-pill">${l.label}</a>`)
            .join("");

        const actionsHtml = usuario
            ? `
                <div class="nav-actions">
                    <div class="user-chip">
                        <span class="user-dot"></span>
                        <span class="user-name">${usuario.username}</span>
                        <span class="user-role">${usuario.rol}</span>
                    </div>
                    <button class="btn-secondary nav-logout" type="button" onclick="logout()">Salir</button>
                </div>
            `
            : `
                <div class="nav-actions">
                    <a href="login.html" class="nav-link nav-pill nav-login">Login</a>
                </div>
            `;

        navEl.classList.add("nav-pro");
        navEl.dataset.collapsible = forceCollapsible ? "true" : "false";

        const initialOpen =
            window.innerWidth <= 900
                ? "false"
                : (forceCollapsible ? "false" : "true");

        navEl.innerHTML = `
            <button class="nav-toggle" type="button" aria-label="Menú" aria-expanded="false">
                <span></span><span></span><span></span>
            </button>
            <div class="nav-menu" data-open="${initialOpen}">
                <div class="nav-links">${linksHtml}</div>
                ${actionsHtml}
            </div>
        `;

        const toggle = navEl.querySelector(".nav-toggle");
        const menu = navEl.querySelector(".nav-menu");
        if (toggle && menu) {
            toggle.setAttribute("aria-expanded", menu.getAttribute("data-open") === "true" ? "true" : "false");
            toggle.addEventListener("click", () => {
                const open = menu.getAttribute("data-open") === "true";
                menu.setAttribute("data-open", open ? "false" : "true");
                toggle.setAttribute("aria-expanded", open ? "false" : "true");
            });

            menu.querySelectorAll("a.nav-link").forEach(a => {
                a.addEventListener("click", () => {
                    menu.setAttribute("data-open", "false");
                    toggle.setAttribute("aria-expanded", "false");
                });
            });
        }

        const headerTitle = document.querySelector("header.navbar h2");
        if (headerTitle && !headerTitle.dataset.bound) {
            headerTitle.dataset.bound = "1";
            headerTitle.style.cursor = "pointer";
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
        const msg = e?.reason?.message || "Ocurrió un error inesperado";
        toast(msg, "error");
    });

    window.addEventListener("error", () => {
        toast("Ocurrió un error inesperado", "error");
    });

    if (oldAlert && typeof oldAlert === "function") {
        window.__oldAlert = oldAlert;
    }
})();
