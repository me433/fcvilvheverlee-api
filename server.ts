const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const credentials = require('./middleware/credentials.ts')
const corsOptions = require('./config/corsOptions.ts');

const app = express();
const PORT = process.env.PORT || 3500;

app.use((req, res, next) => {
  console.log(req.cookies)
  next();
})

//check origin
app.use(credentials);

//CORS
app.use(cors(corsOptions))

//express middleware
app.use(express.urlencoded({extended: false}))
app.use(express.json());

//middleware for cookies
app.use(cookieParser());


app.use('/users', require('./routes/user.ts'))
app.use('/login', require('./routes/auth.ts'))
app.use('/logout', require('./routes/auth.ts'))
app.use('/refresh', require('./routes/refresh.ts'))

// verify JWT + protected routes

app.listen(PORT,console.log(
  `Server started on port ${PORT}`));