const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const app = express();
app.use(cors());

const secretKey = crypto.randomBytes(32).toString('hex');
console.log('Secret Key:', secretKey);

if (!secretKey) {
  console.error('JWT_SECRET_KEY is not defined in the environment.');
  process.exit(1);
}

mongoose.connect("mongodb+srv://maruthilakshmi2253:8BoDa0GjPWXnimvG@cluster0.o1gcdpt.mongodb.net/", 
{
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = mongoose.model('User', {
  username: String,
  phoneNumber: String,
  emailid: String,
  password: String,
  
});

const SemisterOption = mongoose.model('savesemister', new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  Semister: String,
  Branch: String,
  selectedSubject: String,
  userResponse: String,
}));

app.use(bodyParser.json());

app.post('/signup', async (req, res) => {
  try {
    const { username, phoneNumber, emailid, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const existingUser = await User.findOne({ $or: [{ username }, { emailid }, { phoneNumber }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Username or phone number already registered' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = new User({ username, phoneNumber, emailid, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error in /signup:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: 'Authentication failed' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Authentication failed' });
    }

    const token = jwt.sign({ username }, secretKey, { expiresIn: '1h' });
    res.json({ token, message: 'Login successful' });
  } catch (error) {
    console.error('Error in /login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/savesemisters', async (req, res) => {
  try {
     console.log('Request Body:', req.body);
    const {username, Semister,  Branch,selectedSubject, userResponse } = req.body;
    // const user = await User.findOne({ username });
  //    if (!selectedSubject || !userResponse) {
  //   return res.status(400).json({ error: 'Missing parameters' });
  // }

    // if (!user) {
    //   return res.status(404).json({ message: 'User not found' });
    // }

    const newSemisterOption = new SemisterOption({ username, Semister, Branch,selectedSubject, userResponse });
    await newSemisterOption.save();

    const savedSemisterOption = await SemisterOption
    .findById(newSemisterOption._id)
    .populate('user', 'username');

    res.status(200).json({ message: 'Semester Data saved successfully' });
  } catch (error) {
    console.error('Error in /api/savesemisters:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
