const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const analyzeURL = require('./modules/analyze');

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.post('/api/analyze', analyzeURL);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
