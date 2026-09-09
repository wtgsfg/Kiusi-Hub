
package com.kiusi.kiusihub.config;

import com.kiusi.kiusihub.repository.NotaCreditoRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.context.ApplicationContext;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Migración automática al arranque para la tabla notas_credito.
 * - Crea tablas si no existen
 * - Renombra la columna legacy `fecha` (palabra reservada MySQL) → `fecha_creacion`
 * - Agrega columnas faltantes (anulada / fecha_anulacion, etc.)
 * - Al terminar, resetea la caché de detección de columnas del NotaCreditoRepository.
 *
 * Cada ALTER se ejecuta con try/catch individual: la migración NUNCA rompe el arranque.
 */
@Component
public class DatabaseMigrationRunner {

    private final JdbcTemplate jdbcTemplate;
    private final ApplicationContext applicationContext;

    public DatabaseMigrationRunner(JdbcTemplate jdbcTemplate, ApplicationContext applicationContext) {
        this.jdbcTemplate = jdbcTemplate;
        this.applicationContext = applicationContext;
    }

    private boolean columnExists(String table, String column) {
        try {
            Integer n = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS " +
                            "WHERE TABLE_SCHEMA = DATABASE() " +
                            "AND TABLE_NAME = ? " +
                            "AND COLUMN_NAME = ?",
                    Integer.class, table, column);
            return n != null && n > 0;
        } catch (Exception e) {
            try {
                jdbcTemplate.queryForObject(
                        "SELECT " + column + " FROM " + table + " LIMIT 1",
                        (rs, i) -> 1);
                return true;
            } catch (Exception ex) {
                return false;
            }
        }
    }

    private void safeExec(String label, String sql, Object... args) {
        try {
            if (args == null || args.length == 0) {
                jdbcTemplate.update(sql);
            } else {
                jdbcTemplate.update(sql, args);
            }
            System.out.println("[DB Migration] ✓ OK: " + label);
        } catch (Exception e) {
            System.out.println("[DB Migration] ↷ skip (" + e.getMessage() + ") :: " + label);
        }
    }

    @PostConstruct
    public void migrate() {
        System.out.println("\n===== KiusiHub DB Migration (notas_credito, recaudos) =====");
        try {
            // --- RECAUDOS ---
            safeExec("CREATE recaudos IF NOT EXISTS",
                    "CREATE TABLE IF NOT EXISTS recaudos (" +
                            "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                            "factura_id BIGINT NOT NULL, " +
                            "monto DOUBLE NOT NULL, " +
                            "fecha DATETIME, " +
                            "metodo_pago VARCHAR(64))");
            if (!columnExists("recaudos", "metodo_pago")) {
                safeExec("recaudos ADD metodo_pago VARCHAR(64)",
                        "ALTER TABLE recaudos ADD COLUMN metodo_pago VARCHAR(64)");
            }
            if (!columnExists("recaudos", "fecha")) {
                safeExec("recaudos ADD fecha DATETIME",
                        "ALTER TABLE recaudos ADD COLUMN fecha DATETIME");
            }
            if (!columnExists("recaudos", "factura_id")) {
                safeExec("recaudos ADD factura_id BIGINT",
                        "ALTER TABLE recaudos ADD COLUMN factura_id BIGINT NOT NULL DEFAULT 0");
            }

            // --- PRODUCTOS ---
            safeExec("CREATE productos IF NOT EXISTS",
                    "CREATE TABLE IF NOT EXISTS productos (" +
                            "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                            "nombre VARCHAR(255) NOT NULL, " +
                            "descripcion VARCHAR(500), " +
                            "precio DOUBLE NOT NULL DEFAULT 0, " +
                            "stock INT NOT NULL DEFAULT 0, " +
                            "categoria VARCHAR(128), " +
                            "imagen_url VARCHAR(500), " +
                            "activo TINYINT(1) DEFAULT 1, " +
                            "referencia VARCHAR(128))");
            if (!columnExists("productos", "referencia")) {
                safeExec("productos ADD referencia VARCHAR(128)",
                        "ALTER TABLE productos ADD COLUMN referencia VARCHAR(128)");
            }
            if (!columnExists("productos", "categoria")) {
                safeExec("productos ADD categoria VARCHAR(128)",
                        "ALTER TABLE productos ADD COLUMN categoria VARCHAR(128)");
            }
            if (!columnExists("productos", "imagen_url")) {
                safeExec("productos ADD imagen_url VARCHAR(500)",
                        "ALTER TABLE productos ADD COLUMN imagen_url VARCHAR(500)");
            }
            if (!columnExists("productos", "activo")) {
                safeExec("productos ADD activo TINYINT(1) DEFAULT 1",
                        "ALTER TABLE productos ADD COLUMN activo TINYINT(1) DEFAULT 1");
            }

            // --- RESERVAS DE STOCK (bloqueo temporal por vendedor) ---
            safeExec("CREATE reservas_stock IF NOT EXISTS",
                    "CREATE TABLE IF NOT EXISTS reservas_stock (" +
                            "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                            "producto_id BIGINT NOT NULL, " +
                            "vendedor_username VARCHAR(128) NOT NULL, " +
                            "cantidad INT NOT NULL DEFAULT 0, " +
                            "created_at DATETIME NOT NULL, " +
                            "expires_at DATETIME NOT NULL, " +
                            "INDEX idx_reservas_producto (producto_id), " +
                            "INDEX idx_reservas_vendedor (vendedor_username), " +
                            "INDEX idx_reservas_expira (expires_at), " +
                            "UNIQUE KEY uk_reserva_producto_vendedor (producto_id, vendedor_username))");
            if (!columnExists("reservas_stock", "producto_id")) {
                safeExec("reservas_stock ADD producto_id BIGINT",
                        "ALTER TABLE reservas_stock ADD COLUMN producto_id BIGINT NOT NULL DEFAULT 0");
            }
            if (!columnExists("reservas_stock", "vendedor_username")) {
                safeExec("reservas_stock ADD vendedor_username VARCHAR(128)",
                        "ALTER TABLE reservas_stock ADD COLUMN vendedor_username VARCHAR(128) NOT NULL DEFAULT ''");
            }
            if (!columnExists("reservas_stock", "cantidad")) {
                safeExec("reservas_stock ADD cantidad INT",
                        "ALTER TABLE reservas_stock ADD COLUMN cantidad INT NOT NULL DEFAULT 0");
            }
            if (!columnExists("reservas_stock", "created_at")) {
                safeExec("reservas_stock ADD created_at DATETIME",
                        "ALTER TABLE reservas_stock ADD COLUMN created_at DATETIME");
            }
            if (!columnExists("reservas_stock", "expires_at")) {
                safeExec("reservas_stock ADD expires_at DATETIME",
                        "ALTER TABLE reservas_stock ADD COLUMN expires_at DATETIME");
            }
            // Limpieza inicial de reservas vencidas al arrancar
            try {
                int n = jdbcTemplate.update("DELETE FROM reservas_stock WHERE expires_at < NOW()");
                if (n > 0) System.out.println("[DB Migration] ✓ Limpieza inicial: " + n + " reserva(s) vencidas borradas");
            } catch (Exception e) {
                System.out.println("[DB Migration] ↷ No se pudo limpiar reservas vencidas (no crítico): " + e.getMessage());
            }

            // --- NOTAS CREDITO ---
            // 1. Crear tablas si no existen
            safeExec("CREATE notas_credito IF NOT EXISTS",
                    "CREATE TABLE IF NOT EXISTS notas_credito (" +
                            "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                            "factura_id BIGINT NOT NULL, " +
                            "monto DECIMAL(10,2) NOT NULL, " +
                            "motivo VARCHAR(255), " +
                            "fecha_creacion DATE, " +
                            "anulada BOOLEAN DEFAULT FALSE, " +
                            "fecha_anulacion DATE)");

            safeExec("CREATE items_nota_credito IF NOT EXISTS",
                    "CREATE TABLE IF NOT EXISTS items_nota_credito (" +
                            "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                            "nota_credito_id BIGINT NOT NULL, " +
                            "item_pedido_id BIGINT NOT NULL, " +
                            "producto_id BIGINT, " +
                            "nombre_producto VARCHAR(255), " +
                            "cantidad INT NOT NULL, " +
                            "precio_unitario DECIMAL(10,2) NOT NULL, " +
                            "subtotal DECIMAL(10,2) NOT NULL)");

            // 2. Detectar nombres de columnas actuales
            boolean hasFecha = columnExists("notas_credito", "fecha");
            boolean hasFechaCreacion = columnExists("notas_credito", "fecha_creacion");

            // 3. Rename legacy fecha → fecha_creacion
            if (hasFecha && !hasFechaCreacion) {
                try {
                    jdbcTemplate.update("ALTER TABLE notas_credito RENAME COLUMN fecha TO fecha_creacion");
                    System.out.println("[DB Migration] ✓ RENAME COLUMN fecha → fecha_creacion (MySQL 8)");
                    hasFecha = false; hasFechaCreacion = true;
                } catch (Exception e1) {
                    try {
                        jdbcTemplate.update("ALTER TABLE notas_credito CHANGE COLUMN fecha fecha_creacion DATE");
                        System.out.println("[DB Migration] ✓ CHANGE COLUMN fecha → fecha_creacion");
                        hasFecha = false; hasFechaCreacion = true;
                    } catch (Exception e2) {
                        System.out.println("[DB Migration] ↷ No se pudo renombrar fecha; el Repository usa modo dual: " + e2.getMessage());
                    }
                }
            }

            // 4. Agregar columnas faltantes
            if (!hasFechaCreacion && !hasFecha) {
                safeExec("ADD fecha_creacion DATE",
                        "ALTER TABLE notas_credito ADD COLUMN fecha_creacion DATE");
            }
            if (!columnExists("notas_credito", "anulada")) {
                safeExec("ADD anulada BOOLEAN",
                        "ALTER TABLE notas_credito ADD COLUMN anulada BOOLEAN DEFAULT FALSE");
            }
            if (!columnExists("notas_credito", "fecha_anulacion")) {
                safeExec("ADD fecha_anulacion DATE",
                        "ALTER TABLE notas_credito ADD COLUMN fecha_anulacion DATE");
            }
            if (!columnExists("notas_credito", "motivo")) {
                safeExec("ADD motivo VARCHAR(255)",
                        "ALTER TABLE notas_credito ADD COLUMN motivo VARCHAR(255)");
            }
            if (!columnExists("notas_credito", "factura_id")) {
                safeExec("ADD factura_id BIGINT",
                        "ALTER TABLE notas_credito ADD COLUMN factura_id BIGINT NOT NULL DEFAULT 0");
            }
            if (!columnExists("notas_credito", "monto")) {
                safeExec("ADD monto DECIMAL(10,2)",
                        "ALTER TABLE notas_credito ADD COLUMN monto DECIMAL(10,2) NOT NULL DEFAULT 0");
            }

            // 5. Items_nota_credito: agregar columnas faltantes
            safeExec("items_nota_credito ADD producto_id",
                    "ALTER TABLE items_nota_credito ADD COLUMN producto_id BIGINT");
            safeExec("items_nota_credito ADD nombre_producto",
                    "ALTER TABLE items_nota_credito ADD COLUMN nombre_producto VARCHAR(255)");
            safeExec("items_nota_credito ADD precio_unitario",
                    "ALTER TABLE items_nota_credito ADD COLUMN precio_unitario DECIMAL(10,2) NOT NULL DEFAULT 0");
            safeExec("items_nota_credito ADD subtotal",
                    "ALTER TABLE items_nota_credito ADD COLUMN subtotal DECIMAL(10,2) NOT NULL DEFAULT 0");

            // 6. Resetear caché del NotaCreditoRepository para que detecte la nueva columna
            try {
                NotaCreditoRepository repo = applicationContext.getBean(NotaCreditoRepository.class);
                java.lang.reflect.Field f = NotaCreditoRepository.class.getDeclaredField("columnaFechaCreacionExiste");
                f.setAccessible(true);
                f.set(repo, null);
                System.out.println("[DB Migration] ✓ Caché NotaCreditoRepository reseteada");
            } catch (Exception e) {
                System.out.println("[DB Migration] ↷ No se pudo resetear caché (no crítico): " + e.getMessage());
            }
        } catch (Exception e) {
            System.err.println("[DB Migration] ERROR general: " + e.getMessage());
            e.printStackTrace(System.err);
        }
        System.out.println("================================================\n");
    }
}
