import forge from "node-forge"

/**
 * Generate Certificate to use in AFIP in order to access their webservices
 * @see https://www.afip.gob.ar/ws/WSASS/html/generarcsr.html
 *
 * El proceso es:
 *
 * 1. "Agregar alias" en "Administración de Certificados Digitales"
 * 2. El nombre del alias es: "cuits"
 * 3. Ejecutar esta función y subir el "certRequest", guardar el "privateKey"
 * 4. Subir a AFIP el "certRequest", afip descarga el "cert"
 * 5. Subir a nuestra plataforma el "cert" y guardarlo junto a la "privateKey" y anotar la fecha de vencimiento (MUY IMPORTANTE)
 */
export default async function generate(
  organization: string,
  alias: string,
  cuit: string
): Promise<[certRequest: string, privateKey: string]> {
  const keys = await generateKeyPair()
  const csr = forge.pki.createCertificationRequest()
  csr.publicKey = keys.publicKey
  // /C=AR/O=subj_o/CN=subj_cn/serialNumber=CUIT subj_cuit
  csr.setSubject([
    {
      shortName: "C",
      value: "AR",
    },
    {
      shortName: "O",
      value: organization,
    },
    {
      shortName: "CN",
      value: alias,
    },
    {
      name: "serialNumber",
      value: `CUIT ${cuit}`,
    },
  ])

  csr.sign(keys.privateKey)
  const pem = forge.pki.certificationRequestToPem(csr)

  return [
    forge.pki.certificationRequestToPem(csr),
    forge.pki.privateKeyToPem(keys.privateKey),
  ]
}

async function generateKeyPair(): Promise<forge.pki.rsa.KeyPair> {
  return new Promise((resolve, reject) => {
    forge.pki.rsa.generateKeyPair(
      { bits: 2048, workers: 2 },
      (error, keypair) => {
        if (error) {
          reject(error)
          return
        }
        resolve(keypair)
      }
    )
  })
}
