package com.kiusi.kiusihub.repository;

import com.kiusi.kiusihub.model.Producto;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class ProductoRepository {

    private final JdbcTemplate jdbcTemplate;

    public ProductoRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Producto> findAll() {
        try {
            String sql = "SELECT * FROM productos";
            return jdbcTemplate.query(sql, new ProductoRowMapper());
        } catch (Exception e) {
            System.err.println("Error findAll productos: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    public Optional<Producto> findById(Long id) {
        try {
            String sql = "SELECT * FROM productos WHERE id = ?";
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
        try {
            String sql = "SELECT * FROM productos WHERE stock > ?";
            return jdbcTemplate.query(sql, new Object[]{stock}, new ProductoRowMapper());
        } catch (Exception e) {
            return findAll();
        }
    }

    public List<Producto> findByCategoria(String categoria) {
        try {
            String sql = "SELECT * FROM productos WHERE categoria = ?";
            return jdbcTemplate.query(sql, new Object[]{categoria}, new ProductoRowMapper());
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    public List<String> findAllCategorias() {
        try {
            String sql = "SELECT DISTINCT categoria FROM productos WHERE categoria IS NOT NULL AND categoria <> '' ORDER BY categoria";
            return jdbcTemplate.queryForList(sql, String.class);
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    public Producto save(Producto producto) {
        if (producto.getId() == null) {
            // INSERT: intentar con todas las columnas, y si falla, fallback sin referencia. NUNCA lanzar.
            boolean ok = false;
            try {
                String sqlRef = "INSERT INTO productos (nombre, descripcion, precio, stock, categoria, imagen_url, activo, referencia) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
                jdbcTemplate.update(sqlRef,
                        producto.getNombre(),
                        producto.getDescripcion(),
                        producto.getPrecio(),
                        producto.getStock(),
                        producto.getCategoria(),
                        producto.getImagenUrl(),
                        producto.isActivo() ? 1 : 0,
                        (producto.getReferencia() != null && !producto.getReferencia().trim().isEmpty())
                                ? producto.getReferencia() : null
                );
                ok = true;
            } catch (Exception e) {
                try {
                    String sqlNoRef = "INSERT INTO productos (nombre, descripcion, precio, stock, categoria, imagen_url, activo) VALUES (?, ?, ?, ?, ?, ?, ?)";
                    jdbcTemplate.update(sqlNoRef,
                            producto.getNombre(),
                            producto.getDescripcion(),
                            producto.getPrecio(),
                            producto.getStock(),
                            producto.getCategoria(),
                            producto.getImagenUrl(),
                            producto.isActivo() ? 1 : 0
                    );
                    ok = true;
                } catch (Exception e2) {
                    try {
                        String sqlMin = "INSERT INTO productos (nombre, precio, stock) VALUES (?, ?, ?)";
                        jdbcTemplate.update(sqlMin,
                                producto.getNombre(),
                                producto.getPrecio(),
                                producto.getStock()
                        );
                        ok = true;
                    } catch (Exception ignored) {
                        System.err.println("ERROR insert producto: " + ignored.getMessage());
                    }
                }
            }
            Long id = null;
            try {
                id = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
            } catch (Exception ignored) {}
            if (id != null) {
                producto.setId(id);
                // Refuerzo para referencia / categoria / descripcion / imagen
                try {
                    jdbcTemplate.update(
                            "UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, stock = ?, categoria = ?, imagen_url = ?, activo = ?, referencia = ? WHERE id = ?",
                            producto.getNombre(),
                            producto.getDescripcion(),
                            producto.getPrecio(),
                            producto.getStock(),
                            producto.getCategoria(),
                            producto.getImagenUrl(),
                            producto.isActivo() ? 1 : 0,
                            (producto.getReferencia() != null && !producto.getReferencia().trim().isEmpty())
                                    ? producto.getReferencia() : null,
                            id
                    );
                } catch (Exception ignored) {
                    try {
                        jdbcTemplate.update("UPDATE productos SET referencia = ?, categoria = ?, descripcion = ?, imagen_url = ? WHERE id = ?",
                                (producto.getReferencia() != null && !producto.getReferencia().trim().isEmpty())
                                        ? producto.getReferencia() : null,
                                producto.getCategoria(),
                                producto.getDescripcion(),
                                producto.getImagenUrl(),
                                id
                        );
                    } catch (Exception ignored2) {}
                }
            }
        } else {
            // UPDATE
            try {
                String sqlRef = "UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, stock = ?, categoria = ?, imagen_url = ?, activo = ?, referencia = ? WHERE id = ?";
                jdbcTemplate.update(sqlRef,
                        producto.getNombre(),
                        producto.getDescripcion(),
                        producto.getPrecio(),
                        producto.getStock(),
                        producto.getCategoria(),
                        producto.getImagenUrl(),
                        producto.isActivo() ? 1 : 0,
                        (producto.getReferencia() != null && !producto.getReferencia().trim().isEmpty())
                                ? producto.getReferencia() : null,
                        producto.getId()
                );
            } catch (Exception e) {
                try {
                    String sqlNoRef = "UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, stock = ?, categoria = ?, imagen_url = ?, activo = ? WHERE id = ?";
                    jdbcTemplate.update(sqlNoRef,
                            producto.getNombre(),
                            producto.getDescripcion(),
                            producto.getPrecio(),
                            producto.getStock(),
                            producto.getCategoria(),
                            producto.getImagenUrl(),
                            producto.isActivo() ? 1 : 0,
                            producto.getId()
                    );
                } catch (Exception e2) {
                    try {
                        String sqlMin = "UPDATE productos SET nombre = ?, precio = ?, stock = ? WHERE id = ?";
                        jdbcTemplate.update(sqlMin,
                                producto.getNombre(),
                                producto.getPrecio(),
                                producto.getStock(),
                                producto.getId()
                        );
                    } catch (Exception ignored) {
                        System.err.println("ERROR update producto: " + ignored.getMessage());
                    }
                }
            }
        }
        return producto;
    }

    public void deleteById(Long id) {
        try {
            String sql = "DELETE FROM productos WHERE id = ?";
            jdbcTemplate.update(sql, id);
        } catch (Exception e) {
            System.err.println("ERROR delete producto: " + e.getMessage());
        }
    }

    private static class ProductoRowMapper implements RowMapper<Producto> {
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
        public Producto mapRow(ResultSet rs, int rowNum) throws SQLException {
            Producto producto = new Producto();
            if (hasCol(rs, "id")) producto.setId(rs.getLong("id"));
            if (hasCol(rs, "nombre")) producto.setNombre(rs.getString("nombre"));
            if (hasCol(rs, "descripcion")) producto.setDescripcion(rs.getString("descripcion"));
            if (hasCol(rs, "precio")) producto.setPrecio(rs.getDouble("precio"));
            if (hasCol(rs, "stock")) producto.setStock(rs.getInt("stock"));
            if (hasCol(rs, "categoria")) producto.setCategoria(rs.getString("categoria"));
            if (hasCol(rs, "imagen_url")) {
                try {
                    producto.setImagenUrl(rs.getString("imagen_url"));
                } catch (SQLException ignored) {}
            }
            if (hasCol(rs, "activo")) {
                try {
                    Object a = rs.getObject("activo");
                    if (a == null) producto.setActivo(true);
                    else if (a instanceof Boolean) producto.setActivo((Boolean) a);
                    else {
                        int n = ((Number) a).intValue();
                        producto.setActivo(n != 0);
                    }
                } catch (SQLException ignored) {
                    producto.setActivo(true);
                }
            } else {
                producto.setActivo(true);
            }
            if (hasCol(rs, "referencia")) {
                try {
                    String ref = rs.getString("referencia");
                    if (ref != null) producto.setReferencia(ref);
                } catch (SQLException ignored) {}
            }
            return producto;
        }
    }
}
