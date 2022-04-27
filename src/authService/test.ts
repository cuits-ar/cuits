import generateCert from "./generateCertified"

async function run() {
  const [cert, privateKey] = await generateCert(
    "John Doe",
    "cuits-1",
    "20273314254"
  )
  console.log(cert)
  console.log(privateKey)
}

run()
