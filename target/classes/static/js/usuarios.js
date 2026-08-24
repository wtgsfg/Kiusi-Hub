// 🔐 PROTECCIÓN DE ADMIN
const usuarioSesion = JSON.parse(localStorage.getItem("usuario"));
if (!usuarioSesion || usuarioSesion.rol !== "ADMIN") {
    alert("Acceso denegado: Se requieren permisos de administrador.");
    window.location.href = "home.html";
}

// 🔄 CARGAR USUARIOS
function cargarUsuarios() {
    fetch("/api/usuarios")
        .then(res => res.json())
        .then(data => {
            const lista = document.getElementById("lista");
            lista.innerHTML = "";
            data.forEach(u => {
                lista.innerHTML += `
                <div class="card">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">👤</div>
                    <h3>${u.username}</h3>
                    <p><span class="badge ${u.rol.toLowerCase() === 'admin' ? 'despachado' : 'recibido'}">${u.rol}</span></p>
                    <div class="card-buttons">
                        <button class="btn-warning" onclick="editar(${u.id}, '${u.username}', '${u.rol}')">Editar</button>
                        <button class="btn-danger" onclick="eliminar(${u.id})" ${u.id === usuarioSesion.id ? 'disabled' : ''}>Eliminar</button>
                    </div>
                </div>
                `;
            });
        });
}

// 💾 GUARDAR / ACTUALIZAR
function guardar() {
    const id = document.getElementById("id").value;
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const rol = document.getElementById("rol").value;

    if (!username || (!id && !password) || !rol) {
        alert("Por favor completa todos los campos.");
        return;
    }

    const usuario = { username, rol };
    if (password) usuario.password = password; // Solo enviar si se cambió

    const url = id ? `/api/usuarios/${id}` : "/api/usuarios";
    const method = id ? "PUT" : "POST";

    fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(usuario)
    })
    .then(res => {
        if (res.ok) {
            alert("✅ Usuario guardado correctamente");
            limpiar();
            cargarUsuarios();
        } else {
            alert("❌ Error al guardar el usuario");
        }
    });
}

// ✏️ EDITAR
function editar(id, user, role) {
    document.getElementById("id").value = id;
    document.getElementById("username").value = user;
    document.getElementById("rol").value = role;
    document.getElementById("password").placeholder = "Dejar en blanco para no cambiar";
}

// 🗑️ ELIMINAR
function eliminar(id) {
    uiConfirm("¿Estás seguro de eliminar este usuario?").then(ok => {
        if (!ok) return;
        fetch(`/api/usuarios/${id}`, { method: "DELETE" })
            .then(res => {
                if (res.ok) {
                    cargarUsuarios();
                } else {
                    alert("No se pudo eliminar el usuario");
                }
            });
    });
}

// 🧹 LIMPIAR
function limpiar() {
    document.getElementById("id").value = "";
    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
    document.getElementById("password").placeholder = "Contraseña";
    document.getElementById("rol").value = "";
}

// Inicio
cargarUsuarios();
