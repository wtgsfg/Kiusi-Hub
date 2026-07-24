
package com.kiusi.kiusihub.repository;

import com.kiusi.kiusihub.model.ItemNotaCredito;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

@Repository
public class ItemNotaCreditoRepository {

    private final JdbcTemplate jdbcTemplate;

    public ItemNotaCreditoRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<ItemNotaCredito> findByNotaCreditoId(Long notaCreditoId) {
        String sql = "SELECT * FROM items_nota_credito WHERE nota_credito_id = ?";
        return jdbcTemplate.query(sql, new Object[]{notaCreditoId}, new ItemNotaCreditoRowMapper());
    }

    public ItemNotaCredito save(ItemNotaCredito item) {
        String sql = "INSERT INTO items_nota_credito (nota_credito_id, item_pedido_id, nombre_producto, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?, ?)";
        jdbcTemplate.update(sql, item.getNotaCreditoId(), item.getItemPedidoId(), item.getNombreProducto(), item.getCantidad(), item.getPrecioUnitario(), item.getSubtotal());
        Long id = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        item.setId(id);
        return item;
    }

    private static class ItemNotaCreditoRowMapper implements RowMapper<ItemNotaCredito> {
        @Override
        public ItemNotaCredito mapRow(ResultSet rs, int rowNum) throws SQLException {
            ItemNotaCredito item = new ItemNotaCredito();
            item.setId(rs.getLong("id"));
            item.setNotaCreditoId(rs.getLong("nota_credito_id"));
            item.setItemPedidoId(rs.getLong("item_pedido_id"));
            item.setNombreProducto(rs.getString("nombre_producto"));
            item.setCantidad(rs.getInt("cantidad"));
            item.setPrecioUnitario(rs.getDouble("precio_unitario"));
            item.setSubtotal(rs.getDouble("subtotal"));
            return item;
        }
    }
}
