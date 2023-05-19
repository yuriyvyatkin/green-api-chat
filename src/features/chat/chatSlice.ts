import { createSlice } from '@reduxjs/toolkit';

type Message = {
  id: string;
  text: string;
  timestamp: number;
  type: 'incoming' | 'outgoing';
};

const initialState: Array<Message> = [
  {
    id: '1101821368qwe',
    text: 'Привет!',
    timestamp: 1684471983,
    type: 'outgoing',
  },
  {
    id: '1101821368asd',
    text: 'Привет!',
    timestamp: 1684471983,
    type: 'incoming',
  },
  {
    id: '1101821368zxc',
    text: 'Как дела?',
    timestamp: 1684471983,
    type: 'outgoing',
  },
];

const chatSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    addMessage(state, { payload }) {
      state.push(payload);
    },
  },
});

export const { addMessage } = chatSlice.actions;
export default chatSlice.reducer;
