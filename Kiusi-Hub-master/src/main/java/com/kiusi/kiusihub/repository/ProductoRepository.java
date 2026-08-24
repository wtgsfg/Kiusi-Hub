package com.kiusi.kiusihub.repository;

import com.kiusi.kiusihub.model.Producto;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

@Repository
public class ProductoRepository {

    private final JdbcTemplate jdbcTemplate;

    public ProductoRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Producto> findAll() {
        String sql = "SELECT * FROM productos";
        return jdbcTemplate.query(sql, new ProductoRowMapper());
    }

    public Optional<Producto> findById(Long id) {
        String sql = "SELECT * FROM productos WHERE id = ?";
        try {
            Producto producto = jdbcTemplate.queryForObject(sql, new Object[]{id}, new ProductoRowMapper());
            return Optional.ofNullable(producto);
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    public List<Producto> findByActivoTrue() {
        String sql = "SELECT * FROM productos WHERE activo = true";
        try {
            return jdbcTemplate.query(sql, new ProductoRowMapper());
        } catch (Exception e) {
            return findAll();
        }
    }

    public List<Producto> findByCategoriaAndActivoTrue(String categoria) {
        String sql = "SELECT * FROM productos WHERE categoria = ? AND activo = true";
        try {
            return jdbcTemplate.query(sql, new Object[]{categoria}, new ProductoRowMapper());
        } catch (Exception e) {
            try {
                String sql2 = "SELECT * FROM productos WHERE categoria = ?";
                return jdbcTemplate.query(sql2, new Object[]{categoria}, new ProductoRowMapper());
            } catch (Exception e2) {
                return findAll();
            }
        }
    }

    public List<Producto> findByStockGreaterThan(int stock) {
        String sql = "SELECT * FROM productos WHERE stock > ?";
        return jdbcTemplate.query(sql, new Object[]{stock}, new ProductoRowMapper());
    }

    public List<Producto> findByCategoria(String categoria) {
        String sql = "SELECT * FROM productos WHERE categoria = ?";
        return jdbcTemplate.query(sql, new Object[]{categoria}, new ProductoRowMapper());
    }

    public Producto save(Producto producto) {
        if (producto.getId() == null) {
            String sql = "INSERT INTO productos (nombre, descripcion, precio, stock, categoria, imagen_url, activo) VALUES (?, ?, ?, ?, ?, ?, ?)";
            try {
                jdbcTemplate.update(sql, producto.getNombre(), producto.getDescripcion(), producto.getPrecio(), producto.getStock(), producto.getCategoria(), producto.getImagenUrl(), producto.getActivo());
            } catch (Exception e) {
                try {
                    String sql2 = "INSERT INTO productos (nombre, descripcion, precio, stock, categoria, imagen_url, activo, referencia) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
                    jdbcTemplate.update(sql2, producto.getNombre(), producto.getDescripcion(), producto.getPrecio(), producto.getStock(), producto.getCategoria(), producto.getImagenUrl(), producto.getActivo(), producto.getReferencia());
                } catch (Exception e2) {
                }
            }
            Long id = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
            producto.setId(id);
        } else {
            String sql = "UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, stock = ?, categoria = ?, imagen_url = ?, activo = ? WHERE id = ?";
            try {
                jdbcTemplate.update(sql, producto.getNombre(), producto.getDescripcion(), producto.getPrecio(), producto.getStock(), producto.getCategoria(), producto.getImagenUrl(), producto.getActivo(), producto.getId());
            } catch (Exception e) {
                try {
                    String sql2 = "UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, stock = ?, categoria = ?, imagen_url = ?, activo = ?, referencia = ? WHERE id = ?";
                    jdbcTemplate.update(sql2, producto.getNombre(), producto.getDescripcion(), producto.getPrecio(), producto.getStock(), producto.getCategoria(), producto.getImagenUrl(), producto.getActivo(), producto.getReferencia(), producto.getId());
                } catch (Exception e2) {
                }
            }
        }
        return producto;
    }

    public void deleteById(Long id) {
        String sql = "DELETE FROM productos WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }

    private static class ProductoRowMapper implements RowMapper<Producto> {
        @Override
        public Producto mapRow(ResultSet rs, int rowNum) throws SQLException {
            Producto producto = new Producto();
            producto.setId(rs.getLong("id"));
            producto.setNombre(rs.getString("nombre"));
            producto.setDescripcion(rs.getString("descripcion"));
            producto.setPrecio(rs.getDouble("precio"));
            producto.setStock(rs.getInt("stock"));
            producto.setCategoria(rs.getString("categoria"));
            try {
                producto.setImagenUrl(rs.getString("imagen_url"));
            } catch (SQLException e) {
            }
            try {
                producto.setActivo(rs.getBoolean("activo"));
            } catch (SQLException e) {
            }
            try {
                producto.setReferencia(rs.getString("referencia"));
            } catch (SQLException e) {
            }
            return producto;
        }
    }
}
