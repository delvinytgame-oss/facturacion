-- CreateEnum
CREATE TYPE "PdfDocumentType" AS ENUM ('QUOTE', 'INVOICE');

-- CreateTable
CREATE TABLE "PdfDownloadToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "documentType" "PdfDocumentType" NOT NULL,
    "documentId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PdfDownloadToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PdfDownloadToken_tokenHash_key" ON "PdfDownloadToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PdfDownloadToken_documentId_idx" ON "PdfDownloadToken"("documentId");

-- AddForeignKey
ALTER TABLE "PdfDownloadToken" ADD CONSTRAINT "PdfDownloadToken_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
