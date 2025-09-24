const express = require('express');
const app = express();
const port = 3000;

const handlerGet = (req, res) => {
    res.send("URL:" + req.url);
};

app.get('/',handlerGet);

app.post('/submit', (req, res) => {
 res.send('Data submitted!');
});

app.delete("/delete")

app.listen(port, () => {
 console.log(`Server running on http://localhost:${port}`);
});