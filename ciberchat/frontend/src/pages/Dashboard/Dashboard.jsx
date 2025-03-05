import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MDBContainer,
  MDBRow,
  MDBCol,
  MDBCard,
  MDBCardBody,
  MDBBtn,
  MDBIcon
} from 'mdb-react-ui-kit';
import { useAuth } from '../../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { handleLogout, whoami } = useAuth();
  const [username, setUsername] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  
  const handleWhoAmI = async () => {
    try {
      const data = await whoami();
      setUsername(data.username);
      setShowAlert(true);
      
      // Ocultar la alerta después de 3 segundos
      setTimeout(() => {
        setShowAlert(false);
      }, 3000);
    } catch (error) {
      console.error("Error al obtener información de usuario:", error);
    }
  };

  return (
    <div className="dashboard-container">
      <MDBContainer fluid className="py-5">
        {showAlert && username && (
          <MDBRow className="justify-content-center mb-4">
            <MDBCol md="8">
              <div className="alert-info-custom">
                Has iniciado sesión como: <strong>{username}</strong>
                <button type="button" className="btn-close" onClick={() => setShowAlert(false)}></button>
              </div>
            </MDBCol>
          </MDBRow>
        )}
        
        <MDBRow className="justify-content-center">
          <MDBCol md="8">
            <MDBCard className="bg-dark text-white">
              <MDBCardBody className="p-5 text-center">
                <h1 className="mb-4">React Cookie Auth</h1>
                <p className="lead mb-4">Iniciaste sesión con éxito</p>
                
                <div className="d-flex flex-column flex-md-row justify-content-center mb-4">
                  <MDBBtn color="primary" className="mx-2 mb-2 mb-md-0" onClick={handleWhoAmI}>
                    <MDBIcon fas icon="user" className="me-2" /> WhoAmI
                  </MDBBtn>
                  <Link to="/chat">
                    <MDBBtn color="success" className="mx-2 mb-2 mb-md-0">
                      <MDBIcon fas icon="comment-dots" className="me-2" /> Ir al Chat
                    </MDBBtn>
                  </Link>
                  <MDBBtn color="danger" className="mx-2" onClick={handleLogout}>
                    <MDBIcon fas icon="sign-out-alt" className="me-2" /> Log out
                  </MDBBtn>
                </div>

                <div className="mt-4 pt-3 border-top border-secondary">
                  <h4 className="mb-3">Características disponibles</h4>
                  <MDBRow>
                    <MDBCol md="4" className="mb-3">
                      <div className="feature-card p-3">
                        <MDBIcon fas icon="robot" size="3x" className="mb-3 text-primary" />
                        <h5>Chat con IA</h5>
                        <p className="small">Conversa con nuestro asistente de IA para resolver tus dudas.</p>
                      </div>
                    </MDBCol>
                    <MDBCol md="4" className="mb-3">
                      <div className="feature-card p-3">
                        <MDBIcon fas icon="history" size="3x" className="mb-3 text-primary" />
                        <h5>Historial de Chats</h5>
                        <p className="small">Accede a tus conversaciones anteriores en cualquier momento.</p>
                      </div>
                    </MDBCol>
                    <MDBCol md="4" className="mb-3">
                      <div className="feature-card p-3">
                        <MDBIcon fas icon="user-shield" size="3x" className="mb-3 text-primary" />
                        <h5>Privacidad</h5>
                        <p className="small">Tus conversaciones son privadas y seguras.</p>
                      </div>
                    </MDBCol>
                  </MDBRow>
                </div>
              </MDBCardBody>
            </MDBCard>
          </MDBCol>
        </MDBRow>
      </MDBContainer>
    </div>
  );
};

export default Dashboard;