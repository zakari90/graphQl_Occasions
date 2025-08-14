import { gql } from "apollo-server-core";


const typeDefs = gql`

  type User {
    _id: ID!
    username: String!
    email: String!
    password: String!
}

  type Event {
    _id: ID!
    title: String!
    description: String!
    date: String!
    price: Float!
    creator: User!
  }

    type Booking {
    _id: ID!
    event: Event!
    user: User!
    createdAt: String! 
    }
    
    input UserInput {
        username: String!
        email: String!
        password: String!
    }
    
    input EventInput {
        title: String!
        description: String!
        date: String!
        price: Float!
    }

    type Query {
      events: [Event!]
      bookings: [Booking!]
      getUserEvents(userId: ID): [Event]
    }

    type authData {
      userId: ID!
      token: String!
      username: String!
    }

    type Mutation {
      createUser(userInput: UserInput!): authData
      createEvent(eventInput: EventInput!): Event
      bookEvent(eventId: ID!): Booking
      cancelBooking(bookingId: ID!): Boolean
      login(email: String!, password: String!): authData
      deleteEvent(eventId: ID!): [Event]
    }


    `



export default typeDefs;