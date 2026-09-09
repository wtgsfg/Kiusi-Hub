package com.kiusi.kiusihub.exception;

import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static Throwable getRootCause(Throwable t) {
        Throwable cause = t;
        while (cause != null && cause.getCause() != null && cause.getCause() != cause) {
            cause = cause.getCause();
        }
        return cause;
    }

    private static Map<String, String> buildErrorMap(String msg) {
        Map<String, String> error = new HashMap<>();
        error.put("error", msg);
        return error;
    }

    // Manejar errores de validación (@Valid)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        return new ResponseEntity<>(errors, HttpStatus.BAD_REQUEST);
    }

    // Manejar ResourceNotFoundException
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleResourceNotFoundException(ResourceNotFoundException ex) {
        return new ResponseEntity<>(buildErrorMap(ex.getMessage()), HttpStatus.NOT_FOUND);
    }

    // Manejar excepciones de negocio / validaciones (400 BAD_REQUEST)
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleIllegalStateException(IllegalStateException ex) {
        return new ResponseEntity<>(buildErrorMap(ex.getMessage() != null ? ex.getMessage() : "Operación no permitida"),
                HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgumentException(IllegalArgumentException ex) {
        return new ResponseEntity<>(buildErrorMap(ex.getMessage() != null ? ex.getMessage() : "Argumento inválido"),
                HttpStatus.BAD_REQUEST);
    }

    // Manejar excepciones JDBC / DAO con ROOT CAUSE (la excepción SQL real)
    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<Map<String, String>> handleDataAccess(DataAccessException ex) {
        Throwable root = getRootCause(ex);
        String mensaje;
        if (root instanceof SQLException sqle) {
            mensaje = "Error en la base de datos: " + sqle.getMessage();
            if (sqle.getSQLState() != null) {
                mensaje = mensaje + " [SQLState: " + sqle.getSQLState() + ", ErrorCode: " + sqle.getErrorCode() + "]";
            }
        } else if (root != null && root.getMessage() != null) {
            mensaje = "Error en base de datos: " + root.getMessage();
        } else {
            mensaje = "Error al acceder a la base de datos: " + ex.getMessage();
        }
        ex.printStackTrace(System.err);
        return new ResponseEntity<>(buildErrorMap(mensaje), HttpStatus.BAD_REQUEST);
    }

    // Manejar excepciones genéricas de Runtime
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeExceptions(RuntimeException ex) {
        if (ex instanceof IllegalStateException || ex instanceof IllegalArgumentException) {
            return new ResponseEntity<>(buildErrorMap(ex.getMessage() != null ? ex.getMessage() : "Error en la operación"),
                    HttpStatus.BAD_REQUEST);
        }
        Throwable root = getRootCause(ex);
        String msg = "Ocurrió un error inesperado";
        if (root != null && root.getMessage() != null) {
            msg = root.getMessage();
        } else if (ex.getMessage() != null) {
            msg = ex.getMessage();
        }
        ex.printStackTrace(System.err);
        return new ResponseEntity<>(buildErrorMap(msg), HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // Manejar cualquier otra excepción no controlada
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleAllExceptions(Exception ex) {
        Throwable root = getRootCause(ex);
        Map<String, String> error = new HashMap<>();
        String msg = "Ha ocurrido un error inesperado";
        if (root != null && root.getMessage() != null) {
            error.put("detalle_root", root.getMessage());
            if (root instanceof SQLException sqle) {
                msg = "Error en la base de datos: " + sqle.getMessage();
                if (sqle.getSQLState() != null) {
                    error.put("sql_state", sqle.getSQLState());
                    error.put("sql_error_code", String.valueOf(sqle.getErrorCode()));
                }
            }
        }
        error.put("error", msg);
        if (ex.getMessage() != null) {
            error.put("detalle", ex.getMessage());
        }
        ex.printStackTrace(System.err);
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
