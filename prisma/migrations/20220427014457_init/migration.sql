-- CreateTable
CREATE TABLE "AfipServiceCredential" (
    "serviceName" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "sign" TEXT NOT NULL,
    "expirationDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AfipServiceCredential_pkey" PRIMARY KEY ("serviceName")
);
