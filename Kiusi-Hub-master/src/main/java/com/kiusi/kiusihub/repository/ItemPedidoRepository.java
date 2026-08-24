package com.kiusi.kiusihub.repository;

import com.kiusi.kiusihub.model.ItemPedido;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

@Repository
public class ItemPedidoRepository {

    private final JdbcTemplate jdbcTemplate;

    public ItemPedidoRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<ItemPedido> findAll() {
        String sql = "SELECT * FROM items_pedido";
        return jdbcTemplate.query(sql, new ItemPedidoRowMapper());
    }

    public Optional<ItemPedido> findById(Long id) {
        String sql = "SELECT * FROM items_pedido WHERE id = ?";
        try {
            ItemPedido itemPedido = jdbcTemplate.queryForObject(sql, new Object[]{id}, new ItemPedidoRowMapper());
            return Optional.ofNullable(itemPedido);
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    public List<ItemPedido> findByPedidoId(Long pedidoId) {
        String sql = "SELECT * FROM items_pedido WHERE pedido_id = ?";
        return jdbcTemplate.query(sql, new Object[]{pedidoId}, new ItemPedidoRowMapper());
    }

    public ItemPedido save(ItemPedido itemPedido) {
        if (itemPedido.getId() == null) {
            String sql = "INSERT INTO items_pedido (pedido_id, producto_id, nombre_producto, cantidad, precio, subtotal) VALUES (?, ?, ?, ?, ?, ?)";
            try {
                jdbcTemplate.update(sql, itemPedido.getPedidoId(), itemPedido.getProductoId(), itemPedido.getNombreProducto(), itemPedido.getCantidad(), itemPedido.getPrecio(), itemPedido.getSubtotal());
            } catch (Exception e) {
                try {
                    String sql2 = "INSERT INTO items_pedido (pedido_id, producto_id, nombre_producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?, ?)";
                    jdbcTemplate.update(sql2, itemPedido.getPedidoId(), itemPedido.getProductoId(), itemPedido.getNombreProducto(), itemPedido.getCantidad(), itemPedido.getPrecioUnitario());
                } catch (Exception e2) {
                }
            }
            Long id = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
            itemPedido.setId(id);
        } else {
            String sql = "UPDATE items_pedido SET pedido_id = ?, producto_id = ?, nombre_producto = ?, cantidad = ?, precio = ?, subtotal = ? WHERE id = ?";
            try {
                jdbcTemplate.update(sql, itemPedido.getPedidoId(), itemPedido.getProductoId(), itemPedido.getNombreProducto(), itemPedido.getCantidad(), itemPedido.getPrecio(), itemPedido.getSubtotal(), itemPedido.getId());
            } catch (Exception e) {
                try {
                    String sql2 = "UPDATE items_pedido SET pedido_id = ?, producto_id = ?, nombre_producto = ?, cantidad = ?, precio_unitario = ? WHERE id = ?";
                    jdbcTemplate.update(sql2, itemPedido.getPedidoId(), itemPedido.getProductoId(), itemPedido.getNombreProducto(), itemPedido.getCantidad(), itemPedido.getPrecioUnitario(), itemPedido.getId());
                } catch (Exception e2) {
                }
            }
        }
        return itemPedido;
    }

    public void deleteById(Long id) {
        String sql = "DELETE FROM items_pedido WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }

    public void delete(ItemPedido itemPedido) {
        deleteById(itemPedido.getId());
    }

    private static class ItemPedidoRowMapper implements RowMapper<ItemPedido> {
        @Override
        public ItemPedido mapRow(ResultSet rs, int rowNum) throws SQLException {
            ItemPedido itemPedido = new ItemPedido();
            itemPedido.setId(rs.getLong("id"));
            itemPedido.setPedidoId(rs.getLong("pedido_id"));
            itemPedido.setProductoId(rs.getLong("producto_id"));
            itemPedido.setCantidad(rs.getInt("cantidad"));
            itemPedido.setNombreProducto(rs.getString("nombre_producto"));
            try {
                itemPedido.setPrecio(rs.getDouble("precio"));
            } catch (SQLException e) {
                try {
                    itemPedido.setPrecioUnitario(rs.getDouble("precio_unitario"));
                } catch (SQLException e2) {
                }
            }
            try {
                rs.getDouble("subtotal");
            } catch (SQLException e) {
            }
            return itemPedido;
        }
    }
}
