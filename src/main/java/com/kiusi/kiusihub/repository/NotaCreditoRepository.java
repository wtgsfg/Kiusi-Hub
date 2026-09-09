
package com.kiusi.kiusihub.repository;

import com.kiusi.kiusihub.model.ItemNotaCredito;
import com.kiusi.kiusihub.model.NotaCredito;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Date;
import java.util.List;
import java.util.Optional;

@Repository
public class NotaCreditoRepository {

    private final JdbcTemplate jdbcTemplate;
    private final ItemNotaCreditoRepository itemNotaCreditoRepository;

    private volatile Boolean columnaFechaCreacionExiste = null;

    public NotaCreditoRepository(JdbcTemplate jdbcTemplate, ItemNotaCreditoRepository itemNotaCreditoRepository) {
        this.jdbcTemplate = jdbcTemplate;
        this.itemNotaCreditoRepository = itemNotaCreditoRepository;
    }

    /**
     * Detecta de forma perezosa si la tabla notas_credito usa el nombre de columna
     * moderno 'fecha_creacion' o el legacy 'fecha' (palabra reservada MySQL).
     * Cacheamos en memoria para no lanzar la query de detección en cada llamada.
     */
    private boolean usaFechaCreacion() {
        Boolean b = columnaFechaCreacionExiste;
        if (b != null) {
            return b;
        }
        synchronized (this) {
            b = columnaFechaCreacionExiste;
            if (b != null) return b;
            try {
                jdbcTemplate.queryForObject(
                    "SELECT fecha_creacion FROM notas_credito LIMIT 1",
                    (rs, i) -> 1);
                columnaFechaCreacionExiste = true;
                return true;
            } catch (Exception e) {
                columnaFechaCreacionExiste = false;
                return false;
            }
        }
    }

    private String colFecha() {
        return usaFechaCreacion() ? "fecha_creacion" : "fecha";
    }

    public List<NotaCredito> findAll() {
        String sql = "SELECT id, factura_id, monto, motivo, " + colFecha() + " AS fecha_creacion, anulada, fecha_anulacion FROM notas_credito ORDER BY id DESC";
        List<NotaCredito> notas = jdbcTemplate.query(sql, new NotaCreditoRowMapper());
        for (NotaCredito nota : notas) {
            List<ItemNotaCredito> items = itemNotaCreditoRepository.findByNotaCreditoId(nota.getId());
            nota.setItems(items);
        }
        return notas;
    }

    public Optional<NotaCredito> findById(Long id) {
        String sql = "SELECT id, factura_id, monto, motivo, " + colFecha() + " AS fecha_creacion, anulada, fecha_anulacion FROM notas_credito WHERE id = ?";
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
        String sql = "SELECT id, factura_id, monto, motivo, " + colFecha() + " AS fecha_creacion, anulada, fecha_anulacion FROM notas_credito WHERE factura_id = ? ORDER BY id DESC";
        List<NotaCredito> notas = jdbcTemplate.query(sql, new Object[]{facturaId}, new NotaCreditoRowMapper());
        for (NotaCredito nota : notas) {
            List<ItemNotaCredito> items = itemNotaCreditoRepository.findByNotaCreditoId(nota.getId());
            nota.setItems(items);
        }
        return notas;
    }

    public NotaCredito save(NotaCredito notaCredito) {
        final String colF = colFecha();
        if (notaCredito.getId() == null) {
            if (notaCredito.getFecha() == null) {
                notaCredito.setFecha(new Date(System.currentTimeMillis()));
            }
            String sql = "INSERT INTO notas_credito (factura_id, monto, motivo, " + colF + ", anulada, fecha_anulacion) VALUES (?, ?, ?, ?, ?, ?)";
            jdbcTemplate.update(sql,
                    notaCredito.getFacturaId(),
                    notaCredito.getMonto(),
                    notaCredito.getMotivo(),
                    notaCredito.getFecha(),
                    notaCredito.isAnulada(),
                    notaCredito.getFechaAnulacion());
            Long id;
            try {
                id = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
            } catch (Exception e) {
                try {
                    id = jdbcTemplate.queryForObject("SELECT MAX(id) FROM notas_credito", Long.class);
                } catch (Exception e2) {
                    id = null;
                }
            }
            if (id == null) {
                id = jdbcTemplate.queryForObject("SELECT COALESCE(MAX(id), 0) + 1 FROM notas_credito", Long.class);
            }
            notaCredito.setId(id);

            if (notaCredito.getItems() != null) {
                for (ItemNotaCredito item : notaCredito.getItems()) {
                    item.setNotaCreditoId(id);
                    itemNotaCreditoRepository.save(item);
                }
            }
        } else {
            if (notaCredito.getFecha() == null) {
                notaCredito.setFecha(new Date(System.currentTimeMillis()));
            }
            String sql = "UPDATE notas_credito SET factura_id = ?, monto = ?, motivo = ?, " + colF + " = ?, anulada = ?, fecha_anulacion = ? WHERE id = ?";
            jdbcTemplate.update(sql,
                    notaCredito.getFacturaId(),
                    notaCredito.getMonto(),
                    notaCredito.getMotivo(),
                    notaCredito.getFecha(),
                    notaCredito.isAnulada(),
                    notaCredito.getFechaAnulacion(),
                    notaCredito.getId());
        }
        return notaCredito;
    }

    public int marcarAnulada(Long id) {
        String sql = "UPDATE notas_credito SET anulada = TRUE, fecha_anulacion = ? WHERE id = ? AND anulada = FALSE";
        Date hoy = new Date(System.currentTimeMillis());
        return jdbcTemplate.update(sql, hoy, id);
    }

    public double findMontoTotalActivoByFacturaId(Long facturaId) {
        String sql = "SELECT COALESCE(SUM(monto), 0) FROM notas_credito WHERE factura_id = ? AND anulada = FALSE";
        try {
            Double result = jdbcTemplate.queryForObject(sql, new Object[]{facturaId}, Double.class);
            return result != null ? result : 0.0;
        } catch (Exception e) {
            return 0.0;
        }
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
                nota.setFecha(rs.getDate("fecha_creacion"));
            } catch (SQLException e) {
                try {
                    nota.setFecha(rs.getDate("fecha"));
                } catch (SQLException ignored) {
                }
            }
            try {
                nota.setAnulada(rs.getBoolean("anulada"));
            } catch (SQLException e) {
                nota.setAnulada(false);
            }
            try {
                Date fa = rs.getDate("fecha_anulacion");
                if (!rs.wasNull()) {
                    nota.setFechaAnulacion(fa);
                }
            } catch (SQLException e) {
            }
            return nota;
        }
    }
}
