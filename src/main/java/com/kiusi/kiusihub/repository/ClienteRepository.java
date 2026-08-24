package com.kiusi.kiusihub.repository;

import com.kiusi.kiusihub.model.Cliente;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

@Repository
public class ClienteRepository {

    private final JdbcTemplate jdbcTemplate;

    public ClienteRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Cliente> findAll() {
        String sql = "SELECT * FROM clientes";
        return jdbcTemplate.query(sql, new ClienteRowMapper());
    }

    public Optional<Cliente> findById(Long id) {
        String sql = "SELECT * FROM clientes WHERE id = ?";
        try {
            Cliente cliente = jdbcTemplate.queryForObject(sql, new Object[]{id}, new ClienteRowMapper());
            return Optional.ofNullable(cliente);
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    public Cliente save(Cliente cliente) {
        if (cliente.getId() == null) {
            String sql = "INSERT INTO clientes (nombre, ciudad, direccion, nit, vendedor, numero) VALUES (?, ?, ?, ?, ?, ?)";
            jdbcTemplate.update(sql, cliente.getNombre(), cliente.getCiudad(), cliente.getDireccion(), cliente.getNit(), cliente.getVendedor(), cliente.getNumero());
            Long id = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
            cliente.setId(id);
        } else {
            String sql = "UPDATE clientes SET nombre = ?, ciudad = ?, direccion = ?, nit = ?, vendedor = ?, numero = ? WHERE id = ?";
            jdbcTemplate.update(sql, cliente.getNombre(), cliente.getCiudad(), cliente.getDireccion(), cliente.getNit(), cliente.getVendedor(), cliente.getNumero(), cliente.getId());
        }
        return cliente;
    }

    public void deleteById(Long id) {
        String sql = "DELETE FROM clientes WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }

    private static class ClienteRowMapper implements RowMapper<Cliente> {
        @Override
        public Cliente mapRow(ResultSet rs, int rowNum) throws SQLException {
            Cliente cliente = new Cliente();
            cliente.setId(rs.getLong("id"));
            cliente.setNombre(rs.getString("nombre"));
            cliente.setCiudad(rs.getString("ciudad"));
            cliente.setDireccion(rs.getString("direccion"));
            cliente.setNit(rs.getString("nit"));
            cliente.setVendedor(rs.getString("vendedor"));
            cliente.setNumero(rs.getString("numero"));
            return cliente;
        }
    }
}
