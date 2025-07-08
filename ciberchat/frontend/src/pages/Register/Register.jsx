import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Cookies from 'universal-cookie';
import {
  MDBBtn,
  MDBContainer,
  MDBRow,
  MDBCol,
  MDBCard,
  MDBCardBody,
  MDBInput,
  MDBIcon,
  MDBCheckbox
} from 'mdb-react-ui-kit';
import { useAuth } from '../../context/AuthContext';
import './Register.css';

const cookies = new Cookies();

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    acceptTerms: false
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { isResponseOk } = useAuth();

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const validateForm = () => {
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Todos los campos son obligatorios');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }
    
    if (!formData.acceptTerms) {
      setError('Debes aceptar los términos y condiciones');
      return false;
    }
    
    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Por favor, ingresa un email válido');
      return false;
    }
    
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!validateForm()) {
      return;
    }
    
    // Enviar petición al backend para registro
    fetch('/api/register/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': cookies.get('csrftoken'),
      },
      credentials: 'same-origin',
      body: JSON.stringify({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName
      }),
    })
      .then(isResponseOk)
      .then((data) => {
        console.log('Registro exitoso:', data);
        setSuccess('¡Registro exitoso! Redirigiendo al login...');
        
        // Redireccionar al login después de 2 segundos
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      })
      .catch((err) => {
        console.error('Error en registro:', err);
        setError('Error al registrar el usuario. Por favor, intenta con otro nombre de usuario o email.');
      });
  };

  return (
    <MDBContainer fluid className="register-container">
      <MDBRow className='d-flex justify-content-center align-items-center h-100'>
        <MDBCol col='12' className='m-3'>
          <MDBCard className='bg-dark text-white my-5 mx-auto' style={{ borderRadius: '1rem', maxWidth: '500px' }}>
            <MDBCardBody className='p-5 d-flex flex-column align-items-center mx-auto w-100 form-white'>
                <h2 className="fw-bold mb-2 text-uppercase">Registro</h2>
              <p className="text-white-50 mb-4">Crea una cuenta nueva</p>
              
              <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                <MDBRow>
                  <MDBCol col='6'>
                    <MDBInput
                      wrapperClass='mb-3'
                      labelClass='text-white'
                      label='Nombre'
                      id='firstName'
                      name='firstName'
                      type='text'
                      size="lg"
                      value={formData.firstName}
                      onChange={handleInputChange}
                    />
                  </MDBCol>
                  <MDBCol col='6'>
                    <MDBInput
                      wrapperClass='mb-3'
                      labelClass='text-white'
                      label='Apellido'
                      id='lastName'
                      name='lastName'
                      type='text'
                      size="lg"
                      value={formData.lastName}
                      onChange={handleInputChange}
                    />
                  </MDBCol>
                </MDBRow>
                
                <MDBInput
                  wrapperClass='mb-3'
                  labelClass='text-white'
                  label='Usuario *'
                  id='username'
                  name='username'
                  type='text'
                  size="lg"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                />
                
                <MDBInput
                  wrapperClass='mb-3'
                  labelClass='text-white'
                  label='Email *'
                  id='email'
                  name='email'
                  type='email'
                  size="lg"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
                
                <MDBInput
                  wrapperClass='mb-3'
                  labelClass='text-white'
                  label='Contraseña *'
                  id='password'
                  name='password'
                  type='password'
                  size="lg"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                
                <MDBInput
                  wrapperClass='mb-3'
                  labelClass='text-white'
                  label='Confirmar Contraseña *'
                  id='confirmPassword'
                  name='confirmPassword'
                  type='password'
                  size="lg"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
                
                <div className='mb-3'>
                  <MDBCheckbox
                    name='acceptTerms'
                    id='acceptTerms'
                    label='Acepto los términos y condiciones *'
                    checked={formData.acceptTerms}
                    onChange={handleInputChange}
                    labelClass='text-white'
                  />
                </div>
                
                {error && <div className="text-danger mb-3">{error}</div>}
                {success && <div className="text-success mb-3">{success}</div>}
                
                <MDBBtn type='submit' outline className='mx-2 px-5 w-100' color='white' size='lg'>
                  Registrarse
                </MDBBtn>
              </form>
              
              <div className='mt-3'>
                <p className="mb-0">¿Ya tienes una cuenta? <Link to="/login" className="text-white-50 fw-bold">Iniciar sesión</Link></p>
              </div>
            </MDBCardBody>
          </MDBCard>
        </MDBCol>
      </MDBRow>
    </MDBContainer>
  );
};

export default Register;