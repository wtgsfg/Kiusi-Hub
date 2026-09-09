package com.kiusi.kiusihub.repository;

import com.kiusi.kiusihub.model.Factura;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class FacturaRepository {

    private final JdbcTemplate jdbcTemplate;

    public FacturaRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
        repararFacturasSinVendedor();
        repararFacturasSinCliente();
    }

    private void repararFacturasSinVendedor() {
        try {
            String sql =
                "UPDATE facturas f " +
                "INNER JOIN pedidos p ON f.pedido_id = p.id " +
                "SET f.vendedor = p.vendedor " +
                "WHERE (f.vendedor IS NULL OR TRIM(f.vendedor) = '') " +
                "AND p.vendedor IS NOT NULL AND TRIM(p.vendedor) <> ''";
            int n = jdbcTemplate.update(sql);
            if (n > 0) System.out.println("[FacturaRepository] ✓ Reparadas " + n + " facturas: vendedor rellenado desde pedidos");
        } catch (Exception e) {
            System.out.println("[FacturaRepository] ↷ skip reparar vendedor facturas: " + e.getMessage());
        }
    }

    private void repararFacturasSinCliente() {
        try {
            String sql =
                "UPDATE facturas f " +
                "INNER JOIN pedidos p ON f.pedido_id = p.id " +
                "SET f.cliente = COALESCE(NULLIF(p.cliente,''), f.cliente), " +
                "    f.nombre_cliente = COALESCE(NULLIF(p.cliente,''), f.nombre_cliente) " +
                "WHERE ((f.cliente IS NULL OR TRIM(f.cliente) = '') OR (f.nombre_cliente IS NULL OR TRIM(f.nombre_cliente) = '')) " +
                "AND p.cliente IS NOT NULL AND TRIM(p.cliente) <> ''";
            int n = jdbcTemplate.update(sql);
            if (n > 0) System.out.println("[FacturaRepository] ✓ Reparadas " + n + " facturas: cliente rellenado desde pedidos");
        } catch (Exception e) {
            System.out.println("[FacturaRepository] ↷ skip reparar cliente facturas: " + e.getMessage());
        }
    }

    public List<Factura> findAll() {
        return findAllFiltered(null, null, null, null, null, null, null, null);
    }

    public Optional<Factura> findById(Long id) {
        String sql = "SELECT * FROM facturas WHERE id = ?";
        try {
            Factura factura = jdbcTemplate.queryForObject(sql, new Object[]{id}, new FacturaRowMapper());
            return Optional.ofNullable(factura);
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    public Optional<Factura> findByPedidoId(Long pedidoId) {
        String sql = "SELECT * FROM facturas WHERE pedido_id = ?";
        try {
            Factura factura = jdbcTemplate.queryForObject(sql, new Object[]{pedidoId}, new FacturaRowMapper());
            return Optional.ofNullable(factura);
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    public List<Factura> findAllFiltered(LocalDate fechaDesde, LocalDate fechaHasta,
                                         String cliente, String vendedor, String estado,
                                         Double minTotal, Double maxTotal, Long nroFactura) {
        StringBuilder sql = new StringBuilder("SELECT * FROM facturas WHERE 1=1");
        List<Object> args = new ArrayList<>();

        if (nroFactura != null) {
            sql.append(" AND id = ?");
            args.add(nroFactura);
        }
        if (fechaDesde != null) {
            sql.append(" AND DATE(COALESCE(fecha, '1970-01-01')) >= ?");
            args.add(java.sql.Date.valueOf(fechaDesde));
        }
        if (fechaHasta != null) {
            sql.append(" AND DATE(COALESCE(fecha, '1970-01-01')) <= ?");
            args.add(java.sql.Date.valueOf(fechaHasta));
        }
        if (cliente != null && !cliente.isBlank()) {
            sql.append(" AND (LOWER(COALESCE(cliente,'')) LIKE ? OR LOWER(COALESCE(nombre_cliente,'')) LIKE ?)");
            String like = "%" + cliente.trim().toLowerCase() + "%";
            args.add(like);
            args.add(like);
        }
        if (vendedor != null && !vendedor.isBlank()) {
            sql.append(" AND LOWER(COALESCE(vendedor,'')) LIKE ?");
            args.add("%" + vendedor.trim().toLowerCase() + "%");
        }
        if (estado != null && !estado.isBlank()) {
            sql.append(" AND UPPER(COALESCE(estado,'')) = ?");
            args.add(estado.trim().toUpperCase());
        }
        if (minTotal != null) {
            sql.append(" AND COALESCE(total,0) >= ?");
            args.add(minTotal);
        }
        if (maxTotal != null) {
            sql.append(" AND COALESCE(total,0) <= ?");
            args.add(maxTotal);
        }
        sql.append(" ORDER BY COALESCE(fecha, '1970-01-01') DESC, id DESC");

        try {
            return jdbcTemplate.query(sql.toString(), args.toArray(), new FacturaRowMapper());
        } catch (Exception e) {
            System.err.println("[FacturaRepository] Error en findAllFiltered: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    public Map<String, Object> resumenFiltrado(LocalDate fechaDesde, LocalDate fechaHasta,
                                               String cliente, String vendedor, String estado,
                                               Double minTotal, Double maxTotal, Long nroFactura) {
        StringBuilder sql = new StringBuilder(
                "SELECT COUNT(*) AS cantidad, " +
                        "COALESCE(SUM(CASE WHEN COALESCE(total,0) > 0 THEN total ELSE 0 END),0) AS total_facturado, " +
                        "COALESCE(SUM(CASE WHEN COALESCE(pagado,0) > 0 THEN pagado ELSE 0 END),0) AS total_pagado, " +
                        "COALESCE(SUM(CASE WHEN (COALESCE(total,0) - COALESCE(pagado,0)) > 0 THEN (COALESCE(total,0) - COALESCE(pagado,0)) ELSE 0 END),0) AS total_pendiente, " +
                        "COUNT(CASE WHEN UPPER(COALESCE(estado,'')) = 'PAGADO' OR (COALESCE(total,0) - COALESCE(pagado,0)) <= 0 THEN 1 ELSE NULL END) AS cantidad_pagadas, " +
                        "COUNT(CASE WHEN UPPER(COALESCE(estado,'')) = 'PENDIENTE' AND (COALESCE(total,0) - COALESCE(pagado,0)) > 0 THEN 1 ELSE NULL END) AS cantidad_pendientes " +
                        "FROM facturas WHERE 1=1");
        List<Object> args = new ArrayList<>();

        if (nroFactura != null) {
            sql.append(" AND id = ?");
            args.add(nroFactura);
        }
        if (fechaDesde != null) {
            sql.append(" AND DATE(COALESCE(fecha, '1970-01-01')) >= ?");
            args.add(java.sql.Date.valueOf(fechaDesde));
        }
        if (fechaHasta != null) {
            sql.append(" AND DATE(COALESCE(fecha, '1970-01-01')) <= ?");
            args.add(java.sql.Date.valueOf(fechaHasta));
        }
        if (cliente != null && !cliente.isBlank()) {
            sql.append(" AND (LOWER(COALESCE(cliente,'')) LIKE ? OR LOWER(COALESCE(nombre_cliente,'')) LIKE ?)");
            String like = "%" + cliente.trim().toLowerCase() + "%";
            args.add(like);
            args.add(like);
        }
        if (vendedor != null && !vendedor.isBlank()) {
            sql.append(" AND LOWER(COALESCE(vendedor,'')) LIKE ?");
            args.add("%" + vendedor.trim().toLowerCase() + "%");
        }
        if (estado != null && !estado.isBlank()) {
            sql.append(" AND UPPER(COALESCE(estado,'')) = ?");
            args.add(estado.trim().toUpperCase());
        }
        if (minTotal != null) {
            sql.append(" AND COALESCE(total,0) >= ?");
            args.add(minTotal);
        }
        if (maxTotal != null) {
            sql.append(" AND COALESCE(total,0) <= ?");
            args.add(maxTotal);
        }

        Map<String, Object> base = new HashMap<>();
        base.put("cantidad", 0);
        base.put("totalFacturado", 0.0);
        base.put("totalPagado", 0.0);
        base.put("totalPendiente", 0.0);
        base.put("cantidadPagadas", 0);
        base.put("cantidadPendientes", 0);
        base.put("promedioFactura", 0.0);

        try {
            return jdbcTemplate.queryForObject(sql.toString(), args.toArray(), (rs, i) -> {
                int cantidad = rs.getInt("cantidad");
                double totalFacturado = safeDouble(rs, "total_facturado");
                double totalPagado = safeDouble(rs, "total_pagado");
                double totalPendiente = safeDouble(rs, "total_pendiente");
                int cantidadPagadas = rs.getInt("cantidad_pagadas");
                int cantidadPendientes = rs.getInt("cantidad_pendientes");
                Map<String, Object> m = new HashMap<>();
                m.put("cantidad", cantidad);
                m.put("totalFacturado", totalFacturado);
                m.put("totalPagado", totalPagado);
                m.put("totalPendiente", totalPendiente);
                m.put("cantidadPagadas", cantidadPagadas);
                m.put("cantidadPendientes", cantidadPendientes);
                m.put("promedioFactura", cantidad > 0 ? totalFacturado / (double) cantidad : 0.0);
                return m;
            });
        } catch (Exception e) {
            System.err.println("[FacturaRepository] Error en resumenFiltrado: " + e.getMessage());
            return base;
        }
    }

    public List<String> findAllClientesExistentes() {
        String sql =
                "SELECT DISTINCT v FROM (" +
                        "SELECT COALESCE(NULLIF(cliente,''), nombre_cliente) AS v FROM facturas " +
                        "WHERE COALESCE(cliente,'') <> '' OR COALESCE(nombre_cliente,'') <> '' " +
                        "UNION " +
                        "SELECT cliente AS v FROM pedidos WHERE COALESCE(cliente,'') <> ''" +
                        ") t WHERE v IS NOT NULL ORDER BY v";
        try {
            return jdbcTemplate.queryForList(sql, String.class);
        } catch (Exception e) {
            try {
                return jdbcTemplate.queryForList(
                        "SELECT DISTINCT COALESCE(NULLIF(cliente,''), nombre_cliente) AS v FROM facturas WHERE COALESCE(cliente,'') <> '' OR COALESCE(nombre_cliente,'') <> '' ORDER BY v",
                        String.class);
            } catch (Exception e2) {
                return new ArrayList<>();
            }
        }
    }

    public List<String> findAllVendedoresExistentes() {
        String sql =
                "SELECT DISTINCT v FROM (" +
                        "SELECT vendedor AS v FROM facturas WHERE COALESCE(vendedor,'') <> '' " +
                        "UNION " +
                        "SELECT vendedor AS v FROM pedidos WHERE COALESCE(vendedor,'') <> ''" +
                        ") t WHERE v IS NOT NULL ORDER BY v";
        try {
            return jdbcTemplate.queryForList(sql, String.class);
        } catch (Exception e) {
            try {
                return jdbcTemplate.queryForList(
                        "SELECT DISTINCT vendedor AS v FROM facturas WHERE COALESCE(vendedor,'') <> '' ORDER BY v",
                        String.class);
            } catch (Exception e2) {
                return new ArrayList<>();
            }
        }
    }

    public Factura save(Factura factura) {
        if (factura.getId() == null) {
            try {
                String sql = "INSERT INTO facturas (pedido_id, cliente, nombre_cliente, vendedor, total, pagado, saldo, estado, fecha) VALUES (?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, NOW()))";
                jdbcTemplate.update(sql,
                        factura.getPedidoId(),
                        factura.getNombreCliente(),
                        factura.getNombreCliente(),
                        factura.getVendedor(),
                        factura.getTotal(),
                        factura.getPagado(),
                        factura.getTotal() - factura.getPagado(),
                        factura.getEstado(),
                        factura.getFecha());
            } catch (Exception e) {
                try {
                    String sql2 = "INSERT INTO facturas (pedido_id, nombre_cliente, total, pagado, estado, fecha) VALUES (?, ?, ?, ?, ?, COALESCE(?, NOW()))";
                    jdbcTemplate.update(sql2, factura.getPedidoId(), factura.getNombreCliente(), factura.getTotal(), factura.getPagado(), factura.getEstado(), factura.getFecha());
                } catch (Exception e2) {
                    try {
                        String sql3 = "INSERT INTO facturas (pedido_id, cliente, total, pagado, saldo, estado, fecha) VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, NOW()))";
                        jdbcTemplate.update(sql3, factura.getPedidoId(), factura.getNombreCliente(), factura.getTotal(), factura.getPagado(), factura.getTotal() - factura.getPagado(), factura.getEstado(), factura.getFecha());
                    } catch (Exception e3) {
                    }
                }
            }
            Long id = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
            factura.setId(id);
        } else {
            try {
                String sql = "UPDATE facturas SET pedido_id = ?, cliente = ?, nombre_cliente = ?, vendedor = ?, total = ?, pagado = ?, saldo = ?, estado = ?, fecha = COALESCE(?, fecha) WHERE id = ?";
                jdbcTemplate.update(sql,
                        factura.getPedidoId(),
                        factura.getNombreCliente(),
                        factura.getNombreCliente(),
                        factura.getVendedor(),
                        factura.getTotal(),
                        factura.getPagado(),
                        factura.getTotal() - factura.getPagado(),
                        factura.getEstado(),
                        factura.getFecha(),
                        factura.getId());
            } catch (Exception e) {
                try {
                    String sql2 = "UPDATE facturas SET pedido_id = ?, nombre_cliente = ?, total = ?, pagado = ?, estado = ? WHERE id = ?";
                    jdbcTemplate.update(sql2, factura.getPedidoId(), factura.getNombreCliente(), factura.getTotal(), factura.getPagado(), factura.getEstado(), factura.getId());
                } catch (Exception e2) {
                    try {
                        String sql3 = "UPDATE facturas SET pedido_id = ?, cliente = ?, total = ?, pagado = ?, saldo = ?, estado = ? WHERE id = ?";
                        jdbcTemplate.update(sql3, factura.getPedidoId(), factura.getNombreCliente(), factura.getTotal(), factura.getPagado(), factura.getTotal() - factura.getPagado(), factura.getEstado(), factura.getId());
                    } catch (Exception e3) {
                    }
                }
            }
        }
        return factura;
    }

    public void deleteById(Long id) {
        String sql = "DELETE FROM facturas WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }

    public void delete(Factura factura) {
        deleteById(factura.getId());
    }

    private static double safeDouble(ResultSet rs, String col) throws SQLException {
        Object o = rs.getObject(col);
        if (o == null) return 0.0;
        if (o instanceof BigDecimal bd) return bd.doubleValue();
        if (o instanceof Number n) return n.doubleValue();
        try {
            return Double.parseDouble(String.valueOf(o));
        } catch (Exception ex) {
            return 0.0;
        }
    }

    private static class FacturaRowMapper implements RowMapper<Factura> {
        @Override
        public Factura mapRow(ResultSet rs, int rowNum) throws SQLException {
            Factura factura = new Factura();
            ResultSetMetaData md = rs.getMetaData();
            int cols = md.getColumnCount();
            java.util.Set<String> colNames = new java.util.HashSet<>();
            for (int i = 1; i <= cols; i++) colNames.add(md.getColumnLabel(i).toLowerCase());

            factura.setId(rs.getLong("id"));
            Long pedidoId = null;
            try {
                pedidoId = rs.getLong("pedido_id");
                if (rs.wasNull()) pedidoId = null;
                factura.setPedidoId(pedidoId);
            } catch (SQLException ignored) {}
            try { factura.setTotal(rs.getDouble("total")); } catch (SQLException ignored) {}
            try { factura.setPagado(rs.getDouble("pagado")); } catch (SQLException ignored) {}

            // --- CLIENTE ---
            String cliente = null;
            try {
                String c = rs.getString("cliente");
                if (c != null && !c.isBlank()) {
                    cliente = c;
                } else {
                    String nc = rs.getString("nombre_cliente");
                    if (nc != null && !nc.isBlank()) cliente = nc;
                }
            } catch (SQLException e) {
                try {
                    String nc = rs.getString("nombre_cliente");
                    if (nc != null && !nc.isBlank()) cliente = nc;
                } catch (SQLException ignored) {}
            }
            factura.setNombreCliente(cliente != null ? cliente : "");

            // --- VENDEDOR ---
            String vendedor = null;
            if (colNames.contains("vendedor")) {
                try {
                    String v = rs.getString("vendedor");
                    if (v != null && !v.isBlank()) vendedor = v;
                } catch (SQLException ignored) {}
            }
            factura.setVendedor(vendedor != null ? vendedor : "");

            try { factura.setSaldo(rs.getDouble("saldo")); } catch (SQLException ignored) {}
            try {
                String est = rs.getString("estado");
                if (est == null || est.isBlank()) {
                    est = (factura.getSaldo() <= 0) ? "PAGADO" : "PENDIENTE";
                }
                factura.setEstado(est);
            } catch (SQLException e) {
                factura.setEstado((factura.getSaldo() <= 0) ? "PAGADO" : "PENDIENTE");
            }
            try {
                java.sql.Timestamp ts = rs.getTimestamp("fecha");
                if (ts != null) factura.setFecha(new java.sql.Date(ts.getTime()));
            } catch (SQLException e) {
                try { factura.setFecha(rs.getDate("fecha")); } catch (SQLException ignored) {}
            }
            return factura;
        }
    }
}
