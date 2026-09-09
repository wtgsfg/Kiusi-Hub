package com.kiusi.kiusihub.repository;

import com.kiusi.kiusihub.model.ReservaStock;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Repository
public class ReservaStockRepository {

    private final JdbcTemplate jdbcTemplate;

    public ReservaStockRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private static LocalDateTime tsLdt(Timestamp t) {
        return t == null ? null : t.toLocalDateTime();
    }

    private static final RowMapper<ReservaStock> ROW_MAPPER = (rs, rowNum) -> {
        ReservaStock r = new ReservaStock();
        r.setId(rs.getLong("id"));
        r.setProductoId(rs.getLong("producto_id"));
        r.setVendedorUsername(rs.getString("vendedor_username"));
        r.setCantidad(rs.getInt("cantidad"));
        r.setCreatedAt(tsLdt(rs.getTimestamp("created_at")));
        r.setExpiresAt(tsLdt(rs.getTimestamp("expires_at")));
        return r;
    };

    public int sumReservasActivasProducto(Long productoId) {
        try {
            String sql = "SELECT COALESCE(SUM(cantidad), 0) FROM reservas_stock WHERE producto_id = ? AND expires_at > NOW()";
            Integer n = jdbcTemplate.queryForObject(sql, Integer.class, productoId);
            return n == null ? 0 : n;
        } catch (Exception e) {
            return 0;
        }
    }

    public Map<Long, Integer> sumReservasActivasTodosLosProductos() {
        try {
            String sql = "SELECT producto_id, SUM(cantidad) AS total FROM reservas_stock WHERE expires_at > NOW() GROUP BY producto_id";
            return jdbcTemplate.query(sql, rs -> {
                Map<Long, Integer> m = new HashMap<>();
                while (rs.next()) {
                    m.put(rs.getLong("producto_id"), rs.getInt("total"));
                }
                return m;
            });
        } catch (Exception e) {
            return new HashMap<>();
        }
    }

    public ReservaStock findPorProductoYVendedor(Long productoId, String vendedorUsername) {
        try {
            String sql = "SELECT * FROM reservas_stock WHERE producto_id = ? AND vendedor_username = ? LIMIT 1";
            List<ReservaStock> list = jdbcTemplate.query(sql, ROW_MAPPER, productoId, vendedorUsername);
            return list.isEmpty() ? null : list.get(0);
        } catch (Exception e) {
            return null;
        }
    }

    public List<ReservaStock> findPorVendedor(String vendedorUsername) {
        try {
            String sql = "SELECT * FROM reservas_stock WHERE vendedor_username = ? AND expires_at > NOW()";
            return jdbcTemplate.query(sql, ROW_MAPPER, vendedorUsername);
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    public void borrarPorProductoYVendedor(Long productoId, String vendedorUsername) {
        try {
            jdbcTemplate.update("DELETE FROM reservas_stock WHERE producto_id = ? AND vendedor_username = ?",
                    productoId, vendedorUsername);
        } catch (Exception ignored) {
        }
    }

    public void borrarTodoPorVendedor(String vendedorUsername) {
        try {
            jdbcTemplate.update("DELETE FROM reservas_stock WHERE vendedor_username = ?", vendedorUsername);
        } catch (Exception ignored) {
        }
    }

    public int limpiarExpiradas() {
        try {
            return jdbcTemplate.update("DELETE FROM reservas_stock WHERE expires_at < NOW()");
        } catch (Exception e) {
            return 0;
        }
    }

    public void upsertCantidadFinal(Long productoId, String vendedorUsername, int cantidadFinal, LocalDateTime expiresAt) {
        Timestamp tsNow = Timestamp.valueOf(LocalDateTime.now());
        Timestamp tsExp = Timestamp.valueOf(expiresAt);
        if (cantidadFinal <= 0) {
            borrarPorProductoYVendedor(productoId, vendedorUsername);
            return;
        }
        // Intento 1: MySQL 8: INSERT ... ON DUPLICATE KEY UPDATE
        try {
            jdbcTemplate.update(
                    "INSERT INTO reservas_stock (producto_id, vendedor_username, cantidad, created_at, expires_at) " +
                            "VALUES (?, ?, ?, ?, ?) " +
                            "ON DUPLICATE KEY UPDATE cantidad = VALUES(cantidad), expires_at = VALUES(expires_at)",
                    productoId, vendedorUsername, cantidadFinal, tsNow, tsExp);
            return;
        } catch (Exception e1) {
            // Fallback: manual select then insert/update
        }
        try {
            ReservaStock existing = findPorProductoYVendedor(productoId, vendedorUsername);
            if (existing == null) {
                jdbcTemplate.update(
                        "INSERT INTO reservas_stock (producto_id, vendedor_username, cantidad, created_at, expires_at) VALUES (?, ?, ?, ?, ?)",
                        productoId, vendedorUsername, cantidadFinal, tsNow, tsExp);
            } else {
                jdbcTemplate.update(
                        "UPDATE reservas_stock SET cantidad = ?, expires_at = ? WHERE id = ?",
                        cantidadFinal, tsExp, existing.getId());
            }
        } catch (Exception e2) {
            System.err.println("ERROR upsertCantidadFinal: " + e2.getMessage());
        }
    }
}
