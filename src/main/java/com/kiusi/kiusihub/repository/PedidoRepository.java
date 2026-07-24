package com.kiusi.kiusihub.repository;

import com.kiusi.kiusihub.model.EstadoPedido;
import com.kiusi.kiusihub.model.Pedido;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

@Repository
public class PedidoRepository {

    private final JdbcTemplate jdbcTemplate;

    public PedidoRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Pedido> findAll() {
        String sql = "SELECT * FROM pedidos";
        return jdbcTemplate.query(sql, new PedidoRowMapper());
    }

    public Optional<Pedido> findById(Long id) {
        String sql = "SELECT * FROM pedidos WHERE id = ?";
        try {
            Pedido pedido = jdbcTemplate.queryForObject(sql, new Object[]{id}, new PedidoRowMapper());
            return Optional.ofNullable(pedido);
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    public List<Pedido> findByEstado(EstadoPedido estado) {
        String sql = "SELECT * FROM pedidos WHERE estado = ?";
        return jdbcTemplate.query(sql, new Object[]{estado.name()}, new PedidoRowMapper());
    }

    public Pedido save(Pedido pedido) {
        if (pedido.getId() == null) {
            String sql = "INSERT INTO pedidos (cliente, vendedor, estado, fecha) VALUES (?, ?, ?, NOW())";
            try {
                jdbcTemplate.update(sql, pedido.getCliente(), pedido.getVendedor(), pedido.getEstado().name());
            } catch (Exception e) {
                try {
                    String sql2 = "INSERT INTO pedidos (cliente, vendedor, estado, fecha, total, observaciones, sacado) VALUES (?, ?, ?, NOW(), ?, ?, ?)";
                    jdbcTemplate.update(sql2, pedido.getCliente(), pedido.getVendedor(), pedido.getEstado().name(), pedido.getTotal(), pedido.getObservaciones(), pedido.getSacado());
                } catch (Exception e2) {
                }
            }
            Long id = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
            pedido.setId(id);
        } else {
            String sql = "UPDATE pedidos SET cliente = ?, vendedor = ?, estado = ? WHERE id = ?";
            try {
                jdbcTemplate.update(sql, pedido.getCliente(), pedido.getVendedor(), pedido.getEstado().name(), pedido.getId());
            } catch (Exception e) {
                try {
                    String sql2 = "UPDATE pedidos SET cliente = ?, vendedor = ?, estado = ?, total = ?, observaciones = ?, sacado = ? WHERE id = ?";
                    jdbcTemplate.update(sql2, pedido.getCliente(), pedido.getVendedor(), pedido.getEstado().name(), pedido.getTotal(), pedido.getObservaciones(), pedido.getSacado(), pedido.getId());
                } catch (Exception e2) {
                }
            }
        }
        return pedido;
    }

    public void deleteById(Long id) {
        String sql = "DELETE FROM pedidos WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }

    private static class PedidoRowMapper implements RowMapper<Pedido> {
        @Override
        public Pedido mapRow(ResultSet rs, int rowNum) throws SQLException {
            Pedido pedido = new Pedido();
            pedido.setId(rs.getLong("id"));
            pedido.setCliente(rs.getString("cliente"));
            pedido.setVendedor(rs.getString("vendedor"));
            pedido.setEstado(EstadoPedido.valueOf(rs.getString("estado")));
            try {
                pedido.setFecha(rs.getDate("fecha"));
            } catch (SQLException e) {
            }
            try {
                pedido.setTotal(rs.getDouble("total"));
            } catch (SQLException e) {
            }
            try {
                pedido.setObservaciones(rs.getString("observaciones"));
            } catch (SQLException e) {
            }
            try {
                pedido.setSacado(rs.getBoolean("sacado"));
            } catch (SQLException e) {
            }
            return pedido;
        }
    }
}
