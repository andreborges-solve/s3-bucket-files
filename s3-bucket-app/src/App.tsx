import React, { useEffect, useState } from 'react';
import GerenciadorBucket from './pages/GerenciadorBucket';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Slide from '@mui/material/Slide';

const AUTH_LOGIN_URL = 'http://localhost:3000/login';

// extrai o payload do JWT
function getEmailFromToken(token: string | null): string | null {
  if (!token) return null;
  try {
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return null;
    const jsonStr = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
    const data = JSON.parse(jsonStr);
    return data.email || null;
  } catch {
    return null;
  }
}

export const App: React.FC = () => {
  const [pronto, setPronto] = useState(false);
  const [mostrarSucesso, setMostrarSucesso] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // se voltou do Genesys com o token na URL, salva e limpa a URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
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

    const email = getEmailFromToken(savedToken);
    setUserEmail(email);

    // console.log(`oauth - Usuário autenticado: ${email ?? 'desconhecido'}`); //teste do auth
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
            maxWidth: '380px',
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