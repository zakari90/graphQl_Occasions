import { gql } from "apollo-server-core";


const typeDefs = gql`
  type Query{
    greeting : String
  }
    `



export default typeDefs;