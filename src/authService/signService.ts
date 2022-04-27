import { addHours, format } from "date-fns"
// @ts-ignore
import * as ntpClient from "ntp-client"
import * as forge from "node-forge"
import certs from "./certs"

const tokensExpireInHours = 24

export default async function signService(
  serviceName: string
): Promise<string> {
  const networkTime = await getNetworkTime()
  const [cert, privateKey] = await certs()
  const message = loginTicketXml(serviceName, networkTime)
  return signMessage(message, cert, privateKey)
}

async function getNetworkTime(): Promise<Date> {
  return new Promise((resolve) => {
    ntpClient.getNetworkTime(
      "time.afip.gov.ar",
      123,
      (error: unknown, date: Date) => {
        if (error) {
          console.error(error)
          throw new Error(
            "Fallo la intentar obtener la hora de time.afip.gov.ar"
          )
        }
        resolve(date)
      }
    )
  })
}

function loginTicketXml(serviceName: string, networkTime: Date) {
  const expire = addHours(networkTime, tokensExpireInHours)

  const xml = `
	<?xml version="1.0" encoding="UTF-8" ?>
	<loginTicketRequest version="1.0">
		<header>
			<uniqueId>${randomNumber()}</uniqueId>
			<generationTime>${formatDate(networkTime)}</generationTime>
			<expirationTime>${formatDate(expire)}</expirationTime>
		</header>
		<service>${serviceName}</service>
	</loginTicketRequest>
	`

  return xml.trim()
}

function randomNumber() {
  const min = 99
  const max = 9999999
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Output format: 2019-04-09T09:12:00-03:00
function formatDate(date: Date) {
  return format(date, "yyyy-LL-dd'T'HH:mm:ssxxx")
}

function signMessage(
  message: string,
  cert: string,
  privateKey: string
): string {
  const p7 = forge.pkcs7.createSignedData()
  p7.content = forge.util.createBuffer(message, "utf8")
  p7.addCertificate(cert)
  p7.addSigner({
    authenticatedAttributes: [
      {
        type: forge.pki.oids.contentType,
        value: forge.pki.oids.data,
      },
      {
        type: forge.pki.oids.messageDigest,
      },
      {
        type: forge.pki.oids.signingTime,
        value: new Date().toISOString(),
      },
    ],
    certificate: cert,
    digestAlgorithm: forge.pki.oids.sha256,
    key: privateKey,
  })

  p7.sign()
  const bytes = forge.asn1.toDer(p7.toAsn1()).getBytes()
  return Buffer.from(bytes, "binary").toString("base64")
}
