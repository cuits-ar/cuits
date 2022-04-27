import fastify from "fastify"
import endpoint from "./app"

const server = fastify()

endpoint(server)

server.listen(process.env.PORT || 8080, (err, address) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Server listening at ${address}`)
})
