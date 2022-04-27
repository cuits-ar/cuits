import signService from "./signService"
import { XMLParser } from "fast-xml-parser"
import * as cached from "./cached"
import { fetch } from "undici"

const loginURL = "https://wsaa.afip.gov.ar/ws/services/LoginCms"
const serviceName = "ws_sr_constancia_inscripcion"

export type Auth = {
  token: string
  sign: string
  expirationDate: Date
}

function isAfterNow(date: Date) {
  return date.getTime() > new Date().getTime()
}

async function getSavedAuth() {
  const auth = await cached.get()
  if (auth && isAfterNow(auth.expirationDate)) {
    return auth
  }
  return null
}

export default async function authService(): Promise<Auth> {
  const auth = await getSavedAuth()
  if (auth) return auth

  let signedData
  try {
    signedData = await signService(serviceName)
  } catch (error) {
    console.error("Fail on sign service", error)
    throw error
  }

  const requestXml = loginCMSXml(signedData)

  const response = await fetch(loginURL, {
    method: "POST",
    body: requestXml,
    headers: {
      "Content-Type": "text/xml",
      // eslint-disable-next-line quotes
      SOAPAction: '""',
    },
  })

  if (response.ok) {
    const xml = await response.text()
    const auth = parseResponse(xml)
    await cached.replace(auth)
    return auth
  }

  const errorXml = await response.text()
  const { code, description } = parseError(errorXml)
  console.error(`Code: ${code}, description: ${description}`)
  if (code === "ns1:cms.cert.expired") {
    throw new Error(
      "El certificado expiró! se debe generar uno nuevo y subirlo a AFIP"
    )
  }
  throw new Error(`Code: ${code}, description: ${description}`)
}

/**
 *
 * @param {string} xmlError
 * @returns {LoginCmsError} loginCmsError
 */
function parseError(xmlError: string): { code: string; description: string } {
  const code = (xmlError.match(/<faultcode .*?>(.*?)<\/faultcode>/) || [])[1]
  const description = (xmlError.match(/<faultstring>(.*?)<\/faultstring>/) ||
    [])[1]

  return { code, description }
}

function loginCMSXml(signedData: string) {
  return `
	<soapenv:Envelope
		xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
		xmlns:wsaa="http://wsaa.view.sua.dvadac.desein.afip.gov">
   <soapenv:Header/>
   <soapenv:Body>
      <wsaa:loginCms>
         <wsaa:in0>${signedData}</wsaa:in0>
      </wsaa:loginCms>
   </soapenv:Body>
	</soapenv:Envelope>`
}

function responsePath(data: Record<string, any>) {
  return data["soapenv:Envelope"]?.["soapenv:Body"]?.["loginCmsResponse"]?.[
    "loginCmsReturn"
  ]
}

function parseResponse(xml: string): Auth {
  const parser = new XMLParser()
  const data = parser.parse(xml)

  const innerXml =
    data["soapenv:Envelope"]["soapenv:Body"].loginCmsResponse.loginCmsReturn

  if (!innerXml) {
    throw Error(`Unexpected response: ${JSON.stringify(data)}`)
  }

  const innerData = parser.parse(innerXml)

  const { expirationTime } = innerData.loginTicketResponse.header
  const { token, sign } = innerData.loginTicketResponse.credentials

  return { token, sign, expirationDate: new Date(expirationTime) }
}
