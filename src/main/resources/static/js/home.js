window.KiusiUI?.renderNavbar();

// ⚡ ACCESOS RÁPIDOS (solo si hay sesión iniciada)
(function renderizarAccesosRapidos() {
    try {
        const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
        if (!usuario) return;

        const contenedor = document.getElementById("accesos-rapidos");
        const grid = document.getElementById("accesos-rapidos-grid");
        if (!contenedor || !grid) return;

        const rol = (usuario.rol || "").toUpperCase().trim();

        const todosAccesos = [
            {
                href: "notas-credito.html",
                icono: "💳",
                titulo: "Notas de Crédito",
                descripcion: "Gestiona devoluciones, ajustes y anulaciones de facturas.",
                color: "linear-gradient(135deg, #28a745 0%, #20c997 100%)",
                roles: ["ADMIN", "ADMINISTRADOR", "SUPER_ADMIN", "SUPERADMIN", "ROOT",
                        "CARTERA", "CARTERA_COBROS", "COBRANZA", "COBRANZAS"]
            },
            {
                href: "facturas.html",
                icono: "🧾",
                titulo: "Facturas",
                descripcion: "Ver facturas, registrar pagos y generar notas de crédito.",
                color: "linear-gradient(135deg, #ff5a1f 0%, #ff7a45 100%)",
                roles: ["ADMIN", "ADMINISTRADOR", "SUPER_ADMIN", "SUPERADMIN", "ROOT",
                        "CARTERA", "CARTERA_COBROS", "COBRANZA", "COBRANZAS"]
            },
            {
                href: "pedidos.html",
                icono: "📋",
                titulo: "Pedidos",
                descripcion: "Administra pedidos, cambia estados y revisa detalles.",
                color: "linear-gradient(135deg, #6f42c1 0%, #8c6cff 100%)",
                roles: ["ADMIN", "ADMINISTRADOR", "SUPER_ADMIN", "SUPERADMIN", "ROOT",
                        "VENDEDOR", "VENDEDORA", "VENTAS"]
            },
            {
                href: "index.html",
                icono: "📦",
                titulo: "Productos",
                descripcion: "Catálogo interno de productos, stock y precios.",
                color: "linear-gradient(135deg, #007bff 0%, #38a1ff 100%)",
                roles: ["ADMIN", "ADMINISTRADOR", "SUPER_ADMIN", "SUPERADMIN", "ROOT"]
            },
            {
                href: "usuarios.html",
                icono: "👥",
                titulo: "Usuarios",
                descripcion: "Administra usuarios, roles y permisos del sistema.",
                color: "linear-gradient(135deg, #e83e8c 0%, #ff6fa8 100%)",
                roles: ["ADMIN", "ADMINISTRADOR", "SUPER_ADMIN", "SUPERADMIN", "ROOT"]
            },
            {
                href: "bodeguero.html",
                icono: "🏪",
                titulo: "Bodega",
                descripcion: "Control de stock, inventario y movimientos de bodega.",
                color: "linear-gradient(135deg, #fd7e14 0%, #ffb366 100%)",
                roles: ["ADMIN", "ADMINISTRADOR", "SUPER_ADMIN", "SUPERADMIN", "ROOT",
                        "BODEGUERO", "BODEGA", "ALMACEN", "ALMACENISTA"]
            }
        ];

        const accesosVisibles = todosAccesos.filter(a => a.roles.includes(rol));
        if (accesosVisibles.length === 0) return;

        grid.innerHTML = accesosVisibles.map(a => `
            <a href="${a.href}" class="service-item"
               style="text-decoration: none; color: inherit; border-left: 4px solid transparent;
                      transition: transform 0.2s ease, box-shadow 0.2s ease;
                      background: white;"
               onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 10px 26px rgba(0,0,0,0.12)';"
               onmouseout="this.style.transform='';this.style.boxShadow='';">
                <span class="service-icon"
                      style="background: ${a.color}; color: white; padding: 14px;
                             border-radius: 16px; display: inline-flex; width: 56px; height: 56px;
                             align-items: center; justify-content: center; font-size: 26px;">
                    ${a.icono}
                </span>
                <h3>${a.titulo}</h3>
                <p>${a.descripcion}</p>
                <span class="home-link-btn">
                    Ir →
                </span>
            </a>
        `).join("");

        contenedor.style.display = "block";
    } catch (e) {
        console.error("Error renderizando accesos rápidos:", e);
    }
})();

// 🏠 LÓGICA ESPECÍFICA DEL HOME
const frasesColombianas = [
    "¡Qué chimba de equipo!",
    "Parce, la estamos rompiendo",
    "A todo dar con la actitud",
    "La vida es una vaina bella",
    "No hay mal que por bien no venga",
    "¡Qué chévere trabajar juntos!",
    "Con actitud todo se puede",
    "Más vale pájaro en mano que ciento volando",
    "Al que madruga Dios le ayuda",
    "La práctica hace al maestro"
];

const equiposData = {
    "Esteban": {
        avatar: "🦁",
        role: "CEO",
        caracteristicas: ["Liderazgo natural", "Visión estratégica", "Creatividad ilimitada", "Resolución de problemas", "Motivación del equipo"]
    },
    "Susana": {
        avatar: "👩‍💼",
        role: "Administradora",
        caracteristicas: ["Organización impecable", "Atención al detalle", "Gestión de procesos", "Comunicación efectiva", "Responsabilidad total"]
    },
    "Lina": {
        avatar: "👩‍💻",
        role: "Asistente Administrativa",
        caracteristicas: ["Eficiencia máxima", "Multitarea", "Soporte proactivo", "Amabilidad excepcional", "Resolución rápida"]
    },
    "Juan": {
        avatar: "💰",
        role: "Encargado de Cartera",
        caracteristicas: ["Precisión financiera", "Negociación experta", "Análisis detallado", "Confianza total", "Seguimiento riguroso"]
    },
    "Alvaro": {
        avatar: "📦",
        role: "Bodeguero",
        caracteristicas: ["Cuidado de inventario", "Logística perfecta", "Trabajo en equipo", "Eficiencia en envíos", "Responsabilidad"]
    },
    "Johan": {
        avatar: "📦",
        role: "Bodeguero",
        caracteristicas: ["Velocidad y precisión", "Mantenimiento de stock", "Colaboración", "Cuidado de productos", "Puntualidad"]
    },
    "Ana": {
        avatar: "🛍️",
        role: "Vendedora",
        caracteristicas: ["Atención personalizada", "Conocimiento de productos", "Persuasión natural", "Empatía", "Cierre de ventas"]
    },
    "Cristian": {
        avatar: "🛍️",
        role: "Vendedor",
        caracteristicas: ["Carisma único", "Asesoramiento experto", "Relación con clientes", "Energía positiva", "Resultados constantes"]
    }
};

function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function getRandomItems(array, count) {
    const shuffled = shuffleArray(array);
    return shuffled.slice(0, count);
}

function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

document.addEventListener("DOMContentLoaded", () => {
    const overlay = document.createElement("div");
    overlay.className = "team-popup-overlay";
    document.body.appendChild(overlay);

    const popup = document.createElement("div");
    popup.className = "team-popup";
    document.body.appendChild(popup);

    function closePopup() {
        popup.classList.remove("show");
        overlay.classList.remove("show");
    }

    overlay.addEventListener("click", closePopup);

    const teamCards = document.querySelectorAll(".team-card");
    teamCards.forEach(card => {
        card.style.cursor = "pointer";
        card.addEventListener("click", (e) => {
            const nameEl = card.querySelector(".team-name");
            const name = nameEl?.textContent || "";
            const data = equiposData[name];
            if (data) {
                const randomCaracteristicas = getRandomItems(data.caracteristicas, 3);
                const frase = getRandomItem(frasesColombianas);

                popup.innerHTML = `
                    <button class="popup-close" type="button">&times;</button>
                    <div class="popup-avatar">${data.avatar}</div>
                    <h3 class="popup-name">${name}</h3>
                    <p class="popup-role">${data.role}</p>
                    <div class="colombian-phrase">"${frase}"</div>
                    <ul class="popup-caracteristicas">
                        ${randomCaracteristicas.map(c => `<li>${c}</li>`).join("")}
                    </ul>
                `;

                const closeBtn = popup.querySelector(".popup-close");
                closeBtn.addEventListener("click", closePopup);

                popup.style.top = "50%";
                popup.style.left = "50%";
                popup.classList.add("show");
                overlay.classList.add("show");
            }
        });
    });
});
