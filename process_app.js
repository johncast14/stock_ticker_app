const fs = require('fs');
const http = require('http');
const url = require('url');
var port = process.env.PORT || 3000;
const { MongoClient } = require('mongodb');

const connStr = 'mongodb+srv://johncastillotacuri:eJSSmYxNmck26N4K@cluster0.v6aozsk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const client = new MongoClient(connStr);

http.createServer(async function (req, res) {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    if (pathname === '/') {
        fs.readFile('home.html', function(err, data) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write(data);
            res.end();
        });
    } else if (pathname === '/process') {
        const query = parsedUrl.query.query?.trim();
        const searchType = parsedUrl.query.searchType;

        if (!query || !searchType) {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.write("Missing input. <a href='/'>Go back</a>");
            return res.end();
        }

        try {
            await client.connect();
            const db = client.db("Stock");
            const collection = db.collection("PublicCompanies");

            let filter = {};
            if (searchType === 'ticker') {
                filter = { ticker: query };
            } else {
                filter = { companyName: query };
            }

            const results = await collection.find(filter).toArray();

            res.writeHead(200, { 'Content-Type': 'text/html' });

            if (results.length > 0) {
                res.write('<h2>Search Results:</h2><ul>');
                results.forEach(doc => {
                    res.write(`<li>${doc.companyName} (${doc.ticker}) - $${doc.price}</li>`);
                });
                res.write('</ul>');
            } else {
                res.write('No results found.');
            }

            res.write('<br><a href="/">Go back</a>');
            res.end();
        } catch (err) {
            console.error("Database error:", err);
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.write("Error querying the database.");
            res.end();
        }
    } else {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.write("Page not found.");
        res.end();
    }
}).listen(port);
