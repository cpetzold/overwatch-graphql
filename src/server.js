import fs from 'fs'
import express from 'express'
import graphqlHTTP from 'express-graphql'
import { makeExecutableSchema } from 'graphql-tools'
import resolvers from './resolvers'

const typeDefs = fs.readFileSync(__dirname + '/../schema.graphql', 'utf8')

const server = express()

server.use('/', graphqlHTTP({
  schema: makeExecutableSchema({ typeDefs, resolvers }),
  graphiql: true
}))

server.listen(4000)
