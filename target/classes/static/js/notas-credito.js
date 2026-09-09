
// ==============================================================
// 📝 NOTAS DE CRÉDITO - Lógica principal
// ==============================================================
// ✅ Funciones EXPUESTAS al window (para onclick desde HTML):
//     - cargarNotas(forceReload)
//     - toggleDetalle(id)
//     - anularNota(id)
//     - aplicarFiltros()
// ==============================================================

window.NOTAS_CREDITO_ESTADO = {
    todas: [],
    filtroTexto: "",
    filtroEstado: "todas"
};

// -----------------------------
// 🔧 Utilidades
// -----------------------------
function ncFormatFecha(fechaStr) {
    if (!fechaStr) return "—";
    try {
        const d = new Date(fechaStr);
        if (isNaN(d.getTime())) return String(fechaStr);
        return d.toLocaleDateString("es-CO", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    } catch (e) {
        return String(fechaStr);
    }
}

function ncFormatMonto(valor) {
    const num = Number(valor) || 0;
    return "$" + num.toLocaleString("es-CO", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function ncRolPermitido(usuario) {
    if (!usuario) return false;
    const rol = (usuario.rol || "").toUpperCase().trim();
    const permitidos = [
        "ADMIN", "ADMINISTRADOR", "SUPER_ADMIN", "SUPERADMIN", "ROOT",
        "CARTERA", "CARTERA_COBROS", "COBRANZA", "COBRANZAS"
    ];
    return permitidos.includes(rol);
}

// -----------------------------
// 📊 Stats
// -----------------------------
function ncCalcularStats(notas) {
    const total = notas.length;
    const anuladas = notas.filter(n => !!n.anulada).length;
    const activas = total - anuladas;
    const montoActivo = notas
        .filter(n => !n.anulada)
        .reduce((sum, n) => sum + (Number(n.monto) || 0), 0);

    document.getElementById("stat-total").textContent = total;
    document.getElementById("stat-activas").textContent = activas;
    document.getElementById("stat-anuladas").textContent = anuladas;
    document.getElementById("stat-monto").textContent = ncFormatMonto(montoActivo);
}

// -----------------------------
// 🧾 Render detalle items
// -----------------------------
function ncRenderizarItems(nota) {
    if (!nota.items || nota.items.length === 0) {
        return `<p style="color:#6c757d; padding: 20px; text-align:center;">
                    ⚠️ Sin productos registrados en esta nota.
                </p>`;
    }

    const filas = nota.items.map(item => `
        <tr>
            <td>${item.nombreProducto || "Producto sin nombre"}</td>
            <td style="text-align:center; font-weight: 600;">${item.cantidad || 0}</td>
            <td style="text-align:right;">${ncFormatMonto(item.precioUnitario)}</td>
            <td style="text-align:right; font-weight: 700;">${ncFormatMonto(item.subtotal)}</td>
        </tr>
    `).join("");

    const total = nota.items.reduce((s, i) => s + (Number(i.subtotal) || 0), 0);

    return `
        <div class="items-table-container">
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Artículo</th>
                        <th style="width: 110px; text-align:center;">Cantidad</th>
                        <th style="width: 150px; text-align:right;">Precio Unitario</th>
                        <th style="width: 150px; text-align:right;">Subtotal</th>
                    </tr>
                </thead>
                <tbody>${filas}</tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" style="text-align:right;">TOTAL NOTA DE CRÉDITO</td>
                        <td style="text-align:right;">${ncFormatMonto(total)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    `;
}

// -----------------------------
// 🗂️ Render lista completa
// -----------------------------
function ncRenderizarLista() {
    const estado = window.NOTAS_CREDITO_ESTADO;
    const lista = document.getElementById("lista-notas");
    const todas = estado.todas || [];

    // --- Aplicar filtro de estado ---
    let filtradas = todas;
    if (estado.filtroEstado === "activas") {
        filtradas = filtradas.filter(n => !n.anulada);
    } else if (estado.filtroEstado === "anuladas") {
        filtradas = filtradas.filter(n => !!n.anulada);
    }

    // --- Aplicar filtro de texto ---
    const txt = (estado.filtroTexto || "").toLowerCase().trim();
    if (txt) {
        filtradas = filtradas.filter(n => {
            const id = String(n.id || "").toLowerCase();
            const fId = String(n.facturaId || "").toLowerCase();
            const motivo = (n.motivo || "").toLowerCase();
            return id.includes(txt) || fId.includes(txt) || motivo.includes(txt);
        });
    }

    if (!todas.length) {
        ncCalcularStats([]);
        lista.innerHTML = `
            <div class="items-empty">
                <div style="font-size: 64px; margin-bottom: 14px;">📋</div>
                <p style="font-size: 19px; font-weight: 700; margin: 0 0 8px 0; color: #495057;">
                    Aún no hay notas de crédito registradas
                </p>
                <p style="font-size: 14px; color: #6c757d; margin: 0 0 18px 0;">
                    Las notas de crédito se generan desde la sección de Facturas,
                    devolviendo productos al inventario y ajustando el total de la factura.
                </p>
                <a href="facturas.html" class="btn-primary-nc"
                   style="display: inline-flex;">
                    🧾 Ir a Facturas para generar una
                </a>
            </div>
        `;
        return;
    }

    if (!filtradas.length) {
        ncCalcularStats(todas);
        lista.innerHTML = `
            <div class="items-empty">
                <div style="font-size: 52px; margin-bottom: 12px;">🔎</div>
                <p style="font-size: 17px; font-weight: 700; margin: 0; color: #495057;">
                    Sin resultados para estos filtros
                </p>
                <p style="font-size: 13px; color: #6c757d; margin: 6px 0 0 0;">
                    Intenta cambiar el texto de búsqueda o el estado.
                </p>
            </div>
        `;
        return;
    }

    ncCalcularStats(todas);

    lista.innerHTML = "";

    filtradas.forEach((nota) => {
        const esAnulada = !!nota.anulada;
        const claseRow = esAnulada ? "nc-row anulada" : "nc-row";
        const badgeClase = esAnulada ? "anulada-badge" : "activa";
        const badgeTexto = esAnulada ? "✅ Anulada" : "📌 Activa";
        const deshabilitarAnular = esAnulada ? "disabled" : "";
        const tooltipAnular = esAnulada
            ? "Esta nota ya fue anulada (no se puede volver a anular)"
            : "Revertir esta nota: quitar productos del stock y reintegrar monto a la factura";
        const titleBotonFactura = "Abrir factura #" + nota.facturaId;

        const detalleAfectacion = esAnulada
            ? `<div style="margin-top: 10px; padding: 10px 14px; background: rgba(255,255,255,0.5);
                            border-radius: 10px; font-size: 12px; color: #155724; font-weight: 600;">
                    ✅ Esta nota fue <b>ANULADA</b>: el stock ya no incluye esta devolución
                    y la factura recuperó su monto original.
               </div>`
            : `<div style="margin-top: 10px; padding: 10px 14px; background: #fff3cd;
                            border-radius: 10px; font-size: 12px; color: #856404; font-weight: 600;">
                    📌 Nota <b>ACTIVA</b>: los productos fueron devueltos al stock
                    y el total de la factura fue reducido en ${ncFormatMonto(nota.monto)}.
               </div>`;

        const div = document.createElement("div");
        div.className = claseRow;
        div.dataset.id = String(nota.id);

        div.innerHTML = `
            <div class="nc-header">
                <div style="min-width: 0; flex: 1 1 260px;">
                    <h3>Nota de Crédito #${nota.id}</h3>
                    <p style="margin: 6px 0 0 0; color: #495057; font-size: 13px; line-height: 1.65;">
                        🔗 Factura asociada:
                        <a href="facturas.html"
                           style="color: #007bff; text-decoration: none; font-weight: 800;"
                           title="${titleBotonFactura}">
                            #${nota.facturaId}
                        </a>
                        &nbsp;·&nbsp; 📅 Fecha: ${ncFormatFecha(nota.fecha)}
                        ${esAnulada && nota.fechaAnulacion
                            ? `<br>🗓️ <b style="color:#155724;">Anulada el:</b> ${ncFormatFecha(nota.fechaAnulacion)}`
                            : ""}
                    </p>
                </div>
                <div class="nc-actions">
                    <span class="badge ${badgeClase}">${badgeTexto}</span>
                    <a href="facturas.html"
                       class="btn-small btn-factura"
                       title="${titleBotonFactura}">
                        🧾 Ver Factura
                    </a>
                    <button onclick="toggleDetalle(${nota.id})"
                            class="btn-small btn-info"
                            title="Ver productos de esta nota de crédito">
                        🔍 Ver Detalle
                    </button>
                    <button onclick="anularNota(${nota.id})"
                            class="btn-small btn-anular"
                            title="${tooltipAnular}"
                            ${deshabilitarAnular}>
                        ↩️ Anular
                    </button>
                </div>
            </div>

            <div class="nc-info">
                <div class="info-item">
                    <span class="info-label">Motivo</span>
                    <span class="info-value">${nota.motivo && nota.motivo.trim()
                        ? nota.motivo.replace(/\n/g, "<br>")
                        : "<em style='color:#adb5bd;'>Sin motivo registrado</em>"}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Monto Devuelto</span>
                    <span class="info-value" style="color: var(--primary-color); font-weight: 800; font-size: 17px;">
                        ${ncFormatMonto(nota.monto)}
                    </span>
                </div>
                <div class="info-item">
                    <span class="info-label">Productos</span>
                    <span class="info-value">
                        ${(nota.items || []).length} artículo(s)
                        · ${(nota.items || []).reduce((s, i) => s + (Number(i.cantidad) || 0), 0)} unidades totales
                    </span>
                </div>
                <div class="info-item">
                    <span class="info-label">Estado actual</span>
                    <span class="info-value">
                        ${esAnulada
                            ? `<span style="color:#155724; font-weight:800;">Anulada (revertida)</span>`
                            : `<span style="color:#856404; font-weight:800;">Activa (aplicada)</span>`}
                    </span>
                </div>
            </div>

            ${detalleAfectacion}

            <div class="nc-detail" id="nc-detail-${nota.id}">
                <div class="detail-title">🧾 Productos de esta Nota de Crédito</div>
                ${ncRenderizarItems(nota)}
            </div>
        `;

        lista.appendChild(div);
    });
}

// ==============================================================
// 🌍 FUNCIONES EXPUESTAS GLOBALMENTE (usadas desde onclick HTML)
// ==============================================================

window.toggleDetalle = function (id) {
    try {
        const el = document.getElementById("nc-detail-" + id);
        if (el) {
            el.classList.toggle("open");
            const abierto = el.classList.contains("open");
            if (window.console) {
                console.log("[NC] Detalle " + (abierto ? "abierto" : "cerrado") + " - NC #" + id);
            }
        }
    } catch (e) {
        console.error("Error toggleDetalle:", e);
    }
};

window.aplicarFiltros = function () {
    try {
        const txt = document.getElementById("buscador-notas");
        const estado = document.getElementById("filtro-estado");
        if (txt) window.NOTAS_CREDITO_ESTADO.filtroTexto = txt.value || "";
        if (estado) window.NOTAS_CREDITO_ESTADO.filtroEstado = estado.value || "todas";
        ncRenderizarLista();
    } catch (e) {
        console.error("Error aplicarFiltros:", e);
    }
};

window.cargarNotas = function (forceReload) {
    const lista = document.getElementById("lista-notas");
    if (forceReload || !window.NOTAS_CREDITO_ESTADO.todas.length) {
        lista.innerHTML = `
            <div class="cargando">
                <div class="spinner"></div>
                <div>Cargando notas de crédito desde el servidor...</div>
            </div>
        `;
    }

    return fetch("/api/notas-credito")
        .then(res => {
            if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
            return res.json();
        })
        .then(data => {
            const arr = Array.isArray(data) ? data : [];
            // Ordenar: las más recientes primero
            arr.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
            window.NOTAS_CREDITO_ESTADO.todas = arr;
            ncRenderizarLista();
            if (window.console) {
                console.log("[NC] Cargadas " + arr.length + " nota(s) de crédito del servidor.");
            }
            return arr;
        })
        .catch(err => {
            console.error("Error cargarNotas:", err);
            const listaEl = document.getElementById("lista-notas");
            if (listaEl) {
                listaEl.innerHTML = `
                    <div class="items-empty">
                        <div style="font-size: 56px; margin-bottom: 12px;">⚠️</div>
                        <p style="font-size: 17px; font-weight: 700; margin: 0 0 6px 0; color: #842029;">
                            No se pudo conectar con el servidor
                        </p>
                        <p style="font-size: 13px; color: #6c757d; margin: 0 0 16px 0;">
                            Detalle: ${err.message || "Error desconocido"}
                        </p>
                        <button onclick="cargarNotas(true)" class="btn-refresh"
                                style="font-size: 15px; padding: 11px 20px;">
                            🔄 Reintentar
                        </button>
                    </div>
                `;
            }
            if (window.Swal) {
                Swal.fire({
                    icon: "error",
                    title: "Error de conexión",
                    text: "No se pudieron cargar las notas de crédito. Revisa que el backend esté ejecutándose."
                });
            }
        });
};

window.anularNota = function (id) {
    if (!id) return;
    if (typeof window.Swal === "undefined") {
        const ok = confirm("¿Estás seguro de ANULAR la nota de crédito #" + id + "?\n\n" +
            "- Los productos serán retirados del stock.\n" +
            "- El monto volverá al total de la factura.\n" +
            "- Esta acción NO se puede deshacer.");
        if (!ok) return;
        ejecutarAnular(id);
        return;
    }

    Swal.fire({
        title: "¿Anular la Nota de Crédito #" + id + "?",
        html: `
            <div style="text-align:left; padding: 4px 0; line-height: 1.7;">
                <p style="margin: 0 0 12px 0; font-weight: 700; color: #842029;">
                    ⚠️ Esta acción es irreversible.
                </p>
                <p style="margin: 0 0 8px 0;"><b>Se revertirán los siguientes cambios:</b></p>
                <ul style="color: #495057; font-size: 14px; padding-left: 22px; margin: 0;">
                    <li>Los productos de esta nota <b>se RETIRAN del stock</b> nuevamente.</li>
                    <li>El monto de la nota <b>vuelve al total</b> de la factura original.</li>
                    <li>La nota se marcará como <b>ANULADA</b> (quedará resaltada en VERDE).</li>
                </ul>
            </div>
        `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d65500",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Sí, anular esta nota",
        cancelButtonText: "Cancelar",
        reverseButtons: true
    }).then((resSwal) => {
        if (!resSwal.isConfirmed) return;
        ejecutarAnular(id);
    });
};

function ejecutarAnular(id) {
    fetch(`/api/notas-credito/${id}/anular`, {
        method: "PUT"
    })
    .then(res => {
        if (!res.ok) {
            return res.text().then(t => {
                let mensaje = `Error HTTP ${res.status} al anular la nota de crédito`;
                try {
                    const json = JSON.parse(t);
                    if (json && typeof json === 'object') {
                        if (json.error) mensaje = String(json.error);
                        else if (json.message) mensaje = String(json.message);
                        else if (json.detalle) mensaje = String(json.detalle);
                        else mensaje = t;
                    } else {
                        mensaje = t;
                    }
                } catch (_) {
                    if (t && t.trim()) mensaje = t;
                }
                throw new Error(mensaje);
            });
        }
        return res.json();
    })
    .then(notaAnulada => {
        if (window.Swal) {
            Swal.fire({
                icon: "success",
                title: "✅ Nota de Crédito anulada",
                html: `
                    <p style="margin: 0 0 6px 0;">La nota <b>#${notaAnulada && notaAnulada.id ? notaAnulada.id : id}</b> fue anulada correctamente.</p>
                    <p style="margin: 0; font-size: 14px; color: #155724; font-weight: 600;">
                        ✅ Stock actualizado · Factura restaurada · Nota marcada como ANULADA
                    </p>
                `,
                timer: 2600
            }).then(() => cargarNotas(true));
        } else {
            alert("Nota de crédito #" + id + " anulada correctamente.");
            cargarNotas(true);
        }
    })
    .catch(err => {
        console.error("Error al anular NC #" + id + ":", err);
        if (err && err.message) try { err.message.__kiusiHandled = true; } catch (_) {}
        const msg = err && err.message ? err.message : "Ocurrió un error inesperado al anular.";
        if (window.Swal) {
            Swal.fire({
                icon: "error",
                title: "No se pudo anular",
                text: msg,
                confirmButtonColor: "#007bff"
            });
        } else {
            alert("No se pudo anular la nota de crédito:\n" + msg);
        }
    });
}

// ==============================================================
// 🚀 Inicialización (cuando carga la página)
// ==============================================================
document.addEventListener("DOMContentLoaded", function () {
    try {
        window.KiusiUI?.renderNavbar && window.KiusiUI.renderNavbar();
    } catch (e) {
        console.warn("Navbar no disponible:", e);
    }

    let usuario = null;
    try {
        usuario = JSON.parse(localStorage.getItem("usuario") || "null");
    } catch (e) { usuario = null; }

    if (!usuario) {
        if (window.Swal) {
            Swal.fire({
                icon: "info",
                title: "Inicia sesión",
                text: "Debes iniciar sesión para acceder a esta sección.",
                confirmButtonColor: "#007bff"
            }).then(() => { window.location.href = "login.html"; });
        } else {
            window.location.href = "login.html";
        }
        return;
    }

    const rolStr = (usuario.rol || "(sin rol)").toUpperCase().trim();
    if (!ncRolPermitido(usuario)) {
        if (window.Swal) {
            Swal.fire({
                icon: "warning",
                title: "Acceso limitado",
                html: `
                    <p>Tu rol (<b>${rolStr}</b>) no tiene acceso oficial a notas de crédito.</p>
                    <p style="margin-top:8px; font-size:13px; color:#6c757d;">
                        Normalmente solo <b>ADMIN</b> y <b>CARTERA</b> pueden gestionar esta sección.
                    </p>
                `,
                confirmButtonColor: "#ff5a1f",
                showCancelButton: true,
                cancelButtonText: "Volver al inicio",
                confirmButtonText: "Continuar de todos modos"
            }).then(r => {
                if (!r.isConfirmed) {
                    window.location.href = "home.html";
                    return;
                }
                cargarNotas(true);
            });
            return;
        }
    }

    console.log(`[NC] Sesión OK. Usuario: ${usuario.username || "—"} | Rol: ${rolStr}`);
    cargarNotas(true);
});
