// Retrieve username from query parameters
const params = new URLSearchParams(window.location.search);
let username = params.get('username') || 'Anonymous';

// Trim whitespace from the username
username = username.trim();

// Connect to the Socket.IO server
const socket = io('https://chat-server-3jus.onrender.com');

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

        // Send the message to the server
        socket.emit('chat message', msgData);

        // Display the message on sender's chat
        displayMessage(msgData, 'sent');
      };
      reader.readAsDataURL(file);
    } else {
      // Send the message to the server
      socket.emit('chat message', msgData);

      // Display the message on sender's chat
      displayMessage(msgData, 'sent');
    }

    // Clear inputs
    messageInput.value = '';
    document.getElementById('file-input').value = '';
    messageInput.focus();
  }
});

// Receive messages from the server
socket.on('chat message', (msgData) => {
  // Determine message type
  const messageType = msgData.username === username ? 'sent' : 'received';

  // Display the message
  displayMessage(msgData, messageType);
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

  // Display the sender's username for received messages
  if (type === 'received') {
    const senderElement = document.createElement('span');
    senderElement.classList.add('message-sender');
    senderElement.textContent = msgData.username;
    contentElement.appendChild(senderElement);
  }

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
