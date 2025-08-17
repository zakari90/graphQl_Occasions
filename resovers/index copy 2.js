import authResolvers  from "./auth.js"
import  bookingResolvers  from "./booking.js"
import  eventResolvers  from "./event.js"
import merge  from 'lodash'

const resolvers = merge(authResolvers, eventResolvers, bookingResolvers) 

export default  resolvers


