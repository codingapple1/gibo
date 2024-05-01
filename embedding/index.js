const express = require('express')
const pg = require('pg')
const app = express()
const axios = require('axios')
const pgvector = require('pgvector/pg')

//임베딩 활용해서 유사단어 검색 + 추천서비스 대충 만들기
//postgreSQL 데이터베이스, Node.js, OpenAI API키 필요

const client = new pg.Pool({
  host: 'DB주소',
  user: 'DB유저명',
  password: 'DB비번',
  database: 'postgres', port: 5432, max: 5,
})

client.connect(err => {
  if (err) {
    console.log('DB연결에러 ' + err)
  } else {
    app.listen(8080, () => {
      console.log(`서버띄움 http://localhost:8080`)
    });
  }
})

app.get('/', (req, res) => {
  res.send('메인페이지임')
});

app.get('/add', async (req, res) => {
  var result = await axios.post('https://api.openai.com/v1/embeddings',
    {
      input: "오늘 만든 치아바타 치킨 샌드위치",
      model: "text-embedding-3-small"
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + 'OPENAI의API키'
      }
    })
    var text = 'INSERT INTO items (title, embedding) VALUES($1, $2)'
    var values = ['오늘 만든 치아바타 치킨 샌드위치', pgvector.toSql(result.data.data[0].embedding)]
    await client.query(text, values)
    console.log(result.data.data[0].embedding)
  res.send('test')
});

app.get('/search', async (req, res) => {
  var result = await axios.post('https://api.openai.com/v1/embeddings',
    {
      input: req.query.q,
      model: "text-embedding-3-small"
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + 'OPENAI의API키'
      }
    })
    var text = `SELECT id, title, 1 - (embedding <=> $1) as similarity
    FROM items`
    var values = [pgvector.toSql(result.data.data[0].embedding)]
    var rank = await client.query(text, values)
    res.send(rank.rows)
});




