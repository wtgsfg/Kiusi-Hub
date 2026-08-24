window.KiusiUI?.renderNavbar();

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
