const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const saltRounds = 10; // You can adjust the salt rounds based on your security preference



const app = express();
const port = process.env.PORT || 5000;

// Middleware setup
const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:5174','https://avesdigital-39fac.web.app','https://avesdigital-39fac.firebaseapp.com'],
    credentials: true,
    optionSuccessStatus: 200,
}
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser())



// JWT Verify MiddleWare 

const verifyWebToken = (req, res, next) => {
    const token = req.cookies?.token
    if (!token) return res.status(401).send({ message: 'Unauthorized Access' })
    if (token) {
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET_KEY, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'Unauthorized Access' })
  
        }
        console.log(decoded)
        req.user = decoded
        next()
  
      })
  
    }
    console.log(token)
  
  
  }
  


// MongoDB URI from environment variables
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_USERPASSWORD}@cluster0.neywkpg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect to the MongoDB client
        await client.connect();


        const SignUpUserCollection = client.db('AvesDigital').collection('Users')
        const PropertyCollection = client.db('AvesDigital').collection('Property')


   //jwt generate

   app.post('/jwt', async (req, res) => {
    const user = req.body;
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET_KEY, {
      expiresIn: '365d'
    })
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    }).send({ success: true })
  })



        // clear token on logout

        app.get('/logout', async (req, res) => {
            try {
                res
                    .clearCookie('token', {
                        httpOnly: true,
                        maxAge: 0,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                    })
                    .send({ success: true })
                console.log('Logout successful')
            } catch (err) {
                res.status(500).send(err)
            }
        })



        // ,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,


        // Example Express.js Backend Route (assuming MongoDB)


        // signUP user data save here 

        
    app.post('/signup', async (req, res) => {
        const { fullName, email, phoneNumber, nationality, role, image, password } = req.body;
  
        try {
          // Check if the user already exists by email
          const existingUser = await SignUpUserCollection.findOne({ email });
          if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists' });
          }
  
          // Hash the password if provided
          let hashedPassword = password;
          if (password) {
            hashedPassword = await bcrypt.hash(password, saltRounds); // Salt rounds can be adjusted
          }
  
          // Insert user data into the User collection
          const newUser = {
            fullName,
            email,
            phoneNumber,
            nationality,
            role,
            image,
            password: hashedPassword,
          };
  
          const result = await SignUpUserCollection.insertOne(newUser);
  
          if (result.acknowledged) {
            // Send a success response
            res.status(200).json({ success: true, message: 'User created successfully' });
          } else {
            res.status(500).json({ success: false, message: 'Error creating user' });
          }
        } catch (error) {
          res.status(500).json({ success: false, message: error.message });
        }
      });
  

        //get the signUP user data
        app.get('/signup', async (req, res) => {
            const result = await SignUpUserCollection.find().toArray()
            res.send(result)
        });



        // Property information save
        app.post('/property', verifyWebToken, async (req, res) => {
            try {
                const {
                    userEmail,
                    userImage,
                    title,
                    propertyType,
                    address,
                    description,
                    price,
                    rentalStatus,
                    bedrooms,
                    bathrooms,
                    size,
                    furnishingStatus,
                    features,
                    images,
                    phone,
                    dateListed,
                    availableFrom,
                    leaseTerms,
                } = req.body;

                // Construct the formData object
                const formData = {
                    userEmail,
                    userImage,
                    title,
                    propertyType,
                    address,
                    description,
                    price,
                    rentalStatus,
                    bedrooms,
                    bathrooms,
                    size,
                    furnishingStatus,
                    features,
                    images,
                    phone,
                    dateListed,
                    availableFrom,
                    leaseTerms,
                    createdAt: new Date(),
                };

                // Insert into MongoDB
                const result = await PropertyCollection.insertOne(formData);

                res.status(200).json({ message: 'Property added successfully', result });
            } catch (error) {
                console.error('Error handling form submission:', error);
                res.status(500).json({ message: 'Error submitting form', error: error.message });
            }
        });




        // Get the Doctors user data
        app.get('/property', async (req, res) => {
            try {
                const result = await PropertyCollection.find().toArray();
                res.status(200).send(result); // Send a success response with the fetched data
            } catch (error) {
                console.error("Error fetching doctors:", error);
                res.status(500).send({ message: "Failed to fetch doctors", error });
            }
        });

        

        app.get('/property/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await PropertyCollection.findOne(query);
            res.send(result);
          });
      





        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {

    }
}
run().catch(console.dir);

// Define a simple route
app.get('/', (req, res) => {
    res.send("Online Medical server is running..");
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});

