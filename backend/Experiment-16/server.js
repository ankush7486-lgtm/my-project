const express = require('express');
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

function authMiddleware(req, res, next) {
	  const token = req.headers['authorization'];
	  if (token === 'Bearer mysecrettoken') {
	    next();
	  } else {
	    res.status(403).json({ message: 'Forbidden' });
	  }
	}

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`); //adds date and time
  next();
});

let users = [];

// Create a user (POST /users)
app.post('/users', (req, res) => {
  const user = req.body;
  users.push(user);
  res.status(201).json({ message: 'User added', user });
});

// Get all users (GET /users)
app.get('/users', (req, res) => {
  res.status(200).json(users);
});

// Update a user (PUT /users/:id)
app.put('/users/:id', (req, res) => {
  const id = req.params.id;
  const updatedUser = req.body;
  users = users.map(user => (user.id === id ? updatedUser : user));
  res.status(200).json({ message: 'User updated', updatedUser });
});

// Delete a user (DELETE /users/:id)
app.delete('/users/:id', (req, res) => {
  const id = req.params.id;
  users = users.filter(user => user.id !== id);
  res.status(200).json({ message: 'User deleted' });
});

const router = express.Router();
router.use((req, res, next) => {
  console.log('Admin router middleware executed');
  res.send("Hello, Chandigarh University!")
  next();
});
router.get('/dashboard', (req, res) => {
  res.send('Admin dashboard');
});
app.use('/admin',authMiddleware, router);

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
