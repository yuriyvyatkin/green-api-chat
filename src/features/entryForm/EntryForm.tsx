import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import CssBaseline from '@mui/material/CssBaseline';
import Grid from '@mui/material/Grid';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAppDispatch } from '../../app/hooks';
import useCustomFetch from '../../hooks/useCustomFetch/useCustomFetch';
import CustomAlert from './CustomAlert';
import './EntryForm.css';
import { addUserData, toggleAuthorization } from './entryFormSlice';

const theme = createTheme({
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(0, 128, 105, .7)',
          fontSize: '1.1rem',
          '&:disabled': {
            pointerEvents: 'unset',
            cursor: 'not-allowed',
          },
          '&:hover': {
            backgroundColor: 'rgba(0, 128, 105, 1)',
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        message: {
          fontSize: '1.1rem',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiFormHelperText-root': {
            fontSize: '1.1rem',
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: 'grey',
        },
      },
    },
  },
  typography: {
    body1: {
      fontSize: '1.4rem',
    },
  },
});

type FormValues = {
  id: string;
  token: string;
  phone: string;
};

type InstanceState = {
  stateInstance: string;
};

type Notification = {
  idMessage: string;
};

export default function EntryForm() {
  const [fetchError, setFetchError] = useState('');
  const {
    getSettings,
    getStateInstance,
    setSettings,
    sendText,
  } = useCustomFetch();
  const {
    register,
    setError,
    formState: { errors, isSubmitting },
    handleSubmit,
  } = useForm<FormValues>();
  const dispatch = useAppDispatch();

  const submitForm = async (data: FormValues) => {
    setFetchError('');

    const instance = {
      id: data.id,
      token: data.token,
    };

    try {
      // проверяем валидность Id и токена, запрашивая настройки
      await getSettings(instance);

      // проверяем статус авторизации
      const instanceState = (await getStateInstance(instance)) as InstanceState;

      if (instanceState.stateInstance === 'notAuthorized') {
        setError('id', { type: 'unauthorized' }, { shouldFocus: true });
        setError('token', { type: 'unauthorized' });
        return;
      }

      // проверяем валидность номера собеседника, пока не получим ответ или ошибку от сервера
      let notification;

      do {
        notification = await sendText(instance, 'тестовое сообщение', data.phone) as Notification;
      } while (!notification);

      // устанавливаем базовые настройки для использования чата
      await setSettings(instance, {
        delaySendMessagesMilliseconds: 500,
        outgoingAPIMessageWebhook: 'yes',
        incomingWebhook: 'yes',
        stateWebhook: 'yes',
      });

      await Promise.all([
        dispatch(addUserData(data)),
        dispatch(toggleAuthorization()),
      ]);
    } catch (error) {
      const errorMessage = String(error).toLowerCase();

      if (!window.navigator.onLine) {
        setFetchError('Интернет соединение не доступно');
      } else if (errorMessage.includes('networkerror')) {
        setError('id', { type: 'pattern' }, { shouldFocus: true });
      } else if (errorMessage.includes('unauthorized')) {
        setError('token', { type: 'pattern' }, { shouldFocus: true });
      } else if (errorMessage.includes('client error')) {
        setError(
          'phone',
          { type: 'unregisteredRecipientNumber' },
          { shouldFocus: true },
        );
      } else {
        setFetchError('Ошибка сервера: ' + error);
      }
    }
  };

  return (
    <div className="wrapper">
      <ThemeProvider theme={theme}>
        <Container component="main" maxWidth="sm">
          <CssBaseline />
          <Box
            sx={{
              marginTop: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Typography component="h1" variant="h5">
              Заполните форму
            </Typography>
            <Box
              component="form"
              onSubmit={handleSubmit(submitForm)}
              noValidate
              sx={{ mt: 1 }}
            >
              <Grid container>
                <Grid item xs={12}>
                  <TextField
                    {...register('id', { required: true, pattern: /^[0-9]+$/ })}
                    required
                    margin="normal"
                    fullWidth
                    label="Ваш ID"
                    autoFocus
                    autoComplete="off"
                    disabled={isSubmitting}
                  />
                </Grid>
                {errors.id && <CustomAlert type={errors.id?.type} />}
                <Grid item xs={12}>
                  <TextField
                    {...register('token', {
                      required: true,
                      pattern: /^[0-9a-z]+$/,
                    })}
                    required
                    margin="normal"
                    fullWidth
                    label="Ваш токен"
                    autoComplete="off"
                    disabled={isSubmitting}
                  />
                </Grid>
                {errors.token && <CustomAlert type={errors.token?.type} />}
                <Grid item xs={12}>
                  <TextField
                    {...register('phone', {
                      required: true,
                      pattern: /^[0-9]+$/,
                    })}
                    required
                    margin="normal"
                    fullWidth
                    label="Номер телефона WhatsApp собеседника"
                    type="phone"
                    autoComplete="off"
                    helperText="Пример: 79995550404"
                    disabled={isSubmitting}
                  />
                </Grid>
                {errors.phone && <CustomAlert type={errors.phone?.type} />}
              </Grid>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  mt: 3,
                  mb: 2,
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? <CircularProgress color="inherit" /> : 'Создать чат'}
              </Button>
              {fetchError && <CustomAlert text={fetchError} />}
              <a
                href="https://console.green-api.com/auth/register"
                rel="noopener noreferrer"
                target="_blank"
              >
                Регистрация
              </a>
            </Box>
          </Box>
        </Container>
      </ThemeProvider>
    </div>
  );
}
