/* eslint-disable @typescript-eslint/no-var-requires */
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const app = express();
app.use(express.json());

const customers = [];
// cpf - string
// name - string
// id - uuid
// statement -[]

app.post('/account', (req, res) => {
  console.log(customers);
  const { cpf, name } = req.body;
  const customersAlreadyExist = customers.some((customer) => {
    return customer.cpf === cpf;
  });

  if (customersAlreadyExist) {
    return res.status(400).json({ error: 'customer already exists!' });
  }
  customers.push({ id: uuidv4(), name, cpf, statement: [] });

  return res.status(201).send();
});

const port = 3335;
//
app.listen(port, console.log('On-fire, http://localhost:3335'));
