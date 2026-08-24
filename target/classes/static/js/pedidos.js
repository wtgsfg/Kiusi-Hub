// 🔐 PROTECCIÓN POR ROL
const usuario = JSON.parse(localStorage.getItem("usuario"));

if (!usuario) {
    window.location.href = "login.html";
}

// 🔥 SOLO ADMIN Y VENDEDOR
if (usuario.rol !== "ADMIN" && usuario.rol !== "VENDEDOR") {
    alert("No tienes acceso a pedidos");
    window.location.href = "home.html";
}

// 📦 FUNCIONES
function cargarPedidos() {
    fetch("/api/pedidos")
        .then(res => res.json())
        .then(data => {
            const lista = document.getElementById("lista");
            lista.innerHTML = "";

            const pedidos = (Array.isArray(data) ? data : []).filter(p => {
                if (usuario.rol === "VENDEDOR") {
                    return p.vendedor === usuario.username;
                }
                return true;
            });

            pedidos.forEach(p => {
                const div = document.createElement("div");
                div.className = "card";

                let buttonsHtml = `<button class="btn-primary" onclick="verItems(${p.id})">Ver Items</button>`;
                
                if (p.estado === 'RECIBIDO') {
                    buttonsHtml = `<button class="btn-primary" style="background: #17a2b8;" onclick="descargarOrdenVentaPdf(${p.id})">📄 Orden de Venta</button>` + buttonsHtml;
                }

                div.innerHTML = `
                    <h3>Pedido #${p.id}</h3>
                    <p><strong>Cliente:</strong> ${p.cliente}</p>
                    <p><strong>Vendedor:</strong> ${p.vendedor}</p>
                    <p><strong>Estado:</strong> <span class="badge ${p.estado.toLowerCase()}">${p.estado}</span></p>
                    <p><strong>Fecha:</strong> ${new Date(p.fecha).toLocaleString()}</p>

                    <div class="card-buttons">
                        ${buttonsHtml}
                    </div>
                `;

                lista.appendChild(div);
            });
        });
}

let clientes = [];

function cargarClientes() {
    const select = document.getElementById("cliente-select");
    if (!select) return;

    fetch("/api/clientes")
        .then(res => res.json())
        .then(data => {
            const lista = Array.isArray(data) ? data : [];
            clientes = lista.filter(c => {
                if (usuario.rol === "VENDEDOR") {
                    return (c?.vendedor || "") === usuario.username;
                }
                return true;
            });

            select.innerHTML = `<option value="">Selecciona un cliente</option>`;
            clientes.forEach(c => {
                const option = document.createElement("option");
                option.value = String(c.id);

                const ciudad = (c.ciudad || "").trim();
                option.textContent = ciudad ? `${c.nombre} (${ciudad})` : c.nombre;

                option.dataset.nombre = c.nombre || "";
                select.appendChild(option);
            });

            const clienteIdGuardado = localStorage.getItem("pedidoClienteId");
            if (clienteIdGuardado) {
                select.value = clienteIdGuardado;
            }
        })
        .catch(() => {
            select.innerHTML = `<option value="">No se pudieron cargar clientes</option>`;
        });
}

function iniciarPedido() {
    const select = document.getElementById("cliente-select");
    const clienteId = (select?.value || "").trim();
    if (!clienteId) {
        alert("Primero selecciona el cliente");
        return;
    }

    const option = select.options[select.selectedIndex];
    const nombre = (option?.dataset?.nombre || option?.textContent || "").trim();
    if (!nombre) {
        alert("Cliente inválido");
        return;
    }

    localStorage.setItem("pedidoClienteId", clienteId);
    localStorage.setItem("pedidoCliente", nombre);
    localStorage.setItem("pedidoVendedor", usuario.username);
    localStorage.removeItem("carritoPedido");

    window.location.href = "catalogo.html";
}

function limpiarCliente() {
    const select = document.getElementById("cliente-select");
    if (select) select.value = "";
    localStorage.removeItem("pedidoClienteId");
    localStorage.removeItem("pedidoCliente");
}

function mostrarFormularioCliente() {
    const section = document.getElementById("nuevo-cliente");
    if (!section) return;
    section.style.display = "grid";

    const vendedorLabel = document.getElementById("nuevoClienteVendedor");
    if (vendedorLabel) vendedorLabel.textContent = usuario.username;
}

function ocultarFormularioCliente() {
    const section = document.getElementById("nuevo-cliente");
    if (!section) return;
    section.style.display = "none";

    const campos = ["nuevoClienteNombre", "nuevoClienteCiudad", "nuevoClienteDireccion", "nuevoClienteNit", "nuevoClienteNumero"];
    campos.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });
}

function crearCliente() {
    const nombre = (document.getElementById("nuevoClienteNombre")?.value || "").trim();
    if (!nombre) {
        alert("El nombre del cliente es obligatorio");
        return;
    }

    const payload = {
        nombre,
        ciudad: (document.getElementById("nuevoClienteCiudad")?.value || "").trim(),
        direccion: (document.getElementById("nuevoClienteDireccion")?.value || "").trim(),
        nit: (document.getElementById("nuevoClienteNit")?.value || "").trim(),
        numero: (document.getElementById("nuevoClienteNumero")?.value || "").trim(),
        vendedor: usuario.username
    };

    fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
        .then(async res => {
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Error creando cliente");
            }
            return res.json();
        })
        .then(clienteCreado => {
            ocultarFormularioCliente();
            cargarClientes();

            localStorage.setItem("pedidoClienteId", String(clienteCreado.id));
            localStorage.setItem("pedidoCliente", (clienteCreado.nombre || "").trim());

            const select = document.getElementById("cliente-select");
            if (select) select.value = String(clienteCreado.id);

            alert("✅ Cliente creado");
        })
        .catch(err => alert(`❌ No se pudo crear el cliente: ${err.message}`));
}

function verItems(id) {
    fetch(`/api/items/pedido/${id}`)
        .then(res => res.json())
        .then(data => {
            if (data.length === 0) {
                alert("El pedido no tiene productos.");
                return;
            }
            let texto = `Items del Pedido #${id}:\n\n`;
            let total = 0;

            data.forEach(i => {
                texto += `• ${i.nombreProducto}\n  Cant: ${i.cantidad} | Subtotal: $${i.subtotal}\n\n`;
                total += i.subtotal;
            });

            texto += `Total Pedido: $${total}`;
            alert(texto);
        });
}

function descargarOrdenVentaPdf(id) {
    console.log("Descargando orden de venta PDF:", id);
    fetch(`/api/pedidos/${id}/pdf`)
    .then(res => {
        if (!res.ok) throw new Error('Error al descargar el PDF');
        return res.blob();
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Orden-Venta-${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        alert("✅ Orden de Venta descargada correctamente");
    })
    .catch(err => {
        console.error("Error:", err);
        alert("❌ Error al descargar la Orden de Venta");
    });
}

if (document.getElementById("vendedor-label")) {
    document.getElementById("vendedor-label").textContent = usuario.username;
}

cargarClientes();
cargarPedidos();
