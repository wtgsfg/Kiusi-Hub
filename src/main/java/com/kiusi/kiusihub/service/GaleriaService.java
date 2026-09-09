package com.kiusi.kiusihub.service;
import com.kiusi.kiusihub.model.Galeria;
import com.kiusi.kiusihub.repository.GaleriaRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class GaleriaService {
    private final GaleriaRepository galeriaRepository;

    public GaleriaService(GaleriaRepository galeriaRepository){
        this.galeriaRepository = galeriaRepository;
    }

    // Obtener todas las fotografías
    public List<Galeria> findAll() {
        return galeriaRepository.findAll();
    }

    // Buscar una fotografía por ID
    public Optional<Galeria> findById(Long id) {
        return galeriaRepository.findById(id);
    }

    // Obtener fotografías por año
    public List<Galeria> findByAnio(Integer anio) {
        return galeriaRepository.findByAnio(anio);
    }

    // Obtener fotografías por evento
    public List<Galeria> findByEvento(String evento) {
        return galeriaRepository.finByEvento(evento);
    }

    public Galeria save(Galeria galeria) {
        return galeriaRepository.save(galeria);
    }

}
