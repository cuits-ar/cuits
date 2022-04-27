import db from "../db"
import { Auth } from "."

export async function get() {
  return await db.afipServiceCredential.findFirst()
}

export async function replace(auth: Auth) {
  return await db.afipServiceCredential.upsert({
    where: {
      serviceName: "ws_sr_constancia_inscripcion",
    },
    update: auth,
    create: { serviceName: "ws_sr_constancia_inscripcion", ...auth },
  })
}
