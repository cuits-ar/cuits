export default async function certs() {
  return [process.env.CERT as string, process.env.PRIVATE_KEY as string]
}
