import { Message, MessageModel } from '@chatscope/chat-ui-kit-react';
import getTimeFromTimestamp from '../../../helpers/getTimeFromTimestamp';

export default function ChatMessage({
  text,
  timestamp,
  type,
}: {
  text: string;
  timestamp: number;
  type: string;
}) {
  return (
    <Message
      className={`${type}-message`}
      model={{
        direction: type as MessageModel['direction'],
        position: 'single',
      }}
    >
      <Message.CustomContent className="custom-content">
        {text}
        <br />
        <span className="custom-content__timestamp">
          {getTimeFromTimestamp(timestamp)}
        </span>
      </Message.CustomContent>
    </Message>
  );
}
