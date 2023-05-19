/* eslint-disable react-hooks/exhaustive-deps */
import {
  ChatContainer,
  MainContainer,
  MessageInput,
  MessageList,
} from '@chatscope/chat-ui-kit-react';
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import useCustomFetch from '../../hooks/useCustomFetch/useCustomFetch';
import { toggleAuthorization } from '../entryForm/entryFormSlice';
import './Chat.css';
import ChatMessage from './chatMessage/ChatMessage';
import { addMessage } from './chatSlice';

type Notification = {
  receiptId: number;
  body: {
    typeWebhook: string;
    idMessage?: string;
    messageData?: {
      extendedTextMessageData: {
        text: string;
      };
      textMessageData: {
        textMessage: string;
      };
    };
    timestamp: number;
    stateInstance?: string;
  };
};

export default function Chat() {
  const [messageIds, setMessageIds] = useState<Set<string>>(new Set());
  const [notificationHandling, setNotificationHandling] = useState(false);
  const user = useAppSelector((store) => store.user);
  const messages = useAppSelector((store) => store.messages);
  const dispatch = useAppDispatch();
  const { sendText, getNotification, deleteNotification } = useCustomFetch();

  const instance = {
    id: user.id,
    token: user.token,
  };

  const updateMessageIds = (
    prevState: Set<string>,
    newId: string | undefined,
  ) => {
    if (newId) {
      const newState = new Set(prevState);
      newState.add(newId);
      return newState;
    }
    return prevState;
  };

  const handleNotification = (notification: Notification) => {
    if (notificationHandling) {
      return;
    }

    let type = notification.body.typeWebhook;

    if (type === 'outgoingAPIMessageReceived') {
      type = 'outgoing';
    } else if (type === 'outgoingMessageReceived') {
      type = 'incoming';
    } else {
      return;
    }

    setNotificationHandling(true);

    const newId = notification.body.idMessage;

    if (
      notification.body.hasOwnProperty('stateInstance') &&
      notification.body.stateInstance === 'authorized'
    ) {
      dispatch(toggleAuthorization());
    } else if (!messageIds.has(newId as string)) {
      setMessageIds((prevState) => updateMessageIds(prevState, newId));
      const text =
        type === 'incoming'
          ? notification.body?.messageData?.textMessageData.textMessage
          : notification.body?.messageData?.extendedTextMessageData.text;

      dispatch(
        addMessage({
          id: notification.body.idMessage,
          text: text,
          timestamp: notification.body.timestamp,
          type: type,
        }),
      );
    }

    deleteNotification(instance, notification.receiptId);
    setNotificationHandling(false);
  };

  useEffect(() => {
    const checkIncomingMessages = async () => {
      try {
        const data = await getNotification(instance);
        const notification: Notification = data as Notification;

        if (notification && !notificationHandling) {
          handleNotification(notification);
        }
      } catch (error) {
        console.error('Ошибка: ', error);
      }
    };

    const intervalId = setInterval(checkIncomingMessages, 10000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const handleSubmit = async (text: string) => {
    try {
      await sendText(instance, text, user.phone);

      const notification = (await getNotification(instance)) as Notification;

      if (notification && !notificationHandling) {
        handleNotification(notification);
      }
    } catch (error) {
      console.error('Ошибка: ', error);
    }
  };

  return (
    <div className="wrapper">
      <MainContainer className="main-container">
        <ChatContainer className="chat-container">
          <MessageList className="message-list">
            <MessageList.Content>
              {messages.map(({ id, text, timestamp, type }) => {
                return (
                  <ChatMessage
                    key={id}
                    text={text}
                    timestamp={timestamp}
                    type={type}
                  />
                );
              })}
            </MessageList.Content>
          </MessageList>
          <MessageInput
            className="message-input"
            onSend={handleSubmit}
            attachButton={false}
            sendButton={false}
            placeholder="Введите сообщение"
            disabled = {notificationHandling}
            autoFocus
          />
        </ChatContainer>
      </MainContainer>
    </div>
  );
}
