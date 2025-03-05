import React from 'react';
import { MDBSpinner } from 'mdb-react-ui-kit';
import './Loader.css';

const Loader = () => {
  return (
    <div className="loader-container">
      <MDBSpinner role='status' color='primary'>
        <span className='visually-hidden'>Cargando...</span>
      </MDBSpinner>
    </div>
  );
};

export default Loader;