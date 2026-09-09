package com.kiusi.kiusihub.repository;

import com.kiusi.kiusihub.dto.RecaudoDetalle;
import com.kiusi.kiusihub.dto.RecaudoResumen;
import com.kiusi.kiusihub.model.Recaudo;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class RecaudoRepository {

    private final JdbcTemplate jdbcTemplate;

    public RecaudoRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Recaudo> findAll() {
        String sql = "SELECT * FROM recaudos";
        return jdbcTemplate.query(sql, new RecaudoRowMapper());
    }

    public Optional<Recaudo> findById(Long id) {
        String sql = "SELECT * FROM recaudos WHERE id = ?";
        try {
            Recaudo recaudo = jdbcTemplate.queryForObject(sql, new Object[]{id}, new RecaudoRowMapper());
            return Optional.ofNullable(recaudo);
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    public List<Recaudo> findByFacturaId(Long facturaId) {
        String sql = "SELECT * FROM recaudos WHERE factura_id = ?";
        return jdbcTemplate.query(sql, new Object[]{facturaId}, new RecaudoRowMapper());
    }

    private String buildBaseJoin() {
        try {
            return "SELECT r.id, r.factura_id, r.monto, r.fecha, r.metodo_pago, " +
                    "f.cliente AS factura_cliente, f.estado AS factura_estado, f.total AS factura_total " +
                    "FROM recaudos r LEFT JOIN facturas f ON r.factura_id = f.id";
        } catch (Exception e) {
            return "SELECT r.id, r.factura_id, r.monto, r.fecha, r.metodo_pago, " +
                    "f.nombre_cliente AS factura_cliente, f.estado AS factura_estado, f.total AS factura_total " +
                    "FROM recaudos r LEFT JOIN facturas f ON r.factura_id = f.id";
        }
    }

    private String buildJoinQuery() {
        try {
            jdbcTemplate.queryForObject("SELECT f.cliente FROM facturas f LIMIT 1", String.class);
            return "SELECT r.id, r.factura_id, r.monto, r.fecha, r.metodo_pago, " +
                    "f.cliente AS factura_cliente, f.estado AS factura_estado, f.total AS factura_total " +
                    "FROM recaudos r LEFT JOIN facturas f ON r.factura_id = f.id";
        } catch (Exception e) {
            return "SELECT r.id, r.factura_id, r.monto, r.fecha, r.metodo_pago, " +
                    "f.nombre_cliente AS factura_cliente, f.estado AS factura_estado, f.total AS factura_total " +
                    "FROM recaudos r LEFT JOIN facturas f ON r.factura_id = f.id";
        }
    }

    public List<RecaudoDetalle> findAllFiltered(java.sql.Date fechaDesde, java.sql.Date fechaHasta,
                                                 Long facturaId, String cliente, String metodoPago) {
        String base = buildJoinQuery();
        StringBuilder sql = new StringBuilder(base);
        List<Object> params = new ArrayList<>();
        List<String> where = new ArrayList<>();

        if (fechaDesde != null) {
            where.add("r.fecha >= ?");
            params.add(fechaDesde);
        }
        if (fechaHasta != null) {
            where.add("r.fecha <= ?");
            params.add(fechaHasta);
        }
        if (facturaId != null) {
            where.add("r.factura_id = ?");
            params.add(facturaId);
        }
        if (cliente != null && !cliente.trim().isEmpty()) {
            try {
                where.add("f.cliente LIKE ?");
            } catch (Exception e) {
                where.add("f.nombre_cliente LIKE ?");
            }
            params.add("%" + cliente.trim() + "%");
        }
        if (metodoPago != null && !metodoPago.trim().isEmpty()) {
            where.add("r.metodo_pago = ?");
            params.add(metodoPago.trim());
        }

        if (!where.isEmpty()) {
            sql.append(" WHERE ").append(String.join(" AND ", where));
        }

        sql.append(" ORDER BY r.fecha DESC, r.id DESC");

        try {
            return jdbcTemplate.query(sql.toString(), params.toArray(), new RecaudoDetalleRowMapper());
        } catch (Exception e) {
            String altBase = base.contains("f.cliente")
                    ? base.replace("f.cliente", "f.nombre_cliente")
                    : base;
            String altSql = sql.toString().replace("f.cliente", "f.nombre_cliente");
            try {
                return jdbcTemplate.query(altSql, params.toArray(), new RecaudoDetalleRowMapper());
            } catch (Exception e2) {
                try {
                    return jdbcTemplate.query(sql.toString().replace("r.fecha", "CAST(r.fecha AS DATE)"),
                            params.toArray(), new RecaudoDetalleRowMapper());
                } catch (Exception e3) {
                    return jdbcTemplate.query(altBase + " ORDER BY r.id DESC", params.toArray(),
                            new RecaudoDetalleRowMapper());
                }
            }
        }
    }

    public RecaudoResumen calculateSummary(java.sql.Date fechaDesde, java.sql.Date fechaHasta,
                                           Long facturaId, String cliente, String metodoPago) {
        StringBuilder sql = new StringBuilder(
                "SELECT COALESCE(SUM(r.monto), 0) AS total, COUNT(r.id) AS cantidad, " +
                        "COALESCE(AVG(r.monto), 0) AS promedio FROM recaudos r LEFT JOIN facturas f ON r.factura_id = f.id"
        );
        List<Object> params = new ArrayList<>();
        List<String> where = new ArrayList<>();

        if (fechaDesde != null) {
            where.add("r.fecha >= ?");
            params.add(fechaDesde);
        }
        if (fechaHasta != null) {
            where.add("r.fecha <= ?");
            params.add(fechaHasta);
        }
        if (facturaId != null) {
            where.add("r.factura_id = ?");
            params.add(facturaId);
        }
        if (cliente != null && !cliente.trim().isEmpty()) {
            try {
                where.add("f.cliente LIKE ?");
            } catch (Exception e) {
                where.add("f.nombre_cliente LIKE ?");
            }
            params.add("%" + cliente.trim() + "%");
        }
        if (metodoPago != null && !metodoPago.trim().isEmpty()) {
            where.add("r.metodo_pago = ?");
            params.add(metodoPago.trim());
        }

        if (!where.isEmpty()) {
            sql.append(" WHERE ").append(String.join(" AND ", where));
        }

        try {
            return jdbcTemplate.queryForObject(sql.toString(), params.toArray(), (rs, rn) -> new RecaudoResumen(
                    rs.getDouble("total"),
                    rs.getInt("cantidad"),
                    rs.getDouble("promedio")
            ));
        } catch (Exception e) {
            try {
                String altSql = sql.toString().replace("f.cliente", "f.nombre_cliente");
                return jdbcTemplate.queryForObject(altSql, params.toArray(), (rs, rn) -> new RecaudoResumen(
                        rs.getDouble("total"),
                        rs.getInt("cantidad"),
                        rs.getDouble("promedio")
                ));
            } catch (Exception e2) {
                return new RecaudoResumen(0.0, 0, 0.0);
            }
        }
    }

    public Recaudo save(Recaudo recaudo) {
        if (recaudo.getId() == null) {
            boolean ok = false;
            try {
                String sqlWithMetodo = "INSERT INTO recaudos (factura_id, monto, fecha, metodo_pago) VALUES (?, ?, NOW(), ?)";
                jdbcTemplate.update(sqlWithMetodo, recaudo.getFacturaId(), recaudo.getMonto(),
                        (recaudo.getMetodoPago() != null && !recaudo.getMetodoPago().trim().isEmpty())
                                ? recaudo.getMetodoPago() : null);
                ok = true;
            } catch (Exception e1) {
                try {
                    String sqlBasic = "INSERT INTO recaudos (factura_id, monto, fecha) VALUES (?, ?, NOW())";
                    jdbcTemplate.update(sqlBasic, recaudo.getFacturaId(), recaudo.getMonto());
                    ok = true;
                } catch (Exception e2) {
                    try {
                        String sqlNoFecha = "INSERT INTO recaudos (factura_id, monto) VALUES (?, ?)";
                        jdbcTemplate.update(sqlNoFecha, recaudo.getFacturaId(), recaudo.getMonto());
                        ok = true;
                    } catch (Exception ignored) {}
                }
            }
            Long id = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
            recaudo.setId(id);
            if (ok && recaudo.getMetodoPago() != null && !recaudo.getMetodoPago().trim().isEmpty()) {
                try {
                    jdbcTemplate.update("UPDATE recaudos SET metodo_pago = ? WHERE id = ?",
                            recaudo.getMetodoPago(), id);
                } catch (Exception ignored) {}
            }
        } else {
            try {
                String sql2 = "UPDATE recaudos SET factura_id = ?, monto = ?, metodo_pago = ? WHERE id = ?";
                jdbcTemplate.update(sql2, recaudo.getFacturaId(), recaudo.getMonto(),
                        recaudo.getMetodoPago(), recaudo.getId());
            } catch (Exception e) {
                try {
                    String sql = "UPDATE recaudos SET factura_id = ?, monto = ? WHERE id = ?";
                    jdbcTemplate.update(sql, recaudo.getFacturaId(), recaudo.getMonto(), recaudo.getId());
                } catch (Exception ignored) {}
            }
        }
        return recaudo;
    }

    public void deleteById(Long id) {
        String sql = "DELETE FROM recaudos WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }

    private static class RecaudoRowMapper implements RowMapper<Recaudo> {
        private static boolean hasCol(ResultSet rs, String name) throws SQLException {
            java.sql.ResultSetMetaData md = rs.getMetaData();
            int cols = md.getColumnCount();
            for (int i = 1; i <= cols; i++) {
                String label = md.getColumnLabel(i);
                if (label != null && label.equalsIgnoreCase(name)) return true;
            }
            return false;
        }
        @Override
        public Recaudo mapRow(ResultSet rs, int rowNum) throws SQLException {
            Recaudo recaudo = new Recaudo();
            recaudo.setId(rs.getLong("id"));
            if (hasCol(rs, "factura_id")) recaudo.setFacturaId(rs.getLong("factura_id"));
            if (hasCol(rs, "monto")) recaudo.setMonto(rs.getDouble("monto"));
            if (hasCol(rs, "fecha")) {
                try {
                    java.sql.Date fd = rs.getDate("fecha");
                    if (fd != null) recaudo.setFecha(fd);
                } catch (SQLException ignored) {}
            }
            if (hasCol(rs, "metodo_pago")) {
                try {
                    String m = rs.getString("metodo_pago");
                    if (m != null && !m.trim().isEmpty()) recaudo.setMetodoPago(m.trim());
                } catch (SQLException ignored) {}
            }
            return recaudo;
        }
    }

    private static class RecaudoDetalleRowMapper implements RowMapper<RecaudoDetalle> {
        private static boolean hasCol(ResultSet rs, String name) throws SQLException {
            java.sql.ResultSetMetaData md = rs.getMetaData();
            int cols = md.getColumnCount();
            for (int i = 1; i <= cols; i++) {
                String label = md.getColumnLabel(i);
                if (label != null && label.equalsIgnoreCase(name)) return true;
            }
            return false;
        }
        @Override
        public RecaudoDetalle mapRow(ResultSet rs, int rowNum) throws SQLException {
            RecaudoDetalle d = new RecaudoDetalle();
            if (hasCol(rs, "id")) d.setId(rs.getLong("id"));
            if (hasCol(rs, "factura_id")) d.setFacturaId(rs.getLong("factura_id"));
            if (hasCol(rs, "monto")) d.setMonto(rs.getDouble("monto"));
            if (hasCol(rs, "fecha")) {
                try {
                    java.sql.Date fd = rs.getDate("fecha");
                    if (fd != null) d.setFecha(fd);
                } catch (SQLException ignored) {}
            }
            if (hasCol(rs, "metodo_pago")) {
                try {
                    String m = rs.getString("metodo_pago");
                    if (m != null && !m.trim().isEmpty()) d.setMetodoPago(m.trim());
                } catch (SQLException ignored) {}
            }
            if (hasCol(rs, "factura_cliente")) {
                try {
                    String c = rs.getString("factura_cliente");
                    if (c != null) d.setCliente(c);
                } catch (SQLException ignored) {}
            }
            if (hasCol(rs, "factura_estado")) {
                try {
                    String e = rs.getString("factura_estado");
                    if (e != null) d.setFacturaEstado(e);
                } catch (SQLException ignored) {}
            }
            if (hasCol(rs, "factura_total")) {
                try {
                    d.setFacturaTotal(rs.getDouble("factura_total"));
                } catch (SQLException ignored) {}
            }
            return d;
        }
    }
}
