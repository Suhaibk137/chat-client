// Wait for the DOM to load
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
  
    form.addEventListener('submit', (e) => {
      e.preventDefault(); // Prevent form from submitting traditionally
  
      const username = usernameInput.value.trim();
  
      if (username) {
        // Save username in local storage (optional)
        localStorage.setItem('chatUsername', username);
  
        // Redirect to chat page with username as a query parameter
        window.location.href = `chat.html?username=${encodeURIComponent(username)}`;
      } else {
        alert('Please enter a code or name to join the chat.');
      }
    });
  });
  