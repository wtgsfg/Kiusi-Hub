(function () {
    'use strict';

    let itemsFactura = [];
    let productosDisponibles = [];
    let itemsFacturaNotaCredito = [];
    let facturaIdNotaCredito = null;
    let facturaActual = null;
    let filtrosAplicados = {};

    const fmtCOP = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
    const fmtCOP2 = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 2 });

    function getFiltrosActuales() {
        const out = {};
        const fields = [
            { id: "filtroNro", key: "nroFactura", type: "number" },
            { id: "filtroFechaDesde", key: "fechaDesde", type: "string" },
            { id: "filtroFechaHasta", key: "fechaHasta", type: "string" },
            { id: "filtroCliente", key: "cliente", type: "string" },
            { id: "filtroVendedor", key: "vendedor", type: "string" },
            { id: "filtroEstado", key: "estado", type: "string" },
            { id: "filtroMinTotal", key: "minTotal", type: "number" },
            { id: "filtroMaxTotal", key: "maxTotal", type: "number" }
        ];
        fields.forEach(f => {
            const el = document.getElementById(f.id);
            if (!el) return;
            const val = el.value;
            if (val === "" || val == null) return;
            if (f.type === "number") {
                const n = parseFloat(val);
                if (!isNaN(n)) out[f.key] = n;
            } else {
                out[f.key] = val;
            }
        });
        return out;
    }

    function qs(params) {
        const p = new URLSearchParams();
        Object.keys(params || {}).forEach(k => {
            const v = params[k];
            if (v === "" || v == null) return;
            p.append(k, typeof v === "number" ? String(v) : String(v));
        });
        const s = p.toString();
        return s ? "?" + s : "";
    }

    function actualizarKPIs(resumen) {
        const kpiTF = document.getElementById("kpiTotalFacturado");
        const kpiTP = document.getElementById("kpiTotalPagado");
        const kpiPE = document.getElementById("kpiTotalPendiente");
        const kpiCant = document.getElementById("kpiCantidad");
        if (kpiTF) kpiTF.textContent = fmtCOP.format(Number((resumen && resumen.totalFacturado) || 0));
        if (kpiTP) kpiTP.textContent = fmtCOP.format(Number((resumen && resumen.totalPagado) || 0));
        if (kpiPE) kpiPE.textContent = fmtCOP.format(Number((resumen && resumen.totalPendiente) || 0));
        if (kpiCant) kpiCant.textContent = String((resumen && resumen.cantidad) || 0);
    }

    function cargarFacturas(params) {
        console.log("Cargando facturas...", params);
        const lista = document.getElementById("lista");
        if (!lista) return;
        lista.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; background: rgba(255,255,255,0.7); border-radius: 24px; border: 1px dashed #cbd5e1;">
                <p style="color: #64748b;">Cargando facturas...</p>
            </div>
        `;
        Promise.all([
            fetch("/api/facturas" + qs(params)).then(r => {
                if (!r.ok) throw new Error("Error " + r.status + " al cargar facturas");
                return r.json();
            }),
            fetch("/api/facturas/resumen" + qs(params)).then(r => {
                if (!r.ok) return {};
                return r.json();
            })
        ])
        .then(([data, resumen]) => {
            console.log("Datos de facturas:", data, "Resumen:", resumen);
            actualizarKPIs(resumen || {});
            lista.innerHTML = "";
            if (!data || data.length === 0) {
                lista.innerHTML = `
                    <div class="estado-vacio">
                        <span class="emoji">📭</span>
                        <h3>No hay facturas</h3>
                        <p>Prueba con otros filtros o registra pedidos para verlas aquí.</p>
                    </div>
                `;
                return;
            }
            data.forEach(f => {
                const saldoCalc = (Number(f.total || 0) - Number(f.pagado || 0));
                const saldo = (f.saldo != null && !isNaN(Number(f.saldo))) ? Number(f.saldo) : saldoCalc;
                const est = (f.estado && String(f.estado).toUpperCase() === "PAGADO") || saldo <= 0;
                const estadoClase = est ? "pagado" : "pendiente";
                const estadoTexto = est ? "Pagado ✅" : "Pendiente ❌";
                const cliente = f.cliente || f.nombreCliente || "—";
                const vendedor = f.vendedor || "—";
                const fechaTxt = f.fecha ? new Date(f.fecha).toLocaleDateString() : "—";

                const div = document.createElement("div");
                div.className = "factura-row";
                div.innerHTML = `
                    <div class="factura-header">
                        <div>
                            <h3 style="margin:0 0 6px 0; font-size: 20px; color:#0f172a;">Factura #${f.id}</h3>
                            <p style="margin: 0; color: #64748b; font-size: 14px;">
                                Pedido ID: #${f.pedidoId || "—"} | Fecha: ${fechaTxt}
                            </p>
                        </div>
                        <div class="factura-actions">
                            <button onclick="window.descargarFacturaPdf(${f.id})" class="btn-small btn-pdf">
                                📄 PDF
                            </button>
                            <button onclick="window.abrirModalNotaCredito(${f.id})" class="btn-small btn-nota">
                                Nota Crédito
                            </button>
                        </div>
                    </div>
                    <div class="factura-info">
                        <div class="info-item">
                            <span class="info-label">CLIENTE</span>
                            <span class="info-value">${cliente}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">VENDEDOR</span>
                            <span class="info-value">${vendedor}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">TOTAL</span>
                            <span class="info-value" style="color: #15803d; font-weight: 800;">${fmtCOP2.format(Number(f.total || 0))}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">PAGADO</span>
                            <span class="info-value">${fmtCOP2.format(Number(f.pagado || 0))}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">SALDO</span>
                            <span class="info-value" style="color: ${saldo > 0 ? '#dc2626' : '#16a34a'}; font-weight: 800;">${fmtCOP2.format(saldo)}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">ESTADO</span>
                            <span class="badge-estado ${estadoClase}">${estadoTexto}</span>
                        </div>
                    </div>
                `;
                lista.appendChild(div);
            });
        })
        .catch(err => {
            console.error("Error cargando facturas:", err);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al cargar las facturas: ' + err.message
            });
        });
    }

    function cargarSelects() {
        const selCliente = document.getElementById("filtroCliente");
        const selVendedor = document.getElementById("filtroVendedor");
        fetch("/api/facturas/clientes-lista")
            .then(r => r.ok ? r.json() : [])
            .then(list => {
                if (!selCliente) return;
                const actual = selCliente.value;
                selCliente.innerHTML = '<option value="">Todos los clientes</option>';
                (list || []).forEach(c => {
                    selCliente.innerHTML += `<option value="${c}">${c}</option>`;
                });
                selCliente.value = actual || "";
            })
            .catch(() => {});
        fetch("/api/facturas/vendedores-lista")
            .then(r => r.ok ? r.json() : [])
            .then(list => {
                if (!selVendedor) return;
                const actual = selVendedor.value;
                selVendedor.innerHTML = '<option value="">Todos los vendedores</option>';
                (list || []).forEach(v => {
                    selVendedor.innerHTML += `<option value="${v}">${v}</option>`;
                });
                selVendedor.value = actual || "";
            })
            .catch(() => {});
    }

    function aplicarFiltros() {
        filtrosAplicados = getFiltrosActuales();
        cargarFacturas(filtrosAplicados);
    }

    function resetearFiltros() {
        ["filtroNro", "filtroFechaDesde", "filtroFechaHasta", "filtroCliente", "filtroVendedor", "filtroEstado", "filtroMinTotal", "filtroMaxTotal"].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = "";
        });
        filtrosAplicados = {};
        cargarFacturas({});
    }

    function cargarProductos() {
        fetch("/api/productos/catalogo")
        .then(res => res.json())
        .then(data => {
            productosDisponibles = data;
            const select = document.getElementById("nuevoProducto");
            if (select) {
                select.innerHTML = '<option value="">Seleccionar producto...</option>';
                data.forEach(p => {
                    select.innerHTML += `<option value="${p.id}" data-precio="${p.precio}">${p.referencia ? '[' + p.referencia + '] ' : ''}${p.nombre}</option>`;
                });
            }
        });
    }

    function abrirModalEditar(id) {
        Promise.all([
            fetch(`/api/facturas/${id}`).then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            }),
            fetch("/api/productos/catalogo").then(res => res.json())
        ])
        .then(([factura, productos]) => {
            facturaActual = factura;
            productosDisponibles = productos;

            const modalFacturaId = document.getElementById("modalFacturaId");
            if (modalFacturaId) modalFacturaId.textContent = factura.id;
            const editCliente = document.getElementById("editCliente");
            if (editCliente) editCliente.value = factura.cliente || "";
            const editPagado = document.getElementById("editPagado");
            if (editPagado) editPagado.value = factura.pagado || 0;

            const select = document.getElementById("nuevoProducto");
            if (select) {
                select.innerHTML = '<option value="">Seleccionar producto...</option>';
                productos.forEach(p => {
                    select.innerHTML += `<option value="${p.id}" data-precio="${p.precio}">${p.referencia ? '[' + p.referencia + '] ' : ''}${p.nombre}</option>`;
                });
            }

            return fetch(`/api/items/pedido/${factura.pedidoId}`).then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            });
        })
        .then(items => {
            itemsFactura = items;
            renderizarItems();
            const modal = document.getElementById("modalEditar");
            if (modal) modal.classList.add("active");
        })
        .catch(err => {
            console.error("Error:", err);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al cargar la factura: ' + err.message
            });
        });
    }

    function renderizarItems() {
        const tbody = document.getElementById("itemsTableBody");
        if (!tbody) return;
        
        tbody.innerHTML = itemsFactura.map(item => `
            <tr data-item-id="${item.id}" data-original-cantidad="${item.cantidad}" data-original-precio="${item.precio}">
                <td>
                    <input type="text" value="${item.nombreProducto}" readonly style="background: #f8f9fa; border: none;">
                </td>
                <td>
                    <input type="number" value="${item.cantidad}" class="cantidad-input" min="1" onchange="window.calcularTotal()">
                </td>
                <td>
                    <input type="number" value="${item.precio}" class="precio-input" min="0" step="0.01" onchange="window.calcularTotal()">
                </td>
                <td class="item-total">$${(item.precio * item.cantidad).toFixed(2)}</td>
                <td>
                    <button onclick="window.eliminarItem(${item.id})" class="btn-danger">X</button>
                </td>
            </tr>
        `).join("");
        window.calcularTotal();
    }

    function calcularTotal() {
        let total = 0;
        const rows = document.querySelectorAll("#itemsTableBody tr");
        
        rows.forEach(row => {
            const cantidad = parseFloat(row.querySelector(".cantidad-input").value || "0");
            const precio = parseFloat(row.querySelector(".precio-input").value || "0");
            const subtotal = cantidad * precio;
            row.querySelector(".item-total").textContent = "$" + subtotal.toFixed(2);
            total += subtotal;
        });

        const totalFactura = document.getElementById("totalFactura");
        if (totalFactura) {
            totalFactura.textContent = "$" + total.toFixed(2);
        }
    }

    function agregarItem() {
        const productoIdEl = document.getElementById("nuevoProducto");
        const cantidadEl = document.getElementById("nuevaCantidad");
        const precioEl = document.getElementById("nuevoPrecio");
        const productoId = productoIdEl ? productoIdEl.value : "";
        const cantidad = parseInt(cantidadEl ? cantidadEl.value : "0", 10);
        const precio = parseFloat(precioEl ? precioEl.value : "0");

        if (!productoId || !cantidad || !precio) {
            Swal.fire({
                icon: 'warning',
                title: 'Campos incompletos',
                text: 'Por favor completa todos los campos'
            });
            return;
        }

        const producto = productosDisponibles.find(p => String(p.id) === String(productoId));
        if (!producto) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Producto no encontrado'
            });
            return;
        }

        if (producto.stock < cantidad) {
            Swal.fire({
                icon: 'error',
                title: 'Stock insuficiente',
                text: 'No hay suficiente stock para el producto: ' + producto.nombre
            });
            return;
        }

        console.log("Agregando item:", { pedidoId: facturaActual.pedidoId, productoId, cantidad, precio });

        fetch(`/api/items/with-price?pedidoId=${facturaActual.pedidoId}&productoId=${productoId}&cantidad=${cantidad}&precio=${precio}`, {
            method: "POST"
        })
        .then(res => {
            console.log("Respuesta del servidor:", res);
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then(nuevoItem => {
            console.log("Item agregado:", nuevoItem);
            itemsFactura.push(nuevoItem);
            renderizarItems();
            
            if (productoIdEl) productoIdEl.value = "";
            if (cantidadEl) cantidadEl.value = "";
            if (precioEl) precioEl.value = "";
            
            Swal.fire({
                icon: 'success',
                title: 'Item agregado',
                text: 'Producto agregado correctamente',
                timer: 1500
            });

            cargarProductos();
        })
        .catch(err => {
            console.error("Error al agregar item:", err);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err.message
            });
        });
    }

    function cerrarModal() {
        const modal = document.getElementById("modalEditar");
        if (modal) modal.classList.remove("active");
        facturaActual = null;
        itemsFactura = [];
    }

    function guardarEdicion() {
        if (!facturaActual) return;

        const totalFacturaEl = document.getElementById("totalFactura");
        const total = totalFacturaEl ? parseFloat(totalFacturaEl.textContent.replace(/[$,]/g, "")) : 0;
        const pagadoEl = document.getElementById("editPagado");
        const pagado = parseFloat((pagadoEl && pagadoEl.value) || "0");
        const saldo = total - pagado;
        const editClienteEl = document.getElementById("editCliente");

        const factura = {
            cliente: editClienteEl ? editClienteEl.value : "",
            total: total,
            pagado: pagado,
            saldo: saldo,
            estado: saldo <= 0 ? "PAGADO" : "PENDIENTE"
        };

        Swal.fire({
            title: '¿Estás seguro?',
            text: 'Se guardarán los cambios de la factura',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, guardar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (!result.isConfirmed) return;
            console.log("Guardando factura:", factura);
            fetch(`/api/facturas/${facturaActual.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(factura)
            })
            .then(res => {
                console.log("Respuesta de factura:", res);
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                const rows = document.querySelectorAll("#itemsTableBody tr");
                const promises = [];
                
                rows.forEach(row => {
                    const itemId = parseInt(row.dataset.itemId, 10);
                    const cantidad = parseInt(row.querySelector(".cantidad-input").value, 10);
                    const precio = parseFloat(row.querySelector(".precio-input").value || "0");
                    const originalPrecio = parseFloat(row.dataset.originalPrecio || "0");
                    
                    const item = itemsFactura.find(i => i.id === itemId);
                    
                    if (item) {
                        console.log("Actualizando item:", { itemId, cantidad, precio, originalPrecio });
                        if (precio !== originalPrecio) {
                            promises.push(
                                fetch(`/api/items/${itemId}/price?cantidad=${cantidad}&precio=${precio}`, {
                                    method: "PUT"
                                }).then(r => {
                                    if (!r.ok) throw new Error(`Error updating item ${itemId}`);
                                    return r;
                                })
                            );
                        } else {
                            promises.push(
                                fetch(`/api/items/${itemId}?cantidad=${cantidad}`, {
                                    method: "PUT"
                                }).then(r => {
                                    if (!r.ok) throw new Error(`Error updating item ${itemId}`);
                                    return r;
                                })
                            );
                        }
                    }
                });

                Promise.all(promises).then(() => {
                    console.log("Todos los items actualizados");
                    Swal.fire({
                        icon: 'success',
                        title: 'Guardado',
                        text: 'Factura actualizada correctamente',
                        timer: 1500
                    }).then(() => {
                        cerrarModal();
                        cargarFacturas(filtrosAplicados);
                    });
                }).catch(err => {
                    console.error("Error al actualizar items:", err);
                    throw err;
                });
            })
            .catch(err => {
                console.error("Error al guardar factura:", err);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Error al guardar los cambios: ' + err.message
                });
            });
        });
    }

    function eliminarItem(id) {
        Swal.fire({
            title: '¿Estás seguro?',
            text: 'Se eliminará este item y se devolverá al stock',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (!result.isConfirmed) return;
            console.log("Eliminando item:", id);
            fetch(`/api/items/${id}`, {
                method: "DELETE"
            })
            .then(res => {
                console.log("Respuesta de eliminación:", res);
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                itemsFactura = itemsFactura.filter(i => i.id !== id);
                renderizarItems();
                Swal.fire({
                    icon: 'success',
                    title: 'Eliminado',
                    text: 'Item eliminado correctamente',
                    timer: 1500
                });
                cargarProductos();
            })
            .catch(err => {
                console.error("Error al eliminar item:", err);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Error al eliminar el item: ' + err.message
                });
            });
        });
    }

    function eliminarFactura(id) {
        Swal.fire({
            title: '¿Estás seguro?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (!result.isConfirmed) return;
            console.log("Eliminando factura:", id);
            fetch(`/api/facturas/${id}`, {
                method: "DELETE"
            })
            .then(res => {
                console.log("Respuesta de eliminación de factura:", res);
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                Swal.fire({
                    icon: 'success',
                    title: 'Eliminado',
                    text: 'Factura eliminada correctamente',
                    timer: 1500
                }).then(() => {
                    cargarFacturas(filtrosAplicados);
                });
            })
            .catch(err => {
                console.error("Error al eliminar factura:", err);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Error al eliminar la factura: ' + err.message
                });
            });
        });
    }

    function pagar() {
        const facturaIdEl = document.getElementById("facturaId");
        const montoEl = document.getElementById("monto");
        const metodoPagoEl = document.getElementById("metodoPago");
        const facturaId = facturaIdEl ? facturaIdEl.value : "";
        const monto = montoEl ? montoEl.value : "";
        const metodoPago = metodoPagoEl ? metodoPagoEl.value : "";

        if (!facturaId || !monto) {
            Swal.fire({
                icon: 'warning',
                title: 'Campos incompletos',
                text: 'Por favor completa el ID de factura y el monto'
            });
            return;
        }

        let url = `/api/recaudos?facturaId=${encodeURIComponent(facturaId)}&monto=${encodeURIComponent(monto)}`;
        if (metodoPago && metodoPago.trim()) {
            url += `&metodoPago=${encodeURIComponent(metodoPago.trim())}`;
        }

        fetch(url, {
            method: "POST"
        })
        .then(res => {
            if (res.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Pago registrado',
                    text: 'Pago registrado correctamente',
                    timer: 1500
                }).then(() => {
                    if (facturaIdEl) facturaIdEl.value = "";
                    if (montoEl) montoEl.value = "";
                    if (metodoPagoEl) metodoPagoEl.value = "";
                    cargarFacturas(filtrosAplicados);
                });
            } else {
                return res.text().then(t => {
                    let m = 'Error al registrar';
                    try {
                        const j = JSON.parse(t);
                        if (j && j.error) m = String(j.error);
                        else if (j && j.message) m = String(j.message);
                        else if (t) m = t;
                    } catch (_) { if (t) m = t; }
                    throw new Error(m);
                });
            }
        })
        .catch(err => {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err.message || 'Error al registrar el pago'
            });
        });
    }

    function descargarFacturaPdf(id) {
        console.log("Descargando factura PDF:", id);
        fetch(`/api/facturas/${id}/pdf`)
        .then(res => {
            if (!res.ok) throw new Error('Error al descargar el PDF');
            return res.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Factura-${id}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            Swal.fire({
                icon: 'success',
                title: 'Descarga completada',
                text: 'Factura descargada correctamente',
                timer: 1500
            });
        })
        .catch(err => {
            console.error("Error:", err);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al descargar la factura'
            });
        });
    }

    function abrirModalNotaCredito(id) {
        console.log('Opening nota de facturaId: ' + id);
        facturaIdNotaCredito = id;
        const modalFacturaId = document.getElementById("modalFacturaId");
        if (modalFacturaId) modalFacturaId.textContent = id;

        let pedidoIdTemp = null;

        Promise.all([
            fetch(`/api/facturas/${id}`).then(res => {
                if (!res.ok) throw new Error('Error al obtener la factura');
                return res.json();
            }),
            fetch(`/api/notas-credito/factura/${id}`).then(res => {
                if (!res.ok) return [];
                return res.json();
            })
        ])
        .then(([factura, notasExistentes]) => {
            console.log('Factura data:', factura);
            console.log('Notas existentes:', notasExistentes);
            if (!factura.pedidoId) {
                throw new Error('Esta factura no tiene pedido asociado');
            }
            pedidoIdTemp = factura.pedidoId;

            const cantidadesDevueltas = {};
            (notasExistentes || []).forEach(nota => {
                if (nota.anulada) return;
                (nota.items || []).forEach(item => {
                    if (!cantidadesDevueltas[item.itemPedidoId]) {
                        cantidadesDevueltas[item.itemPedidoId] = 0;
                    }
                    cantidadesDevueltas[item.itemPedidoId] += Number(item.cantidad) || 0;
                });
            });

            return fetch(`/api/items/pedido/${pedidoIdTemp}`)
                .then(res => {
                    if (!res.ok) throw new Error('Error al obtener los items del pedido');
                    return res.json();
                })
                .then(items => {
                    itemsFacturaNotaCredito = items.map(it => ({
                        ...it,
                        cantidadDevuelta: cantidadesDevueltas[it.id] || 0,
                        cantidadDisponible: (it.cantidad || 0) - (cantidadesDevueltas[it.id] || 0)
                    }));
                    renderizarItemsNotaCredito();
                    const modal = document.getElementById("modalNotaCredito");
                    if (modal) modal.classList.add("active");
                });
        })
        .catch(err => {
            console.error('Error completo:', err);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err.message || 'Ocurrió un error inesperado'
            });
        });
    }

    function cerrarModalNotaCredito() {
        const modal = document.getElementById("modalNotaCredito");
        if (modal) modal.classList.remove("active");
        facturaIdNotaCredito = null;
        itemsFacturaNotaCredito = [];
        const motivo = document.getElementById("motivoNotaCredito");
        if (motivo) motivo.value = "";
        const tbody = document.getElementById("itemsNotaCreditoTableBody");
        if (tbody) tbody.innerHTML = "";
        const total = document.getElementById("totalNotaCredito");
        if (total) total.textContent = "$0.00";
    }

    function renderizarItemsNotaCredito() {
        const tbody = document.getElementById("itemsNotaCreditoTableBody");
        if (!tbody) return;
        tbody.innerHTML = "";

        itemsFacturaNotaCredito.forEach((item, index) => {
            const precio = item.precioUnitario != null ? item.precioUnitario : item.precio;
            const cantFacturada = item.cantidad || 0;
            const cantDevuelta = item.cantidadDevuelta || 0;
            const cantDisponible = item.cantidadDisponible != null ? item.cantidadDisponible : (cantFacturada - cantDevuelta);
            const sinDisponibilidad = cantDisponible <= 0;
            const bgRow = sinDisponibilidad ? "background: #fef9f9;" : "";

            const tr = document.createElement("tr");
            tr.style = bgRow;
            tr.innerHTML = `
                <td style="text-align:center;">
                    <input type="checkbox" id="item-${index}" onchange="window.onCambiarCheckboxItem(${index})" ${sinDisponibilidad ? "disabled" : ""}>
                </td>
                <td>
                    <input type="text" value="${item.nombreProducto}" readonly style="background: #f8f9fa; border: none; width: 100%; ${sinDisponibilidad ? "color:#999;" : ""}">
                </td>
                <td style="text-align:center; font-weight:600;">
                    ${cantFacturada}
                </td>
                <td style="text-align:center; color:#856404; font-weight:600;">
                    ${cantDevuelta}
                </td>
                <td style="text-align:center; ${sinDisponibilidad ? "color:#dc3545;" : "color:#28a745;"} font-weight:800;">
                    ${cantDisponible}
                </td>
                <td>
                    <input type="number" value="0" min="0" max="${cantDisponible}" id="cantidad-devolver-${index}"
                        onchange="window.onCambiarCantidadItem(${index})" oninput="window.onCambiarCantidadItem(${index})"
                        style="width: 100%; text-align:center;"
                        ${sinDisponibilidad ? "disabled" : ""}>
                </td>
                <td>
                    <input type="number" value="${precio}" step="0.01" readonly id="precio-${index}" style="width: 100%;">
                </td>
                <td id="subtotal-${index}" style="font-weight:600;">$0.00</td>
            `;
            tbody.appendChild(tr);
        });
    }

    function onCambiarCheckboxItem(index) {
        const checkbox = document.getElementById(`item-${index}`);
        const inputCantidad = document.getElementById(`cantidad-devolver-${index}`);
        if (!checkbox || !inputCantidad) return;

        const item = itemsFacturaNotaCredito[index];
        if (!item) return;

        const maxDisp = item.cantidadDisponible != null ? item.cantidadDisponible : (item.cantidad - (item.cantidadDevuelta || 0));
        if (checkbox.checked) {
            const actual = parseInt(inputCantidad.value || "0", 10);
            if (actual <= 0) {
                const poner = maxDisp >= 1 ? 1 : maxDisp;
                inputCantidad.value = poner;
            } else if (actual > maxDisp) {
                inputCantidad.value = maxDisp;
            }
        }
        calcularTotalNotaCredito();
    }

    function onCambiarCantidadItem(index) {
        const checkbox = document.getElementById(`item-${index}`);
        const inputCantidad = document.getElementById(`cantidad-devolver-${index}`);
        if (!checkbox || !inputCantidad) return;

        const item = itemsFacturaNotaCredito[index];
        if (!item) return;

        const maxDisp = item.cantidadDisponible != null ? item.cantidadDisponible : (item.cantidad - (item.cantidadDevuelta || 0));
        let cantRaw = parseInt(inputCantidad.value || "0", 10);
        if (cantRaw < 0) cantRaw = 0;
        if (cantRaw > maxDisp) {
            cantRaw = maxDisp;
            inputCantidad.value = cantRaw;
        }
        if (cantRaw > 0) {
            checkbox.checked = true;
        }
        calcularTotalNotaCredito();
    }

    function calcularTotalNotaCredito() {
        let total = 0;

        itemsFacturaNotaCredito.forEach((item, index) => {
            const checkbox = document.getElementById(`item-${index}`);
            const inputCantidad = document.getElementById(`cantidad-devolver-${index}`);
            const precioEl = document.getElementById(`precio-${index}`);
            if (!precioEl) return;
            const precio = parseFloat(precioEl.value || "0");

            let cantidadDevolver = 0;
            if (inputCantidad && !inputCantidad.disabled) {
                const maxDisp = item.cantidadDisponible != null ? item.cantidadDisponible : (item.cantidad - (item.cantidadDevuelta || 0));
                let cantRaw = parseInt(inputCantidad.value || "0", 10);
                if (cantRaw < 0) cantRaw = 0;
                if (cantRaw > maxDisp) {
                    cantRaw = maxDisp;
                    inputCantidad.value = cantRaw;
                }
                cantidadDevolver = cantRaw;
            }

            const itemValido = checkbox && !checkbox.disabled && checkbox.checked && cantidadDevolver > 0;
            const sEl = document.getElementById(`subtotal-${index}`);
            if (itemValido) {
                const subtotal = cantidadDevolver * precio;
                total += subtotal;
                if (sEl) sEl.textContent = `$${subtotal.toFixed(2)}`;
            } else {
                if (sEl) sEl.textContent = "$0.00";
            }
        });

        const totalEl = document.getElementById("totalNotaCredito");
        if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
    }

    function generarNotaCredito() {
        const motivoEl = document.getElementById("motivoNotaCredito");
        const motivo = motivoEl ? motivoEl.value : "";
        const itemsSeleccionados = [];
        let tieneError = false;

        itemsFacturaNotaCredito.forEach((item, index) => {
            const checkbox = document.getElementById(`item-${index}`);
            const inputCantidad = document.getElementById(`cantidad-devolver-${index}`);
            const precioEl = document.getElementById(`precio-${index}`);
            const precio = parseFloat(((precioEl && precioEl.value) || item.precio || 0));

            if (!checkbox || !inputCantidad) return;

            let cantidadDevolver = parseInt(inputCantidad.value || "0", 10);
            const maxDisp = item.cantidadDisponible != null ? item.cantidadDisponible : (item.cantidad - (item.cantidadDevuelta || 0));

            if (checkbox.checked || cantidadDevolver > 0) {
                if (cantidadDevolver <= 0) return;
                if (cantidadDevolver > maxDisp) {
                    tieneError = true;
                    Swal.fire({
                        icon: 'warning',
                        title: 'Cantidad inválida',
                        text: `El producto '${item.nombreProducto}' solo tiene ${maxDisp} unidades disponibles para devolver.`
                    });
                    return;
                }
                checkbox.checked = true;
                itemsSeleccionados.push({
                    itemPedidoId: item.id,
                    nombreProducto: item.nombreProducto,
                    cantidad: cantidadDevolver,
                    precioUnitario: precio,
                    subtotal: cantidadDevolver * precio
                });
            }
        });

        if (tieneError) return;

        if (!motivo || !motivo.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Campo incompleto',
                text: 'Por favor escribe el motivo de la nota de crédito'
            });
            return;
        }

        if (itemsSeleccionados.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Sin productos',
                text: 'Por favor selecciona y escribe la cantidad de al menos un producto para devolver'
            });
            return;
        }

        const totalCalculado = itemsSeleccionados.reduce((s, i) => s + i.subtotal, 0);

        const notaCredito = {
            facturaId: facturaIdNotaCredito,
            monto: totalCalculado,
            motivo: motivo.trim(),
            items: itemsSeleccionados
        };

        const itemsResumen = itemsSeleccionados.map(i =>
            `<li><b>${i.nombreProducto}</b>: ${i.cantidad} ud × ${fmtCOP2.format(Number(i.precioUnitario))} = <b>${fmtCOP2.format(Number(i.subtotal))}</b></li>`
        ).join("");

        Swal.fire({
            title: '¿Generar esta nota de crédito?',
            html: `
                <div style="text-align:left; padding: 6px 0;">
                    <p style="margin-bottom: 10px;"><b>Motivo:</b> ${motivo}</p>
                    <p style="margin-bottom: 8px;"><b>Productos a devolver:</b></p>
                    <ul style="color: #495057; font-size: 14px; line-height: 1.8; padding-left: 20px; margin: 0;">
                        ${itemsResumen}
                    </ul>
                    <div style="margin-top: 14px; padding: 12px; background: #fff3cd; border-radius: 10px; font-size: 13px; color: #856404;">
                        ✅ Los productos devueltos <b>regresarán al stock</b> automáticamente.<br>
                        ✅ El total de la factura <b>se reducirá en ${fmtCOP2.format(Number(totalCalculado))}</b>.
                    </div>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, generar nota',
            cancelButtonText: 'Cancelar',
            reverseButtons: true
        }).then((result) => {
            if (!result.isConfirmed) return;

            fetch('/api/notas-credito', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(notaCredito)
            })
            .then(res => {
                if (res.ok) {
                    return res.json();
                } else {
                    return res.text().then(text => {
                        let mensaje = 'Error al generar la nota de crédito';
                        try {
                            const json = JSON.parse(text);
                            if (json && typeof json === 'object') {
                                if (json.error) mensaje = String(json.error);
                                else if (json.message) mensaje = String(json.message);
                                else if (json.detalle) mensaje = String(json.detalle);
                                else mensaje = text;
                            } else {
                                mensaje = text;
                            }
                        } catch (_) {
                            if (text && text.trim()) mensaje = text;
                        }
                        throw new Error(mensaje || `Error ${res.status} al generar la nota`);
                    });
                }
            })
            .then((ncCreada) => {
                const idNc = ncCreada && ncCreada.id ? ` #${ncCreada.id}` : "";
                Swal.fire({
                    icon: 'success',
                    title: '¡Nota de crédito generada!',
                    html: `
                        <p>Nota de crédito${idNc} creada correctamente.</p>
                        <p style="margin-top: 8px; color: #28a745; font-weight: 600;">✅ Stock devuelto · Factura actualizada</p>
                    `,
                    timer: 2200
                }).then(() => {
                    cerrarModalNotaCredito();
                    cargarFacturas(filtrosAplicados);
                });
            })
            .catch(err => {
                console.error('Error al generar nota:', err);
                Swal.fire({
                    icon: 'error',
                    title: 'No se pudo generar',
                    text: (err && err.message) ? err.message : 'Ocurrió un error inesperado'
                });
            });
        });
    }

    // ---------- EXPORTS ----------
    window.aplicarFiltros = aplicarFiltros;
    window.resetearFiltros = resetearFiltros;
    window.cargarFacturas = cargarFacturas;
    window.agregarItem = agregarItem;
    window.cerrarModal = cerrarModal;
    window.guardarEdicion = guardarEdicion;
    window.eliminarItem = eliminarItem;
    window.eliminarFactura = eliminarFactura;
    window.abrirModalEditar = abrirModalEditar;
    window.pagar = pagar;
    window.calcularTotal = calcularTotal;
    window.descargarFacturaPdf = descargarFacturaPdf;
    window.abrirModalNotaCredito = abrirModalNotaCredito;
    window.cerrarModalNotaCredito = cerrarModalNotaCredito;
    window.generarNotaCredito = generarNotaCredito;
    window.onCambiarCheckboxItem = onCambiarCheckboxItem;
    window.onCambiarCantidadItem = onCambiarCantidadItem;

    document.addEventListener("DOMContentLoaded", function () {
        const usuarioStr = localStorage.getItem("usuario");
        const usuario = usuarioStr ? JSON.parse(usuarioStr) : null;
        if (!usuario) {
            window.location.href = "login.html";
            return;
        }
        if (usuario.rol !== "ADMIN" && usuario.rol !== "CARTERA") {
            Swal.fire({
                icon: 'error',
                title: 'Acceso denegado',
                text: 'No tienes acceso a facturación'
            }).then(() => {
                window.location.href = "home.html";
            });
            return;
        }

        const selProducto = document.getElementById("nuevoProducto");
        if (selProducto) {
            selProducto.addEventListener("change", function() {
                const selectedOption = this.options[this.selectedIndex];
                const precio = selectedOption && selectedOption.dataset ? selectedOption.dataset.precio : null;
                const nuevoPrecioEl = document.getElementById("nuevoPrecio");
                if (precio && nuevoPrecioEl) {
                    nuevoPrecioEl.value = precio;
                }
            });
        }

        console.log("Inicializando facturas...");
        cargarSelects();
        cargarFacturas({});
        cargarProductos();
        console.log("Facturas inicializadas");
    });

})();
