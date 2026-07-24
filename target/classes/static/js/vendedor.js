(function () {
    const grid = document.getElementById("vendedores-grid");
    const searchInput = document.getElementById("vendedor-search");
    const chips = Array.from(document.querySelectorAll(".vendedor-chip"));
    const statTotal = document.getElementById("stat-total");
    const statOnline = document.getElementById("stat-online");

    if (!grid) return;

    let vendedores = [];
    let filtro = "all";
    let query = "";

    const normalizar = (text) => String(text ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

    const fotoUrlPara = (username, index) => {
        const name = normalizar(username);
        if (name === "ana") return "https://randomuser.me/api/portraits/women/65.jpg";
        if (name === "cristian") return "https://randomuser.me/api/portraits/men/46.jpg";
        return `https://randomuser.me/api/portraits/${index % 2 === 0 ? "women" : "men"}/${30 + index}.jpg`;
    };

    const estaOnline = (index) => (index % 3) !== 0;

    const actualizarStats = () => {
        if (statTotal) statTotal.textContent = String(vendedores.length);
        if (statOnline) statOnline.textContent = String(vendedores.filter(v => v.online).length);
    };

    const render = () => {
        const q = normalizar(query);
        const lista = vendedores.filter(v => {
            if (filtro === "online" && !v.online) return false;
            if (!q) return true;
            return normalizar(v.username).includes(q);
        });

        if (lista.length === 0) {
            const msg =
                vendedores.length === 0
                    ? "Próximamente más asesores para ti..."
                    : "No encontramos asesores con ese filtro.";
            grid.innerHTML = `<div class="vendedor-empty">${msg}</div>`;
            return;
        }

        grid.innerHTML = lista.map(v => `
            <article class="vendedor-card-premium">
                <div class="vendedor-banner"></div>
                <div class="vendedor-info">
                    <div class="vendedor-img-wrapper">
                        <img src="${v.fotoUrl}" alt="${v.username}" class="vendedor-img-premium">
                        <div class="status-dot ${v.online ? "is-online" : "is-offline"}" title="${v.online ? "Disponible ahora" : "No disponible"}"></div>
                    </div>
                    <h3 class="vendedor-name">${v.username}</h3>
                    <span class="vendedor-role-badge">${v.online ? "Disponible hoy" : "Fuera de línea"}</span>

                    <div class="vendedor-contact-actions">
                        <a href="${v.whatsappUrl}" target="_blank" rel="noopener" class="btn-contact btn-ws">
                            <span>WhatsApp</span>
                        </a>
                        <a href="${v.telUrl}" class="btn-contact btn-call">
                            <span>Llamar</span>
                        </a>
                    </div>
                </div>
            </article>
        `).join("");
    };

    const setFiltro = (next) => {
        filtro = next;
        chips.forEach(c => c.classList.toggle("is-active", c.dataset.filter === filtro));
        render();
    };

    const cargarVendedoresDinamicamente = () => {
        fetch("/api/usuarios")
            .then(res => res.json())
            .then(usuarios => {
                const lista = Array.isArray(usuarios) ? usuarios : [];
                const vendedoresApi = lista.filter(u => u && u.rol === "VENDEDOR");
                const telefono = "+573000000000";
                const telefonoDial = "573000000000";

                vendedores = vendedoresApi.map((v, index) => {
                    const username = String(v.username ?? "Asesor");
                    const online = estaOnline(index);
                    const texto = encodeURIComponent(`Hola ${username}, vengo de KiusiHub`);
                    return {
                        username,
                        online,
                        fotoUrl: fotoUrlPara(username, index),
                        whatsappUrl: `https://wa.me/${telefonoDial}?text=${texto}`,
                        telUrl: `tel:${telefono}`
                    };
                });

                actualizarStats();
                render();
            })
            .catch(err => {
                console.error("Error cargando vendedores:", err);
                if (statTotal) statTotal.textContent = "—";
                if (statOnline) statOnline.textContent = "—";
                grid.innerHTML = `<div class="vendedor-empty" style="color: #b91c1c;">No pudimos conectar con nuestros asesores en este momento.</div>`;
            });
    };

    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            query = e.target.value || "";
            render();
        });
    }

    chips.forEach(c => {
        c.addEventListener("click", () => setFiltro(c.dataset.filter || "all"));
    });

    cargarVendedoresDinamicamente();
})();
