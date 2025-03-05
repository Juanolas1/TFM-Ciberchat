import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Cookies from 'universal-cookie';
import {
  MDBBtn,
  MDBContainer,
  MDBRow,
  MDBCol,
  MDBCard,
  MDBCardBody,
  MDBInput,
  MDBIcon
} from 'mdb-react-ui-kit';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

const cookies = new Cookies();

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { handleLoginSuccess, isResponseOk } = useAuth();

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const handleUserNameChange = (event) => {
    setUsername(event.target.value);
  };

  const login = (event) => {
    event.preventDefault();
    setError("");
    
    // Validación básica
    if (!username || !password) {
      setError("Por favor ingresa usuario y contraseña");
      return;
    }
    
    // Petición de login
    fetch("/api/login/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": cookies.get("csrftoken"),
      },
      credentials: "same-origin",
      body: JSON.stringify({
        username: username,
        password: password
      }),
    })
      .then(isResponseOk)
      .then((data) => {
        console.log(data);
        handleLoginSuccess();
      })
      .catch((err) => {
        console.log(err);
        setError("Contraseña o usuario incorrecto");
      });
  };

  return (
    <MDBContainer fluid>
      <MDBRow className='d-flex justify-content-center align-items-center h-100'>
        <MDBCol col='12'>
          <MDBCard className='bg-dark text-white my-5 mx-auto' style={{ borderRadius: '1rem', maxWidth: '400px' }}>
            <MDBCardBody className='p-5 d-flex flex-column align-items-center mx-auto w-100'>
              <h2 className="fw-bold mb-2 text-uppercase">Login</h2>
              <p className="text-white-50 mb-5">Por favor ingresa tu usuario y contraseña</p>
              
              <MDBInput 
                wrapperClass='mb-4 mx-5 w-100' 
                labelClass='text-white' 
                label='Usuario' 
                id='username' 
                type='text' 
                size="lg"
                value={username}
                onChange={handleUserNameChange}
              />
              
              <MDBInput 
                wrapperClass='mb-4 mx-5 w-100' 
                labelClass='text-white' 
                label='Contraseña' 
                id='password' 
                type='password' 
                size="lg"
                value={password}
                onChange={handlePasswordChange}
              />
              
              {error && <p className="text-danger mb-3">{error}</p>}
              
              <MDBBtn outline className='mx-2 px-5 w-100' color='white' size='lg' onClick={login}>
                Iniciar Sesión
              </MDBBtn>
              
              <div className='d-flex flex-row mt-3 mb-5'>
                <MDBBtn tag='a' color='none' className='m-3' style={{ color: 'white' }}>
                  <MDBIcon fab icon='facebook-f' size="lg"/>
                </MDBBtn>
                <MDBBtn tag='a' color='none' className='m-3' style={{ color: 'white' }}>
                  <MDBIcon fab icon='twitter' size="lg"/>
                </MDBBtn>
                <MDBBtn tag='a' color='none' className='m-3' style={{ color: 'white' }}>
                  <MDBIcon fab icon='google' size="lg"/>
                </MDBBtn>
              </div>
              
              <div>
                <p className="mb-0">¿No tienes una cuenta? <Link to="/register" className="text-white-50 fw-bold">Regístrate</Link></p>
              </div>
            </MDBCardBody>
          </MDBCard>
        </MDBCol>
      </MDBRow>
    </MDBContainer>
  );
};

export default Login;