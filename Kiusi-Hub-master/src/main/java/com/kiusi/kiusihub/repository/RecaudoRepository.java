package com.kiusi.kiusihub.repository;

import com.kiusi.kiusihub.model.Recaudo;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

@Repository
public class RecaudoRepository {

    private final JdbcTemplate jdbcTemplate;

    public RecaudoRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Recaudo> findAll() {
        String sql = "SELECT * FROM recaudos";
        return jdbcTemplate.query(sql, new RecaudoRowMapper());
    }

    public Optional<Recaudo> findById(Long id) {
        String sql = "SELECT * FROM recaudos WHERE id = ?";
        try {
            Recaudo recaudo = jdbcTemplate.queryForObject(sql, new Object[]{id}, new RecaudoRowMapper());
            return Optional.ofNullable(recaudo);
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    public List<Recaudo> findByFacturaId(Long facturaId) {
        String sql = "SELECT * FROM recaudos WHERE factura_id = ?";
        return jdbcTemplate.query(sql, new Object[]{facturaId}, new RecaudoRowMapper());
    }

    public Recaudo save(Recaudo recaudo) {
        if (recaudo.getId() == null) {
            String sql = "INSERT INTO recaudos (factura_id, monto, fecha) VALUES (?, ?, NOW())";
            try {
                jdbcTemplate.update(sql, recaudo.getFacturaId(), recaudo.getMonto());
            } catch (Exception e) {
                try {
                    String sql2 = "INSERT INTO recaudos (factura_id, monto, fecha, metodo_pago) VALUES (?, ?, NOW(), ?)";
                    jdbcTemplate.update(sql2, recaudo.getFacturaId(), recaudo.getMonto(), recaudo.getMetodoPago());
                } catch (Exception e2) {
                }
            }
            Long id = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
            recaudo.setId(id);
        } else {
            String sql = "UPDATE recaudos SET factura_id = ?, monto = ? WHERE id = ?";
            try {
                jdbcTemplate.update(sql, recaudo.getFacturaId(), recaudo.getMonto(), recaudo.getId());
            } catch (Exception e) {
                try {
                    String sql2 = "UPDATE recaudos SET factura_id = ?, monto = ?, metodo_pago = ? WHERE id = ?";
                    jdbcTemplate.update(sql2, recaudo.getFacturaId(), recaudo.getMonto(), recaudo.getMetodoPago(), recaudo.getId());
                } catch (Exception e2) {
                }
            }
        }
        return recaudo;
    }

    public void deleteById(Long id) {
        String sql = "DELETE FROM recaudos WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }

    private static class RecaudoRowMapper implements RowMapper<Recaudo> {
        @Override
        public Recaudo mapRow(ResultSet rs, int rowNum) throws SQLException {
            Recaudo recaudo = new Recaudo();
            recaudo.setId(rs.getLong("id"));
            recaudo.setFacturaId(rs.getLong("factura_id"));
            recaudo.setMonto(rs.getDouble("monto"));
            try {
                recaudo.setFecha(rs.getDate("fecha"));
            } catch (SQLException e) {
            }
            try {
                recaudo.setMetodoPago(rs.getString("metodo_pago"));
            } catch (SQLException e) {
            }
            return recaudo;
        }
    }
}
