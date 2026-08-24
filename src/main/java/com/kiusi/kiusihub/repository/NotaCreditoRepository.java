
package com.kiusi.kiusihub.repository;

import com.kiusi.kiusihub.model.ItemNotaCredito;
import com.kiusi.kiusihub.model.NotaCredito;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

@Repository
public class NotaCreditoRepository {

    private final JdbcTemplate jdbcTemplate;
    private final ItemNotaCreditoRepository itemNotaCreditoRepository;

    public NotaCreditoRepository(JdbcTemplate jdbcTemplate, ItemNotaCreditoRepository itemNotaCreditoRepository) {
        this.jdbcTemplate = jdbcTemplate;
        this.itemNotaCreditoRepository = itemNotaCreditoRepository;
    }

    public List<NotaCredito> findAll() {
        String sql = "SELECT * FROM notas_credito";
        return jdbcTemplate.query(sql, new NotaCreditoRowMapper());
    }

    public Optional<NotaCredito> findById(Long id) {
        String sql = "SELECT * FROM notas_credito WHERE id = ?";
        try {
            NotaCredito nota = jdbcTemplate.queryForObject(sql, new Object[]{id}, new NotaCreditoRowMapper());
            if (nota != null) {
                List<ItemNotaCredito> items = itemNotaCreditoRepository.findByNotaCreditoId(nota.getId());
                nota.setItems(items);
            }
            return Optional.ofNullable(nota);
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    public List<NotaCredito> findByFacturaId(Long facturaId) {
        String sql = "SELECT * FROM notas_credito WHERE factura_id = ?";
        List<NotaCredito> notas = jdbcTemplate.query(sql, new Object[]{facturaId}, new NotaCreditoRowMapper());
        for (NotaCredito nota : notas) {
            List<ItemNotaCredito> items = itemNotaCreditoRepository.findByNotaCreditoId(nota.getId());
            nota.setItems(items);
        }
        return notas;
    }

    public NotaCredito save(NotaCredito notaCredito) {
        if (notaCredito.getId() == null) {
            String sql = "INSERT INTO notas_credito (factura_id, monto, motivo, fecha) VALUES (?, ?, ?, NOW())";
            jdbcTemplate.update(sql, notaCredito.getFacturaId(), notaCredito.getMonto(), notaCredito.getMotivo());
            Long id = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
            notaCredito.setId(id);

            // Guardar items
            if (notaCredito.getItems() != null) {
                for (ItemNotaCredito item : notaCredito.getItems()) {
                    item.setNotaCreditoId(id);
                    itemNotaCreditoRepository.save(item);
                }
            }
        }
        return notaCredito;
    }

    public void deleteById(Long id) {
        String sql = "DELETE FROM notas_credito WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }

    private static class NotaCreditoRowMapper implements RowMapper<NotaCredito> {
        @Override
        public NotaCredito mapRow(ResultSet rs, int rowNum) throws SQLException {
            NotaCredito nota = new NotaCredito();
            nota.setId(rs.getLong("id"));
            nota.setFacturaId(rs.getLong("factura_id"));
            nota.setMonto(rs.getDouble("monto"));
            nota.setMotivo(rs.getString("motivo"));
            try {
                nota.setFecha(rs.getDate("fecha"));
            } catch (SQLException e) {
            }
            return nota;
        }
    }
}
