document.addEventListener("DOMContentLoaded", function () {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "null");

    if (!usuario) {
        Swal.fire({
            icon: 'warning',
            title: 'Inicia sesión',
            text: 'Debes iniciar sesión para ver los recaudos.'
        }).then(() => { window.location.href = "login.html"; });
        return;
    }

    const rol = (usuario.rol || "").toString().toUpperCase().trim();
    const esAdmin = ["ADMIN", "ADMINISTRADOR", "SUPER_ADMIN", "SUPERADMIN", "ROOT"].includes(rol);
    const esCartera = ["CARTERA", "CARTERA_COBROS", "COBRANZA", "COBRANZAS"].includes(rol);

    if (!esAdmin && !esCartera) {
        Swal.fire({
            icon: 'error',
            title: 'Acceso denegado',
            text: 'Solo ADMIN y Cartera pueden acceder a Recaudos.'
        }).then(() => { window.location.href = "home.html"; });
        return;
    }

    const $ = (id) => document.getElementById(id);
    const listaEl = $("recaudos-lista");
    const kpiTotal = $("kpi-total");
    const kpiCantidad = $("kpi-cantidad");
    const kpiPromedio = $("kpi-promedio");
    const fDesde = $("f-fecha-desde");
    const fHasta = $("f-fecha-hasta");
    const fCliente = $("f-cliente");
    const fFactura = $("f-factura");
    const fMetodo = $("f-metodo");
    const btnAplicar = $("btn-aplicar");
    const btnLimpiar = $("btn-limpiar");

    const fmtCOP = (n) => {
        const num = Number(n) || 0;
        try {
            return "$" + num.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } catch (e) {
            return "$" + num.toFixed(2);
        }
    };

    const fmtFecha = (f) => {
        if (!f) return "—";
        try {
            const d = new Date(f);
            if (isNaN(d.getTime())) return String(f);
            return d.toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" });
        } catch (e) {
            return String(f);
        }
    };

    const metodoLabel = (m) => {
        if (!m) return "—";
        const MAP = {
            EFECTIVO: "💵 Efectivo",
            TRANSFERENCIA: "🏦 Transferencia",
            TARJETA: "💳 Tarjeta",
            NEQUI: "📱 Nequi",
            DAVIPLATA: "📲 Daviplata",
            BOTON: "🔘 Botón",
            OTRO: "📦 Otro"
        };
        return MAP[m.toString().toUpperCase().trim()] || String(m);
    };

    const buildParams = () => {
        const params = new URLSearchParams();
        if (fDesde && fDesde.value) params.append("fechaDesde", fDesde.value);
        if (fHasta && fHasta.value) params.append("fechaHasta", fHasta.value);
        const cliente = fCliente ? fCliente.value.trim() : "";
        if (cliente) params.append("cliente", cliente);
        const facturaId = fFactura ? fFactura.value : "";
        if (facturaId && Number(facturaId) > 0) params.append("facturaId", facturaId);
        const metodo = fMetodo ? fMetodo.value : "";
        if (metodo) params.append("metodoPago", metodo);
        return params;
    };

    const cargarResumen = async () => {
        try {
            const params = buildParams();
            const res = await fetch("/api/recaudos/resumen" + (params.toString() ? "?" + params.toString() : ""));
            if (!res.ok) throw new Error("HTTP " + res.status);
            const r = await res.json();
            kpiTotal.textContent = fmtCOP(r.totalRecaudado || 0);
            kpiCantidad.textContent = String(r.cantidadPagos || 0);
            kpiPromedio.textContent = fmtCOP(r.promedioPago || 0);
        } catch (err) {
            console.error("Error cargando resumen:", err);
            kpiTotal.textContent = "Error";
            kpiCantidad.textContent = "—";
            kpiPromedio.textContent = "—";
            window.KiusiUI && window.KiusiUI.toast && window.KiusiUI.toast("Error cargando resumen", "error");
        }
    };

    const cargarLista = async () => {
        listaEl.innerHTML = `
            <div class="estado-vacio">
                <span class="emoji">⏳</span>
                <h3>Cargando recaudos...</h3>
                <p>Espera un momento mientras obtenemos los datos.</p>
            </div>`;
        try {
            const params = buildParams();
            const res = await fetch("/api/recaudos" + (params.toString() ? "?" + params.toString() : ""));
            if (!res.ok) throw new Error("HTTP " + res.status);
            const data = await res.json();

            if (!data || data.length === 0) {
                listaEl.innerHTML = `
                    <div class="estado-vacio">
                        <span class="emoji">🔍</span>
                        <h3>No hay recaudos para este filtro</h3>
                        <p>Prueba limpiando los filtros o ajusta los rangos de búsqueda.</p>
                    </div>`;
                return;
            }

            listaEl.innerHTML = data.map(r => {
                const estado = (r.facturaEstado || "").toString().toUpperCase();
                const esPagado = estado === "PAGADO" || (r.facturaTotal && r.facturaTotal > 0 && (r.facturaTotal - r.monto) <= 0);
                const estadoClase = esPagado ? "pagado" : "pendiente";
                const estadoTexto = (estado === "PAGADO") ? "✓ Pagado" : ((estado === "PENDIENTE") ? "⏳ Pendiente" : (estado || "—"));
                const cliente = r.cliente ? String(r.cliente) : "Sin cliente";
                const facturaId = r.facturaId || "—";

                return `
                <div class="recaudo-card">
                    <div class="recaudo-info">
                        <span class="tag">Recaudo #</span>
                        <span class="valor">#${r.id}</span>
                    </div>
                    <div class="recaudo-info">
                        <span class="tag">Fecha</span>
                        <span class="valor">${fmtFecha(r.fecha)}</span>
                    </div>
                    <div class="recaudo-info">
                        <span class="tag">Factura</span>
                        <span class="valor">#${facturaId}</span>
                    </div>
                    <div class="recaudo-info">
                        <span class="tag">Cliente</span>
                        <span class="valor" style="white-space:normal;">${cliente}</span>
                    </div>
                    <div class="recaudo-info">
                        <span class="tag">Monto</span>
                        <span class="valor monto">${fmtCOP(r.monto)}</span>
                    </div>
                    <div class="recaudo-info">
                        <span class="tag">Método</span>
                        <span class="badge-metodo">${metodoLabel(r.metodoPago)}</span>
                    </div>
                    <div class="recaudo-info">
                        <span class="tag">Estado Factura</span>
                        <span class="badge-estado ${estadoClase}">${estadoTexto}</span>
                    </div>
                </div>`;
            }).join("");
        } catch (err) {
            console.error("Error cargando lista:", err);
            listaEl.innerHTML = `
                <div class="estado-vacio" style="background: rgba(254,226,226,0.65); border-color:#fecaca;">
                    <span class="emoji">❌</span>
                    <h3 style="color:#991b1b;">Error al cargar los recaudos</h3>
                    <p style="color:#b91c1c;">${err.message || "Revisa la conexión o consulta al administrador."}</p>
                </div>`;
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo cargar los recaudos: ' + (err.message || "")
            });
        }
    };

    const aplicarFiltros = () => {
        cargarResumen();
        cargarLista();
    };

    const limpiarFiltros = () => {
        fDesde.value = "";
        fHasta.value = "";
        fCliente.value = "";
        fFactura.value = "";
        fMetodo.value = "";
        aplicarFiltros();
    };

    btnAplicar && btnAplicar.addEventListener("click", aplicarFiltros);
    btnLimpiar && btnLimpiar.addEventListener("click", limpiarFiltros);

    if (fCliente) {
        let t;
        fCliente.addEventListener("input", () => {
            clearTimeout(t);
            t = setTimeout(aplicarFiltros, 450);
        });
    }

    if (fFactura) {
        let t;
        fFactura.addEventListener("input", () => {
            clearTimeout(t);
            t = setTimeout(aplicarFiltros, 400);
        });
    }

    if (fDesde) fDesde.addEventListener("change", aplicarFiltros);
    if (fHasta) fHasta.addEventListener("change", aplicarFiltros);
    if (fMetodo) fMetodo.addEventListener("change", aplicarFiltros);

    window.aplicarFiltros = aplicarFiltros;
    window.limpiarFiltros = limpiarFiltros;

    aplicarFiltros();
});
