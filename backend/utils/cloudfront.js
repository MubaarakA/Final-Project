// employees.image_key stores only the bare S3 object key (e.g. "2.png") — the
// same key the file was uploaded to S3 under. The CloudFront URL is derived
// on every read and never stored, so changing CLOUDFRONT_DOMAIN needs no migration.
function buildImageUrl(imageKey) {
  if (!imageKey) return null;
  const domain = process.env.CLOUDFRONT_DOMAIN;
  if (!domain) return null;
  return `${domain.replace(/\/$/, "")}/${imageKey.replace(/^\//, "")}`;
}

module.exports = { buildImageUrl };
