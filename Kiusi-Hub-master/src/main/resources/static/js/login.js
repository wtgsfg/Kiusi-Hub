function login() {
    const usernameInput = document.getElementById("username").value;
    const passwordInput = document.getElementById("password").value;

    fetch("/api/usuarios/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: usernameInput,
            password: passwordInput
        })
    })
    .then(res => {
        if (res.ok) {
            return res.json();
        }
        throw new Error("Credenciales incorrectas");
    })
    .then(data => {
        if (data && data.id) {
            localStorage.setItem("usuario", JSON.stringify(data));
            window.location.href = "home.html";
        }
    })
    .catch(err => {
        alert("❌ " + err.message);
    });
}

// Permitir login con la tecla Enter
document.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        login();
    }
});
