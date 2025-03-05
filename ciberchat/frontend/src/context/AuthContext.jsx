import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Verificar la sesión al cargar la aplicación
  useEffect(() => {
    getSession();
  }, []);

  // Función para verificar si hay una sesión activa
  const getSession = () => {
    fetch("/api/session/", {
      credentials: "same-origin",
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setIsAuthenticated(data.isAuthenticated);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  };

  // Función para validar respuestas
  const isResponseOk = (response) => {
    if (response.status >= 200 && response.status <= 299) {
      return response.json();
    } else {
      throw Error(response.statusText);
    }
  };

  // Función para actualizar el estado después de un login exitoso
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  // Función para cerrar sesión
  const handleLogout = () => {
    fetch("/api/logout/", {
      credentials: "same-origin",
    })
      .then(isResponseOk)
      .then((data) => {
        console.log(data);
        setIsAuthenticated(false);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  // Función para verificar quién está autenticado
  const whoami = () => {
    return fetch("/api/whoami/", {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Has iniciado sesión como: " + data.username);
        return data;
      })
      .catch((err) => {
        console.log(err);
        throw err;
      });
  };

  // Exportar todas las funciones y estados relevantes
  const value = {
    isAuthenticated,
    loading,
    handleLoginSuccess,
    handleLogout,
    whoami,
    isResponseOk
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};