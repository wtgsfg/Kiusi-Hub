package com.kiusi.kiusihub.repository;

import com.kiusi.kiusihub.model.Factura;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

@Repository
public class FacturaRepository {

    private final JdbcTemplate jdbcTemplate;

    public FacturaRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Factura> findAll() {
        String sql = "SELECT * FROM facturas";
        return jdbcTemplate.query(sql, new FacturaRowMapper());
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

    public Factura save(Factura factura) {
        if (factura.getId() == null) {
            String sql = "INSERT INTO facturas (pedido_id, cliente, total, pagado, saldo, estado, fecha) VALUES (?, ?, ?, ?, ?, ?, NOW())";
            try {
                jdbcTemplate.update(sql, factura.getPedidoId(), factura.getCliente(), factura.getTotal(), factura.getPagado(), factura.getSaldo(), factura.getEstado());
            } catch (Exception e) {
                try {
                    String sql2 = "INSERT INTO facturas (pedido_id, nombre_cliente, total, pagado, estado, fecha) VALUES (?, ?, ?, ?, ?, NOW())";
                    jdbcTemplate.update(sql2, factura.getPedidoId(), factura.getNombreCliente(), factura.getTotal(), factura.getPagado(), factura.getEstado());
                } catch (Exception e2) {
                }
            }
            Long id = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
            factura.setId(id);
        } else {
            String sql = "UPDATE facturas SET pedido_id = ?, cliente = ?, total = ?, pagado = ?, saldo = ?, estado = ? WHERE id = ?";
            try {
                jdbcTemplate.update(sql, factura.getPedidoId(), factura.getCliente(), factura.getTotal(), factura.getPagado(), factura.getSaldo(), factura.getEstado(), factura.getId());
            } catch (Exception e) {
                try {
                    String sql2 = "UPDATE facturas SET pedido_id = ?, nombre_cliente = ?, total = ?, pagado = ?, estado = ? WHERE id = ?";
                    jdbcTemplate.update(sql2, factura.getPedidoId(), factura.getNombreCliente(), factura.getTotal(), factura.getPagado(), factura.getEstado(), factura.getId());
                } catch (Exception e2) {
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

    private static class FacturaRowMapper implements RowMapper<Factura> {
        @Override
        public Factura mapRow(ResultSet rs, int rowNum) throws SQLException {
            Factura factura = new Factura();
            factura.setId(rs.getLong("id"));
            factura.setPedidoId(rs.getLong("pedido_id"));
            factura.setTotal(rs.getDouble("total"));
            factura.setPagado(rs.getDouble("pagado"));
            try {
                factura.setCliente(rs.getString("cliente"));
            } catch (SQLException e) {
                try {
                    factura.setNombreCliente(rs.getString("nombre_cliente"));
                } catch (SQLException e2) {
                }
            }
            try {
                factura.setSaldo(rs.getDouble("saldo"));
            } catch (SQLException e) {
            }
            try {
                factura.setEstado(rs.getString("estado"));
            } catch (SQLException e) {
            }
            try {
                factura.setFecha(rs.getDate("fecha"));
            } catch (SQLException e) {
            }
            return factura;
        }
    }
}
