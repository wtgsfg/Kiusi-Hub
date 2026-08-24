package com.kiusi.kiusihub.service;

import com.kiusi.kiusihub.repository.UsuarioRepository;
import org.springframework.stereotype.Service;

@Service
public class AdminAuthorizationService {

    private final UsuarioRepository usuarioRepository;

    public AdminAuthorizationService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    public boolean esAdministrador(Long idUsuario) {
        return usuarioRepository.esAdministrador(idUsuario);
    }
}