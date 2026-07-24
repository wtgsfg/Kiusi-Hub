package com.kiusi.kiusihub.repository;

import com.kiusi.kiusihub.model.Usuario;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

@Repository
public class UsuarioRepository {

    private final JdbcTemplate jdbcTemplate;

    public UsuarioRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Usuario> findAll() {
        String sql = "SELECT * FROM usuarios";
        return jdbcTemplate.query(sql, new UsuarioRowMapper());
    }

    public Optional<Usuario> findById(Long id) {
        String sql = "SELECT * FROM usuarios WHERE id = ?";
        try {
            Usuario usuario = jdbcTemplate.queryForObject(sql, new Object[]{id}, new UsuarioRowMapper());
            return Optional.ofNullable(usuario);
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    public Optional<Usuario> findByUsername(String username) {
        String sql = "SELECT * FROM usuarios WHERE username = ?";
        try {
            Usuario usuario = jdbcTemplate.queryForObject(sql, new Object[]{username}, new UsuarioRowMapper());
            return Optional.ofNullable(usuario);
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    public Usuario save(Usuario usuario) {
        if (usuario.getId() == null) {
            String sql = "INSERT INTO usuarios (username, password, rol) VALUES (?, ?, ?)";
            try {
                jdbcTemplate.update(sql, usuario.getUsername(), usuario.getPassword(), usuario.getRol());
            } catch (Exception e) {
                try {
                    String sql2 = "INSERT INTO usuarios (username, password, rol, nombre) VALUES (?, ?, ?, ?)";
                    jdbcTemplate.update(sql2, usuario.getUsername(), usuario.getPassword(), usuario.getRol(), usuario.getNombre());
                } catch (Exception e2) {
                }
            }
            Long id = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
            usuario.setId(id);
        } else {
            String sql = "UPDATE usuarios SET username = ?, password = ?, rol = ? WHERE id = ?";
            try {
                jdbcTemplate.update(sql, usuario.getUsername(), usuario.getPassword(), usuario.getRol(), usuario.getId());
            } catch (Exception e) {
                try {
                    String sql2 = "UPDATE usuarios SET username = ?, password = ?, rol = ?, nombre = ? WHERE id = ?";
                    jdbcTemplate.update(sql2, usuario.getUsername(), usuario.getPassword(), usuario.getRol(), usuario.getNombre(), usuario.getId());
                } catch (Exception e2) {
                }
            }
        }
        return usuario;
    }

    public void deleteById(Long id) {
        String sql = "DELETE FROM usuarios WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }

    private static class UsuarioRowMapper implements RowMapper<Usuario> {
        @Override
        public Usuario mapRow(ResultSet rs, int rowNum) throws SQLException {
            Usuario usuario = new Usuario();
            usuario.setId(rs.getLong("id"));
            usuario.setUsername(rs.getString("username"));
            usuario.setPassword(rs.getString("password"));
            usuario.setRol(rs.getString("rol"));
            try {
                usuario.setNombre(rs.getString("nombre"));
            } catch (SQLException e) {
            }
            return usuario;
        }
    }
}
