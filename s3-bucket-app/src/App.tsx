import React, { useEffect, useState } from 'react';
import GerenciadorBucket from './pages/GerenciadorBucket';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Slide from '@mui/material/Slide';
import { parseTokenData } from './utils/token';

export const AUTH_LOGIN_URL = '/login';

export const App: React.FC = () => {
  const [pronto, setPronto] = useState(false);
  const [mostrarSucesso, setMostrarSucesso] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // se voltou do Genesys com o token no fragment da URL, salva e limpa a URL
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const token = hashParams.get('token');
    if (token) {
      localStorage.setItem('token', token);
      window.history.replaceState({}, '', '/');
      console.log('Auth - Login bem-sucedido, token recebido da Genesys');
    }

    const savedToken = localStorage.getItem('token');

    // se não tem token no storage vai para a tela de login do genesys
    if (!savedToken) {
      console.log('Auth - Sem token salvo, redirecionando para login');
      window.location.href = AUTH_LOGIN_URL;
      return;
    }

    const { email, isExpired } = parseTokenData(savedToken);
    if (!email || isExpired) {
      console.log('Auth - Token inválido, expirado ou corrompido, redirecionando para login');
      localStorage.removeItem('token');
      window.location.href = AUTH_LOGIN_URL;
      return;
    }

    setUserEmail(email);

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
            width: 'auto',
            maxWidth: '600px',
            position: 'fixed',
            top: 16,
            alignItems: 'center',
            justifyContent: 'center',
            left: 16,
            zIndex: 100,
          }}
          spacing={2}
        >
          <Alert
            severity="success"
            sx={{
              backgroundColor: '#2e3cb4',
              color: '#ffffff',
              borderRadius: '8px',
              '& .MuiAlert-icon': {
                color: '#ffffff',
              },
            }}
          >
            {userEmail
              ? `Usuário autenticado: ${userEmail}`
              : 'Usuário autenticado com sucesso'}
          </Alert>
        </Stack>
      </Slide>
      <GerenciadorBucket />
    </>
  );
};

export default App;