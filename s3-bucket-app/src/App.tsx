import React, { useEffect, useState } from 'react';
import GerenciadorBucket from './pages/GerenciadorBucket';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Slide from '@mui/material/Slide';

const AUTH_LOGIN_URL = 'http://localhost:3000/login';

export const App: React.FC = () => {
  const [pronto, setPronto] = useState(false);
  const [mostrarSucesso, setMostrarSucesso] = useState(false);

  useEffect(() => {
    // se voltou do Genesys com o token na URL, salva e limpa a URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('token', token);
      window.history.replaceState({}, '', '/');
      console.log('Auth - Login bem-sucedido, token recebido da Genesys');
      setMostrarSucesso(true);
      setTimeout(() => setMostrarSucesso(false), 3000);
    }

    // se não tem token salvo, manda pro login
    if (!localStorage.getItem('token')) {
      console.log('Auth - Sem token salvo, redirecionando para login');
      window.location.href = AUTH_LOGIN_URL;
      return;
    }

    console.log('Auth - Sessão válida, usuário autenticado');
    setMostrarSucesso(true);
    setTimeout(() => setMostrarSucesso(false), 3000);
    setPronto(true);
  }, []);

  if (!pronto) return null;

  return (
    <>
      <Slide in={mostrarSucesso} direction="right" mountOnEnter unmountOnExit timeout={400}>
        <Stack
          sx={{
            width: '20%',
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: 100,
          }}
          spacing={2}
        >
          <Alert
            severity="success"
            sx={{
              backgroundColor: '#aee297',
              color: '#25692d',
              borderRadius: '15px',
              border: '2px solid #99eba4',
            }}
          >
            Usuario autenticado com sucesso
          </Alert>
        </Stack>
      </Slide>
      <GerenciadorBucket />
    </>
  );
};

export default App;