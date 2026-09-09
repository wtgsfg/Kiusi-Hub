document.addEventListener("DOMContentLoaded", function() {
    const usuario = JSON.parse(localStorage.getItem("usuario"));

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

    let facturaActual = null;
    let itemsFactura = [];
    let productosDisponibles = [];
    let facturaIdNotaCredito = null;
    let itemsFacturaNotaCredito = [];

    const selectProducto = document.getElementById("nuevoProducto");
    if (selectProducto) {
        selectProducto.addEventListener("change", function() {
            const selectedOption = this.options[this.selectedIndex];
            const precio = selectedOption.dataset.precio;
            if (precio) {
                document.getElementById("nuevoPrecio").value = precio;
            }
        });
    }

    function cargarFacturas() {
        console.log("Cargando facturas...");
        fetch("/api/facturas")
        .then(res => {
            console.log("Respuesta recibida:", res);
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            console.log("Datos de facturas:", data);
            const lista = document.getElementById("lista");
            if (!lista) {
                console.error("No se encontró el elemento #lista");
                return;
            }
            lista.innerHTML = "";

            if (!data || data.length === 0) {
                lista.innerHTML = `
                    <div style="text-align: center; padding: 50px; background: white; border-radius: 8px;">
                        <p style="font-size: 18px; color: #6c757d;">No hay facturas registradas</p>
                    </div>
                `;
                return;
            }

            data.forEach(f => {
                const isPagada = f.estado === 'PAGADO' || f.saldo <= 0;
                const estadoClase = isPagada ? "despachado" : "pendiente";
                const estadoTexto = isPagada ? "Pagado ✅" : "Pendiente ❌";

                const div = document.createElement("div");
                div.className = "factura-row";
                div.innerHTML = `
                    <div class="factura-header">
                        <div>
                            <h3>Factura #${f.id}</h3>
                            <p style="margin: 5px 0; color: #6c757d; font-size: 14px;">
                                Pedido ID: #${f.pedidoId} | Fecha: ${new Date(f.fecha).toLocaleDateString()}
                            </p>
                        </div>
                        <div class="factura-actions">
                            <button onclick="descargarFacturaPdf(${f.id})" class="btn-small" style="background: #17a2b8; color: white;">
                                📄 PDF
                            </button>
                            <button onclick="abrirModalNotaCredito(${f.id})" class="btn-small" style="background: #ffc107; color: black;">
                                Nota Crédito
                            </button>
                        </div>
                    </div>
                    <div class="factura-info">
                        <div class="info-item">
                            <span class="info-label">CLIENTE</span>
                            <span class="info-value">${f.cliente}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">TOTAL</span>
                            <span class="info-value" style="color: var(--primary-color); font-weight: bold;">$${f.total}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">PAGADO</span>
                            <span class="info-value">$${f.pagado}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">SALDO</span>
                            <span class="info-value" style="color: ${f.saldo > 0 ? '#dc3545' : '#28a745'}; font-weight: bold;">$${f.saldo}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">ESTADO</span>
                            <span class="badge ${estadoClase}">${estadoTexto}</span>
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

            document.getElementById("modalFacturaId").textContent = factura.id;
            document.getElementById("editCliente").value = factura.cliente;
            document.getElementById("editPagado").value = factura.pagado;

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
            document.getElementById("modalEditar").classList.add("active");
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
                    <input type="number" value="${item.cantidad}" class="cantidad-input" min="1" onchange="calcularTotal()">
                </td>
                <td>
                    <input type="number" value="${item.precio}" class="precio-input" min="0" step="0.01" onchange="calcularTotal()">
                </td>
                <td class="item-total">$${(item.precio * item.cantidad).toFixed(2)}</td>
                <td>
                    <button onclick="eliminarItem(${item.id})" class="btn-danger">X</button>
                </td>
            </tr>
        `).join("");
        calcularTotal();
    }

    function calcularTotal() {
        let total = 0;
        const rows = document.querySelectorAll("#itemsTableBody tr");
        
        rows.forEach(row => {
            const cantidad = parseFloat(row.querySelector(".cantidad-input").value || 0);
            const precio = parseFloat(row.querySelector(".precio-input").value || 0);
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
        const productoId = document.getElementById("nuevoProducto").value;
        const cantidad = parseInt(document.getElementById("nuevaCantidad").value);
        const precio = parseFloat(document.getElementById("nuevoPrecio").value);

        if (!productoId || !cantidad || !precio) {
            Swal.fire({
                icon: 'warning',
                title: 'Campos incompletos',
                text: 'Por favor completa todos los campos'
            });
            return;
        }

        const producto = productosDisponibles.find(p => p.id == productoId);
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
            
            document.getElementById("nuevoProducto").value = "";
            document.getElementById("nuevaCantidad").value = "";
            document.getElementById("nuevoPrecio").value = "";
            
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
        document.getElementById("modalEditar").classList.remove("active");
        facturaActual = null;
        itemsFactura = [];
    }

    function guardarEdicion() {
        if (!facturaActual) return;

        const totalFacturaEl = document.getElementById("totalFactura");
        const total = totalFacturaEl ? parseFloat(totalFacturaEl.textContent.replace("$", "")) : 0;
        const pagado = parseFloat(document.getElementById("editPagado").value);
        const saldo = total - pagado;

        const factura = {
            cliente: document.getElementById("editCliente").value,
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
            if (result.isConfirmed) {
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
                    let promises = [];
                    
                    rows.forEach(row => {
                        const itemId = parseInt(row.dataset.itemId);
                        const cantidad = parseInt(row.querySelector(".cantidad-input").value);
                        const precio = parseFloat(row.querySelector(".precio-input").value);
                        const originalPrecio = parseFloat(row.dataset.originalPrecio);
                        
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
                            cargarFacturas();
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
            }
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
            if (result.isConfirmed) {
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
            }
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
            if (result.isConfirmed) {
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
                        cargarFacturas();
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
            }
        });
    }

    function pagar() {
        const facturaId = document.getElementById("facturaId").value;
        const monto = document.getElementById("monto").value;
        const metodoPagoEl = document.getElementById("metodoPago");
        const metodoPago = metodoPagoEl ? metodoPagoEl.value : "";

        if (!facturaId || !monto) {
            Swal.fire({
                icon: 'warning',
                title: 'Campos incompletos',
                text: 'Por favor completa el ID de factura y el monto'
            });
            return;
        }

        let url = `/api/recaudos?facturaId=${facturaId}&monto=${monto}`;
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
                    document.getElementById("facturaId").value = "";
                    document.getElementById("monto").value = "";
                    if (metodoPagoEl) metodoPagoEl.value = "";
                    cargarFacturas();
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
        document.getElementById("modalFacturaId").textContent = id;

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
                    document.getElementById("modalNotaCredito").classList.add("active");
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
        document.getElementById("modalNotaCredito").classList.remove("active");
        facturaIdNotaCredito = null;
        itemsFacturaNotaCredito = [];
        document.getElementById("motivoNotaCredito").value = "";
        document.getElementById("itemsNotaCreditoTableBody").innerHTML = "";
        document.getElementById("totalNotaCredito").textContent = "$0.00";
    }

    function renderizarItemsNotaCredito() {
        const tbody = document.getElementById("itemsNotaCreditoTableBody");
        tbody.innerHTML = "";

        itemsFacturaNotaCredito.forEach((item, index) => {
            const precio = item.precioUnitario || item.precio;
            const cantFacturada = item.cantidad || 0;
            const cantDevuelta = item.cantidadDevuelta || 0;
            const cantDisponible = item.cantidadDisponible != null ? item.cantidadDisponible : (cantFacturada - cantDevuelta);
            const sinDisponibilidad = cantDisponible <= 0;
            const bgRow = sinDisponibilidad ? "background: #fef9f9;" : "";

            const tr = document.createElement("tr");
            tr.style = bgRow;
            tr.innerHTML = `
                <td style="text-align:center;">
                    <input type="checkbox" id="item-${index}" onchange="onCambiarCheckboxItem(${index})" ${sinDisponibilidad ? "disabled" : ""}>
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
                        onchange="onCambiarCantidadItem(${index})" oninput="onCambiarCantidadItem(${index})"
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

    window.onCambiarCheckboxItem = function (index) {
        const checkbox = document.getElementById(`item-${index}`);
        const inputCantidad = document.getElementById(`cantidad-devolver-${index}`);
        if (!checkbox || !inputCantidad) return;

        const item = itemsFacturaNotaCredito[index];
        if (!item) return;

        const maxDisp = item.cantidadDisponible != null ? item.cantidadDisponible : (item.cantidad - (item.cantidadDevuelta || 0));
        if (checkbox.checked) {
            const actual = parseInt(inputCantidad.value) || 0;
            if (actual <= 0) {
                const poner = maxDisp >= 1 ? 1 : maxDisp;
                inputCantidad.value = poner;
            } else if (actual > maxDisp) {
                inputCantidad.value = maxDisp;
            }
        }
        calcularTotalNotaCredito();
    };

    window.onCambiarCantidadItem = function (index) {
        const checkbox = document.getElementById(`item-${index}`);
        const inputCantidad = document.getElementById(`cantidad-devolver-${index}`);
        if (!checkbox || !inputCantidad) return;

        const item = itemsFacturaNotaCredito[index];
        if (!item) return;

        const maxDisp = item.cantidadDisponible != null ? item.cantidadDisponible : (item.cantidad - (item.cantidadDevuelta || 0));
        let cantRaw = parseInt(inputCantidad.value) || 0;
        if (cantRaw < 0) cantRaw = 0;
        if (cantRaw > maxDisp) {
            cantRaw = maxDisp;
            inputCantidad.value = cantRaw;
        }
        if (cantRaw > 0) {
            checkbox.checked = true;
        }
        calcularTotalNotaCredito();
    };

    function calcularTotalNotaCredito() {
        let total = 0;

        itemsFacturaNotaCredito.forEach((item, index) => {
            const checkbox = document.getElementById(`item-${index}`);
            const inputCantidad = document.getElementById(`cantidad-devolver-${index}`);
            const precioEl = document.getElementById(`precio-${index}`);
            if (!precioEl) return;
            const precio = parseFloat(precioEl.value) || 0;

            let cantidadDevolver = 0;
            if (inputCantidad && !inputCantidad.disabled) {
                const maxDisp = item.cantidadDisponible != null ? item.cantidadDisponible : (item.cantidad - (item.cantidadDevuelta || 0));
                let cantRaw = parseInt(inputCantidad.value) || 0;
                if (cantRaw < 0) cantRaw = 0;
                if (cantRaw > maxDisp) {
                    cantRaw = maxDisp;
                    inputCantidad.value = cantRaw;
                }
                cantidadDevolver = cantRaw;
            }

            const itemValido = checkbox && !checkbox.disabled && checkbox.checked && cantidadDevolver > 0;
            if (itemValido) {
                const subtotal = cantidadDevolver * precio;
                total += subtotal;
                const sEl = document.getElementById(`subtotal-${index}`);
                if (sEl) sEl.textContent = `$${subtotal.toFixed(2)}`;
            } else {
                const sEl = document.getElementById(`subtotal-${index}`);
                if (sEl) sEl.textContent = "$0.00";
            }
        });

        const totalEl = document.getElementById("totalNotaCredito");
        if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
    }

    function generarNotaCredito() {
        const motivo = document.getElementById("motivoNotaCredito").value;
        const itemsSeleccionados = [];
        let tieneError = false;

        itemsFacturaNotaCredito.forEach((item, index) => {
            const checkbox = document.getElementById(`item-${index}`);
            const inputCantidad = document.getElementById(`cantidad-devolver-${index}`);
            const precio = parseFloat(document.getElementById(`precio-${index}`).value) || 0;

            if (!checkbox || !inputCantidad) return;

            let cantidadDevolver = parseInt(inputCantidad.value) || 0;
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
            `<li><b>${i.nombreProducto}</b>: ${i.cantidad} ud × $${Number(i.precioUnitario).toLocaleString("es-CO", {minimumFractionDigits: 2})} = <b>$${Number(i.subtotal).toLocaleString("es-CO", {minimumFractionDigits: 2})}</b></li>`
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
                        ✅ El total de la factura <b>se reducirá en $${Number(totalCalculado).toLocaleString("es-CO", {minimumFractionDigits: 2})}</b>.
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
                    cargarFacturas();
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

    console.log("Inicializando facturas...");
    cargarFacturas();
    cargarProductos();
    console.log("Facturas inicializadas");
});
