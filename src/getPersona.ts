import { XMLParser } from "fast-xml-parser"
import authService from "./authService"
import { fetch } from "undici"

const prodUrl = "https://aws.afip.gov.ar/sr-padron/webservices/personaServiceA5"

export async function getPersona(cuit: string) {
  const { token, sign } = await authService()
  const requestXml = body(token, sign, cuit)

  const response = await fetch(prodUrl, {
    method: "POST",
    body: requestXml,
    headers: {
      "Content-Type": "text/xml charset=utf-8",
      // eslint-disable-next-line quotes
      SOAPAction: '""',
    },
  })

  const parser = new XMLParser()

  if (response.ok) {
    const xml = await response.text()
    return stripSoap(parser.parse(xml))
  }

  const errorXml = await response.text()
  const errorMsg = stripError(parser.parse(errorXml))

  if (errorMsg === "No existe persona con ese Id") {
    throw new Error("NOT_EXIST")
  }
  throw new Error(errorMsg)
}

function stripSoap(data: Record<string, any>) {
  return data["soap:Envelope"]?.["soap:Body"]?.["ns2:getPersonaResponse"]
    ?.personaReturn
}

function stripError(data: Record<string, any>) {
  return data["soap:Envelope"]?.["soap:Body"]?.["soap:Fault"]?.faultstring
}

function body(token: string, sign: string, cuit: string) {
  return `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
xmlns:a5="http://a5.soap.ws.server.puc.sr/">
	<soapenv:Header/>
	<soapenv:Body>
	<a5:getPersona>
		<token>${token}</token>
		<sign>${sign}</sign>
		<cuitRepresentada>20273314254</cuitRepresentada>
		<idPersona>${cuit}</idPersona>
	</a5:getPersona>
	</soapenv:Body>
</soapenv:Envelope>
`
}
