const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const crypto = require("crypto");
const path = require("path");

// No credentials are configured here on purpose — the EC2 instance's IAM role
// is picked up automatically by the SDK v3 default credential provider chain.
const s3 = new S3Client({ region: process.env.AWS_REGION });

// Unique filename, extension preserved, stored at the bucket root (S3 Key == MySQL image_key).
function generateFilename(originalName) {
  const ext = path.extname(originalName).toLowerCase();
  return `employee-${crypto.randomBytes(4).toString("hex")}${ext}`;
}

async function uploadProfilePicture(buffer, filename, contentType) {
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: filename,
      Body: buffer,
      ContentType: contentType
    })
  );
  return filename;
}

module.exports = { generateFilename, uploadProfilePicture };
