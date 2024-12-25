import { io } from "socket.io-client";
import { DebtNotification } from 'src/notification/types/debt-notification.type';

const socket = io('http://localhost:3001');
const creditorId = '1';

socket.on('connect', () => {
  console.log('Connected to notification server');
  socket.emit('join', { room: creditorId });
});

socket.on('debt-notification', (notification: DebtNotification) => {
  console.log('New Notification:', notification);
});
