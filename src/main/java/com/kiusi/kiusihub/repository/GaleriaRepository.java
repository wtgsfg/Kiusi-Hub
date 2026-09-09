package com.kiusi.kiusihub.repository;

import com.kiusi.kiusihub.model.Galeria;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

@Repository
public class GaleriaRepository {
    private final JdbcTemplate jdbcTemplate;

    public GaleriaRepository(JdbcTemplate jdbcTemplate){
        this.jdbcTemplate = jdbcTemplate;
    }
    //Obtener todas las fotografías activas
    public List<Galeria> findAll(){
        String sql = """
                SELECT * FROM galeria WHERE activo = true ORDER BY anio DESC, fecha_creacion DESC
                """;
        return jdbcTemplate.query(sql, new GaleriaRowMapper());
    }
    // Buscar una fotografía por su ID
    public Optional<Galeria> findById(Long id){
        String sql = """
                SELECT * FROM galeria WHERE id = ?
                """;
        try{
            Galeria galeria = jdbcTemplate.queryForObject(
                    sql, new Object[]{id}, new GaleriaRowMapper()

            );
            return Optional.ofNullable(galeria);
        } catch (Exception e){
            return Optional.empty();
        }
    }

    // Obtener fotografías de un año específico
    public List<Galeria> findByAnio(Integer anio) {

        String sql = """
                SELECT * FROM galeria
                WHERE anio = ? AND activo = true ORDER BY fecha_creacion DESC
                """;
        return jdbcTemplate.query(
                sql,
                new Object[]{anio}, new GaleriaRowMapper()
        );
    }

    // Obtener fotografías de un evento específico
    public List<Galeria> finByEvento(String evento){
        String sql = """
                SELECT * 
                FROM galeria 
                WHERE evento = ?
                AND activo = true 
                ORDER BY fecha_creacion DESC
                """;
        return jdbcTemplate.query(
                sql,
                new Object[]{evento},
                new GaleriaRowMapper()
        );
    }

    public Galeria save(Galeria galeria) {

        String sql = """
            INSERT INTO galeria
            (titulo, descripcion, imagen_url, anio, evento, activo)
            VALUES (?, ?, ?, ?, ?, ?)
            """;

        jdbcTemplate.update(
                sql,
                galeria.getTitulo(),
                galeria.getDescripcion(),
                galeria.getImagenUrl(),
                galeria.getAnio(),
                galeria.getEvento(),
                galeria.isActivo()
        );

        Long id = jdbcTemplate.queryForObject(
                "SELECT LAST_INSERT_ID()",
                Long.class
        );

        galeria.setId(id);

        return galeria;
    }

    private static class GaleriaRowMapper implements RowMapper<Galeria>{
        @Override public Galeria mapRow(ResultSet rs, int rowNum) throws SQLException{
            Galeria galeria = new Galeria();

            galeria.setId(rs.getLong("id"));
            galeria.setTitulo(rs.getString("titulo"));
            galeria.setDescripcion(rs.getString("descripcion"));
            galeria.setImagenUrl(rs.getString("imagen_url"));
            galeria.setAnio(rs.getInt("anio"));
            galeria.setEvento(rs.getString("evento"));
            galeria.setFechaCreacion(rs.getTimestamp("fecha_creacion").toLocalDateTime()
            );
            galeria.setActivo(rs.getBoolean("activo"));

            return galeria;
        }
    }

    }
