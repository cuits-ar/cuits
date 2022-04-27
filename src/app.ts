import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import { getPersona } from "./getPersona"

const cuitRegex = new RegExp(/^\d{11}$/)

export default function endpoint(server: FastifyInstance) {
  server.get("/cuit/:cuit", handler)
}

interface CuitParam {
  cuit: string
}

async function handler(req: FastifyRequest, reply: FastifyReply) {
  const { cuit } = req.params as CuitParam

  if (!cuitRegex.test(cuit)) {
    return reply.code(400).send({
      codigo: "CUIT_INVALIDO",
      descripcion:
        "La CUIT no parece válido, debe ser numérico sin espacios y sin guiones",
    })
  }

  const authKey = req.headers["authorization"]
  if (!authKey) {
    return reply.code(400).send({
      codigo: "AUTHORIZATION_HEADER_REQUERIDO",
      descripcion: "El header Authorization es requerido para utilizar la API",
    })
  }

  if (process.env.AUTH_KEY !== authKey) {
    return reply.code(400).send({
      codigo: "API_KEY_INVALIDA",
      descripcion: "La api key usada en el header Authorization no es válida",
    })
  }

  const response = await getPersona(cuit)
  reply.send(response)
}
