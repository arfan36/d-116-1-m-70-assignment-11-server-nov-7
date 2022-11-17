const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// middleware
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        req.decoded = decoded;
        next();
    });
}

// middleware
app.use(cors());
app.use(express.json());

// mongoDb
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@clusterarfan36.opuzllc.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const serviceCollection = client.db('honestDelivery').collection('services');
        const reviewCollection = client.db('honestDelivery').collection('reviews');
        const myServiceCollection = client.db('honestDelivery').collection('myService');

        // (C) : jwt token
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
            res.send({ token });
        });

        // Read (R) : limit (3)
        app.get('/services', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.limit(3).toArray();
            res.send(services);
        });

        // Read (R) all
        app.get('/service-all', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        });

        // Read (R) specific item
        app.get('/service/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const service = await serviceCollection.findOne(query);
            res.send(service);
        });


        // ─── Review Api ──────────────────────────────────────────────

        // Read (R)
        app.get('/reviews', verifyJWT, async (req, res) => {

            let query = {};
            if (req.query.user_email) {
                query = {
                    user_email: req.query.user_email
                };
            }
            const cursor = reviewCollection.find(query);
            const reviews = await cursor.toArray();
            res.send(reviews);
        });

        // to update Read (R) specific item
        app.get('/reviews/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const userReview = await reviewCollection.findOne(query);
            res.send(userReview);
        });

        // Read (R) by user_email
        app.get('/reviews-email', async (req, res) => {
            let query = {};
            if (req.query.user_email) {
                query = {
                    user_email: req.query.user_email
                };
            }
            const cursor = reviewCollection.find(query);
            const reviews = await cursor.toArray();
            res.send(reviews);
        });

        // Read (R) by product_id
        app.get('/reviews-id', async (req, res) => {

            let query = {};
            if (req.query.product_id) {
                query = {
                    product_id: req.query.product_id
                };
            }
            const cursor = reviewCollection.find(query);
            const reviews = await cursor.toArray();
            res.send(reviews);
        });

        // Read (R) by user_email and product_id
        app.get('/reviews-email-id', async (req, res) => {

            let query = {};
            if (req.query.user_email && req.query.product_id) {
                query = {
                    user_email: req.query.user_email,
                    product_id: req.query.product_id
                };
            }
            const cursor = reviewCollection.find(query);
            const reviews = await cursor.toArray();
            res.send(reviews);
        });

        // Update (U) or insert (C) : by id //! upsert
        app.put('/reviews/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const userReview = req.body;
            const option = { upsert: true };  // update or insert
            const updateUserReview = {
                $set: {
                    product_id: userReview.product_id,
                    product_name: userReview.product_name,
                    product_img: userReview.product_img,
                    product_price: userReview.product_price,
                    product_description: userReview.product_description,
                    user_name: userReview.user_name,
                    user_photoURL: userReview.user_photoURL,
                    user_email: userReview.user_email,
                    review_message: userReview.review_message
                }
            };
            const result = await reviewCollection.updateOne(filter, updateUserReview, option);
            res.send(result);
        });

        // Update (U) or insert (C) by id and email : //! upsert
        app.put('/reviews/', async (req, res) => {
            let filter = {};
            if (req.query.user_email && req.query.product_id) {
                filter = {
                    user_email: req.query.user_email,
                    product_id: req.query.product_id
                };
            }
            const userReview = req.body;
            const option = { upsert: true };  // update or insert
            const updateUserReview = {
                $set: {
                    product_id: userReview.product_id,
                    product_name: userReview.product_name,
                    product_img: userReview.product_img,
                    product_price: userReview.product_price,
                    product_description: userReview.product_description,
                    user_name: userReview.user_name,
                    user_photoURL: userReview.user_photoURL,
                    user_email: userReview.user_email,
                    review_message: userReview.review_message
                }
            };
            const result = await reviewCollection.updateOne(filter, updateUserReview, option);
            res.send(result);
        });

        // Delete (D) delete One
        app.delete('/reviews/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await reviewCollection.deleteOne(filter);
            res.send(result);
        });

        // ─── My Service Api ──────────────────────────────────────────

        // Read (R) : limit (3)
        app.get('/my-service', async (req, res) => {
            let filter = {};
            if (req.query.user_email) {
                filter = {
                    user_email: req.query.user_email
                };
            }
            const cursor = myServiceCollection.find(filter);
            const myServices = await cursor.limit(3).toArray();
            res.send(myServices);
        });

        // Read (R) all
        app.get('/my-service-all', async (req, res) => {
            const query = {};
            const cursor = myServiceCollection.find(query);
            const myServices = await cursor.toArray();
            res.send(myServices);
        });

        // Update (U) or insert (C) by email and id : updateOne //! upsert
        app.put('/my-service', async (req, res) => {
            let filter = {};
            if (req.query.user_email && req.query.product_id) {
                filter = {
                    user_email: req.query.user_email,
                    product_id: req.query.product_id
                };
            }
            const myService = req.body;
            const option = { upsert: true };  // update or insert
            const updateMyService = {
                $set: {
                    product_id: myService._id,
                    rating: myService.rating,
                    name: myService.name,
                    img: myService.img,
                    price: myService.price,
                    description: myService.description,
                    user_email: myService.user_email
                }
            };
            const result = await myServiceCollection.updateOne(filter, updateMyService, option);
            res.send(result);
        });

        // Delete (D) delete One
        app.delete('/my-service/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await myServiceCollection.deleteOne(filter);
            res.send(result);
        });


    }
    finally {

    }
}

run().catch(err => console.log(err));

app.get('/', (req, res) => {
    res.send('Server running');
});

app.listen(port, () => {
    console.log(`Listening to port ${port}`);
});
