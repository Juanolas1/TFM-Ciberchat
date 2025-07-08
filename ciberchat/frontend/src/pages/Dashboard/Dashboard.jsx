import React from 'react';
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
import guardIAnLogo from '../../images/guardIAnlogo.png';


const Dashboard = () => {
  const { handleLogout } = useAuth();

  return (
    <div className="dashboard-container">
      <MDBContainer fluid className="py-5">
        <MDBRow className="justify-content-center">
          <MDBCol md="10" lg="8">
            <MDBCard className="guardian-main-card">
              <MDBCardBody className="p-5 text-center">
                {/* Header con logo/icono */}
                <div className="guardian-header mb-4">
                  <div className="guardian-logo mb-3">
                    <MDBIcon fas icon="shield-alt" size="4x" className="guardian-icon" />
                    {/*<img src={guardIAnLogo} alt="Guardian Logo" style={{ width: '90px', height: '90px' }} />*/}

                  </div>
                  <h1 className="guardian-title mb-3">Bienvenido a guardIAn</h1>
                  <p className="guardian-subtitle">Tu asistente inteligente de seguridad y protección</p>
                </div>
                
                {/* Botones principales */}
                <div className="guardian-actions mb-5">
                  <Link to="/chat">
                    <MDBBtn color="primary" size="lg" className="guardian-btn mx-3 mb-3">
                      <MDBIcon fas icon="comment-dots" className="me-2" /> 
                      Iniciar Chat
                    </MDBBtn>
                  </Link>
                  <MDBBtn color="danger" size="lg" className="guardian-btn mx-3 mb-3" onClick={handleLogout}>
                    <MDBIcon fas icon="sign-out-alt" className="me-2" /> 
                    Cerrar Sesión
                  </MDBBtn>
                </div>
                
                {/* Sección de características */}
                <div className="guardian-features">
                  <h3 className="features-title mb-4">¿Qué puedo hacer por ti?</h3>
                  <MDBRow>
                    <MDBCol md="4" className="mb-4">
                      <div className="feature-card">
                        <MDBIcon fas icon="brain" size="3x" className="feature-icon mb-3" />
                        <h5 className="feature-title">Inteligencia Artificial</h5>
                        <p className="feature-description">
                          Conversaciones inteligentes adaptadas a tus necesidades de seguridad
                        </p>
                      </div>
                    </MDBCol>
                    <MDBCol md="4" className="mb-4">
                      <div className="feature-card">
                        <MDBIcon fas icon="lock" size="3x" className="feature-icon mb-3" />
                        <h5 className="feature-title">Seguridad Total</h5>
                        <p className="feature-description">
                          Protección avanzada y análisis de vulnerabilidades en tiempo real
                        </p>
                      </div>
                    </MDBCol>
                    <MDBCol md="4" className="mb-4">
                      <div className="feature-card">
                        <MDBIcon fas icon="clock" size="3x" className="feature-icon mb-3" />
                        <h5 className="feature-title">Disponible 24/7</h5>
                        <p className="feature-description">
                          Asistencia continua para resolver tus consultas cuando las necesites
                        </p>
                      </div>
                    </MDBCol>
                  </MDBRow>
                </div>

                {/* Sección adicional con estadísticas o info */}
                <div className="guardian-stats mt-5 pt-4">
                  <MDBRow>
                    <MDBCol md="4" className="text-center mb-3">
                      <div className="stat-item">
                        <h2 className="stat-number">24/7</h2>
                        <p className="stat-label">Protección Continua</p>
                      </div>
                    </MDBCol>
                    <MDBCol md="4" className="text-center mb-3">
                      <div className="stat-item">
                        <h2 className="stat-number">100%</h2>
                        <p className="stat-label">Confidencial</p>
                      </div>
                    </MDBCol>
                    <MDBCol md="4" className="text-center mb-3">
                      <div className="stat-item">
                        <h2 className="stat-number">AI</h2>
                        <p className="stat-label">Tecnología Avanzada</p>
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