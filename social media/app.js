const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

// Setup
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

const DATA_FILE = path.join(__dirname, 'users.json');

// Helper: Data Read karna
const readData = () => {
    try {
        if (!fs.existsSync(DATA_FILE)) return [];
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (e) { return []; }
};

// Helper: Data Save karne ke liye
const saveData = (data) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

//ROUTES ---

// 1. Home Page
app.get('/', (req, res) => {
    const users = readData();
    res.render('index', { users: users, message: null });
});

// 2. Submit (Create)
app.post('/submit', (req, res) => {
    const users = readData();
    const newUser = {
        id: Date.now().toString(), // Unique ID delete karne ke liye
        name: req.body.name,
        email: req.body.email
    };
    users.push(newUser);
    saveData(users);
    res.redirect('/');
});

// 3. Delete
app.get('/delete/:id', (req, res) => {
    let users = readData();
    const userId = req.params.id;
    // Us ID ko chhod kar baki sab rakho
    users = users.filter(user => user.id !== userId);
    saveData(users);
    res.redirect('/');
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});