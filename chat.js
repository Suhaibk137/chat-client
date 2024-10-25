// Retrieve username from query parameters
const params = new URLSearchParams(window.location.search);
let username = params.get('username') || 'You';

// Normalize username to 'You' or 'Me'
username = username.toLowerCase() === 'me' ? 'Me' : 'You';

// Connect to the Socket.IO server
const socket = io();

// Select elements
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const chatMessages = document.getElementById('chat-messages');

// Store message elements for deletion
const messageElements = [];

// Handle form submission
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const message = messageInput.value.trim();
  const file = document.getElementById('file-input').files[0];

  if (message || file) {
    const msgData = {
      username,
      time: Date.now(),
    };

    if (message) {
      msgData.message = message;
    }

    if (file) {
      const reader = new FileReader();
      reader.onload = function () {
        msgData.file = reader.result; // Base64 encoded file
        msgData.fileName = file.name;
        msgData.fileType = file.type;

        // Display the message on sender's chat
        displayMessage(msgData, 'sent');

        // Send the message to the server
        socket.emit('chat message', msgData);
      };
      reader.readAsDataURL(file);
    } else {
      // Display the message on sender's chat
      displayMessage(msgData, 'sent');

      // Send the message to the server
      socket.emit('chat message', msgData);
    }

    // Clear inputs
    messageInput.value = '';
    document.getElementById('file-input').value = '';
    messageInput.focus();
  }
});

// Receive messages from the server
socket.on('chat message', (msgData) => {
  // Display received messages
  if (msgData.username !== username) {
    displayMessage(msgData, 'received');
  }
});

// Listen for delete message events from the server
socket.on('delete message', (msgData) => {
  const messageObj = messageElements.find((msg) => msg.id === msgData.id);
  if (messageObj && chatMessages.contains(messageObj.element)) {
    chatMessages.removeChild(messageObj.element);
  }
});

// Function to display messages
function displayMessage(msgData, type) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message', type);

  const contentElement = document.createElement('div');
  contentElement.classList.add('message-content');

  if (msgData.message) {
    const textElement = document.createElement('p');
    textElement.textContent = msgData.message;
    contentElement.appendChild(textElement);
  }

  if (msgData.file) {
    if (msgData.fileType.startsWith('image/')) {
      const img = document.createElement('img');
      img.src = msgData.file;
      img.alt = msgData.fileName;
      img.style.maxWidth = '100%';
      contentElement.appendChild(img);
    } else if (msgData.fileType.startsWith('audio/')) {
      const audio = document.createElement('audio');
      audio.controls = true;
      audio.src = msgData.file;
      contentElement.appendChild(audio);
    }
  }

  // Add timestamp
  const timeElement = document.createElement('span');
  timeElement.classList.add('message-time');
  const messageTime = new Date(msgData.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  timeElement.textContent = messageTime;
  contentElement.appendChild(timeElement);

  messageElement.appendChild(contentElement);
  chatMessages.appendChild(messageElement);

  // Scroll to the bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;

  // Store the message element with its id
  messageElements.push({ id: msgData.id, element: messageElement });

  // Auto-delete message after 1 minute
  setTimeout(() => {
    if (chatMessages.contains(messageElement)) {
      chatMessages.removeChild(messageElement);
    }
  }, 60000); // 1 minute
}
